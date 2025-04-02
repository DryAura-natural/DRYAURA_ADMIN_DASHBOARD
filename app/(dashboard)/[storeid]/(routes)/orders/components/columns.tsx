"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { OrderColumn, Product } from "./order-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem,  } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<OrderColumn>[] = [
  {
    accessorKey: "id",
    header: "Order ID",
    cell: ({ getValue }) => {
      const id = getValue() as string;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div 
                className="text-xs text-gray-500 font-mono cursor-copy flex items-center"
                onClick={() => navigator.clipboard.writeText(id)}
              >
                {id}
                <Copy className="ml-2 h-3 w-3 opacity-50" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to copy Order ID</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
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
              <div className="flex flex-col">
                <span className="font-medium truncate max-w-[150px]">
                  {product.name}
                </span>
                <div className="text-xs text-gray-500 space-x-2">
                  <span>Size: {product.size || "N/A"}</span>
                  <span>Color: {product.color || "N/A"}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-x-2 text-right">
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="font-semibold text-green-600 cursor-help">
                ₹{total.toLocaleString()}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total order value including all products</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
            isPaid 
              ? "bg-green-500 text-white hover:bg-green-600" 
              : "bg-red-500 text-white hover:bg-red-600"
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
      const statusVariants: Record<string, { 
        color: string; 
        label: string; 
        description?: string 
      }> = {
        PENDING: {
          color: "yellow",
          label: "Pending",
          description: "Order received, awaiting processing"
        },
        PROCESSING: {
          color: "blue",
          label: "Processing",
          description: "Order is being prepared"
        },
        SHIPPED: {
          color: "purple",
          label: "Shipped",
          description: "Order is on its way"
        },
        DELIVERED: {
          color: "green",
          label: "Delivered",
          description: "Order successfully completed"
        },
        CANCELLED: {
          color: "red",
          label: "Cancelled",
          description: "Order has been cancelled"
        },
        REFUNDED: {
          color: "gray",
          label: "Refunded",
          description: "Order has been refunded"
        },
        PARTIALLY_SHIPPED: {
          color: "orange",
          label: "Partially Shipped",
          description: "Some items have been shipped"
        }
      };
  
      const statusInfo = statusVariants[status.toUpperCase()] || {
        color: "gray",
        label: status,
        description: "Unknown status"
      };
  
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                color={statusInfo.color}
                className="cursor-help"
              >
                {statusInfo.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{statusInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const status = row.getValue(columnId) as string;
      return filterValue.includes(status.toUpperCase());
    }
  },
  {
    accessorKey: "createdAt",
    header: "Order Date",
    cell: ({ getValue }) => {
      const date = getValue() as string;
      const formattedDate = format(new Date(date), "dd MMM yyyy");
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="cursor-help">
                {formattedDate}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{new Date(date).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const { name, email, phone, address } = row.original;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <div className="cursor-help">
                <div className="font-medium">{name}</div>
                <div className="text-xs text-gray-500">{email}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                <p>{phone}</p>
                <p>{address}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

      return (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            const orderDetailsText = `
Order Details:
Order ID: ${order.id}
Status: ${order.status}
Address:${order.address}
Phone:${order.phone}
alternative:${order.alternativePhone}
payment:${order.isPaid}
products:${order.products.map(product => `
  - Name: ${product.name}
  - Quantity: ${product.quantity}
  - Unit Price: ₹${product.unitPrice}
  - Total Price: ₹${product.totalPrice}
`).join('\n')}
Total Price: ₹${order.totalPrice}
Created At: ${order.createdAt}

            `.trim();

            navigator.clipboard.writeText(orderDetailsText)
              .then(() => {
                // Optional: Add a visual feedback mechanism
                console.log('Order details copied to clipboard');
              })
              .catch(err => {
                console.error('Failed to copy order details', err);
              });
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      );
    }
  },
  { id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  }

];