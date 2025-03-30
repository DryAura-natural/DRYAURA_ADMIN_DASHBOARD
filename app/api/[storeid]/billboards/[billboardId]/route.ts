import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// export async function GET(
//       req: Request,
//       { params }: { params: {billboardId: string } }
//     ) {
//       try {
        
//         if (!params.billboardId) {
//           return new NextResponse("Billboard id is required", { status: 400 });
//         }
     
  
//         const billboard = await prismadb.billboard.findUnique({
//           where: {
//             id: params.billboardId,
//           },
//           include: {
//             images: true
//           }
//         });
        
//         return NextResponse.json(billboard);
//       } catch (error) {
//         console.log("[BILLBOARDS_GET]", error);
//         return new NextResponse("Internal error", { status: 500 });
//       }
// }
export async function GET(
  req: Request,
  { params }: { params: {billboardId: string } }
) {
  try {
    // Validate billboardId
    if (!params.billboardId) {
      return new NextResponse("Billboard id is required", { status: 400 });
    }

    // Add CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*', // Or specify your exact origin
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    const billboard = await prismadb.billboard.findUnique({
      where: {
        id: params.billboardId,
      },
      include: {
        images: true
      }
    });
    
    // Handle case when billboard is not found
    if (!billboard) {
      return new NextResponse("Billboard not found", { status: 404 });
    }

    // Return billboard with CORS headers
    return NextResponse.json(billboard, { 
      headers: new Headers(headers) 
    });
  } catch (error) {
    console.error("[BILLBOARDS_GET]", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error({
        message: error.message,
        stack: error.stack
      });
    }

    return new NextResponse("Internal error", { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
export async function PATCH(
  req: Request,
  { params }: { params: { storeid:string , billboardId: string } }
) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { label, images, description } = body;

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!label) {
      return new NextResponse("label is required", { status: 400 });
    }
    if (!description) {
      return new NextResponse("description is required", { status: 400 });
    }

    if (!images || images.length === 0) {
      return new NextResponse("At least one image is required", { status: 400 });
    }
    if (!params.billboardId) {
      return new NextResponse("Billboard id is required", { status: 400 });
    }
    const storeByUserId = await prismadb.store.findFirst({
      where:{
            id:params.storeid,
            userId
      }
    })
    if (!storeByUserId){
      return new NextResponse("Unauthorized", { status: 403 });
    }
    
    // First, delete existing images
    await prismadb.billboardImage.deleteMany({
      where: {
        billboardId: params.billboardId
      }
    });

    const billboard = await prismadb.billboard.update({
      where: {
        id: params.billboardId,
      },
      data: {
        label,
        description,
        images: {
          create: images.map((url: string) => ({ url }))
        }
      },
      include: {
        images: true
      }
    });
    return NextResponse.json(billboard);
  } catch (error) {
    console.log("[BILLBOARD_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: {storeid:string ,billboardId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    if (!params.billboardId) {
      return new NextResponse("Billboard id is required", { status: 400 });
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
    // First, delete associated billboard images
    await prismadb.billboardImage.deleteMany({
      where: {
        billboardId: params.billboardId
      }
    });

    const billboard = await prismadb.billboard.deleteMany({
      where: {
        id: params.billboardId,
      },
    });
    
    return NextResponse.json(billboard);
  } catch (error) {
    console.log("[BILLBOARDS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
