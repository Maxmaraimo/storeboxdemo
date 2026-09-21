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
  courier?: StaffItem | null;
  courier_id?: number | null;
  delivery_address: string;
  delivery_type?: string;
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

export interface ModulePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export type RolePermissionMap = Record<string, ModulePermission>;

export interface UserPermissions {
  is_owner: boolean;
  is_courier: boolean;
  role_name: string;
  modules: RolePermissionMap;
}

export interface StaffItem {
  id: number;
  name: string;
  phone: string;
  role: string;
  role_id?: number | null;
  role_name?: string;
  is_courier: boolean;
  is_active: boolean;
  orders_count: number;
  created_at: string;
  updated_at?: string;
}

export interface StoreRoleItem {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  permissions: RolePermissionMap;
  staff_count: number;
}

export interface CourierItem {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  orders_count: number;
  current_lat?: number | null;
  current_lng?: number | null;
  last_location_update?: string | null;
  last_seen_seconds_ago?: number | null;
  active_order?: {
    id: number;
    order_number: string;
    status: string;
    status_display: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    delivery_lat?: number | null;
    delivery_lng?: number | null;
    total_amount: number;
  } | null;
  created_at: string;
}
