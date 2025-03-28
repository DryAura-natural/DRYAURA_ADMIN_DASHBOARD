// utils/razorpay-invoice.ts
import Razorpay from 'razorpay';
import prismadb from '@/lib/prismadb';
import { Order, Customer } from '@prisma/client';

interface InvoiceGenerationParams {
  order: Order;
  customer: Customer & {
    name?: string;
    email?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  amount?: number;
  currency?: string;
  draft?: boolean;
}

export const generateRazorpayInvoice = async ({
  order,
  customer,
  amount,
  currency = 'INR',
}: InvoiceGenerationParams) => {
  // Check if the order is paid before generating invoice
  const paidOrder = await prismadb.order.findUnique({
    where: { 
      id: order.id,
      isPaid: true // Only generate invoice for paid orders
    }
  });

  if (!paidOrder) {
    console.log(`Order ${order.id} not paid. Skipping invoice generation.`);
    return null; // Return null if order is not paid
  }

  // Fetch the full order with its products
  const fullOrder = await prismadb.order.findUnique({
    where: { id: order.id },
    include: {
      orderItems: {
        include: {
          variant: {
            include: {
              orderItems:true,
              product: true,
              size: true,
              color: true
            }
          },
        
          order: true
        }
      },
      customer: true,
      store: true,
      promoCode: true
    }
  });

  if (!fullOrder) {
    throw new Error('Order not found');
  }

  // Initialize Razorpay instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
  });

  try {
    // Fetch product names for line items
    const productNames = await Promise.all(
      fullOrder.orderItems.map(async (item) => {
        const product = await prismadb.product.findUnique({
          where: { id: item.variant.productId },
          select: { name: true }
        });
        return product?.name || `Product ${item.variant.productId}`;
      })
    );

    // Sanitize customer details
    const sanitizedCustomer = {
      name: customer.name || fullOrder.customer?.name || 'N/A',
      email: customer.email || fullOrder.customer?.email || 'N/A',
      phone: customer.phone || fullOrder.customer?.phone || 'N/A',
      streetAddress: customer.streetAddress || fullOrder.customer?.streetAddress || 'N/A',
      city: customer.city || fullOrder.customer?.city || 'N/A',
      state: customer.state || fullOrder.customer?.state || 'N/A',
      country: customer.country || fullOrder.customer?.country || 'IN',
      postalCode: customer.postalCode || fullOrder.customer?.postalCode || 'N/A'
    };
    console.log(sanitizedCustomer);
    

    // Create invoice
    const invoice = await razorpay.invoices.create({
      type: 'invoice',
      description: `Order #${order.id} Invoice`,
      customer: {
        name: sanitizedCustomer.name,
        email: sanitizedCustomer.email,
        contact: sanitizedCustomer.phone,
        billing_address: {
          line1: sanitizedCustomer.streetAddress,
          city: sanitizedCustomer.city,
          state: sanitizedCustomer.state,
          country: sanitizedCustomer.country,
          zipcode: sanitizedCustomer.postalCode
        }
      },
      line_items: fullOrder.orderItems.map((item, index) => ({
        name: productNames[index],
        quantity: item.quantity,
        amount: Math.round((amount || item.variant.price.toNumber()) * 100), // Amount in paise
        currency: currency,
        description: `${productNames[index]} - Size: ${item.variant.size?.value || 'One Size'} | Color: ${item.variant.color?.name || 'N/A'}`,
        tax_rate: fullOrder.store.taxRate || 0, // Optional tax rate
      })),
      notes: {
        order_id: order.id,
        customer_id: customer.id || 'N/A',
        order_date: fullOrder.createdAt.toISOString(),
        store_name: fullOrder.store.name,
        payment_method: fullOrder.paymentMethod || 'N/A',
        payment_status: 'Completed',
        transaction_id: fullOrder.transactionId || 'N/A',
        promo_code: fullOrder.promoCode?.code || 'No Promo Applied',
        custom_branding: 'Powered by Dryaura - Elevating Your Shopping Experience 🛍️',
        support_note: 'Need help? Contact our customer support at support@dryaura.com'
      },
      partial_payment: 0,
      // draft: draft ? "true" : "false"
    });

    // Attempt to mark invoice as paid
    try {
      await razorpay.invoices.markAsPaid(invoice.id);
    } catch (error) {
      console.warn('Could not mark invoice as paid:', error);
    }

    // Update order with invoice details
    await updateOrderWithInvoiceDetails(order.id, {
        razorpayInvoiceId: invoice.id!,
        invoiceLink: invoice.short_url!
      });

    return {
      invoiceId: invoice.id,
      invoiceLink: invoice.short_url,
      amount: invoice.amount
    };
  } catch (error) {
    console.error('Razorpay Invoice Generation Error:', error);
    throw new Error('Failed to generate invoice');
  }
};

// Update order with invoice details
const updateOrderWithInvoiceDetails = async (
  orderId: string, 
  invoiceDetails: {
    razorpayInvoiceId: string;
    invoiceLink: string;
  }
) => {
  try {
    // Update order in database with invoice information
    const updatedOrder = await prismadb.order.update({
      where: { id: orderId },
      data: {
        razorpayInvoiceId: invoiceDetails.razorpayInvoiceId,
        invoiceLink: invoiceDetails.invoiceLink,
        invoiceGeneratedAt: new Date()
      }
    });

    return updatedOrder;
  } catch (error) {
    console.error('Error updating order with invoice details:', error);
    throw new Error('Failed to update order with invoice information');
  }
};

// Utility for sending invoice via email
export const sendInvoiceToCustomer = async (invoiceId: string) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
  });

  try {
    // Send invoice via Razorpay
    await razorpay.invoices.notifyBy(invoiceId, 'email');
    
    console.log(`Invoice ${invoiceId} sent successfully`);
    return true;
  } catch (error) {
    console.error('Failed to send invoice:', error);
    return false;
  }
};

// Invoice retrieval utility
export const getRazorpayInvoice = async (invoiceId: string) => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!
  });

  try {
    const invoice = await razorpay.invoices.fetch(invoiceId);
    return invoice;
  } catch (error) {
    console.error('Failed to retrieve invoice:', error);
    throw new Error('Invoice retrieval failed');
  }
};