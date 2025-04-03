import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

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

// Handle preflight requests
export async function OPTIONS(req: NextRequest) {
  const requestOrigin = req.headers.get('origin') || corsHeaders["Access-Control-Allow-Origin"];
  return NextResponse.json({}, {
    headers: corsHeaders
  });
}

// Get orders with comprehensive filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    const skip = (page - 1) * pageSize;

// In app/api/orders/route.tsx
const orders = await prisma.order.findMany({
  where: {
    storeId,
    ...(customerId && { customerId }),
    ...(status && { orderStatus: status as OrderStatus }),
    ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
  },
  include: {
    orderItems: {
      include: {
        variant: {
          include: {
            size: true,  // Include size information
            color: true  // Optional: include color if needed
          }
        },
       
      }
    },
    customer: true
  },
  skip,
  take: pageSize,
  orderBy: {
    createdAt: 'desc'
  }
});
    const totalOrders = await prisma.order.count({
      where: {
        storeId,
        ...(customerId && { customerId }),
        ...(status && { orderStatus: status as OrderStatus }),
        ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
      }
    });

    return NextResponse.json(
      {
        orders,
        pagination: {
          currentPage: page,
          pageSize,
          totalOrders,
          totalPages: Math.ceil(totalOrders / pageSize)
        }
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: String(error) }, 
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update order status
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, orderId, status } = body;

    if (!storeId || !orderId || !status) {
      return NextResponse.json(
        { error: 'Store ID, Order ID, and Status are required' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { 
        id: orderId,
        storeId: storeId 
      },
      data: { },
      include: {
        orderItems: {
          include: {
            variant: true
          }
        }
      }
    });

    return NextResponse.json(
      { order: updatedOrder },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status', details: String(error) }, 
      { status: 500, headers: corsHeaders }
    );
  } finally {
    await prisma.$disconnect();
  }
}