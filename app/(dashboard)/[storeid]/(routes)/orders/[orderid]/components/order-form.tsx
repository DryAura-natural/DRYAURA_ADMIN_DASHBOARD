"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FileUp, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrderFormProps {
  initialData: {
    id: string;
    status: string;
    invoiceLink?: string;
    trackingId?: string;
  };
}

export const OrderForm: React.FC<OrderFormProps> = ({ initialData }) => {
  const [status, setStatus] = useState(initialData.status);
  const [invoiceLink, setInvoiceLink] = useState(initialData.invoiceLink || '');
  const [trackingId, setTrackingId] = useState(initialData.trackingId || '');
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const router = useRouter();

  const statusOptions = [
    "PENDING", 
    "PROCESSING", 
    "SHIPPED", 
    "DELIVERED", 
    "CANCELLED"
  ];

  const onStatusChange = async () => {
    try {
      setLoading(true);
      await axios.patch(`/api/${params.storeid}/createOrder/${initialData.id}`, { 
        orderStatus: status,
        invoiceLink: invoiceLink || undefined,
        trackingId: trackingId || undefined
      });
      toast.success("Order status updated");
      router.refresh();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(
        (error as { response?: { data: string } })?.response?.data || 
        "Failed to update order status"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Select
          value={status}
          onValueChange={setStatus}
          disabled={loading}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="invoiceLink" className="flex items-center">
            <FileUp className="mr-2 h-4 w-4" />
            Invoice Link
          </Label>
          <Input 
            id="invoiceLink"
            placeholder="Paste invoice URL"
            value={invoiceLink}
            onChange={(e) => setInvoiceLink(e.target.value)}
            className="w-[300px]"
            disabled={loading}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="trackingId" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            Tracking ID
          </Label>
          <Input 
            id="trackingId"
            placeholder="Enter tracking ID"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="w-[300px]"
            disabled={loading}
          />
        </div>

        <Button 
          onClick={onStatusChange}
          disabled={loading || (
            status === initialData.status && 
            invoiceLink === initialData.invoiceLink && 
            trackingId === initialData.trackingId
          )}
        >
          Update
        </Button>

        {initialData.invoiceLink && (
          <Link 
            href={initialData.invoiceLink} 
            target="_blank" 
            className="ml-4 text-blue-600 hover:underline"
          >
            View Current Invoice
          </Link>
        )}
      </div>
    </div>
  );
};