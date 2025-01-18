import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

// Initialize Razorpay instance with your key and secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3001", // Allow your frontend
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS request for preflight requests
export async function OPTIONS(req: NextRequest, res: NextResponse) {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const { amount } = await req.json();
    
    // Validate the amount
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount provided." },
        { status: 400, headers: corsHeaders }
      );
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects the amount in paise
      currency: "INR",
      receipt: "receipt_001" + Math.random().toString(36).substring(7),
    });

    return NextResponse.json(
      { orderId: order.id },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating order:", error); // Log detailed error for debugging
    return NextResponse.json(
      { error: error || "Error creating order" },
      { status: 500, headers: corsHeaders }
    );
  }
}
