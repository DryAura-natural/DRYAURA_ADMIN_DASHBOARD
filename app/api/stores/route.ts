import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { name } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Check if a store with the same name already exists for this user
    const existingStore = await prismadb.store.findFirst({
      where: {
        name: name,
        userId: userId
      }
    });

    if (existingStore) {
      return new NextResponse("A store with this name already exists", { status: 400 });
    }

    const store = await prismadb.store.create({
      data: {
        name,
        userId,
      },
    });
    return NextResponse.json(store);
  } catch (error) {
    console.error("[STORES_POST] Error:", error);
    
    return new NextResponse("Internal error", { status: 500 });
  }
}