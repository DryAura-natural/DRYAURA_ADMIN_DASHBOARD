"use client";

import { useState } from "react";
import { Copy, Edit, MoreHorizontal } from "lucide-react";
import { toast } from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { OrderColumn } from "./order-types";
import { Badge } from "@/components/ui/badge";

interface CellActionProps {
  data: OrderColumn;
  onError?: (error: any) => void;
}

export const CellAction: React.FC<CellActionProps> = ({ 
  data, 
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();

  console.log("CellAction Received Data:", data);

  const onCopy = (id: string) => {
    try {
      navigator.clipboard.writeText(id);
      toast.success("Order ID copied to clipboard.");
    } catch (error) {
      console.error("Copy Error:", error);
      onError?.(error);
    }
  };

  const onUpdateStatus = async (currentStatus: string) => {
    try {
      setLoading(true);
      const statusOptions = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      const currentIndex = statusOptions.indexOf(currentStatus);
      const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];

      const response = await axios.patch(`/api/createOrder/${data.id}`, { 
        orderStatus: nextStatus 
      });
      
      if (response.status === 200) {
        toast.success(`Order status updated to ${nextStatus}`);
        
        // Multiple refresh strategies
        router.refresh(); // Next.js server-side refresh
        window.location.reload(); // Hard browser reload as fallback
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (error) {
      console.error("Status Update Error:", error);
      onError?.(error);
      toast.error("Failed to update order status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Validate data before rendering
  if (!data || !data.id) {
    console.error("Invalid data for CellAction:", data);
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onCopy(data.id)}>
          <Copy className="mr-2 h-4 w-4" /> Copy ID
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push(`/${params.storeid}/orders/${data.id}`)}
        >
          <Edit className="mr-2 h-4 w-4" /> View Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onUpdateStatus(data.status)}
          disabled={loading}
        >
          <Edit className="mr-2 h-4 w-4" /> 
          Update Status 
          <Badge 
            variant="outline" 
            className="ml-2 text-xs"
          >
            {data.status}
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};