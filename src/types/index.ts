export type UserRole = "USER" | "ADMIN";
export type OrderStatus = "pending" | "processing" | "completed" | "canceled";
export type PaymentMethod = "CASH" | "CASHLESS";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface StockRow {
  quantity: number;
}

export interface Product {
  id: string;
  id_category: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  categories: Pick<Category, "id" | "name"> | null;
  stocks: StockRow | StockRow[] | null;
}

export interface Payment {
  id: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  amount: number;
  paid_at: string | null;
}

export interface OrderDetail {
  id: string;
  quantity: number;
  price: number;
  subtotal: number;
  id_product: string;
  products: { name: string; image_url: string | null } | null;
}

export interface Order {
  id: string;
  id_user: string;
  order_date: string;
  total_amount: number;
  status: OrderStatus;
  payments: Payment | Payment[] | null;
  order_details: OrderDetail[];
  users?: { name: string; email: string } | null;
}

export interface SalesReport {
  period: "weekly" | "monthly" | "yearly";
  start_date: string;
  end_date: string;
  total_orders: number;
  total_revenue: number;
  series: { bucket: string; orders: number; revenue: number }[];
  top_products: { name: string; quantity: number; revenue: number }[];
}

export interface AdminDashboard {
  orders_today: number;
  revenue_today: number;
  pending_orders: number;
  processing_orders: number;
  active_products: number;
  low_stock: { id_product: string; name: string; quantity: number }[];
}

/** Hasil Server Action yang dipakai bersama oleh form (useActionState). */
export type ActionState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
} | null;
