"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BillboardColumn } from "./columns";
import { Button } from "@/components/ui/button";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import toast from "react-hot-toast";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { AlertModal } from "@/components/models/alert-modal";

interface CellActionProps {
  data: BillboardColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
     const router = useRouter()
     const params = useParams()
     const [loading,setLoading]= useState(false)
     const [open,setOpen]= useState(false)
      const onCopy = (id:string) =>{
            navigator.clipboard.writeText(id);
            toast.success("Billboad id copied to the clipboard")
                  }
                  const onDelete = async () => {
                        console.log("clicked");
                    
                        try {
                          setLoading(true);
                          await axios.delete(
                            `/api/${params.storeid}/billboards/${data.id}`
                          );
                          router.refresh();
                        router.push(`/${params.storeid}/billboards`)
                          toast.success("Billboard deleted");
                        } catch (error) {
                          toast.error(
                            "Make sure you remove all categories using this billboard first"
                          );
                        } finally {
                          setLoading(false);
                          setOpen(false);
                        }
                      };
            
  return (
    <div>
      <AlertModal 
      isOpen={open}
      loading={loading}
      onClose={()=>setOpen(false)}
      onConfirm={onDelete}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Action</DropdownMenuLabel>
          <DropdownMenuItem onClick={()=>onCopy(data.id)}>
            <Copy className="h-4 w-4 mr-2"/>
            Copy Id
          </DropdownMenuItem>
          <DropdownMenuItem onClick={()=>router.push(`/${params.storeid}/billboards/${data.id}`)}>
            <Edit className="h-4 w-4 mr-2" />
            Update
          </DropdownMenuItem>
          <DropdownMenuItem onClick={()=>setOpen(true)}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
