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
      name,
      price,
      colorId,
      sizeId,
      categoryId,
      images,
      isFeatured,
      isArchived,
      subLabel,
      description,
    } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }
    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }
    if (!price) {
      return new NextResponse("Price is required", { status: 400 });
    }
    // if (!colorId) {
    //   return new NextResponse("Color id is required", { status: 400 });
    // }
    if (!sizeId) {
      return new NextResponse("Size id is required", { status: 400 });
    }
    if (!categoryId) {
      return new NextResponse("Category id is required", { status: 400 });
    }
    if (!images ||!images) {
      return new NextResponse("Images is required", { status: 400 });
    }
    if (!subLabel) {
      return new NextResponse("SubLabel is required", { status: 400 });
    }
    if (!description) {
      return new NextResponse("Description is required", { status: 400 });
    }

    // if (!isFeature) {
    //   return new NextResponse("Label is required", { status: 400 });
    // }
    // if (!isArchived) {
    //   return new NextResponse("Image URL is required", { status: 400 });
    // }

    if (!params.storeid) {
      return new NextResponse("Store id is required", { status: 400 });
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
    const products = await prismadb.product.create({
      data: {
        name,
        price,
        colorId,
        sizeId,
        categoryId,
        isFeatured,
        isArchived,
        storeId: params.storeid,
        subLabel,
        description,
        images:{
          createMany:{
            data:[...images.map((image:{url:string})=>image)]
          }
        }
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
export async function GET(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    const {searchParams} = new URL(req.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const colorId = searchParams.get("colorId") || undefined;
    const sizeId = searchParams.get("sizedId") || undefined;
    const isFeature = searchParams.get("isFeature");
   
    if (!params.storeid) {
      return new NextResponse("Store id is required", { status: 400 });
    }

    const products = await prismadb.product.findMany({
      where: {
        storeId: params.storeid,
        categoryId,
        colorId,
        sizeId,
        isFeatured:isFeature?true:undefined,
        isArchived:false


      },
      include:{
        images:true,
        category:true,
        color:true,
        size:true,

      },
      orderBy:{
        createdAt:'desc'
      }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_GET]", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
