import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendOrderStatusEmail, logEmailAttempt } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: { storeid: string; orderid: string } }
) {
  try {
    // Log incoming request details
    console.log('Incoming PATCH request:', {
      url: req.url,
      method: req.method,
      params: params
    });

    const { userId } = await auth();``
    
    // Log authentication details
    console.log('Authentication:', {
      userId: userId,
      isAuthenticated: !!userId
    });

    const body = await req.json();
    
    // Log request body
    console.log('Request Body:', body);

    const { 
      orderStatus, 
      invoiceLink,
      trackingId,
      customerName, 
      customerEmail, 
      customerPhone 
    } = body;

    // Detailed authentication checks
    if (!userId) {
      console.error('Authentication Failed: No userId');
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Detailed parameter checks
    if (!params.storeid) {
      console.error('Validation Failed: No Store ID');
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!params.orderid) {
      console.error('Validation Failed: No Order ID');
      return new NextResponse("Order ID is required", { status: 400 });
    }

    // Validate order status
    const validStatuses = [
      'PENDING', 
      'PROCESSING', 
      'SHIPPED', 
      'DELIVERED', 
      'CANCELLED'
    ];

    // Detailed status validation
    if (orderStatus) {
      console.log('Validating Order Status:', {
        status: orderStatus,
        validStatuses: validStatuses
      });

      if (!validStatuses.includes(orderStatus)) {
        console.error('Validation Failed: Invalid Order Status', {
          providedStatus: orderStatus,
          allowedStatuses: validStatuses
        });
        return new NextResponse("Invalid order status", { status: 400 });
      }
    }

    // Check if the store belongs to the user
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,
        userId
      }
    });

    if (!storeByUserId) {
      console.error('Authorization Failed: Store does not belong to user', {
        storeId: params.storeid,
        userId: userId
      });
      return new NextResponse("Unauthorized", { status: 405 });
    }

    // Update the order
    try {
      const order = await prismadb.order.update({
        where: {
          id: params.orderid,
          storeId: params.storeid
        },
        data: {
          ...(orderStatus && { orderStatus }),
          ...(invoiceLink && { invoiceLink }),
          ...(trackingId && { trackingId }),
          ...(customerName || customerEmail || customerPhone ? {
            customer: {
              update: {
                ...(customerName && { name: customerName }),
                ...(customerEmail && { email: customerEmail }),
                ...(customerPhone && { phone: customerPhone })
              }
            }
          } : {})
        },
        include: {
          customer: true,
          store: true
        }
      });

      console.log('Order update successful:', {
        orderId: order.id,
        newStatus: orderStatus,
        trackingId,
        storeId: params.storeid
      });

      if (order.customer?.email && (orderStatus || invoiceLink || trackingId)) {
        try {
          const emailResult = await sendOrderStatusEmail({
            customerEmail: order.customer.email,
            orderNumber: order.id,
            newStatus: orderStatus || 'Updated',
            storeName: order.store.name,
            trackingId,
            additionalInfo: invoiceLink ? `Invoice is now available: ${invoiceLink}` : undefined
          });

          // Log email attempt
          logEmailAttempt({
            orderId: order.id,
            customerEmail: order.customer.email,
            status: emailResult ? 'sent' : 'failed',
            errorMessage: emailResult ? undefined : 'Failed to send email'
          });
        } catch (emailError) {
          console.error('Email notification error:', emailError);
          // Continue with the request even if email fails
        }
      }
      return NextResponse.json(order);
    } catch (updateError) {
      console.error('Order update error details:', {
        message: updateError.message,
        stack: updateError.stack,
        params: {
          orderid: params.orderid,
          storeid: params.storeid,
          orderStatus,
          invoiceLink,
          trackingId,
          customerName,
          customerEmail,
          customerPhone
        }
      });

      // Check if the order exists
      try {
        const existingOrder = await prismadb.order.findUnique({
          where: {
            id: params.orderid,
            storeId: params.storeid
          }
        });

        if (!existingOrder) {
          console.error('Order not found:', {
            orderId: params.orderid,
            storeId: params.storeid
          });
          return new NextResponse("Order not found", { status: 404 });
        }
      } catch (findError) {
        console.error('Error checking order existence:', findError);
      }

      return new NextResponse("Failed to update order", { status: 500 });
    }

  } catch (error) {
    console.error('Unexpected error in ORDER_PATCH:', error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}