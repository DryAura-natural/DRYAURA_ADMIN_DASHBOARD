import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { promoId: string, storeid: string } }
) {
  try {
    if (!params.promoId) {
      return new NextResponse("Promo code ID is required", { status: 400 });
    }

    const promoCode = await prismadb.promoCode.findUnique({
      where: {
        id: params.promoId,
        storeId: params.storeid
      }
    });

    if (!promoCode) {
      return new NextResponse("Promo code not found", { status: 404 });
    }

    return NextResponse.json(promoCode);
  } catch (error) {
    console.error("[PROMO_CODE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeid: string, promoId: string } }
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
      isActive,
      maxUses,
      maxUsesPerUser
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
      return new NextResponse("Start and end dates are required", { status: 400 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const promoCode = await prismadb.promoCode.update({
      where: {
        id: params.promoId,
      },
      data: {
        code,
        discount: Number(discount),
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        maxUses: maxUses ? Number(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : null
      }
    });

    return NextResponse.json(promoCode);
  } catch (error) {
    console.error("[PROMO_CODE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeid: string, promoId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,
        userId
      }
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const promoCode = await prismadb.promoCode.delete({
      where: {
        id: params.promoId,
      }
    });

    return NextResponse.json(promoCode);
  } catch (error) {
    console.error("[PROMO_CODE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}