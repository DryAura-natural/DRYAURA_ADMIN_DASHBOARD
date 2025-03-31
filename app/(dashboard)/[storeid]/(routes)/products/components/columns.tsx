"use client";

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export type ProductsColumn = {
  id: string;
  name: string;
  price: string;
  mrp: string;
  sizes: string[];
  categories: string[];
  badges: string[];
  colors: { value: string }[];
  createdAt: string;
  subLabel?: string;
  description?: string;
  variantsCount: number;
  isStock: boolean;
  benefits: string[];
  specifications: string[];
  sortDate: Date;
  isOutOfStock: boolean;
};

export const columns: ColumnDef<ProductsColumn>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="truncate max-w-[200px]">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price Range
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col overflow-hidden max-w-[200px] truncate">
        <span className="flex w-full">Price: {row.original.price}</span>
        <span className="flex flex-row text-xs line-through text-gray-500">
          MRP: {row.original.mrp}
        </span>
      </div>
    ),
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
    filterFn: (row, columnId, filterValue) => {
      const categories = row.original.categories;
      return filterValue.length === 0 || 
        filterValue.some((category: string) => categories.includes(category));
    }
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
    filterFn: (row, columnId, filterValue) => {
      const badges = row.original.badges;
      return filterValue.length === 0 || 
        filterValue.some((badge: string) => badges.includes(badge));
    }
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
            <Badge className="text-xs bg-slate-100  text-gray-500 border border-blue-300 hover:bg-transparent">
              +{hiddenBadges.length} more
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const sizes = row.original.sizes;
      return filterValue.length === 0 || 
        filterValue.some((size: string) => sizes.includes(size));
    }
  },
  {
    accessorKey: "colors",
    header: "Colors",
    cell: ({ row }) => {
      const colors = row.original.colors;
      const visibleColors = colors.slice(0, 3);
      const hiddenColors = colors.slice(3);
      return (
        <div className="flex items-center gap-1">
          {visibleColors.map((color) => (
            <div
              key={color.value}
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: color.value }}
            />
          ))}
          {hiddenColors.length > 0 && (
            <Badge className="text-xs text-gray-500 border hover:bg-transparent">
              +{hiddenColors.length} more
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const colors = row.original.colors.map(c => c.value);
      return filterValue.length === 0 || 
        filterValue.some((color: string) => colors.includes(color));
    }
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
    filterFn: (row, columnId, filterValue) => {
      const benefits = row.original.benefits;
      return filterValue.length === 0 || 
        filterValue.some((benefit: string) => benefits.includes(benefit));
    }
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
    filterFn: (row, columnId, filterValue) => {
      const specifications = row.original.specifications;
      return filterValue.length === 0 || 
        filterValue.some((spec: string) => specifications.includes(spec));
    }
  },
  {
    accessorKey: "isStock",
    header: "Stock Status",
    cell: ({ row }) => {
      const isInStock = row.original.isStock;
      return (
        <div className="flex items-center">
          <span className={`
            px-2 py-1 rounded-full text-xs font-medium truncate
            ${isInStock ? 'bg-red-100 text-red-800' : '  bg-green-100 text-green-800'}
          `}>
            {isInStock ? ' Out of Stock' : 'In Stock'}
          </span>
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const isInStock = row.original.isStock;
      return filterValue.length === 0 || 
        filterValue.includes(isInStock.toString());
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date Created
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {row.original.createdAt}
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      // Ensure consistent date parsing
      const dateA = new Date(rowA.original.sortDate || rowA.original.createdAt);
      const dateB = new Date(rowB.original.sortDate || rowB.original.createdAt);
      return dateA.getTime() - dateB.getTime();
    }
  },
];