import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Adjust this in production
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Request body:", body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Missing required fields", isOk: false },
        { status: 400, headers: corsHeaders }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { message: "Razorpay secret key is missing", isOk: false },
        { status: 500, headers: corsHeaders }
      );
    }

    // 🔹 Generate expected signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // 🔹 Compare signatures
    const isOk = generatedSignature === razorpay_signature;

    if (!isOk) {
      return NextResponse.json(
        { message: "Payment verification failed", isOk: false },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔹 Update the order in the database
    const updatedOrder = await prisma.order.updateMany({
      where: { razorpayOrderId: razorpay_order_id }, // Ensure this field exists in your DB
      data: { isPaid: isOk,orderStatus:"PROCESSING" },
    });

    return NextResponse.json(
      { message: "Payment verified successfully", isOk: true, updatedOrder },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", isOk: false },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}
