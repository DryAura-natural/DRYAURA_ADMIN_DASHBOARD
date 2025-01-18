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
      category: true,
      size: true,
      color: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedProducts: ProductsColumn[] = products.map((item) => ({
    id: item.id,
    name: item.name,
    isFeatured: item.isFeatured,
    isArchived: item.isArchived,
    price: formatter.format(item.price.toNumber()),
    category:item.category.name,
    size:item.size.name,
    color: item.color ? item.color.value : "Unknown", // Fallback value for missing color
    createdAt: isValid(new Date(item.createdAt))
      ? format(new Date(item.createdAt), "MMM do yyyy")
      : "Unknown", // Fallback value for invalid dates
    subLabel: item.subLabel || "No subLabel",
    description: item.description ? item.description.split(" ").slice(0, 10).join(" ") + (item.description.split(" ").length > 10 ? "..." : "") : "No description available",
  }));
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProductsClient data={formattedProducts} />
      </div>
    </div>
  );
};
export default ProductsPage;
