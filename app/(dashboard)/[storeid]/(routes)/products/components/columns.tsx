"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge"; // Assume you have a Badge component

export type ProductsColumn = {
  id: string;
  name: string;
  price: string;
  mrp: string;
  sizes: string[];
  categories: string[];
  badges: string[];
  createdAt: string;
  subLabel?: string;
  description?: string;
  variantsCount: number;
  benefits?: string[];
  specifications?: string[];
};

export const columns: ColumnDef<ProductsColumn>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="truncate max-w-[200px]">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "subLabel",
    header: "Sub Label",
    cell: ({ row }) => (
      <div className="truncate max-w-[200px]">{row.original.subLabel}</div>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="truncate max-w-[200px]">{row.original.description}</div>
    ),
  },
  {
    accessorKey: "price",
    header: "Price Range",
    cell: ({ row }) => (
      <div className="flex flex-col overflow-hidden max-w-[200px truncate">
        <span className="flex w-full">Price: {row.original.price}</span>
        <span className="flex flex-row text-xs line-through text-gray-500">
          MRP: {row.original.mrp}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "sizes",
    header: "Sizes",
    cell: ({ row }) => {
      const sizes = row.original.sizes;
      const visibleBadges = sizes.slice(0, 2);
      const hiddenBadges = sizes.slice(2);
      return (
        <div className="flex flex-wrap gap-1">
          {visibleBadges.map((size) => (
            <Badge
              key={size}
              variant="outline"
              className="text-xs bg-black text-white px-4 py-1 truncate"
            >
              {size}
            </Badge>
          ))}
          {hiddenBadges.length > 0 && (
            <Badge className="text-xs text-gray-500 border hover:bg-transparent">
              +{hiddenBadges.length} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "categories",
    header: "Categories",
    cell: ({ row }) => {
      const categories = row.original.categories;
      const visibleBadges = categories.slice(0, 2);
      const hiddenBadges = categories.slice(2);
      return (
        <div className="flex flex-wrap gap-1">
          {visibleBadges.map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="text-xs bg-black text-white px-4 py-1 truncate"
            >
              {category}
            </Badge>
          ))}
          {hiddenBadges.length > 0 && (
            <Badge className="text-xs text-gray-500 border hover:bg-transparent">
              +{hiddenBadges.length} more
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "badges",
    header: "Badges",
    cell: ({ row }) => {
      const badges = row.original.badges;
      const visibleBadges = badges.slice(0, 2);
      const hiddenBadges = badges.slice(2);
      return (
        <div className="flex flex-wrap gap-1">
          {visibleBadges.map((badge) => (
            <Badge
              key={badge}
              variant="outline"
              className="text-xs bg-black text-white px-4 py-1 truncate"
            >
              {badge}
            </Badge>
          ))}
          {hiddenBadges.length > 0 && (
            <Badge className="text-xs text-gray-500 border hover:bg-transparent">
              +{hiddenBadges.length} more
            </Badge>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "variantsCount",
    header: "Variants",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
  {
    accessorKey: "benefits",
    header: "Benefits",
    cell: ({ row }) => {
      const benefits = row.original.benefits || [];

      return benefits.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {benefits.slice(0, 1).map((benefit, index) => (
            <Badge
              key={index}
              variant="outline"
              className="text-xs bg-green-100 text-green-800 px-2 py-1"
            >
              <div className="truncate max-w-[100px]">{benefit}</div>
            </Badge>
          ))}
          {benefits.length > 1 && (
            <Badge
              variant="outline"
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1"
            >
              +{benefits.length - 1} more
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-gray-400 text-xs">No benefits</span>
      );
    },
  },
  {
    accessorKey: "specifications",
    header: "Specifications",
    cell: ({ row }) => {
      const specifications = row.original.specifications || [];
      return specifications.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {specifications.slice(0, 1).map((spec, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800 px-2 py-1"
            >
              <div className="truncate max-w-[100px]">{spec}</div>
            </Badge>
          ))}
          {specifications.length > 1 && (
            <Badge
              variant="outline"
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1"
            >
              +{specifications.length - 1} more
            </Badge>
          )}
        </div>
      ) : (
        <span className="text-gray-400 text-xs">No specifications</span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
