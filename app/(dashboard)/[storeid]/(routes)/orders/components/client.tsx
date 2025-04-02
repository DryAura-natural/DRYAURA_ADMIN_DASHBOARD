"use client";

import * as React from "react"
import { useState, useCallback } from "react";
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calender"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


import { cn } from "@/lib/utils"
import { columns } from "./columns";
import { OrderColumn, getDefaultOrderFilterOptions } from "./order-types"
import { OrderFilterOptions } from "./order-types";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast"

interface OrderClientProps {
  data: OrderColumn[];
  filterOptions?: OrderFilterOptions;
}

export const OrderClient: React.FC<OrderClientProps> = ({ 
  data, 
  filterOptions
}) => {
  // Use default filter options if not provided
  const { toast } = useToast()
  const defaultFilterOptions = getDefaultOrderFilterOptions();
  const finalFilterOptions = {
    ...(filterOptions || defaultFilterOptions),
    paymentStatusFilters: [
      { label: 'Paid', value: true },
      { label: 'Unpaid', value: false }
    ]
  };

  const [filteredData, setFilteredData] = useState<OrderColumn[]>(data);
  const [selectedFilters, setSelectedFilters] = useState<{
    status?: string[];
    dateRange?: DateRange;
    searchQuery?: string;
    sortBy?: string;
    paymentStatus?: boolean[];
  }>({
    status: [],
    paymentStatus: []
  });

  const applyDateRangeFilter = useCallback((orders: OrderColumn[], dateRange?: DateRange) => {
    if (!dateRange || !dateRange.from) return orders;

    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const fromDate = dateRange.from;
      const toDate = dateRange.to || fromDate;

      // Ensure toDate is set to the end of the day
      toDate.setHours(23, 59, 59, 999);

      return orderDate >= fromDate && orderDate <= toDate;
    });
  }, []);

  // Re-apply filters when data changes
  const applyFilters = useCallback(() => {
    let result = [...data];

    // Apply status filter
    if (selectedFilters.status && selectedFilters.status.length > 0) {
      result = result.filter(order => 
        selectedFilters.status.includes(order.status)
      );
    }

    // Apply payment status filter
    if (selectedFilters.paymentStatus && selectedFilters.paymentStatus.length > 0) {
      result = result.filter(order => 
        selectedFilters.paymentStatus.includes(order.isPaid)
      );
    }

    // Apply date range filter
    result = applyDateRangeFilter(result, selectedFilters.dateRange);

    // Apply search query filter
    if (selectedFilters.searchQuery) {
      const searchQuery = selectedFilters.searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery) ||
        order.name.toLowerCase().includes(searchQuery) ||
        order.email.toLowerCase().includes(searchQuery)
      );
    }

    // Sorting
    if (selectedFilters.sortBy) {
      result.sort((a, b) => {
        switch(selectedFilters.sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'total_asc':
            return a.totalPrice - b.totalPrice;
          case 'total_desc':
            return b.totalPrice - a.totalPrice;
          default:
            return 0;
        }
      });
    }

    setFilteredData(result);
  }, [data, selectedFilters, applyDateRangeFilter]);

  const resetFilters = () => {
    setSelectedFilters({ status: [], paymentStatus: [] });
    setFilteredData(data);
  };

  // Function to share order details
  const shareOrderDetails = (order: any, method: 'clipboard' | 'whatsapp') => {
    // Prepare order details as a formatted string
    const orderDetailsText = `
Order Details:
Order ID: ${order.id}
Status: ${order.status}
Total Price: ₹${order.totalPrice}
Created At: ${new Date(order.createdAt).toLocaleString()}
    `.trim();

    if (method === 'clipboard') {
      navigator.clipboard.writeText(orderDetailsText)
        .then(() => {
          toast({
            title: "Order Details Copied",
            description: "Order details have been copied to clipboard.",
          });
        })
        .catch(err => {
          toast({
            title: "Copy Failed",
            description: "Unable to copy order details.",
            variant: "destructive"
          });
        });
    }

    if (method === 'whatsapp') {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(orderDetailsText)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Orders ({filteredData.length})
          </h2>
          <p className="text-sm text-gray-500">
            Manage orders for your store
          </p>
        </div>
        
        {/* Filter and Search Section */}
        <div className="flex space-x-2 items-center">
{/* Status Filter */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="min-w-[120px]">
      {selectedFilters.status && selectedFilters.status.length > 0 
        ? `Status: ${finalFilterOptions.statusFilters.find(s => s.value === selectedFilters.status[0])?.label ?? 'Unknown Status'}`
        : "Status"}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {finalFilterOptions.statusFilters.map(status => (
      <DropdownMenuItem 
        key={status.value}
        onSelect={() => {
          setSelectedFilters(prev => ({
            ...prev,
            status: [status.value] // Replace previous status with new single status
          }));
        }}
      >
        {status.label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>

{/* Payment Status Filter */}
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="min-w-[120px]">
      {selectedFilters.paymentStatus && selectedFilters.paymentStatus.length > 0 
        ? `Payment Status: ${finalFilterOptions.paymentStatusFilters.find(s => s.value === selectedFilters.paymentStatus[0])?.label ?? 'Unknown Payment Status'}`
        : "Payment Status"}
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {finalFilterOptions.paymentStatusFilters.map(status => (
      <DropdownMenuItem 
        key={status.value}
        onSelect={() => {
          setSelectedFilters(prev => ({
            ...prev,
            paymentStatus: [status.value] // Replace previous payment status with new single payment status
          }));
        }}
      >
        {status.label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
            <Button
  variant={"outline"}
  className={cn(
    "w-[240px] justify-start text-left font-normal",
    !selectedFilters.dateRange && "text-muted-foreground"
  )}
>
  <CalendarIcon className="mr-2 h-4 w-4" />
  
  {selectedFilters.dateRange?.from ? (
    selectedFilters.dateRange.to ? (
      <>
        {format(selectedFilters.dateRange.from, "LLL dd, y")} -{" "}
        {format(selectedFilters.dateRange.to, "LLL dd, y")}
      </>
    ) : (
      format(selectedFilters.dateRange.from, "LLL dd, y")
    )
  ) : (
    <span>Pick a date range</span>
  )}
</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
  <div className="p-2">
    <Calendar
      initialFocus
      mode="range"
      defaultMonth={selectedFilters.dateRange?.from}
      selected={selectedFilters.dateRange}
      onSelect={(range) => {
        setSelectedFilters(prev => ({
          ...prev,
          dateRange: range
        }));
      }}
      numberOfMonths={2}
    />
    {selectedFilters.dateRange?.from && (
      <div className="flex justify-end p-2">
        <Button 
          size="sm" 
          onClick={() => {
            if (selectedFilters.dateRange?.from || selectedFilters.dateRange?.to) {
              applyFilters();
            }
          }}
        >
          Apply Date Filter
        </Button>
      </div>
    )}
  </div>
</PopoverContent>
          </Popover>

          {/* Search Input */}
          <Input 
            placeholder="Search orders..." 
            value={selectedFilters.searchQuery || ''}
            onChange={(e) => {
              setSelectedFilters(prev => ({
                ...prev,
                searchQuery: e.target.value
              }));
              applyFilters();
            }}
            className="w-[200px]"
          />

          {/* Sort Dropdown */}
          <Select 
            onValueChange={(value) => {
              setSelectedFilters(prev => ({
                ...prev,
                sortBy: value
              }));
              applyFilters();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="total_asc">Total (Low to High)</SelectItem>
              <SelectItem value="total_desc">Total (High to Low)</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters Button */}
          {(selectedFilters.status?.length || 
            selectedFilters.paymentStatus?.length || 
            selectedFilters.dateRange || 
            selectedFilters.searchQuery || 
            selectedFilters.sortBy) && (
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="ml-2"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>
      
      <Separator className="my-4" />
      
      {filteredData.length > 0 ? (
        <DataTable 
          searchKey="products" 
          columns={columns} 
          data={filteredData} 
          onRowClick={(order) => {
            const orderDetailsText = `
Order Details:
Order ID: ${order.id}
Status: ${order.status}
Total Price: ₹${order.totalPrice}
Created At: ${order.createdAt}
            `.trim();

            navigator.clipboard.writeText(orderDetailsText)
              .then(() => {
                toast({
                  title: "Order Details Copied",
                  description: `Details for Order ${order.id} copied to clipboard.`
                });
              })
              .catch(err => {
                toast({
                  title: "Copy Failed",
                  description: "Unable to copy order details.",
                  variant: "destructive"
                });
              });
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <p className="text-lg text-gray-600">No orders found.</p>
          <p className="text-sm text-gray-500">
            {selectedFilters.status || selectedFilters.searchQuery 
              ? "No orders match your current filters." 
              : "Your store hasn't received any orders yet."}
          </p>
          {(selectedFilters.status?.length || 
            selectedFilters.paymentStatus?.length || 
            selectedFilters.dateRange || 
            selectedFilters.searchQuery || 
            selectedFilters.sortBy) && (
            <Button onClick={resetFilters}>
              Reset Filters
            </Button>
          )}
        </div>
      )}
    </>
  );
};