import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
      req: Request,
      { params }: { params: {storeid: string,categoryId: string ,} }
    ) {
      try {
        
        if (!params.categoryId) {
          return new NextResponse("Category id is required", { status: 400 });
        }
        const category = await prismadb.category.findFirst({
          where: {
            OR: [
              { id: params.categoryId },
              { name: params.categoryId }
            ],
            storeId: params.storeid
          },
          include: {
            billboard: {
              include: {
                images: true
              }
            },
          },
        });
   
        if (!category) {
          return new NextResponse("Category not found", { status: 404 });
        }
        return NextResponse.json(category);
      } catch (error) {
        console.log("[CATEGORY_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
      }
}
export async function PATCH(
  req: Request,
  { params }: { params: { storeid:string , categoryId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    
    const { name,billboardId } = body;
    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!billboardId) {
      return new NextResponse("Billboard Id is required", { status: 400 });
    }
    if (!params.categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
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
    const category = await prismadb.category.updateMany({
      where: {
        id: params.categoryId,
      },
      data: {
        name,
        billboardId,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.log("[CATEGORY_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: {storeid:string ,categoryId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!params.categoryId) {
      return new NextResponse("Category Id is required", { status: 400 });
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
    const categories = await prismadb.category.deleteMany({
      where: {
        id: params.categoryId,
      },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.log("[CATEGORY_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
