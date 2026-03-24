// User types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  role: 'CUSTOMER' | 'STORE' | 'RIDER' | 'ADMIN' | 'SUPPORT' | 'OPERATIONS';
  isBlocked: boolean;
  createdAt: string;
  store?: { id: string; name: string };
}

// Store types
export interface Store {
  id: string;
  name: string;
  ownerId: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  gstNumber?: string;
  imageUrl?: string;
  isApproved: boolean;
  isDisabled: boolean;
  rating: number;
  totalOrders: number;
  category?: string;
  tags: string[];
  createdAt: string;
  owner?: { id: string; name: string; phone: string };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  status: 'active' | 'inactive';
  storeId: string;
}

// Rider types
export interface Rider {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isBlocked: boolean;
  createdAt: string;
  _count?: { deliveries: number };
  vehicleType?: string;
  vehicleNumber?: string;
  totalDeliveries?: number;
  rating?: number;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  storeId: string;
  riderId?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  amountReceived?: number;
  otpCode: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryAddress?: string;
  packingStartedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; phone: string; email?: string };
  store?: { id: string; name: string; address: string; phone?: string };
  rider?: { id: string; name: string; phone: string };
  items?: OrderItem[];
}

export type OrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'PACKING'
  | 'READY'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'ONLINE';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  offerPercentage?: number;
  product?: { id: string; name: string; images: string[] };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  description: string;
  timestamp: string;
  actor?: string;
}

// Ticket types
export interface Ticket {
  id: string;
  userId: string;
  orderId?: string;
  type: 'DELIVERY' | 'PAYMENT' | 'PRODUCT' | 'STORE' | 'RIDER' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  subject: string;
  message: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; phone: string; email?: string };
  assignee?: { id: string; name: string };
  replies?: TicketReply[];
  _count?: { replies: number };
}

export interface TicketReply {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  user?: { id: string; name: string; role: string };
}

// Payment types
export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  type: 'PAYMENT' | 'REFUND';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  metadata?: any;
  createdAt: string;
  user?: { id: string; name: string };
  order?: { id: string; orderNumber: string; store?: { id: string; name: string } };
}

// Analytics types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeStores: number;
  activeRiders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalUsers: number;
}

export interface AnalyticsData {
  ordersCount: { date: string; count: number }[];
  revenue: { date: string; amount: number }[];
  activeUsers: { date: string; count: number }[];
}

// Auth types
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

// Pagination types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter types
export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  storeId?: string;
  paymentStatus?: string;
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  type?: Ticket['type'];
  priority?: Ticket['priority'];
}

// Search types
export interface SearchResultItem {
  id: string;
  type: 'order' | 'user' | 'store';
  title: string;
  subtitle: string;
  status?: string;
}

export interface SearchResult {
  orders: SearchResultItem[];
  users: SearchResultItem[];
  stores: SearchResultItem[];
}
