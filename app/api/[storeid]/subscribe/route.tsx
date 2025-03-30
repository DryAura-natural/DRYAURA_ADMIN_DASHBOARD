import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { z } from 'zod'
import prismadb from "@/lib/prismadb";

const prisma = new PrismaClient();
const subscriberQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
  search: z.string().optional(),
  sortBy: z.enum(['email', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: corsHeaders,
    status: 204,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { storeid: string } }
) {
  try {
    const body = await req.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Check if email already exists for this store
    const existingSubscription = await prisma.subscribe.findFirst({
      where: {
        email,
        storeId: params.storeid,
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          message: "Email already subscribed",
          alreadySubscribed: true,
        },
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    // Create new subscription
    const newSubscription = await prisma.subscribe.create({
      data: {
        email,
        storeId: params.storeid,
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtpout.secureserver.net",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, // Use SSL
      auth: {
        user: process.env.SMTP_USER || process.env.ADMIN_EMAIL,
        pass: process.env.SMTP_PASS || process.env.ADMIN_EMAIL_PASSWORD,
      },
      // Add additional configuration for better reliability
      tls: {
        rejectUnauthorized: true,
      },
    });

    const mailOptions = {
      from: {
        name: 'Dryaura Family',
        address: process.env.ADMIN_EMAIL || 'customercare@dryaura.in'
      },
      to: email,
      subject: "🌿 Welcome to Dryaura Family! 🥜",
      html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F0F4F8; border-radius: 12px;">
            <div style="background-color: #3D1D1D; color: white; padding: 20px; border-radius: 8px; text-align: center;">
              <img src="https://cloud.appwrite.io/v1/storage/buckets/67a9cbfa001285dc191f/files/67a9d16d0027ce92d6a9/view?project=67a96cd2001e32766970&mode=admin" alt="Dryaura Logo" style="max-width: 150px; margin-bottom: 15px;">
            </div>
            <h1 style="margin: 0; font-size: 24px;">🌱 Welcome to the Dryaura Family! 🌱</h1>
    
            <div style="background-color: white; padding: 25px; margin-top: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #3D1D1D; margin-top: 0;">Nutrition Insights Await You! 📊</h2>
              
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">🍑</span>
                <p style="margin: 0; color: #2C3E50;">Get ready for weekly nutrition tips and wellness strategies!</p>
              </div>
    
              <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 24px; margin-right: 10px;">💪</span>
                <p style="margin: 0; color: #2C3E50;">Exclusive insights into healthy living and premium nutrition.</p>
              </div>
    
             <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; margin-top: 20px;">
  <h3 style="color: #3D1D1D; margin-top: 0;">🌰 Why Choose Dryaura Dry Fruits? 🥜</h3>
  <ul style="padding-left: 20px; color: #2C3E50;">
    <li>🫘 100% Natural & Handpicked Dry Fruits</li>
    <li>🌿 Sourced from Premium Organic Farms</li>
    <li>💎 Nutrient-Dense Superfoods with Zero Preservatives</li>
    <li>🚚 Free Shipping on First Order</li>
    <li>🔬 Scientifically Curated Nutrition Packs</li>
  </ul>

  <div style="background-color: #E9F5E9; padding: 10px; border-radius: 6px; margin-top: 15px;">
    <h4 style="color: #3D1D1D; margin: 0 0 10px 0;">🌟 Dry Fruit Benefits:</h4>
    <p style="margin: 0; color: #2C3E50; font-size: 14px;">
      Our dry fruits are packed with essential nutrients, promoting heart health, 
      boosting immunity, supporting weight management, and providing sustained energy. 
      Each bite is a step towards holistic wellness!
    </p>
  </div>
</div>
            </div>
    
            <div style="text-align: center; margin-top: 20px; color: #6B7280;">
              <p>Can't wait to support your nutrition journey! 🥦🥑</p>
              <p style="font-size: 12px;">
                If you didn't subscribe, please ignore this email. 
                <a href="https://dryaura.in/unsubscribe" style="color: #3D1D1D;">Unsubscribe</a>
              </p>
            </div>
    
            <div style="background-color: #3D1D1D; color: white; text-align: center; padding: 10px; margin-top: 20px; border-radius: 8px;">
              <p style="margin: 0; font-size: 12px;">© 2024 Dryaura Nutrition. All rights reserved.</p>
            </div>
          </div>
        `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Congratulatory email sent to ${email}`);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }

    return NextResponse.json(
      {
        message: "Successfully subscribed!",
        subscriptionId: newSubscription.id,
        isNewSubscription: true,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}



export async function GET(
  req: NextRequest, 
  { params }: { params: { storeid: string } }
) {
  try {
    // Validate query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedParams = subscriberQuerySchema.parse({
      page: queryParams.page,
      limit: queryParams.limit,
      search: queryParams.search,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder
    });

    // Calculate pagination
    const { page, limit, search, sortBy, sortOrder } = validatedParams;
    const offset = (page - 1) * limit;

    // Construct dynamic filter
    const whereCondition: any = {
      storeId: params.storeid,
      ...(search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    // Fetch subscribers with pagination and sorting
    const [subscribers, total] = await Promise.all([
      prismadb.subscribe.findMany({
        where: whereCondition,
        orderBy: { 
          [sortBy]: sortOrder 
        },
        skip: offset,
        take: limit
      }),
      prismadb.subscribe.count({ where: whereCondition })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: subscribers,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Total-Count': total.toString()
      }
    });

  } catch (error) {
    console.error('[SUBSCRIBERS_GET]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        message: 'Invalid query parameters',
        errors: error.errors
      }, { status: 400 });
    }

    return NextResponse.json(
      { message: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}