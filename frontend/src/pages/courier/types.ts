export type Language = 'uz' | 'ru' | 'en';

export interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CourierOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  status: 'PENDING' | 'READY' | 'IN_DELIVERY' | 'COMPLETED' | 'CANCELLED' | string;
  payment_method: 'CASH' | 'PAYME' | 'CLICK' | 'CARD' | string;
  payment_status: 'PENDING' | 'PAID' | string;
  total_amount: number;
  notes?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
  time_ago?: string;
}

export interface CourierProfile {
  id: number | null;
  name: string;
  phone: string;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  vehicle: string;
  completed_count: number;
  total_earned: number;
  store_name: string;
  is_active: boolean;
}

export interface CourierDashboardData {
  pending_orders: CourierOrder[];
  delivering_orders: CourierOrder[];
  completed_orders: CourierOrder[];
  pending_count: number;
  delivering_count: number;
  completed_count: number;
  total_completed_amount: number;
  courier: CourierProfile;
  current_lang: Language;
}

export type NavigationStage = 'PREVIEW' | 'DRIVING' | 'ARRIVED';

export interface RouteGeometry {
  coordinates: [number, number][]; // [lat, lng] array
  distanceMeters: number;
  durationSeconds: number;
}
