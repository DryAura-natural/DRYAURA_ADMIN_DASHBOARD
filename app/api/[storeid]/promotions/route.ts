import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,

  { params }: { params: { storeid: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const {
      code,
      discount,
      type,
      startDate,
      endDate,
      isActive = true,
      maxUses,
      maxUsesPerUser,
    } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!code) {
      return new NextResponse("Code is required", { status: 400 });
    }

    if (!discount) {
      return new NextResponse("Discount is required", { status: 400 });
    }

    if (!type) {
      return new NextResponse("Type is required", { status: 400 });
    }

    if (!startDate || !endDate) {
      return new NextResponse("Start and end dates are required", {
        status: 400,
      });
    }

    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,

        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const promoCode = await prismadb.promoCode.create({
      data: {
        code,

        discount: Number(discount),

        type,

        startDate: new Date(startDate),

        endDate: new Date(endDate),

        isActive,

        maxUses: maxUses ? Number(maxUses) : null,

        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : null,

        storeId: params.storeid,
      },
    });

    return NextResponse.json(promoCode);
  } catch (error) {
    console.error("[PROMOTIONS_POST]", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}

// export async function GET(
//   req: Request,
//   { params }: { params: { storeid: string } }
// ) {
//   try {
//     if (!params.storeid) {
//       return new NextResponse("Store ID is required", { status: 400 });
//     }

//     const promoCodes = await prismadb.promoCode.findMany({
//       where: {
//         storeId: params.storeid,
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     return NextResponse.json(promoCodes);
//   } catch (error) {
//     console.error("[PROMO_CODE_GET]", error);
//     return new NextResponse("Internal error", { status: 500 });
//   }
// }

export async function GET(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    // Log incoming request details
    console.log('Promotion GET Request:', {
      storeId: params.storeid,
      queryParams: req.url
    });

    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    // Extract code from query parameters
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    console.log('Received Promotion Code:', code);

    // Fetch promotions for the specific store
    const promoCodes = await prismadb.promoCode.findMany({
      where: {
        storeId: params.storeid,
        // Optional: Add additional filters
        isActive: true,
        // Ensure current date is within start and end dates
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    });

    console.log('Found Promotions:', promoCodes);

    // If a specific code is provided, filter further
    const filteredPromotions = code 
      ? promoCodes.filter(promo => 
          promo.code.toLowerCase() === code.toLowerCase()
        ) 
      : promoCodes;

    return NextResponse.json(filteredPromotions);
  } catch (error) {
    console.error('[PROMO_CODE_GET_ERROR]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
