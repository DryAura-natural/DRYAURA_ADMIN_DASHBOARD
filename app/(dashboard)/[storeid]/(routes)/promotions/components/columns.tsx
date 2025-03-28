import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";

export type PromoCodeColumn = {
  id: string;
  code: string;
  discount: number;
  type: string;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
};

export const columns: ColumnDef<PromoCodeColumn>[] = [
  {
    accessorKey: "code",
    header: "Code",
  },
  {
    accessorKey: "discount",
    header: "Discount",
    cell: ({ row }) => {
      const discount = row.original.discount;
      const type = row.original.type;
      return type === "PERCENTAGE" ? `${discount}` : `₹${discount}`;
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "default" : "destructive"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "maxUses",
    header: "Total Limit",
    cell: ({ row }) => row.original.maxUses || "Unlimited",
  },
  {
    accessorKey: "maxUsesPerUser",
    header: "Per-User Limit",
    cell: ({ row }) => row.original.maxUsesPerUser || "Unlimited",
  },
  {
    accessorKey: "usedCount",
    header: "Used",
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => format(row.original.startDate, "MMM dd, yyyy"),
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => format(row.original.endDate, "MMM dd, yyyy"),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => format(row.original.createdAt, "MMM dd, yyyy"),
  },
  {
    id:"actions",
    cell:({row})=><CellAction data={row.original}/>
}
];
