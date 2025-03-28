export type Product = {
  id: string;
  name: string;
  quantity: number;
  size?: string;
  unitPrice: number;
  totalPrice: number;
};

export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
};

export type OrderColumn = {
  id: string;
  customer: Customer;
  products: Product[];
  totalPrice: number;
  status: OrderStatus;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  storeId: string;

  // Convenience getters for backwards compatibility
  name: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
};
export function createOrderColumn(data: Partial<OrderColumn>): OrderColumn {
  return {
    id: data.id || '',
    customer: data.customer || {
      id: '',
      name: '',
      email: '',
      phone: '',
      address: ''
    },
    products: data.products || [],
    totalPrice: data.totalPrice || 0,
    status: data.status || 'PENDING',
    isPaid: data.isPaid || false,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    storeId: data.storeId || '',

    // Convenience getters
    name: data.customer?.name || data.name || '',
    email: data.customer?.email || data.email || '',
    phone: data.customer?.phone || data.phone || '',
    alternativePhone: data.customer?.alternativePhone || data.alternativePhone,
    address: data.customer?.address || data.address || ''
  };
}
