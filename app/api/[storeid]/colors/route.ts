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
    const { name, value } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!value) {
      return new NextResponse("value is required", { status: 400 });
    }
    if (!params.storeid) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const  storeByUserId = await prismadb.store.findFirst({
      where:{
            id:params.storeid,
            userId
      }
    })
    if (!storeByUserId){
      return new NextResponse("Unauthorized", { status: 403 });

    }
    const colors = await prismadb.color.create({
      data: {
        name,
        value,
        storeId: params.storeid,
      },
    });
    return NextResponse.json(colors);
  } catch (error) {
    console.error("COLOR_POST]", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
export async function GET( 
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
   
    if (!params.storeid) {
      return new NextResponse("Store id is required", { status: 400 });
    }



    const colors = await prismadb.color.findMany({
      where: {
        storeId: params.storeid,
      },
    });

    if (!colors || colors.length === 0) {
      return new NextResponse("No colors found", { status: 404 });
    }
    
    return NextResponse.json(colors);
  } catch (error) {
    console.error("[COLOR_GET]", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
