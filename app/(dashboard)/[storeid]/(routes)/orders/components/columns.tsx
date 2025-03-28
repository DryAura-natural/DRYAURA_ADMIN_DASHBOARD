"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { OrderColumn, Product } from "./order-types";

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ getValue }) => {
      const id = getValue() as string;
      return <span className="text-xs text-gray-500 font-mono">{id}</span>;
    },
  },
  {
    accessorKey: "products",
    header: "Products",
    cell: ({ getValue }) => {
      const products = getValue() as Product[];
      return (
        <div className="space-y-1">
          {products.map((product, index) => (
            <div
              key={index}
              className="text-sm flex justify-between items-center"
            >
              <span className="font-medium truncate max-w-[150px]">
                {product.name}
              </span>
              <div className="text-xs text-gray-500 space-x-2">
                <span>Size: {product.size || "N/A"}</span>
                {/* <span>{product.unitPrice.toLocaleString()}</span> */}
              </div>
              <div className="text-xs text-gray-500 space-x-2">
                <span>Qty: {product.quantity}</span>
                <span>₹{product.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "totalPrice",
    header: "Total Price",
    cell: ({ getValue }) => {
      const total = getValue() as number;
      return (
        <span className="font-semibold text-green-600">
          ₹{total.toLocaleString()}
        </span>
      );
    },
  },
  {
    accessorKey: "isPaid",
    header: "Payment Status",
    cell: ({ getValue }) => {
      const isPaid = getValue() as boolean;
      return (
        <Badge
          variant={isPaid ? "default" : "destructive"}
          className={
            isPaid ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }
        >
          {isPaid ? "Paid" : "Unpaid"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as string;
      const statusVariants: Record<string, string> = {
        PENDING: "yellow",
        PROCESSING: "blue",
        SHIPPED: "purple",
        DELIVERED: "green",
        CANCELLED: "red",
      };

      return (
        <Badge
          variant="outline"
          color={statusVariants[status.toUpperCase()] || "gray"}
        >
          {status}
        </Badge>
      );
    },
  },

  {
    accessorKey: "createdAt",
    header: "Order Date",
    cell: ({ getValue }) => {
      const date = getValue() as string;
      return format(new Date(date), "dd MMM yyyy");
    },
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const { name, email, phone, address } = row.original;
      return (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">{email}</div>
          <div className="text-xs text-gray-500">{phone}</div>
          <div className="text-xs text-gray-500">{address}</div>
        </div>
      );
    },
  },

  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
