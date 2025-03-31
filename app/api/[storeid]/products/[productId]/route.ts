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
            color: true,
          },
        },
        badges: { include: { badge: true } },
        productBanner: true,
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
        ? typeof product.benefits === "string"
          ? [product.benefits]
          : Array.isArray(product.benefits)
          ? product.benefits
          : Object.values(product.benefits).flat()
        : [],
      specifications: product.specificationsArray?.length
        ? product.specificationsArray
        : product.specifications
        ? typeof product.specifications === "string"
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

    const body = await req.json();

    // Validate store ownership
    const storeByUserId = await prismadb.store.findFirst({
      where: {
        id: storeid,
        userId,
      },
    });

    if (!storeByUserId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Sanitize and validate inputs
    const sanitizedBenefits = Array.isArray(body.benefitsArray)
      ? body.benefitsArray.filter(Boolean)
      : [];

    const sanitizedSpecifications = Array.isArray(body.specificationsArray)
      ? body.specificationsArray.filter(Boolean)
      : [];


  

    // Validate that product cannot be both out of stock and featured if needed
    if (body.isOutOfStock !== undefined && typeof body.isOutOfStock !== 'boolean') {
      console.error('[PRODUCT_PATCH] Invalid isOutOfStock value:', body.isOutOfStock);
      return new NextResponse('isOutOfStock must be a boolean', { status: 400 });
    }

    // Update product core details
    const updatedProduct = await prismadb.product.update({
      where: {
        id: productId,
        storeId: storeid,
      },

      data: {
        name: body.name,
        description: body.description,
        subLabel: body.subLabel,
        // Ensure benefits and specifications are saved
        benefits:
          body.benefitsArray && body.benefitsArray.length > 0
            ? JSON.parse(JSON.stringify(body.benefitsArray))
            : null,
        specifications:
          body.specificationsArray && body.specificationsArray.length > 0
            ? JSON.parse(JSON.stringify(body.specificationsArray))
            : null,

        benefitsArray: body.benefitsArray,
        specificationsArray: body.specificationsArray,

        categories: {
          deleteMany: {
            productId,
          },
        },
        badges: {
          deleteMany: {
            productId,
          },
        },

   
        isOutOfStock: body.isOutOfStock,
        createdAt: body.createdAt,
        updatedAt: body.updatedAt,
      },
      include: {
        categories: { include: { category: true } },
        variants: true,
        images: true,
        productBanner: true,
        badges: { include: { badge: true } },
      },
    });

    // Update categories
    if (body.categories && Array.isArray(body.categories)) {
      await prismadb.categoryOnProduct.deleteMany({
        where: { productId },
      });

      if (body.categories.length > 0) {
        await prismadb.categoryOnProduct.createMany({
          data: body.categories.map(
            (category: string | { categoryId?: string }) => {
              const categoryId =
                typeof category === "string" ? category : category.categoryId;

              return {
                productId,
                categoryId,
              };
            }
          ),
        });
      }
    }

    // Update badges
    if (body.badges && Array.isArray(body.badges)) {
      await prismadb.productBadge.deleteMany({
        where: { productId },
      });

      if (body.badges.length > 0) {
        await prismadb.productBadge.createMany({
          data: body.badges.map((badge: { badgeId: string }) => ({
            productId,
            badgeId: badge.badgeId,
          })),
          skipDuplicates: true,
        });
      }
    }

    // Update variants with robust handling
    if (body.variants && Array.isArray(body.variants)) {
      const existingVariantIds = new Set(
        (
          await prismadb.productVariant.findMany({
            where: { productId },
            select: { id: true },
          })
        ).map((v) => v.id)
      );

      const newVariantIds = new Set(body.variants.map((v) => v.id));

      // Delete removed variants
      const variantsToDelete = Array.from(existingVariantIds).filter(
        (id) => !newVariantIds.has(id)
      );

      if (variantsToDelete.length > 0) {
        await prismadb.productVariant.deleteMany({
          where: {
            id: { in: variantsToDelete },
            productId,
          },
        });
      }

      // Upsert variants
      for (const variant of body.variants) {
        await prismadb.productVariant.upsert({
          where: {
            id: variant.id || undefined,
            productId,
          },
          update: {
            sizeId: variant.sizeId,
            colorId: variant.colorId,
            price: variant.price,
            mrp: variant.mrp,
          },
          create: {
            productId,
            sizeId: variant.sizeId,
            colorId: variant.colorId,
            price: variant.price,
            mrp: variant.mrp,
          },
        });
      }
    }

    // Update images
    if (body.images && Array.isArray(body.images)) {
      await prismadb.image.deleteMany({
        where: { productId },
      });

      if (body.images.length > 0) {
        await prismadb.image.createMany({
          data: body.images.map((image: { url: string }) => ({
            productId,
            url: image.url,
          })),
        });
      }
    }

    // Update product banner
    if (body.productBadge && Array.isArray(body.productBadge)) {
      await prismadb.productBadge.deleteMany({
        where: { productId },
      });

      if (body.productBadge.length > 0) {
        await prismadb.productBadge.createMany({
          data: body.productBanner.map((banner: { url: string }) => ({
            productId,
            url: banner.url,
          })),
        });
      }
    }

    // Fetch and return the final updated product
    const finalProduct = await prismadb.product.findUnique({
      where: { id: productId },
      include: {
        categories: { include: { category: true } },
        variants: true,
        images: true,
        productBanner: true,
        badges: { include: { badge: true } },
      },
    });

    return NextResponse.json(finalProduct);
  } catch (error) {
    console.error(
      "[PRODUCT_PATCH] Unexpected error:",
      error instanceof Error ? error.message : String(error)
    );
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
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
    if (!productId)
      return new NextResponse("Product ID required", { status: 400 });

    const store = await prismadb.store.findFirst({
      where: { id: storeid, userId },
    });
    if (!store) return new NextResponse("Unauthorized", { status: 403 });

    await prismadb.$transaction([
      prismadb.categoryOnProduct.deleteMany({ where: { productId } }),
      prismadb.productVariant.deleteMany({ where: { productId } }),
      prismadb.image.deleteMany({ where: { productId } }),
      prismadb.productBannerImage.deleteMany({ where: { productId } }),
      prismadb.productBadge.deleteMany({ where: { productId } }),
      prismadb.product.delete({ where: { id: productId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
