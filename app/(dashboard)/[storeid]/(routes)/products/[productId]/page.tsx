import prismadb from "@/lib/prismadb";
import { ProductForm } from "./components/product-form";

const ProductPage = async ({
  params,
}: {
  params: { productId: string; storeid: string };
}) => {
  const { productId, storeid } = await params;
  const product = await prismadb.product.findUnique({
    where: { id: productId },
    include: {
      images: true,
      variants: true,
      categories: { include: { category: true } },
      badges: { include: { badge: true } },
      productBanner: true,
    },
  });

  const categories = await prismadb.category.findMany({
    where: { storeId: storeid },
  });

  const sizes = await prismadb.size.findMany({
    where: { storeId: storeid },
  });

  const colors = await prismadb.color.findMany({
    where: { storeId: storeid },
  });

  const badges = await prismadb.badge.findMany({
    where: { storeId: storeid },
    select: { id: true, label: true },
  });

  const formattedProduct = product ? ({
    ...product,
    // Convert Decimal to number
    // price: product.price.toNumber(),
    // mrp: product.mrp.toNumber(),
    // Handle null values for optional fields
    description: product.description ?? null,
    subLabel: product.subLabel ?? null,
    isOutOfStock: product.isOutOfStock ?? false,
    // Transform relations to match expected type
    images: product.images.map(img => ({ url: img.url })),
    variants: product.variants.map(variant => ({
      ...variant,
      price: variant.price.toNumber(),
      mrp: variant.mrp.toNumber(),
      colorId: variant.colorId ?? null,
    })),
    categories: product.categories.map(c => ({ categoryId: c.categoryId })),
    badges: product.badges.map(b => ({ badgeId: b.badgeId })),
    productBanner: product.productBanner.map(b => ({ url: b.url })),
    // Handle benefits and specifications as arrays
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
  
          
  }) : null;

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductForm 
          initialData={formattedProduct}
          categories={categories}
          sizes={sizes}
          colors={colors}
          badges={badges}
        />
      </div>
    </div>
  );
};

export default ProductPage;