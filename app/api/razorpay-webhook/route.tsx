import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const CORS_HEADERS = {
'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL 
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin 
  : '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-razorpay-signature',
};

// Detailed logging function
function logWebhookDetails(req: NextRequest, rawBody: string) {
  console.log('🌐 Webhook Received');
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  console.log('Raw Body:', rawBody);
}

// Razorpay webhook signature verification function
function verifyRazorpaySignature(rawBody: string, signature: string | null, secret: string): boolean {
  console.log('🕵️ Razorpay Signature Verification Process');
  console.log('Raw Body:', rawBody);
  console.log('Signature:', signature);
  console.log('Secret Length:', secret.length);

  if (!signature) {
    console.error('❌ No signature provided');
    return false;
  }

  try {
    // Ensure the signature is a string and trim any whitespace
    const cleanSignature = (signature || '').trim();
    
    // Compute signature using the entire raw body
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    console.log('Computed Signature:', computedSignature);
    console.log('Received Signature:', cleanSignature);

    // Perform constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(cleanSignature)
    );

    console.log('Signature Verification Result:', isValid);
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error);
    
    // Log additional context about the error
    if (error instanceof Error) {
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }

    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Extract raw body first
    const rawBody = await req.text();
    
    // Log detailed request information
    logWebhookDetails(req, rawBody);

    // Validate webhook secret
    const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    console.log('🔑 Webhook Secret Used:', razorpayWebhookSecret ? 'Custom Secret' : 'No Secret');

    // Verify webhook signature
    if (!razorpayWebhookSecret) {
      console.error('❌ Razorpay Webhook Secret is not configured');
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Webhook secret not configured'
        }, 
        { 
          status: 500,
          headers: CORS_HEADERS 
        }
      );
    }

    const razorpaySignature = req.headers.get('x-razorpay-signature');

    // Enhanced logging for signature verification
    console.log('🕵️ Signature Verification Details:');
    console.log('Raw Body Length:', rawBody.length);
    console.log('Raw Body (first 500 chars):', rawBody.substring(0, 500));
    console.log('Signature:', razorpaySignature);
    console.log('Webhook Secret Length:', razorpayWebhookSecret.length);

    const isSignatureValid = verifyRazorpaySignature(
      rawBody, 
      razorpaySignature || '', 
      razorpayWebhookSecret
    );

    if (!isSignatureValid) {
      console.error('❌ Invalid webhook signature');
      console.error('Detailed Signature Verification Failure:');
      console.error('Signature:', razorpaySignature);
      console.error('Webhook Secret Used:', razorpayWebhookSecret ? 'Present' : 'Missing');
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Signature verification failed',
          details: {
            signaturePresent: !!razorpaySignature,
            secretConfigured: !!razorpayWebhookSecret
          }
        }, 
        { 
          status: 403,
          headers: CORS_HEADERS 
        }
      );
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
      console.log('📦 Webhook Payload:', JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse webhook payload:', parseError);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Invalid payload format',
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }, 
        { 
          status: 400,
          headers: CORS_HEADERS 
        }
      );
    }

    // Extract payment details
    const paymentEntity = payload.payload?.payment?.entity;
    if (!paymentEntity) {
      console.error('❌ Invalid payment payload', payload);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Invalid payment payload',
          details: payload
        }, 
        { 
          status: 400,
          headers: CORS_HEADERS 
        }
      );
    }

    // Determine payment status
    const isPaid = paymentEntity.status === 'captured';
    const paymentMethod = paymentEntity.method;
    const paymentAmount = paymentEntity.amount / 100; // Convert from paise to rupees

    // Find the order first to ensure it exists
    const existingOrder = await prisma.order.findFirst({
      where: { 
        razorpayOrderId: paymentEntity.order_id 
      }
    });

    // If no order found, log and return error
    if (!existingOrder) {
      console.error(`❌ No order found with Razorpay Order ID: ${paymentEntity.order_id}`);
      console.error('Payload Details:', JSON.stringify(paymentEntity, null, 2));
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Order not found',
          details: {
            razorpayOrderId: paymentEntity.order_id,
            paymentStatus: paymentEntity.status
          }
        }, 
        { 
          status: 404,
          headers: CORS_HEADERS 
        }
      );
    }

    // Update order status in database
    const order = await prisma.order.update({
      where: { 
        id: existingOrder.id 
      },
      data: {
        isPaid: isPaid,
        orderStatus: isPaid ? 'PROCESSING' : 'PENDING', 
        paymentMethod: paymentMethod,
      }
    });

    // Additional logging for successful webhook processing
    console.log(`✅ Order ${order.id} updated. Payment ${isPaid ? 'Successful' : 'Failed'}`);

    // Return immediate success for testing
    return NextResponse.json({ 
      status: 'success', 
      message: 'Webhook received and processed',
      orderId: order.id,
      paymentStatus: isPaid ? 'Captured' : 'Failed'
    }, {
      headers: CORS_HEADERS
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Log additional context about the error
    if (error instanceof Error) {
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }

    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { 
        status: 500,
        headers: CORS_HEADERS 
      }
    );
  }
}

// Ensure the route can handle OPTIONS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: CORS_HEADERS 
  });
}