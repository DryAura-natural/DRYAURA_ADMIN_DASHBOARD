import React from "react";
import { OrderClient } from "./components/client";
import prismadb from "@/lib/prismadb";
import { OrderColumn } from "./components/order-types";
import { format, isValid } from "date-fns";
import { formatter } from "@/lib/utils";

const OrdersPage = async ({ params }: { params: { storeid: string } }) => {
  const orders = await prismadb.order.findMany({
    where: { storeId: params.storeid },
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
    orderBy: { createdAt: "desc" },
  });

  // ✅ Correctly calculating quantity
  const formattedOrders: OrderColumn[] = orders.map((item) => {
    const totalQuantity = item.orderItems.reduce(
      (total, orderItem) => total + orderItem.quantity,
      0
    ); // ✅ Correctly summing up the quantity of all order items

    orders.forEach((order) => {
      console.log("Customer Name:", order.customer?.name);
    });
    
    return {
      id: item.id,
      // customerName: item.customer
      //   ? `${item.customer.name}`
      //   : "Guest use",
      name: item.customer?.name || "Guest",
      phone: item.phone || item.customer?.phone || "N/A",
      address:
        item.address ||
        (item.customer
          ? [
              item.customer.streetAddress,
              item.customer.city,
              item.customer.state,
              item.customer.postalCode,
              item.customer.country,
            ]
              .filter(Boolean)
              .join(", ")
          : "N/A"),
      products: item.orderItems
        .map((orderItem) => {
          const product = orderItem.product;
          return `${product.name} (Qty: ${orderItem.quantity}, ${
            product.size?.value || "N/A"
          }, ${product.color?.name || "No color"})`;
        })
        .join(", "),
      totalPrice: formatter.format(
        item.orderItems.reduce((total, orderItem) => {
          return total + Number(orderItem.product.price) * orderItem.quantity;
        }, 0)
      ),
      isPaid: item.isPaid,
      orderStatus: item.orderStatus,
      quantity: totalQuantity, // ✅ Ensure quantity is assigned and passed to frontend
      createdAt: isValid(new Date(item.createdAt))
        ? format(new Date(item.createdAt), "MMM do yyyy")
        : "Unknown",
      updatedAt: isValid(new Date(item.updatedAt))
        ? format(new Date(item.updatedAt), "MMM do yyyy")
        : "Unknown",
    };
  });

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />{" "}
        {/* ✅ Ensure frontend receives quantity */}
      </div>
    </div>
  );
};

export default OrdersPage;
