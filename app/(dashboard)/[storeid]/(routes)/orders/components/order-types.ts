export type Product = {
  id: string;
  name: string;
  quantity: number;
  size?: string;
  color?: string;
  unitPrice: number;
  totalPrice: number;
  variantId?: string;
};

export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_SHIPPED';

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

export interface OrderFilterOptions {
  statusFilters: {
    label: string;
    value: OrderStatus;
  }[];
}

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
  orderNumber: string;

  // Convenience getters for backwards compatibility
  name: string;
  email: string;
  phone: string;
  alternativePhone?: string;
  address: string;
};

export function createOrderColumn(data: Partial<OrderColumn>): OrderColumn {
  return {
    id: data.id || crypto.randomUUID(),
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
    orderNumber: data.orderNumber || `ORD-${Date.now()}`,

    // Convenience getters
    name: data.customer?.name || data.name || '',
    email: data.customer?.email || data.email || '',
    phone: data.customer?.phone || data.phone || '',
    alternativePhone: data.customer?.alternativePhone || data.alternativePhone,
    address: data.customer?.address || data.address || ''
  };
}

// Helper function to generate default filter options
export function getDefaultOrderFilterOptions(): OrderFilterOptions {
  return {
    statusFilters: [
      { label: 'Pending', value: 'PENDING' },
      { label: 'Processing', value: 'PROCESSING' },
      { label: 'Shipped', value: 'SHIPPED' },
      { label: 'Delivered', value: 'DELIVERED' },
      { label: 'Cancelled', value: 'CANCELLED' }
    ]
  };
}
