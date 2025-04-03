import { PrismaClient, Prisma } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import Razorpay from "razorpay";
import prismadb from "@/lib/prismadb";

const prisma = new PrismaClient();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("❌ Missing Razorpay API keys in environment variables");
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Define CORS headers with comprehensive support
const corsHeaders = {
 'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_FRONTEND_URL 
  ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).origin 
  : '*',
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
  "Vary": "Origin"
};

// Define an interface for the request body to ensure type safety
interface OrderRequestBody {
  storeId: string;
  customerId: string;
  totalAmount: number;
  orderItems: Array<{
    productId: string;
    productName?: string;  // Optional
    productImageUrl?: string;  // Optional
    variantId: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
  }>;
  phone: string;
  alternatePhone: string;
  address: string;
  name?: string;
  email?: string;
}

// Handle preflight requests
export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get('origin') || corsHeaders["Access-Control-Allow-Origin"];
  return NextResponse.json({}, {
    headers: {
      ...corsHeaders,
      "Access-Control-Allow-Origin": requestOrigin
    },
    status: 200
  });
}

export async function GET(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 });
    }

    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Construct filter conditions
    const filter: any = {
      storeId: params.storeid,
    };

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Add date range filter if start or end date is provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = new Date(startDate);
      if (endDate) filter.createdAt.lte = new Date(endDate);
    }

    // Fetch orders with pagination and include related data
    const orders = await prismadb.order.findMany({
      where: filter,
      include: {
        orderItems: {
          include: {
            product: true,
            variant: true
          }
        },
        customer: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Count total orders for pagination
    const totalOrders = await prismadb.order.count({
      where: filter
    });

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders
      }
    });

  } catch (error) {
    console.error('[ORDERS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
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
      // if (item.productImageUrl && !isValidUrl(item.productImageUrl)) {
      //   console.error(`❌ Validation Warning: Order item ${index + 1} - Invalid image URL`);
      //   validationErrors.push(`Order item ${index + 1}: Invalid image URL`);
      // }
    });
    // function isValidUrl(url: string): boolean {
    //   try {
    //     new URL(url);
    //     return true;
    //   } catch {
    //     return false;
    //   }
    // }
    if (validationErrors.length > 0) {
      console.error("❌ Validation Failed:", validationErrors);
      return NextResponse.json(
        { error: "Validation Failed", details: validationErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify store exists
    const store = await prisma.store.findUnique({
      where: { id: requestBody.storeId }
    });

    if (!store) {
      console.error(`❌ Store Not Found: No store found with ID: ${requestBody.storeId}`);
      return NextResponse.json(
        { error: "Store Not Found", details: `No store found with ID: ${requestBody.storeId}` },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { userId: requestBody.customerId }
    });

    if (!customer) {
      console.error(`❌ Customer Not Found: No customer found with User ID: ${requestBody.customerId}`);
      return NextResponse.json(
        { error: "Customer Not Found", details: `No customer found with User ID: ${requestBody.customerId}` },
        { status: 404, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate a unique order ID for Razorpay
    const orderId = uuidv4();
    
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001';
    const adminUrl = process.env.NEXT_PUBLIC_API_URL_ADMIN || frontendUrl;
    const returnUrl = `${frontendUrl.replace(/\/+$/, '')}/payment-success`;
    const cancelUrl = `${frontendUrl.replace(/\/+$/, '')}/cart`;
    const notifyUrl = `${adminUrl.replace(/\/+$/, '')}/api/razorpay-webhook`;
    
    const payloadForRazorpay = {
      amount: Math.round(requestBody.totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1,
      notes: {
        storeId: requestBody.storeId,
        customerId: requestBody.customerId,
      },
    };

    console.log("🔍 Razorpay Order Payload:", JSON.stringify(payloadForRazorpay, null, 2));

    let razorpayOrder;
    try {
      // Comprehensive error handling for Razorpay order creation
      razorpayOrder = await razorpay.orders.create(payloadForRazorpay);
    } catch (razorpayError: any) {
      // Detailed Razorpay error logging
      console.error("❌ Comprehensive Razorpay Order Creation Error:", {
        message: razorpayError.message,
        name: razorpayError.name,
        stack: razorpayError.stack,
        responseData: razorpayError.response?.data,
        responseStatus: razorpayError.response?.status,
        responseHeaders: razorpayError.response?.headers
      });

      // Return a detailed error response
      return NextResponse.json(
        { 
          error: "Payment Gateway Error", 
          details: razorpayError.message || "Failed to create Razorpay order",
          diagnostics: {
            orderId: orderId,
            totalAmount: requestBody.totalAmount,
            phone: requestBody.phone,
           
            alternatePhone: requestBody.alternatePhone,
            email: requestBody.email,
            customerId: requestBody.customerId,
            errorDetails: razorpayError.response ? razorpayError.response.data : null,
            frontendUrl: process.env.NEXT_PUBLIC_FRONTEND_URL
          }
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Validate Razorpay order response
    if (!razorpayOrder.id || !razorpayOrder.receipt) {
      console.error("❌ Invalid Razorpay Order Response:", {
        hasId: !!razorpayOrder.id,
        hasReceipt: !!razorpayOrder.receipt,
        fullResponse: razorpayOrder
      });

      // Return the full response for debugging
      return NextResponse.json(
        { 
          paymentOrderDetails: {
            id: razorpayOrder.id,
            receipt: razorpayOrder.receipt,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
          },
          message: "Order created successfully",
          order: {
            id: '',
            totalAmount: requestBody.totalAmount.toString()
          }
        },
        { status: 200, headers: corsHeaders }
      );
    }

    // Create order in the database
    const newOrder = await prisma.$transaction(async (prisma) => {
      return await prisma.order.create({
        data: {
          storeId: requestBody.storeId,
          customerId: requestBody.customerId,
          totalAmount: new Prisma.Decimal(requestBody.totalAmount),
          phone: requestBody.phone,
          alternatePhone: requestBody.alternatePhone,
          address: requestBody.address,
          razorpayOrderId: razorpayOrder.id,
          ...(requestBody.name && { name: requestBody.name }),
          ...(requestBody.email && { email: requestBody.email }),
          orderItems: {
            create: requestBody.orderItems.map((item) => ({
              productId:item.productId,
              productName:item.productName,
              // productImageUrl:item.productImageUrl,
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

    // Return successful order creation response
    return NextResponse.json(
      { 
        paymentOrderDetails: {
          id: razorpayOrder.id,
          receipt: razorpayOrder.receipt,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        message: "Order created successfully",
        order: newOrder
      },
      { 
        headers: corsHeaders 
      }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    console.error("❌ Order Creation Error:", errorMessage);
    return NextResponse.json(
      { error: "Order Creation Failed", details: errorMessage },
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}



