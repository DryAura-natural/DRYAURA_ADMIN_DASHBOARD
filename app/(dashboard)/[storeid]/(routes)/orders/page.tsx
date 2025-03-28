import { format } from "date-fns";
import prismadb from "@/lib/prismadb";
import { OrderClient } from "./components/client";
import { OrderColumn, createOrderColumn } from "./components/order-types";

const OrdersPage = async ({ params }: { params: { storeid: string } }) => {
  const orders = await prismadb.order.findMany({
    where: {
      storeId: params.storeid
    },
    include: {
      orderItems: {
        include: {
          variant: {
            include: {
              product: true,
              size: true,
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

  const formattedOrders: OrderColumn[] = orders.map((order) => 
    createOrderColumn({
      id: order.id,
      customer: {
        name: order.customer?.name || order.name || "Guest",
        id: order.customerId || '',
        email: order.customer?.email || order.email || '',
        phone: order.customer?.phone || order.phone || "N/A",
        address: order.customer?.streetAddress || order.address || "N/A",
        alternativePhone: order.customer?.alternatePhone || "N/A"
      
      },
      products: order.orderItems.map((item) => ({
        id: item.variantId,
        name: item.variant.product.name,
        size: item.variant.size?.value || 'N/A',
        quantity: item.quantity,
        unitPrice: item.variant.price.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
      totalPrice: order.totalAmount.toNumber(),
      status: order.orderStatus || 'PENDING',
      isPaid: order.isPaid || false,
      createdAt: format(order.createdAt, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      updatedAt: format(order.updatedAt, "yyyy-MM-dd'T'HH:mm:ssxxx"),
      storeId: order.storeId
    })
  );

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrdersPage;