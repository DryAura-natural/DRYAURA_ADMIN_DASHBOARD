import React from "react";
import { ProductsClient } from "./components/client";
import prismadb from "@/lib/prismadb";
import { ProductsColumn } from "./components/columns";
import { format, isValid } from "date-fns";
import { formatter } from "@/lib/utils";

const ProductsPage = async ({ params }: { params: { storeid: string } }) => {
  const products = await prismadb.product.findMany({
    where: {
      storeId: params.storeid,
    },
    include: {
      categories: {
        include: {
          category: true
        }
      },
      variants: {
        include: {
          size: true,
          color: true
        }
      },
      badges: {
        include: {
          badge: true
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedProducts: ProductsColumn[] = products.map((product) => {
    // Add sortDate
    const sortDate = product.createdAt instanceof Date 
    ? product.createdAt 
    : new Date(product.createdAt);
    // Get all unique sizes from variants
    const sizes = Array.from(new Set(
      product.variants.map(variant => variant.size.name)
    ));

    // Get all unique colors from variants that have colors
    const colors = Array.from(new Set(
      product.variants
        .filter(variant => variant.color)
        .map(variant => ({ value: variant.color!.value }))
    ));

    // Get price range from variants
    const variantPrices = product.variants.map(v => v.price.toNumber());
    const priceRange = variantPrices.length > 0 
      ? `${Math.min(...variantPrices)} - ${Math.max(...variantPrices)}`
      : "N/A";

    // Get MRP range from variants
    const variantMrps = product.variants.map(v => v.mrp.toNumber());
    const mrpRange = variantMrps.length > 0
      ? `${Math.min(...variantMrps)} - ${Math.max(...variantMrps)}`
      : "N/A";

    // Handle benefits and specifications
    const benefits = product.benefitsArray || 
      (typeof product.benefits === 'string' 
        ? [product.benefits] 
        : Array.isArray(product.benefits) 
          ? product.benefits 
          : product.benefits 
            ? Object.values(product.benefits).flat() 
            : []);

    const specifications = product.specificationsArray || 
      (typeof product.specifications === 'string'
        ? [product.specifications]
        : Array.isArray(product.specifications)
          ? product.specifications
          : product.specifications
            ? Object.values(product.specifications).flat()
            : []);


    return {
      id: product.id,
      name: product.name,
      price: priceRange,
      mrp: mrpRange,
      sizes,
      categories: product.categories.map(c => c.category.name),
      badges: product.badges.map(b => b.badge.label),
      colors,
      isStock: product.isOutOfStock,
      createdAt: isValid(product.createdAt)
        ? format(product.createdAt, "MMM do yyyy")
        : "Invalid date",
      subLabel: product.subLabel || undefined,
      description: product.description 
        ? `${product.description.split(" ").slice(0, 10).join(" ")}${product.description.split(" ").length > 10 ? "..." : ""}`
        : undefined,
      variantsCount: product.variants.length,
      benefits,
      specifications,
      sortDate: sortDate,
    } as ProductsColumn; // Explicit type assertion
  });

  // In page.tsx
return (
  <div className="flex-col">
    <div className="flex-1 space-y-4 p-8 pt-6">
      <ProductsClient 
        data={formattedProducts} 
        filterOptions={{
          categories: Array.from(new Set(
            products.flatMap(p => p.categories.map(c => c.category.name))
          )),
          badges: Array.from(new Set(
            products.flatMap(p => p.badges.map(b => b.badge.label))
          )),
          sizes: Array.from(new Set(
            products.flatMap(p => p.variants.map(v => v.size.name))
          )),
          colors: Array.from(new Set(
            products.flatMap(p => 
              p.variants
                .filter(v => v.color)
                .map(v => v.color!.value)
            )
          )),
          benefits: Array.from(new Set(
            products.flatMap(p => 
              typeof p.benefits === 'string' 
                ? [p.benefits] 
                : Array.isArray(p.benefits) 
                  ? p.benefits 
                  : p.benefits 
                    ? Object.values(p.benefits).flat() 
                    : []
            )
          )),
          specifications: Array.from(new Set(
            products.flatMap(p => 
              typeof p.specifications === 'string'
                ? [p.specifications]
                : Array.isArray(p.specifications)
                  ? p.specifications
                  : p.specifications
                    ? Object.values(p.specifications).flat()
                    : []
            )
          )),
             isStock: [true, false]
        }}
      />
    </div>
  </div>
);
};

export default ProductsPage;