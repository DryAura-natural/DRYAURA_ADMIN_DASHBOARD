"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { PromoCodeColumn } from "./columns";
import { columns } from './columns';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/heading";
import { Separator } from "@/components/ui/separator";
import { AlertModal } from "@/components/models/alert-modal";
import toast from "react-hot-toast";
import axios from "axios";

interface PromoCodesClientProps {
  data: PromoCodeColumn[];
}

export const PromoCodesClient: React.FC<PromoCodesClientProps> = ({ data }) => {
  const router = useRouter();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const handleRowClick = (promoCode: PromoCodeColumn) => {
    router.push(`/${params.storeid}/promotions/${promoCode.id}`);
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/stores/${params.storeid}/promotions/${selectedId}`);
      router.refresh();
      toast.success('Promo code deleted successfully');
    } catch (error) {
      toast.error('Remove this promo code from all orders first.');
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={onDelete}
      />
      <div className="flex items-center justify-between">
        <Heading
          title={`Promo Codes (${data.length})`}
          description="Manage your store's promotional codes"
        />
        <Button 
          onClick={() => router.push(`/${params.storeid}/promotions/new`)}
          disabled={loading}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      <Separator />
      <DataTable
        columns={columns}
        data={data}
        searchKey="code"
        onRowClick={handleRowClick}
      />
    </>
  );
};