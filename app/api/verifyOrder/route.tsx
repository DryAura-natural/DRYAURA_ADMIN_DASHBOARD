import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Set CORS headers for your backend
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Frontend's URL
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Razorpay instance with your key and secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Handle OPTIONS request for preflight checks
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: corsHeaders,
  });
}

// Handle POST request for payment verification
export async function POST(req: NextRequest) {
  try {
    const { orderId, razorpayPaymentId, razorpaySignature } = await req.json();

    const generatedSignature = (razorpayOrderId: string, razorpayPaymentId: string) => {
      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const sig = crypto
        .createHmac("sha256", keySecret)
        .update(razorpayOrderId + "|" + razorpayPaymentId)
        .digest("hex");
      return sig;
    };

    const signature = generatedSignature(orderId, razorpayPaymentId);
    if (signature !== razorpaySignature) {
      return NextResponse.json(
        { message: "Payment verification failed", isOk: false },
        { status: 400, headers: corsHeaders }
      );
    }

    // Success: Payment is verified
    return NextResponse.json(
      { message: "Payment verified successfully", isOk: true },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { message: "Payment verification failed", isOk: false },
      { status: 500, headers: corsHeaders }
    );
  }
}
