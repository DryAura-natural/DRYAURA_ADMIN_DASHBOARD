"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge"; // Import Badge component for styling
import { OrderColumn } from "./order-types";

// Ensure this import path is correct

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "products",
    header: "Products (Qty)",
  },
  {
    accessorKey: "name",
    header: "Customer Name",
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
  },
  {
    accessorKey: "isPaid",
    header: "Payment",
    cell: ({ row }) => {
      const isPaid = row.original.isPaid;
      return (
        <Badge className={isPaid ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
          {isPaid ? "Paid" : "Unpaid"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: "Status",
    cell: ({ row }) => {
      const statusColors: Record<string, string> = {
        pending: "bg-yellow-500 text-white",
        processing: "bg-blue-500 text-white",
        shipped: "bg-purple-500 text-white",
        delivered: "bg-green-500 text-white",
        cancelled: "bg-red-500 text-white",
      };

      const orderStatus = row.original.orderStatus.toLowerCase(); // Ensure lowercase match

      return (
        <Badge className={statusColors[orderStatus] || "bg-gray-500 text-white"}>
          {row.original.orderStatus}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
  },
];
