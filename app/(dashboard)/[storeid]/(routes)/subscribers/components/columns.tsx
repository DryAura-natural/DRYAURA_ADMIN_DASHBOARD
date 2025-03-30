"use client"

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowUpDown, 
  CheckCircle2, 
  XCircle 
} from "lucide-react"

export type SubscriberColumn = {
  id: string
  email: string
  name: string
  totalOrders: number
  isActive: boolean
  createdAt: string
  lastOrderDate: string
}

export const subscriberColumns: ColumnDef<SubscriberColumn>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <button
        className="flex items-center hover:bg-gray-100 px-2 py-1 rounded"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="lowercase font-medium">
        {row.getValue("email")}
      </div>
    )
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="capitalize">
        {row.getValue("name")}
      </div>
    )
  },
  {
    accessorKey: "totalOrders",
    header: "Total Orders",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {row.getValue("totalOrders")}
      </Badge>
    )
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive")
      return (
        <div className="flex items-center">
          {isActive ? (
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="mr-2 h-5 w-5 text-red-500" />
          )}
          <span>{isActive ? "Active" : "Inactive"}</span>
        </div>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Subscribed On",
  },
  {
    accessorKey: "lastOrderDate",
    header: "Last Order",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />
  }
]