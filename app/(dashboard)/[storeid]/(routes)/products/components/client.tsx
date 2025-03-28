"use client";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ProductsColumn, columns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";

interface ProductsClientProps {
  data: ProductsColumn[];
}

export const ProductsClient: React.FC<ProductsClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title={`Products (${data.length})`}
          description={`Manage ${data.length} products and their variants`}
        />
        <Button
          onClick={() => router.push(`/${params.storeid}/products/new`)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      
      <Separator />
      
      <DataTable 
        searchKey="name" 
        columns={columns} 
        data={data}
        // Remove filterOptions and use column-based filtering instead
      />
      
      <Heading 
        title="API Endpoints" 
        description="Access product data via API" 
      />
      <Separator />
      <ApiList  
        entityName="products" 
        entityIdName="id"
      />
    </div>
  );
};