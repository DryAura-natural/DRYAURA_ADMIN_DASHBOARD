import { PrismaClient, Prisma } from "@prisma/client";
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

// Robust CORS headers generation function
function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = origin || process.env.NEXT_PUBLIC_FRONTEND_URL || "*";
  return {
   'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL 
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin 
  : '*',
    "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };
}

// Define an interface for the request body to ensure type safety
interface OrderRequestBody {
  storeId: string;
  customerId: string;
  totalAmount: number;
  orderItems: Array<{
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
  phone: string;
  address: string;
  name?: string;
  email?: string;
}

// Handle preflight requests
export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get('origin');
  return NextResponse.json({}, {
    headers: getCorsHeaders(requestOrigin),
    status: 200
  });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const requestOrigin = req.headers.get('origin');

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order ID" },
        { 
          status: 400, 
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { 
          status: 404, 
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }

    return NextResponse.json(
      { order },
      { 
        headers: getCorsHeaders(requestOrigin)
      }
    );
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    const requestOrigin = req.headers.get('origin');
    return NextResponse.json(
      { error: "Internal Server Error" },
      { 
        status: 500, 
        headers: getCorsHeaders(requestOrigin)
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  console.log("🔍 Order Creation Request Received");
  console.log("Request Headers:", Object.fromEntries(req.headers.entries()));

  try {
    // Parse request body
    const requestBody: OrderRequestBody = await req.json();
    console.log("🔢 Parsed Request Body:", JSON.stringify(requestBody, null, 2));

    // Validate request body
    const validationErrors: string[] = [];
    if (!requestBody.storeId) {
      console.error("❌ Validation Error: Store ID is missing");
      validationErrors.push("Store ID is required");
    }
    if (!requestBody.customerId) {
      console.error("❌ Validation Error: Customer ID is missing");
      validationErrors.push("Customer ID is required");
    }
    if (!requestBody.totalAmount || requestBody.totalAmount <= 0) {
      console.error("❌ Validation Error: Invalid total amount");
      validationErrors.push("Invalid total amount");
    }
    if (!Array.isArray(requestBody.orderItems) || requestBody.orderItems.length === 0) {
      console.error("❌ Validation Error: Order items are empty");
      validationErrors.push("Order items are required");
    }
    if (!requestBody.phone) {
      console.error("❌ Validation Error: Phone number is missing");
      validationErrors.push("Phone number is required");
    }
    if (!requestBody.address) {
      console.error("❌ Validation Error: Delivery address is missing");
      validationErrors.push("Delivery address is required");
    }

    // Validate each order item
    requestBody.orderItems.forEach((item, index) => {
      if (!item.productId) {
        console.error(`❌ Validation Error: Order item ${index + 1} - Product ID is missing`);
        validationErrors.push(`Order item ${index + 1}: Product ID is required`);
      }
      if (!item.variantId) {
        console.error(`❌ Validation Error: Order item ${index + 1} - Variant ID is missing`);
        validationErrors.push(`Order item ${index + 1}: Variant ID is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        console.error(`❌ Validation Error: Order item ${index + 1} - Invalid quantity`);
        validationErrors.push(`Order item ${index + 1}: Invalid quantity`);
      }
      if (!item.unitPrice || item.unitPrice < 0) {
        console.error(`❌ Validation Error: Order item ${index + 1} - Invalid unit price`);
        validationErrors.push(`Order item ${index + 1}: Invalid unit price`);
      }
    });

    if (validationErrors.length > 0) {
      console.error("❌ Validation Failed:", validationErrors);
      const requestOrigin = req.headers.get('origin');
      return NextResponse.json(
        { error: "Validation Failed", details: validationErrors },
        { status: 400, headers: getCorsHeaders(requestOrigin) }
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: requestBody.storeId }
    });

    if (!store) {
      console.error(`❌ Store Not Found: No store found with ID: ${requestBody.storeId}`);
      const requestOrigin = req.headers.get('origin');
      return NextResponse.json(
        { error: "Store Not Found", details: `No store found with ID: ${requestBody.storeId}` },
        { status: 404, headers: getCorsHeaders(requestOrigin) }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { userId: requestBody.customerId }
    });

    if (!customer) {
      console.error(`❌ Customer Not Found: No customer found with User ID: ${requestBody.customerId}`);
      const requestOrigin = req.headers.get('origin');
      return NextResponse.json(
        { error: "Customer Not Found", details: `No customer found with User ID: ${requestBody.customerId}` },
        { status: 404, headers: getCorsHeaders(requestOrigin) }
      );
    }

    // Verify product and variant details
    const productVariantErrors: string[] = [];
    for (const item of requestBody.orderItems) {
      // First, check if the product exists
      const product = await prisma.product.findUnique({
        where: { 
          id: item.productId,
          storeId: requestBody.storeId  // Ensure product belongs to the correct store
        }
      });

      if (!product) {
        console.error(`❌ Product Not Found: Product ${item.productId} does not exist in store ${requestBody.storeId}`);
        productVariantErrors.push(`Product ${item.productId} not found in the specified store`);
        continue;  // Skip to next item
      }

      // Then check the variant
      const variant = await prisma.productVariant.findUnique({
        where: { 
          id: item.variantId,
          productId: item.productId 
        }
      });

      if (!variant) {
        console.error(`❌ Product Variant Not Found: 
          Variant ${item.variantId} does not exist for product ${item.productId}
          Store ID: ${requestBody.storeId}`);
        
        // Additional diagnostic logging
        const allVariantsForProduct = await prisma.productVariant.findMany({
          where: { productId: item.productId }
        });

        console.log(`🔍 Existing variants for product ${item.productId}:`, 
          JSON.stringify(allVariantsForProduct.map(v => v.id), null, 2)
        );

        productVariantErrors.push(`Invalid variant ${item.variantId} for product ${item.productId}`);
      }
    }

    if (productVariantErrors.length > 0) {
      console.error("❌ Product Variant Validation Failed:", productVariantErrors);
      const requestOrigin = req.headers.get('origin');
      return NextResponse.json(
        { 
          error: "Product Variant Validation Failed", 
          details: productVariantErrors,
          diagnostics: {
            storeId: requestBody.storeId,
            orderItems: requestBody.orderItems.map(item => ({
              productId: item.productId,
              variantId: item.variantId
            }))
          }
        },
        { status: 400, headers: getCorsHeaders(requestOrigin) }
      );
    }

    // 🔹 Step 1: Create an order in Razorpay
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(requestBody.totalAmount * 100), // Ensure integer conversion
        currency: "INR",
        receipt: uuidv4(),
        notes: {
          customerId: requestBody.customerId,
          storeId: requestBody.storeId,
          customerName: requestBody.name || '',
          customerEmail: requestBody.email || '',
          customerPhone: requestBody.phone || '',
       
        }
      });
      console.log("✅ Razorpay Order Created Successfully:", razorpayOrder.id);
    } catch (razorpayError: any) {
      console.error("❌ Razorpay Order Creation Error:", razorpayError);
      const requestOrigin = req.headers.get('origin');
      return NextResponse.json(
        { error: "Payment Gateway Error", details: razorpayError.message || "Failed to create Razorpay order" },
        { status: 500, headers: getCorsHeaders(requestOrigin) }
      );
    }

    // 🔹 Step 2: Save the order in your database
    const newOrder = await prisma.$transaction(async (prisma) => {
      return await prisma.order.create({
        data: {
          storeId: requestBody.storeId,
          customerId: customer.id,
          totalAmount: new Prisma.Decimal(requestBody.totalAmount),
          phone: requestBody.phone,
          address: requestBody.address,
          razorpayOrderId: razorpayOrder.id,
          ...(requestBody.name && { name: requestBody.name }),
          ...(requestBody.email && { email: requestBody.email }),
          orderItems: {
            create: requestBody.orderItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              totalPrice: new Prisma.Decimal(item.totalPrice || item.unitPrice * item.quantity)
            })),
          },
        },
        include: { orderItems: true },
      });
    });
    console.log("✅ Order Created Successfully:", newOrder.id);

    const requestOrigin = req.headers.get('origin');
    return NextResponse.json(
      { 
        message: "Order created successfully", 
        order: {
          id: newOrder.id,
          totalAmount: newOrder.totalAmount.toString(),
          razorpayOrderId: razorpayOrder.id
        },
        razorpayOrderDetails: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
        }
      },
      { 
        status: 201, 
        headers: getCorsHeaders(requestOrigin) 
      }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("❌ Order Creation Error:", errorMessage);
    const requestOrigin = req.headers.get('origin');
    return NextResponse.json(
      { error: "Order Creation Failed", details: errorMessage },
      { status: 500, headers: getCorsHeaders(requestOrigin) }
    );
  } finally {
    await prisma.$disconnect();
  }
}
