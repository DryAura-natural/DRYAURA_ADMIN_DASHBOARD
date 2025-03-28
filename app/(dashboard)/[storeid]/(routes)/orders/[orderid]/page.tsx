import prismadb from "@/lib/prismadb";
import { OrderForm } from "./components/order-form";
import { 
  AlertCircle, 
  Package, 
  User, 
  CreditCard, 
  Calendar, 
  ShoppingCart 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OrderPage = async ({ 
  params 
}: { 
  params: { 
    storeid: string, 
    orderid: string 
  } 
}) => {
  const order = await prismadb.order.findUnique({
    where: {
      id: params.orderid,
      storeId: params.storeid
    },
    include: {
      customer: true,
     
      
      orderItems: {
        include: {
          variant: {
            include: {
              product: true,
              size: true
            }
          }
        }
      },
     
    }
  });
  const customerDetails = order?.customerId 
  ? await prismadb.customer.findUnique({
      where: { 
        id: order.customerId 
      },
      include: {
        // Include any additional related data you might need
        orders: {
          where: {
            id: params.orderid
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
  : null;

  console.log('Order Details:', {
    orderId: order?.id,
    customerId: order?.customerId,
    customerDetails: customerDetails,
    orderItemsCount: order?.orderItems?.length
  });

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
        <Card className="w-full max-w-md border-red-500">
          <CardHeader className="flex flex-row items-center space-x-4 bg-red-50 border-b border-red-200">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <CardTitle className="text-red-600">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">
              The order you are looking for does not exist or has been deleted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    const statusVariants = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'PROCESSING': 'bg-blue-100 text-blue-800 border-blue-200',
      'SHIPPED': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'DELIVERED': 'bg-green-100 text-green-800 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200'
    };

    const normalizedStatus = status.toUpperCase();
    
    return (
      <Badge 
        variant="outline" 
        className={
          statusVariants[normalizedStatus] || 
          'bg-gray-100 text-gray-800 border-gray-200'
        }
      >
        {normalizedStatus}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Order Details
        </h1>
        <OrderForm 
          initialData={{
            id: order.id,
            status: order.orderStatus || 'PENDING'
          }} 
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-semibold">{order.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold">₹{order.totalAmount?.toNumber() || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span>{order.isPaid ? '✅ Paid' : '❌ Unpaid'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Status</span>
              {getOrderStatusBadge(order.orderStatus || 'PENDING')}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created At</span>
              <span>{order.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Updated At</span>
              <span>{order.updatedAt.toLocaleDateString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Tracking ID</span>
              <span>{order.trackingId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Link</span>
              <span>{order.invoiceLink || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span>{order.customer?.name || order.name || 'Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span>{order.customer?.email || order.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600"> Primary Phone</span>
              <span>{order.customer?.phone || order.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Alternate Phone</span>
              <span>{order.customer?.alternatePhone || order.alternatePhone ||  'N/A'}</span>
            </div>
          

            <div className="flex justify-between">
              <span className="text-gray-600">Address</span>
              <span>{order.customer?.streetAddress || order.address || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">City</span>
              <span>{order.customer?.city || customerDetails?.city || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">State</span>
              <span>{order.customer?.state || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Postal Code</span>
              <span>{order.customer?.postalCode || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item) => (
              <div 
                key={item.id} 
                className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-lg">
                    {item.variant.product.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Size: {item.variant.size?.name || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Quantity: {item.quantity}</p>
                  <p className="text-primary">
                    Price: ₹{item.variant.price?.toNumber() || 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderPage;