import { columns } from "./columns";
import { OrderColumn } from "./order-types";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";

interface OrderClientProps {
  data: OrderColumn[];
}

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
  const totalRevenue = data.reduce((total, order) => total + order.totalPrice, 0);
  const pendingOrders = data.filter(order => order.status === 'PENDING').length;
  const shippedOrders = data.filter(order => order.status === 'SHIPPED').length;

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Orders ({data.length})
        </h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            Total Revenue: ₹{totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            Pending: {pendingOrders} | Shipped: {shippedOrders}
          </div>
        </div>
      </div>
      <Separator />
      {data.length > 0 ? (
        <DataTable 
          searchKey="products" 
          columns={columns} 
          data={data} 
        />
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <p className="text-lg text-gray-600">No orders found.</p>
          <p className="text-sm text-gray-500">
            Your store hasn't received any orders yet.
          </p>
        </div>
      )}
    </>
  );
};