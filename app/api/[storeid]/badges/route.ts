import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST: Create a new badge
export async function POST(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { label, color } = body; // Changed from name and value to label and color

    // Validate user authentication
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }
    if (!label) {
      return new NextResponse("Label is required", { status: 400 });
    }
    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    // Check if the store belongs to the user
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: params.storeid,
        userId,
      },
    });
    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Create the badge
    const badge = await prismadb.badge.create({
      data: {
        label,
        color,
        storeId: params.storeid,
      },
    });

    return NextResponse.json(badge);
  } catch (error) {
    console.error("[BADGE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// GET: Fetch all badges for a store
export async function GET(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    if (!params.storeid) {
      return new NextResponse("Store ID is required", { status: 400 });
    }

    // Fetch all badges for the store
    const badges = await prismadb.badge.findMany({
      where: {
        storeId: params.storeid,
      },
    });

    // Handle case where no badges are found
    if (!badges || badges.length === 0) {
      return new NextResponse("No badges found", { status: 404 });
    }

    return NextResponse.json(badges);
  } catch (error) {
    console.error("[BADGE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}