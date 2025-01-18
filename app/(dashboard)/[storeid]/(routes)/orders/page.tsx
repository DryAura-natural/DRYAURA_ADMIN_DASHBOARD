import React from "react";
import { OrderClient } from "./components/client";
import prismadb from "@/lib/prismadb";
import { OrderColumn } from "./components/columns";
import { format, isValid } from "date-fns";
import { formatter } from "@/lib/utils";

const OrdersPage = async ({ params }: { params: { storeid: string } }) => {
  const orders = await prismadb.order.findMany({
    where: {
      storeId: params.storeid,
    },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              size: true,
              color: true,
            },
          },
        },
      },
      customer: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedOrders: OrderColumn[] = orders.map((item) => ({
    id: item.id,
    customerName: `${item.customer.firstName} ${item.customer.lastName}`, // Customer's name
    phone: item.phone || item.customer.phone || "N/A", // Fallback for optional phone
    address: item.address || item.customer.address || "N/A", // Fallback for optional address
    products: item.orderItems
      .map((orderItem) => {
        const product = orderItem.product;
        return `${product.name} (${product.size?.value || "N/A"}, ${
          product.color?.name || "No color"
        })`;
      })
      .join(", "),
    totalPrice: formatter.format(
      item.orderItems.reduce((total, orderItem) => {
        return total + Number(orderItem.product.price);
      }, 0)
    ),
    isPaid: item.isPaid,
    createdAt: isValid(new Date(item.createdAt))
      ? format(new Date(item.createdAt), "MMM do yyyy")
      : "Unknown", // Fallback for invalid dates
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;
