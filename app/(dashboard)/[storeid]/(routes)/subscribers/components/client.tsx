"use client";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { SubscriberColumn, subscriberColumns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface SubscriberClientProps {
  data: SubscriberColumn[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    recentSubscribers: SubscriberColumn[];
  };
}

export const SubscriberClient: React.FC<SubscriberClientProps> = ({ 
  data, 
  stats 
}) => {
  const router = useRouter();
  const params = useParams();
  const [filterOption, setFilterOption] = useState<string | null>(null);

  const handleExport = () => {
    // Implement CSV export logic
    const csvContent = [
      ["Email", "Name", "Total Orders", "Status", "Subscribed On"],
      ...data.map(subscriber => [
        subscriber.email,
        subscriber.name,
        subscriber.totalOrders.toString(),
        subscriber.isActive ? "Active" : "Inactive",
        subscriber.createdAt
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `dryaura_subscribers_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = filterOption 
    ? data.filter(subscriber => 
        filterOption === 'active' 
          ? subscriber.isActive 
          : !subscriber.isActive
      ) 
    : data;

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Subscribers (${data.length})`}
          description="Manage and track your newsletter subscribers"
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter Subscribers</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => setFilterOption(null)}
                className={!filterOption ? "bg-gray-100" : ""}
              >
                All Subscribers
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterOption('active')}
                className={filterOption === 'active' ? "bg-gray-100" : ""}
              >
                Active Subscribers
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setFilterOption('inactive')}
                className={filterOption === 'inactive' ? "bg-gray-100" : ""}
              >
                Inactive Subscribers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <Separator />
      <DataTable 
        searchKey="email" 
        columns={subscriberColumns} 
        data={filteredData} 
      />
      <Heading 
        title="API" 
        description="API calls for subscriber management" 
      />
      <Separator />
      <ApiList 
        entityName="subscribers" 
        entityIdName="subscriberId"
      />
    </>
  );
};