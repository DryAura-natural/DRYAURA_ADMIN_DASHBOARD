"use client";

import { useState } from "react";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { ProductsColumn, columns } from "./columns";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";

// types.ts or in a suitable types file
export interface FilterOptions {
  categories: string[];
  badges: string[];
  sizes: string[];
  colors: string[];
  benefits?: string[];
  specifications?: string[];
  dateFrom?: string;
  dateTo?: string;
  isOutOfStock?: boolean;
  isStock?: boolean[]; 
}

interface ProductsClientProps {
  data: ProductsColumn[];
  filterOptions: FilterOptions;
}

export const ProductsClient: React.FC<ProductsClientProps> = ({ 
  data, 
  filterOptions 

}) => {
  const router = useRouter();
  const params = useParams();
  
  // State for managing filters
  const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({
    categories: [],
    badges: [],
    sizes: [],
    colors: [],
    benefits: [], // Updated from nutritionalBenefits
    specifications: [] // Updated from dietaryPreferences
   
  });

  // Handle filter selection
  const handleFilterSelect = (filterType: keyof FilterOptions, value: string) => {
    setSelectedFilters(prev => {
      // Type-safe handling of array-based filters
      const currentFilterArray = prev[filterType] as string[] | undefined;
  
      // Handle array-based filters
      if (Array.isArray(currentFilterArray)) {
        return {
          ...prev,
          [filterType]: currentFilterArray.includes(value)
            ? currentFilterArray.filter(item => item !== value)
            : [...currentFilterArray, value]
        };
      }
  
      // Handle special cases like date filters
      switch(filterType) {
        case 'dateFrom':
        case 'dateTo':
          return {
            ...prev,
            [filterType]: value ? new Date(value) : undefined
          };
        
        // Fallback for any unexpected filter types
        default:
          console.warn(`Unhandled filter type: ${filterType}`);
          return prev;
      }
    });
  };

  // Filter data based on selected filters
  const filteredData = data.filter(product => {
    const matchesCategories = selectedFilters.categories.length === 0 || 
      selectedFilters.categories.some(cat => product.categories.includes(cat));
    
    const matchesBadges = selectedFilters.badges.length === 0 || 
      selectedFilters.badges.some(badge => product.badges.includes(badge));
    
    const matchesSizes = selectedFilters.sizes.length === 0 || 
      selectedFilters.sizes.some(size => product.sizes.includes(size));
    
    const matchesColors = selectedFilters.colors.length === 0 || 
      selectedFilters.colors.some(color => 
        product.colors.some(productColor => productColor.value === color)
      );
    
    const matchesBenefits = !selectedFilters.benefits?.length || 
      selectedFilters.benefits.some(benefit => 
        product.benefits.includes(benefit)
      );
    
    const matchesSpecifications = !selectedFilters.specifications?.length || 
      selectedFilters.specifications.some(spec => 
        product.specifications.includes(spec)
      );
      const matchesDateRange = 
      (!selectedFilters.dateFrom || new Date(product.sortDate) >= new Date(selectedFilters.dateFrom)) &&
      (!selectedFilters.dateTo || new Date(product.sortDate) <= new Date(selectedFilters.dateTo));
      
    return matchesCategories && 
           matchesBadges && 
           matchesSizes && 
           matchesColors && 
           matchesBenefits && 
           matchesSpecifications && 
           matchesDateRange;
  });

  // Export to CSV functionality
  const handleExport = () => {
    const csvHeaders = [
      "ID", 
      "Name", 
      "Price", 
      "MRP", 
      "Categories", 
      "Badges", 
      "Sizes", 
      "Colors", 
      "Benefits", 
      "Specifications", 
      "Featured", 
      "Created At", 
      "Sub Label", 
      "Description", 
      "Variants Count", 
      "Archived"
    ];
  
    const csvContent = [
      csvHeaders,
      ...filteredData.map(product => [
        product.id,
        `"${product.name}"`, // Wrap in quotes to handle commas
        product.price,
        product.mrp,
        `"${product.categories.join('|')}"`, // Wrap in quotes
        `"${product.badges.join('|')}"`,
        `"${product.sizes.join('|')}"`,
        `"${product.colors.map(c => c.value).join('|')}"`,
        `"${product.benefits.join('|')}"`,
        `"${product.specifications.join('|')}"`,
        product.isOutOfStock ? "Yes" : "No",
        product.createdAt,
        `"${product.subLabel || ''}"`,
        `"${product.description || ''}"`, // Handle potential undefined
        product.variantsCount,
      
      ])
    ]
    .map(row => row.join(",")) // Convert each row to CSV
    .join("\n"); // Join rows with newline
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `products_export_${new Date().toISOString().replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title={`Products (${filteredData.length})`}
          description={`Manage ${filteredData.length} products and their variants`}
        />
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuLabel>Filter Products</DropdownMenuLabel>
              
              {/* Categories Filter */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Categories</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {filterOptions.categories.map(category => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedFilters.categories.includes(category)}
                      onCheckedChange={() => handleFilterSelect('categories', category)}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Badges</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {filterOptions.badges.map(badge => (
                    <DropdownMenuCheckboxItem
                      key={badge}
                      checked={selectedFilters.badges.includes(badge)}
                      onCheckedChange={() => handleFilterSelect('badges', badge)}
                    >
                      {badge}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Sizes</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {filterOptions.sizes.map(size => (
                    <DropdownMenuCheckboxItem
                      key={size}
                      checked={selectedFilters.sizes.includes(size)}
                      onCheckedChange={() => handleFilterSelect('sizes', size)}
                    >
                      {size}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              

              {/* Similar dropdowns for other filter types */}
              {/* Badges, Sizes, Colors, Nutritional Benefits, Dietary Preferences */}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button
            onClick={() => router.push(`/${params.storeid}/products/new`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <DataTable 
        searchKey="name" 
        columns={columns} 
        data={filteredData}
      />
      
      <Heading 
        title="API Endpoints" 
        description="Access product data via API" 
      />
      <Separator />
      <ApiList  
        entityName="products" 
        entityIdName="id"
      />
    </div>
  );
};