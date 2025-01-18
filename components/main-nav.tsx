"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useState } from "react";
import { Home, Tags, Ruler, Palette, Box, ShoppingCart, Settings, Presentation } from "lucide-react"; // Import Lucide icons

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  const params = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const routes = [
    {
      href: `/${params.storeid}`,
      label: "Overview",
      icon: <Home className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}`,
    },
    {
      href: `/${params.storeid}/billboards`,
      label: "Billboard",
      icon: <Presentation className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/billboards`,
    },
    {
      href: `/${params.storeid}/categories`,
      label: "Categories",
      icon: <Tags className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/categories`,
    },
    {
      href: `/${params.storeid}/sizes`,
      label: "Sizes",
      icon: <Ruler className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/sizes`,
    },
    {
      href: `/${params.storeid}/colors`,
      label: "Colors",
      icon: <Palette className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/colors`,
    },
    {
      href: `/${params.storeid}/products`,
      label: "Products",
      icon: <Box className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/products`,
    },
    {
      href: `/${params.storeid}/orders`,
      label: "Orders",
      icon: <ShoppingCart className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/orders`,
    },
    {
      href: `/${params.storeid}/settings`,
      label: "Settings",
      icon: <Settings className="mr-2 h-5 w-5" />,
      active: pathname === `/${params.storeid}/settings`,
    },
  ];

  return (
    <nav
      className={cn(
        "flex flex-col lg:flex-row items-center lg:space-x-6",
        className
      )}
      {...props}
    >
      {/* Hamburger Button */}
      <button
        className="lg:hidden p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary border"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={
              isMenuOpen
                ? "M6 18L18 6M6 6l12 12" // Close icon
                : "M4 6h16M4 12h16M4 18h16" // Hamburger icon
            }
          />
        </svg>
      </button>

      {/* Navigation Links */}
      <div
        className={cn(
          "flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6 pl-5 py-4",
          "absolute lg:static bg-white lg:bg-transparent w-full lg:w-auto left-0 top-14 lg:top-auto z-10 lg:z-auto",
          isMenuOpen ? "flex" : "hidden lg:flex"
        )}
      >
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary block lg:inline-flex items-center",
              route.active
                ? "text-black dark:text-white"
                : "text-muted-foreground"
            )}
            onClick={() => setIsMenuOpen(false)} // Close menu on link click
          >
            <div className="flex">
            {route.icon}
            {route.label}
            </div>
        
          </Link>
        ))}
      </div>
    </nav>
  );
}
