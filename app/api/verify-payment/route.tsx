import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { OrderStatus } from '@prisma/client';
import { generateRazorpayInvoice } from '@/utils/razorpay-invoice';

const prisma = new PrismaClient();

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Verify Razorpay payment signature
function verifyRazorpaySignature(
  razorpayOrderId: string, 
  razorpayPaymentId: string, 
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  try {
    // Construct the signature payload
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;

    // Generate the expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await req.json();
    console.log('Payment Verification Request Body:', JSON.stringify(body, null, 2));

    const {
      order_id: razorpayOrderId,
      payment_id: razorpayPaymentId,
      signature: razorpaySignature,
      amount,
      currency
    } = body;

        // Extensive logging for debugging
        console.log('Extracted Payment Details:', {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature: razorpaySignature ? 'Present' : 'Missing',
          amount,
          currency
        });
    // Validate input parameters
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing required payment verification parameters' 
        },
        { 
          status: 400, 
          headers: CORS_HEADERS 
        }
      );
    }

    // Find the corresponding order in the database
// Find the corresponding order in the database
const order = await prisma.order.findFirst({
  where: { 
    OR: [
      { razorpayOrderId: razorpayOrderId },
      { id: razorpayOrderId } // Some systems might pass the order ID
    ]
  },
  include: {
    orderItems: {
      include: {
        variant: true
      }
    }
  }
});

    if (!order) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Order not found' 
        },
        { 
          status: 404, 
          headers: CORS_HEADERS 
        }
      );
    }

    // Verify payment signature
    const isSignatureValid = verifyRazorpaySignature(
      razorpayOrderId, 
      razorpayPaymentId, 
      razorpaySignature
    );

    if (!isSignatureValid) {
      console.error('Invalid payment signature', {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      });

      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Invalid payment signature' 
        },
        { 
          status: 400, 
          headers: CORS_HEADERS 
        }
      );
    }

    // Update order status to paid
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        isPaid: true,
        orderStatus: OrderStatus.PROCESSING,
        paymentMethod: 'Razorpay',
        // trackingId: razorpayPaymentId,
        razorpayOrderId: razorpayOrderId,
        ...(body.invoiceLink && { invoiceLink: body.invoiceLink }),
        invoiceGeneratedAt: new Date()
      }
    });
    

    // Generate invoice
    // try {
    //   // Try to find customer details
    //   const customerDetails = order.customerId ? await prisma.customer.findUnique({
    //     where: { userId: order.customerId }
    //   }) : null;

    //   // If no customer found, create a customer-like object from order details
    //   const invoiceCustomer = customerDetails || {
    //     name: order.name || 'Unknown Customer',
    //     email: order.email || '',
    //     phone: order.phone || '',
    //     streetAddress: order.address || '',
    //     city: '',  // Add these if you have them in your order
    //     state: '',
    //     country: '',
    //     postalCode: ''
    //   };

    //   // Log details for debugging
    //   console.log('📋 Invoice Customer Details:', {
    //     customerFound: !!customerDetails,
    //     name: invoiceCustomer.name,
    //     email: invoiceCustomer.email,
    //     phone: invoiceCustomer.phone
    //   });

    //   // Use order total amount if not provided in payment details
    //   const invoiceAmount = amount || updatedOrder.totalAmount.toNumber();
    //   const invoiceCurrency = currency || 'INR';

    //   console.log('💰 Invoice Amount Details:', {
    //     amount: invoiceAmount,
    //     currency: invoiceCurrency
    //   });

    //   // Generate invoice using either customer details or order details
    //   const invoiceResult = await generateRazorpayInvoice({ 
    //     order: updatedOrder, 
        
    //     customer: invoiceCustomer,
    //     amount: invoiceAmount,
    //     currency: invoiceCurrency
    //   });
      
    //   console.log('✅ Invoice Generated:', invoiceResult);
    // } catch (invoiceError) {
    //   console.error('Invoice generation error:', invoiceError);
    //   // Non-critical error, so we'll continue with the response
    // }

    return NextResponse.json(
      { 
        status: 'success', 
        message: 'Payment verified successfully',
        orderId: updatedOrder.id
      },
      { 
        status: 200, 
        headers: CORS_HEADERS 
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);

    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Internal server error during payment verification' 
      },
      { 
        status: 500, 
        headers: CORS_HEADERS 
      }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200, 
    headers: CORS_HEADERS 
  });
}