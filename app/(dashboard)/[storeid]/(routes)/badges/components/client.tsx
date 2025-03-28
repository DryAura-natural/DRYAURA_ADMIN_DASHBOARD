"use client";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { BadgeColumn, columns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";

interface BadgesClientProps {
  data: BadgeColumn[];
}

export const BadgesClient: React.FC<BadgesClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Badges (${data.length})`}
          description="Manage product badges for your store"
        />
        <Button onClick={() => router.push(`/${params.storeid}/badges/new`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable searchKey="label" columns={columns} data={data} />
      <Heading title="API" description="API calls for badges" />
      <Separator />
      <ApiList entityName="badges" entityIdName="badgeId" />
    </>
  );
};