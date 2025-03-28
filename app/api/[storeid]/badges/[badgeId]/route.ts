import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET: Fetch a specific badge by ID (with store validation)
export async function GET(
  req: Request,
  { params }: { params: { storeid: string; badgeId: string } }
) {
  try {
    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!params.badgeId) {
      return new NextResponse("Badge ID is required", { status: 400 });
    }

    // Verify badge belongs to store
    const badge = await prismadb.badge.findUnique({
      where: {
        id: params.badgeId,
        storeId: params.storeid,
      },
    });

    if (!badge) {
      return new NextResponse("Badge not found", { status: 404 });
    }

    return NextResponse.json(badge);
  } catch (error) {
    console.error("[BADGE_GET]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// PATCH: Update a specific badge
export async function PATCH(
  req: Request,
  { params }: { params: { storeid: string; badgeId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { label, color } = body;

    // Validate authentication
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Validate input
    if (!label) {
      return new NextResponse("Label is required", { status: 400 });
    }
    if (color && !/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
      return new NextResponse("Invalid color format. Use hexadecimal color code (e.g., #FF0000)", { status: 400 });
    }
    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!params.badgeId) {
      return new NextResponse("Badge ID is required", { status: 400 });
    }

    // Verify store ownership
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Update badge with store validation
    const updatedBadge = await prismadb.badge.update({
      where: {
        id: params.badgeId,
        storeId: params.storeid,
      },
      data: {
        label,
        ...(color && { color }), // Only update color if provided
      },
    });

    return NextResponse.json(updatedBadge);
  } catch (error) {
    console.error("[BADGE_PATCH]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// DELETE: Delete a specific badge
export async function DELETE(
  req: Request,
  { params }: { params: { storeid: string; badgeId: string } }
) {
  try {
    const { userId } = await auth();

    // Validate authentication
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Validate input
    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }
    if (!params.badgeId) {
      return new NextResponse("Badge ID is required", { status: 400 });
    }

    // Verify store ownership
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Delete badge with store validation
    const deletedBadge = await prismadb.badge.delete({
      where: {
        id: params.badgeId,
        storeId: params.storeid,
      },
    });

    return NextResponse.json(deletedBadge);
  } catch (error) {
    console.error("[BADGE_DELETE]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}