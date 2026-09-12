export interface User {
  id: number;
  phone: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface Store {
  id: number;
  name: string;
  subdomain: string;
  storefront_url: string;
  business_category?: string;
  currency: string;
  phone?: string;
  telegram_bot_username?: string;
  is_active: boolean;
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product_image?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  delivery_fee: string;
  payment_method: string;
  payment_method_display: string;
  payment_status: string;
  payment_status_display: string;
  status: "NEW" | "PROCESSING" | "READY" | "IN_DELIVERY" | "COMPLETED" | "CANCELLED";
  status_display: string;
  total_amount: string;
  discount_amount: string;
  source: string;
  source_display: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name_uz: string;
  name_ru?: string;
  name_en?: string;
  price: string;
  old_price?: string | null;
  cost_price?: string | number | null;
  stock: number;
  unit: string;
  barcode?: string;
  ikpu_code?: string;
  description_uz?: string;
  is_active: boolean;
  primary_image_url?: string | null;
  category?: number | null;
  category_name?: string | null;
  created_at?: string;
}

export interface Category {
  id: number;
  name_uz: string;
  name_ru?: string;
  name_en?: string;
  slug: string;
  icon: string;
  primary_image_url?: string | null;
  is_active: boolean;
  sort_order: number;
  active_products_count: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  bonus_balance: number;
  orders_count: number;
  total_spent?: string;
  created_at: string;
}

export interface DashboardMetrics {
  period: string;
  revenue: number;
  sales_sum: number;
  delivery_fee: number;
  orders_count: number;
  new_orders: number;
  ready_orders: number;
  cancelled_orders: number;
  total_customers: number;
  avg_order: number;
  web_cnt: number;
  tma_cnt: number;
}

export interface DashboardCharts {
  labels: string[];
  revenue: number[];
  traffic: {
    web: number;
    telegram: number;
  };
}

export interface TopProduct {
  product_name: string;
  sold_qty: number;
  sold_sum: number;
}

export interface MapOrder {
  num: string;
  client: string;
  lat: number;
  lng: number;
  total: number;
  status: string;
}
