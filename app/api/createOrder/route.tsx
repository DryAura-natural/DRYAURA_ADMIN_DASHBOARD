import { PrismaClient } from "@prisma/client";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("❌ Missing Razorpay API keys in environment variables");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400, headers: corsHeaders }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { order },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// export async function POST(req: NextRequest) {
//   try {
//     const requestBody = await req.json();
//     console.log("📥 Incoming Request Body:", requestBody);

//     const { storeId, customerId, totalAmount, orderItems, phone, address } = requestBody;

//     if (!storeId || !customerId || !totalAmount || !Array.isArray(orderItems) || orderItems.length === 0) {
//       return NextResponse.json(
//         { error: "Missing required fields or invalid order items" },
//         { status: 400, headers: corsHeaders }
//       );
//     }

//     let razorpayOrder;
//     try {
//       razorpayOrder = await razorpay.orders.create({
//         amount: totalAmount * 100,
//         currency: "INR",
//         receipt: uuidv4(),
//       });
//     } catch (razorpayError: any) {
//       return NextResponse.json(
//         { error: razorpayError.message || "Failed to create Razorpay order" },
//         { status: 500, headers: corsHeaders }
//       );
//     }

//     const newOrder = await prisma.$transaction(async (prisma) => {
//       return await prisma.order.create({
//         data: {
//           storeId,
//           customerId,
//           totalAmount,
//           phone,
//           address,
//           orderItems: {
//             create: orderItems.map((item) => ({
//               productId: item.productId,
//               quantity: item.quantity,
//             })),
//           },
//         },
//         include: { orderItems: true },
//       });
//     });

//     return NextResponse.json(
//       { message: "Order created successfully", order: newOrder, razorpayOrder },
//       { status: 201, headers: corsHeaders }
//     );
//   } catch (error: any) {
//     return NextResponse.json(
//       { error: error.message || "Failed to create order" },
//       { status: 500, headers: corsHeaders }
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// }

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    console.log("📥 Incoming Request Body:", requestBody);

    const { storeId, customerId, totalAmount, orderItems, phone, address } = requestBody;

    if (!storeId || !customerId || !totalAmount || !Array.isArray(orderItems) || orderItems.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields or invalid order items" },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔹 Step 1: Create an order in Razorpay
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // Convert to paise
        currency: "INR",
        receipt: uuidv4(),
      });
    } catch (razorpayError: any) {
      return NextResponse.json(
        { error: razorpayError.message || "Failed to create Razorpay order" },
        { status: 500, headers: corsHeaders }
      );
    }

    // 🔹 Step 2: Save the order in your database
    const newOrder = await prisma.$transaction(async (prisma) => {
      return await prisma.order.create({
        data: {
          storeId,
          customerId,
          totalAmount,
          phone,
          address,
          razorpayOrderId: razorpayOrder.id, // Save Razorpay Order ID
          orderItems: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
        include: { orderItems: true },
      });
    });

    return NextResponse.json(
      { 
        message: "Order created successfully", 
        order: newOrder, 
        razorpayOrderId: razorpayOrder.id // Send Razorpay Order ID in response
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}


export async function PATCH(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { orderId, orderStatus } = requestBody; // Use `orderStatus` instead of `status`

    if (!orderId || !orderStatus) {
      return NextResponse.json(
        { error: "Missing order ID or status" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Define valid statuses based on your `OrderStatus` enum
    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(orderStatus)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update the order with the new `orderStatus`
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus }, // Use `orderStatus` here
    });

    return NextResponse.json(
      { message: "Order status updated successfully", order: updatedOrder },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
} 