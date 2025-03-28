import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(
  req: Request,
  { params }: { params: { storeid: string; productId: string } }
) {
  try {
    const { productId } = params;
    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const product = await prismadb.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        categories: { include: { category: true } },
        variants: {
          include: {
            size: true,
            color: true
          }
        },
        badges: { include: { badge: true } },
        productBanner: true
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Sanitize benefits and specifications
    const sanitizedProduct = {
      ...product,
      benefits: product.benefitsArray?.length 
        ? product.benefitsArray 
        : product.benefits 
          ? typeof product.benefits === 'string' 
            ? [product.benefits]
            : Array.isArray(product.benefits)
              ? product.benefits
              : Object.values(product.benefits).flat()
          : [],
      specifications: product.specificationsArray?.length
        ? product.specificationsArray
        : product.specifications
          ? typeof product.specifications === 'string'
            ? [product.specifications]
            : Array.isArray(product.specifications)
              ? product.specifications
              : Object.values(product.specifications).flat()
          : [],
    };

    return NextResponse.json(sanitizedProduct);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { storeid: string; productId: string } }
) {
  try {
    const { userId } = await auth();
    const { storeid, productId } = params;

    if (!userId) {
      console.error("[PRODUCT_PATCH] Unauthenticated user");
      return new NextResponse("Unauthenticated", { status: 401 });
    }

    // Validate input parameters
    if (!storeid) {
      console.error("[PRODUCT_PATCH] Store ID is required");
      return new NextResponse("Store ID is required", { status: 400 });
    }

    if (!productId) {
      console.error("[PRODUCT_PATCH] Product ID is required");
      return new NextResponse("Product ID is required", { status: 400 });
    }

    // Special handling for 'new' productId
    if (productId === 'new') {
      console.log("[PRODUCT_PATCH] Creating new product instead of updating");
      
      // Delegate to POST method for creating a new product
      const postRoute = await import('../route');
      return postRoute.POST(req, { params: { storeid } });
    }

    // Verify store ownership first
    const store = await prismadb.store.findFirst({
      where: { id: storeid, userId },
    });

    if (!store) {
      console.error("[PRODUCT_PATCH] Unauthorized store access");
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[PRODUCT_PATCH] Parsed request body:", JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error("[PRODUCT_PATCH] JSON parsing error:", jsonError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: jsonError instanceof Error ? jsonError.message : String(jsonError)
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate request body
    if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
      console.error("[PRODUCT_PATCH] Invalid or empty request body");
      return new NextResponse(
        JSON.stringify({ 
          error: 'Request body is required and must be a non-empty object',
          details: 'Received body: ' + JSON.stringify(body)
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    if (!body.name) {
      console.error("[PRODUCT_PATCH] Product name is required");
      return new NextResponse("Product name is required", { status: 400 });
    }

    // Validate boolean fields
    if (body.isArchived !== undefined && typeof body.isArchived !== 'boolean') {
      console.error('[PRODUCT_PATCH] Invalid isArchived value:', body.isArchived);
      return new NextResponse('isArchived must be a boolean', { status: 400 });
    }
    if (body.isFeatured !== undefined && typeof body.isFeatured !== 'boolean') {
      console.error('[PRODUCT_PATCH] Invalid isFeatured value:', body.isFeatured);
      return new NextResponse('isFeatured must be a boolean', { status: 400 });
    }

    // Validate that product cannot be both archived and featured
    if (body.isArchived === true && body.isFeatured === true) {
      console.error('[PRODUCT_PATCH] Product cannot be both archived and featured');
      return new NextResponse('Product cannot be both archived and featured', { status: 400 });
    }

    // Comprehensive product existence check
    const existingProduct = await prismadb.product.findUnique({
      where: { 
        id: productId, 
        storeId: storeid 
      },
      select: {
        id: true,
        name: true,
        storeId: true,
      }
    });

    if (!existingProduct) {
      console.error("[PRODUCT_PATCH] Product not found", {
        productId,
        storeId: storeid,
        userId
      });
      return new NextResponse(
        JSON.stringify({ 
          error: 'Product not found',
          details: {
            message: 'The specified product does not exist or you do not have permission to modify it.',
            productId,
            storeId: storeid
          }
        }), 
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize benefits and specifications
    const sanitizedBenefits = Array.isArray(body.benefits) 
      ? body.benefits 
      : typeof body.benefits === 'string'
        ? [body.benefits]
        : body.benefits 
          ? Object.values(body.benefits).flat() 
          : [];

    const sanitizedSpecifications = Array.isArray(body.specifications)
      ? body.specifications
      : typeof body.specifications === 'string'
        ? [body.specifications]
        : body.specifications
          ? Object.values(body.specifications).flat()
          : [];

    // Perform updates sequentially to avoid transaction issues
    // Update main product
    const updatedProduct = await prismadb.product.update({
      where: { id: productId, storeId: storeid },
      data: {
        name: body.name,
        description: body.description,
        subLabel: body.subLabel,
        // Only update if values are explicitly provided
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
        benefits: sanitizedBenefits.length > 0 
          ? JSON.parse(JSON.stringify(sanitizedBenefits)) 
          : null,
        specifications: sanitizedSpecifications.length > 0
          ? JSON.parse(JSON.stringify(sanitizedSpecifications))
          : null,
        benefitsArray: sanitizedBenefits,
        specificationsArray: sanitizedSpecifications,
      },
      include: {
        categories: { include: { category: true } },
        variants: true,
        images: true,
        productBanner: true,
        badges: { include: { badge: true } },
      },
    });

    // Update categories if provided
    if (body.categories && Array.isArray(body.categories)) {
      // Remove existing category associations
      await prismadb.categoryOnProduct.deleteMany({ 
        where: { productId } 
      });

      // Create new category associations
      if (body.categories.length > 0) {
        await prismadb.categoryOnProduct.createMany({
          data: body.categories.map((categoryId: string) => ({
            productId,
            categoryId
          }))
        });
      }
    }

    // Update badges if provided
    if (body.badges && Array.isArray(body.badges)) {
      // Remove existing badge associations
      await prismadb.productBadge.deleteMany({ 
        where: { productId } 
      });

      // Create new badge associations
      if (body.badges.length > 0) {
        await prismadb.productBadge.createMany({
          data: body.badges.map((badge: { badgeId: string }) => ({
            productId,
            badgeId: badge.badgeId
          })),
          skipDuplicates: true
        });
      }
    }

    // Update variants with more robust handling
    if (body.variants && Array.isArray(body.variants)) {
      const existingVariantIds = new Set(
        (await prismadb.productVariant.findMany({
          where: { productId },
          select: { id: true }
        })).map(v => v.id)
      );

      const newVariantIds = new Set(body.variants.map(v => v.id));

      // Delete removed variants
      const variantsToDelete = Array.from(existingVariantIds).filter(
        id => !newVariantIds.has(id)
      );
      if (variantsToDelete.length > 0) {
        await prismadb.productVariant.deleteMany({
          where: { id: { in: variantsToDelete } }
        });
      }

      // Update or create variants
      for (const variant of body.variants) {
        const variantData = {
          price: new Decimal(variant.price),
          sizeId: variant.sizeId,
          colorId: variant.colorId || null,
          mrp: new Decimal(variant.mrp),
          productId: productId
        };

        if (existingVariantIds.has(variant.id)) {
          // Update existing variant
          await prismadb.productVariant.update({
            where: { id: variant.id },
            data: variantData
          });
        } else {
          // Create new variant
          await prismadb.productVariant.create({
            data: {
              ...variantData,
              id: variant.id
            }
          });
        }
      }
    }

    if (!updatedProduct) {
      console.error("[PRODUCT_PATCH] Product update failed", {
        productId,
        storeId: storeid
      });
      return new NextResponse(
        JSON.stringify({ 
          error: 'Product update failed',
          details: {
            message: 'Unable to update the product due to an unexpected error.',
            productId,
            storeId: storeid
          }
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log("[PRODUCT_PATCH] Product and related entities updated:", updatedProduct);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_PATCH] Unexpected error:", 
      error instanceof Error ? error.message : String(error)
    );
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { storeid: string; productId: string } }
) {
  try {
    const { userId } = await auth();
    const { storeid, productId } = params; 

    if (!userId) return new NextResponse("Unauthenticated", { status: 401 });
    if (!productId) return new NextResponse("Product ID required", { status: 400 });

    const store = await prismadb.store.findFirst({
      where: { id: storeid, userId }
    });
    if (!store) return new NextResponse("Unauthorized", { status: 403 });

    await prismadb.$transaction([
      prismadb.categoryOnProduct.deleteMany({ where: { productId } }),
      prismadb.productVariant.deleteMany({ where: { productId } }),
      prismadb.image.deleteMany({ where: { productId } }),
      prismadb.productBannerImage.deleteMany({ where: { productId } }),
      prismadb.productBadge.deleteMany({ where: { productId } }),
      prismadb.product.delete({ where: { id: productId } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}