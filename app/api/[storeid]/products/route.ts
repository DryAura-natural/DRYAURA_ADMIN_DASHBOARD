import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Decimal } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";


import { z } from 'zod';

// Advanced Filter Schema
const ProductFilterSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(20),
  search: z.string().optional(),
  sortBy: z.enum([
    'name', 
    'createdAt', 
    'price', 
   
  ]).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  
  // Advanced Filtering Options
  categories: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  
  // Price and Variant Filtering
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  
  // Boolean Filters

  isOutOfStock: z.boolean().optional(),
  
  // Nutritional and Specification Filters
  benefits: z.array(z.string()).optional(),
  specifications: z.array(z.string()).optional()
});

export async function GET(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse and validate query parameters
    const validatedParams = ProductFilterSchema.parse({
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '10', 10),
      search: searchParams.get('search') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      
      // Advanced Filter Parsing
      categories: searchParams.getAll('categories'),
      badges: searchParams.getAll('badges'),
      sizes: searchParams.getAll('sizes'),
      colors: searchParams.getAll('colors'),
      
      priceMin: searchParams.get('priceMin') 
        ? parseFloat(searchParams.get('priceMin')!) 
        : undefined,
      priceMax: searchParams.get('priceMax') 
        ? parseFloat(searchParams.get('priceMax')!) 
        : undefined,
      
    
      isOutOfStock: searchParams.get('isOutOfStock') === 'true' ? true : 
                    searchParams.get('isOutOfStock') === 'false' ? false : undefined,
      
      benefits: searchParams.getAll('benefits'),
      specifications: searchParams.getAll('specifications')
    });

    const { storeid } = params;
    const { 
      page, 
      limit, 
      search, 
      sortBy, 
      sortOrder,
      categories,
      badges,
      sizes,
      colors,
      priceMin,
      priceMax,
      isOutOfStock,
      benefits,
      specifications
    } = validatedParams;

    // Construct dynamic where clause for filtering
    const whereClause: Prisma.ProductWhereInput = { 
      storeId: storeid,
      
      // Category Filtering
      ...(categories?.length ? { 
        categories: { 
          some: { 
            category: { 
              name: { in: categories } 
            } 
          } 
        } 
      } : {}),
      
      // Badge Filtering
      ...(badges?.length ? { 
        badges: { 
          some: { 
            badge: { 
              label: { in: badges } 
            } 
          } 
        } 
      } : {}),
      
      // Size Filtering
      ...(sizes?.length ? { 
        variants: { 
          some: { 
            size: { 
              name: { in: sizes } 
            } 
          } 
        } 
      } : {}),
      
      // Color Filtering
      ...(colors?.length ? { 
        variants: { 
          some: { 
            color: { 
              value: { in: colors } 
            } 
          } 
        } 
      } : {}),
      
      // Price Range Filtering
      ...(priceMin !== undefined && priceMax !== undefined ? { 
        variants: { 
          some: { 
            price: { 
              gte: priceMin, 
              lte: priceMax 
            } 
          } 
        } 
      } : {}),
      
      // Boolean Filters
      
      
      
      // Benefits Filtering
      ...(benefits?.length ? { 
        benefitsArray: { 
          hasSome: benefits 
        } 
      } : {}),
      
      // Specifications Filtering
      ...(specifications?.length ? { 
        specificationsArray: { 
          hasSome: specifications 
        } 
      } : {}),
      
      // Global Search
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { benefitsArray: { has: search } },
          { specificationsArray: { has: search } },
        ]
      } : {})
    };

    // Construct dynamic order by clause
    const orderByClause: any = { 
      [sortBy]: sortOrder 
    };

    // Fetch total count for pagination
    const totalProducts = await prismadb.product.count({ 
      where: whereClause 
    });

    // Fetch products with all necessary includes
    const products = await prismadb.product.findMany({
      where: whereClause,
      include: {
        categories: { include: { category: true } },
        variants: { 
          include: { 
            size: true,
            color: true
          } 
        },
        images: true,
        productBanner: true,
        badges: { include: { badge: true } },
      },
      orderBy: orderByClause,
      skip: (page - 1) * limit,
      take: limit,
    });

    // Sanitize and transform products
    const sanitizedProducts = products.map(product => ({
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
    }));

    return NextResponse.json({
      products: sanitizedProducts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        pageSize: limit,
      },
      // Include filter metadata for frontend
      filterOptions: {
        categories: await prismadb.category.findMany({ 
          where: { storeId: storeid },
          select: { name: true }
        }),
        badges: await prismadb.badge.findMany({ 
          where: { storeId: storeid },
          select: { label: true }
        }),
        sizes: await prismadb.size.findMany({ 
          where: { storeId: storeid },
          select: { name: true }
        }),
        colors: await prismadb.color.findMany({ 
          where: { storeId: storeid },
          select: { value: true }
        })
      }
    });
  } catch (error) {
    console.error("[PRODUCTS_GET] Unexpected error:", 
      error instanceof Error ? error.message : String(error)
    );
    
    // Differentiate between validation and other errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation Error', 
        details: error.errors 
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}



export async function POST(
  req: Request,
  { params }: { params: { storeid: string } }
) {
  try {
    // Attempt to parse request body
    let body;
    try {
      body = await req.json();
      console.log("[PRODUCTS_POST] Parsed request body:", JSON.stringify(body, null, 2));
    } catch (jsonError) {
      console.error("[PRODUCTS_POST] JSON parsing error:", jsonError);
      return new NextResponse(JSON.stringify({ 
        error: 'Invalid request body',
        details: jsonError instanceof Error ? jsonError.message : String(jsonError)
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate request body
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      console.error('[PRODUCTS_POST] Invalid or empty request body');
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

    const { userId } = await auth();
    const { storeid } = params;
    console.log("[PRODUCTS_POST] User ID:", userId, "Store ID:", storeid);

    const {
      name,
      price: rawPrice,
      mrp: rawMrp,
      categories = [],
      variants = [],
      images = [],
      productBanner = [],
      badges = [],
      subLabel = "",
      description = "",
      benefits = [],
      specifications = [],
      isOutOfStock,
    } = body;

    // Comprehensive validation
    const validationErrors: string[] = [];

    // Name validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      validationErrors.push("Product name is required and must be a non-empty string");
    }

    // Price and MRP validation
    if (rawPrice === undefined || rawPrice === null) {
      validationErrors.push("Price is required");
    } else {
      const price = Number(rawPrice);
      if (isNaN(price) || price < 0) {
        validationErrors.push(`Invalid price: ${rawPrice}. Must be a non-negative number.`);
      }
    }

    if (rawMrp === undefined || rawMrp === null) {
      validationErrors.push("MRP is required");
    } else {
      const mrp = Number(rawMrp);
      if (isNaN(mrp) || mrp < 0) {
        validationErrors.push(`Invalid MRP: ${rawMrp}. Must be a non-negative number.`);
      }
    }

    // Ensure price is not greater than MRP if both are provided
    if (
      rawPrice !== undefined && 
      rawMrp !== undefined && 
      Number(rawPrice) > Number(rawMrp)
    ) {
      validationErrors.push("Price cannot be greater than MRP");
    }

    // Variants validation
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      validationErrors.push("At least one variant is required");
    } else {
      variants.forEach((variant, index) => {
        if (!variant.sizeId) {
          validationErrors.push(`Variant at index ${index} is missing size ID`);
        }
        
        // Price validation for variants
        if (variant.price === undefined || variant.price === null) {
          validationErrors.push(`Variant at index ${index} is missing price`);
        } else {
          const price = Number(variant.price);
          if (isNaN(price) || price < 0) {
            validationErrors.push(`Variant at index ${index} has invalid price`);
          }
        }

        // MRP validation for variants
        if (variant.mrp === undefined || variant.mrp === null) {
          validationErrors.push(`Variant at index ${index} is missing MRP`);
        } else {
          const mrp = Number(variant.mrp);
          if (isNaN(mrp) || mrp < 0) {
            validationErrors.push(`Variant at index ${index} has invalid MRP`);
          }
        }

        // Ensure variant price is not greater than variant MRP
        if (
          variant.price !== undefined && 
          variant.mrp !== undefined && 
          Number(variant.price) > Number(variant.mrp)
        ) {
          validationErrors.push(`Variant at index ${index}: Price cannot be greater than MRP`);
        }
      });
    }

    // Images validation
    if (!images || !Array.isArray(images) || images.length === 0) {
      validationErrors.push("At least one image is required");
    } else {
      images.forEach((image, index) => {
        if (!image.url || typeof image.url !== 'string') {
          validationErrors.push(`Image at index ${index} is missing a valid URL`);
        }
      });
    }

    // Optional but recommended validations
    if (description && typeof description !== 'string') {
      validationErrors.push("Description must be a string");
    }

    if (subLabel && typeof subLabel !== 'string') {
      validationErrors.push("Sub-label must be a string");
    }

    // Validate categories
    if (categories && Array.isArray(categories)) {
      categories.forEach((category, index) => {
        // Ensure each category has a categoryId
        if (!category || !category.categoryId) {
          console.error(`[PRODUCTS_POST] Invalid category at index ${index}:`, category);
          validationErrors.push(`Category at index ${index} is invalid`);
        }
      });
    }

    // Comprehensive logging for debugging
    console.log("[PRODUCTS_POST] Category Validation:", {
      categoriesReceived: categories,
      categoriesLength: categories?.length || 0,
      validationErrors
    });

 
    // Validate isOutOfStock
    if (body.isOutOfStock !== undefined && typeof body.isOutOfStock !== 'boolean') {
      console.error('[PRODUCTS_POST] Invalid isOutOfStock value:', body.isOutOfStock);
      return new NextResponse('isOutOfStock must be a boolean', { status: 400 });
    }

 

    // Validate that product cannot be both out of stock and featured if needed
    if (body.isOutOfStock === true ) {
      console.error('[PRODUCTS_POST] Product cannot be both out of stock ');
      return new NextResponse('Product cannot be both out of stock ', { status: 400 });
    }

    // Return all validation errors
    if (validationErrors.length > 0) {
      console.error('[PRODUCTS_POST] Validation errors:', validationErrors);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors 
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Authentication and authorization checks
    if (!userId) {
      console.error('[PRODUCTS_POST] Unauthenticated user');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthenticated' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!storeid) {
      console.error('[PRODUCTS_POST] Store ID is required');
      return new NextResponse(
        JSON.stringify({ error: 'Store ID required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify store ownership
    const store = await prismadb.store.findFirst({
      where: { id: storeid, userId },
    });

    if (!store) {
      console.error('[PRODUCTS_POST] Unauthorized store access');
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize and prepare benefits and specifications
    const sanitizedBenefits = Array.isArray(benefits) 
      ? benefits 
      : typeof benefits === 'string'
        ? [benefits]
        : benefits 
          ? Object.values(benefits).flat() 
          : [];

    const sanitizedSpecifications = Array.isArray(specifications)
      ? specifications
      : typeof specifications === 'string'
        ? [specifications]
        : specifications
          ? Object.values(specifications).flat()
          : [];

    // Create product with comprehensive transaction
    const product = await prismadb.$transaction(
      async (prisma) => {
        try {
          console.log("[PRODUCTS_POST] Starting product creation transaction");
          const newProduct = await prisma.product.create({
            data: {
              name,
              subLabel,
              description,
              storeId: storeid,
              benefits: sanitizedBenefits.length > 0 
                ? JSON.parse(JSON.stringify(sanitizedBenefits)) 
                : null,
              specifications: sanitizedSpecifications.length > 0
                ? JSON.parse(JSON.stringify(sanitizedSpecifications))
                : null,
              benefitsArray: sanitizedBenefits,
              specificationsArray: sanitizedSpecifications,
              images: {
                createMany: {
                  data: images.map((image: { url: string }) => ({
                    url: image.url,
                  })),
                },
              },
              productBanner: {
                createMany: {
                  data: productBanner.map((banner: { url: string }) => ({
                    url: banner.url,
                  })),
                },
              },
              isOutOfStock,
            },
          });
          console.log("[PRODUCTS_POST] Created product:", newProduct);

          // Create relations
          console.log("[PRODUCTS_POST] Creating category relations");
          if (categories && categories.length > 0) {
            console.log("[PRODUCTS_POST] Categories to process:", JSON.stringify(categories, null, 2));
            
            // Validate and prepare categories
            const validCategories = categories.filter(
              (category): category is { categoryId: string } => 
                !!category && 
                typeof category === 'object' && 
                'categoryId' in category && 
                !!category.categoryId
            );

            console.log("[PRODUCTS_POST] Validated categories:", JSON.stringify(validCategories, null, 2));
            
            if (validCategories.length > 0) {
              try {
                // Use createMany with validation
                const categoryRelations = await prisma.categoryOnProduct.createMany({
                  data: validCategories.map(category => ({
                    productId: newProduct.id,
                    categoryId: category.categoryId
                  })),
                  skipDuplicates: true // Prevent duplicate entries
                });

                console.log("[PRODUCTS_POST] Category relations created:", categoryRelations);
              } catch (categoryError) {
                console.error("[PRODUCTS_POST] Error creating category relations:", categoryError);
                
                // Additional error handling
                if (categoryError instanceof Error) {
                  throw new Error(`Failed to create category relations: ${categoryError.message}`);
                }
              }
            } else {
              console.warn("[PRODUCTS_POST] No valid categories found to create relations");
            }
          } else {
            console.log("[PRODUCTS_POST] No categories provided for the product");
          }

          console.log("[PRODUCTS_POST] Creating variant relations");
          // Validate and create variants
          if (variants.length > 0) {
            await prisma.productVariant.createMany({
              data: variants.map(
                (variant: {
                  sizeId: string;
                  colorId?: string;
                  price: number;
                  mrp: number;
                }) => ({
                  productId: newProduct.id,
                  sizeId: variant.sizeId,
                  colorId: variant.colorId || null,
                  price: new Decimal(variant.price),
                  mrp: new Decimal(variant.mrp),
                })
              ),
            });
          }

          // Create badge relations
          console.log("[PRODUCTS_POST] Creating badge relations");
          if (badges && badges.length > 0) {
            console.log("[PRODUCTS_POST] Badges to process:", JSON.stringify(badges, null, 2));
            
            // Validate and prepare badges
            const validBadges = badges.filter(
              (badge): badge is { badgeId: string } => 
                !!badge && 
                typeof badge === 'object' && 
                'badgeId' in badge && 
                !!badge.badgeId
            );

            console.log("[PRODUCTS_POST] Validated badges:", JSON.stringify(validBadges, null, 2));
            
            if (validBadges.length > 0) {
              try {
                // Use createMany with validation
                const badgeRelations = await prisma.productBadge.createMany({
                  data: validBadges.map(badge => ({
                    productId: newProduct.id,
                    badgeId: badge.badgeId
                  })),
                  skipDuplicates: true // Prevent duplicate entries
                });

                console.log("[PRODUCTS_POST] Badge relations created:", badgeRelations);
              } catch (badgeError) {
                console.error("[PRODUCTS_POST] Error creating badge relations:", badgeError);
                
                // Additional error handling
                if (badgeError instanceof Error) {
                  throw new Error(`Failed to create badge relations: ${badgeError.message}`);
                }
              }
            } else {
              console.warn("[PRODUCTS_POST] No valid badges found to create relations");
            }
          } else {
            console.log("[PRODUCTS_POST] No badges provided for the product");
          }

          return newProduct;
        } catch (transactionError) {
          console.error("[PRODUCTS_POST] Transaction error:", 
            transactionError instanceof Error 
              ? transactionError.message 
              : String(transactionError)
          );
          throw transactionError instanceof Error 
            ? transactionError 
            : new Error(`Transaction failed: ${String(transactionError)}`);
        }
      },
      { timeout: 15000 }
    );

    // Ensure product is not null before returning
    if (!product) {
      console.error("[PRODUCTS_POST] Product is null after creation");
      return new NextResponse(JSON.stringify({ 
        error: 'Failed to create product',
        details: 'Product creation transaction returned null'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCTS_POST] Unexpected error:", 
      error instanceof Error ? error.message : String(error)
    );
    return new NextResponse(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}