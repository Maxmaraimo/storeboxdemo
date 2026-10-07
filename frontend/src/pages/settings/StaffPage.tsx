import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Shield,
  Truck,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  AlertTriangle,
  Lock,
  Phone,
  User,
  CheckSquare,
  Square,
  ChevronRight,
  ShieldAlert,
  MapPin,
  Navigation,
  Compass,
  Activity,
  Radio,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Clock,
  Award,
  Route,
  DollarSign,
  Eye,
  CheckCircle2,
  XCircle,
  Package,
  Smartphone
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { StaffItem, StoreRoleItem, CourierItem, RolePermissionMap, ModulePermission } from "../../types";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMap } from "react-leaflet";

// Fix leaflet default icons with modern vector SVGs
const courierCarIcon = L.divIcon({
  className: "custom-courier-car-marker",
  html: `<div class="relative flex items-center justify-center">
    <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(245,158,11,0.35); animation: pulse-ring 2s infinite;"></div>
    <div style="width: 44px; height: 44px; filter: drop-shadow(0 6px 12px rgba(217, 119, 6, 0.55));">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <path d="M24 4 L42 42 L24 33 L6 42 Z" fill="rgba(0,0,0,0.22)" transform="translate(0, 3)"/>
        <path d="M24 4 L6 42 L24 33 Z" fill="url(#reactNavFacetLeft)" stroke="#d97706" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M24 4 L42 42 L24 33 Z" fill="url(#reactNavFacetRight)" stroke="#b45309" stroke-width="1.2" stroke-linejoin="round"/>
        <line x1="24" y1="4" x2="24" y2="33" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.95"/>
        <defs>
          <linearGradient id="reactNavFacetLeft" x1="6" y1="4" x2="24" y2="33" gradientUnits="userSpaceOnUse">
            <stop stop-color="#fef08a"/>
            <stop offset="0.5" stop-color="#facc15"/>
            <stop offset="1" stop-color="#eab308"/>
          </linearGradient>
          <linearGradient id="reactNavFacetRight" x1="42" y1="4" x2="24" y2="33" gradientUnits="userSpaceOnUse">
            <stop stop-color="#f59e0b"/>
            <stop offset="0.7" stop-color="#d97706"/>
            <stop offset="1" stop-color="#b45309"/>
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

const destinationPinIcon = L.divIcon({
  className: "custom-dest-pin-marker",
  html: `<div class="relative flex items-center justify-center">
    <div style="position: absolute; inset: -8px; border-radius: 50%; background: rgba(15,23,42,0.25); animation: pulse-ring 2.2s infinite;"></div>
    <div class="w-10 h-10 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-2xl border-2 border-slate-900">
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M4 2v20" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <rect x="6" y="3" width="7" height="6" fill="#0f172a"/>
        <rect x="13" y="3" width="7" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="0.5"/>
        <rect x="6" y="9" width="7" height="6" fill="#ffffff" stroke="#0f172a" stroke-width="0.5"/>
        <rect x="13" y="9" width="7" height="6" fill="#0f172a"/>
      </svg>
    </div>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 36],
});

const MapAutoResize: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const RouteBoundsFitter: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 1) {
      try {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [60, 60] });
      } catch (e) {}
    }
  }, [coords, map]);
  return null;
};

// Valid Uzbek operator codes (e.g. 90, 91, 93, 94, 95, 97, 98, 99, 33, 50, 55, 77, 88)
const UZ_VALID_PREFIXES = [
  "33", "50", "55", "70", "71", "72", "73", "74", "75", "77", "78", "79", "88", "90", "91", "93", "94", "95", "97", "98", "99"
];

export const formatUzbekPhone = (value: string): string => {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("998")) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);

  if (!digits) {
    return "+998 ";
  }
  if (digits.length <= 2) {
    return `+998 (${digits}`;
  }
  if (digits.length <= 5) {
    return `+998 (${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 7) {
    return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return `+998 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}`;
};

export const getCanonicalPhone = (formatted: string): string => {
  let digits = formatted.replace(/\D/g, "");
  if (!digits.startsWith("998")) {
    digits = "998" + digits;
  }
  return "+" + digits;
};

export const validateUzbekPhone = (formatted: string, lang: string = "uz"): { valid: boolean; error?: string } => {
  let digits = formatted.replace(/\D/g, "");
  if (digits.startsWith("998")) {
    digits = digits.slice(3);
  }
  if (digits.length === 0) {
    return { valid: false, error: lang === "ru" ? "Введите номер телефона" : lang === "en" ? "Enter phone number" : "Telefon raqamini kiriting" };
  }
  if (digits.length < 9) {
    return {
      valid: false,
      error: lang === "ru"
        ? `Номер телефона неполный (${digits.length}/9 цифр введено)`
        : lang === "en"
        ? `Phone number incomplete (${digits.length}/9 digits entered)`
        : `Telefon raqami to'liq emas (${digits.length}/9 raqam kiritildi)`
    };
  }
  const prefix = digits.slice(0, 2);
  if (!UZ_VALID_PREFIXES.includes(prefix)) {
    return {
      valid: false,
      error: lang === "ru"
        ? `Неверный код оператора: (${prefix}). Введите код Узбекистана (например: 90, 91, 93, 94, 95, 97, 98, 99, 33, 50, 77, 88)`
        : lang === "en"
        ? `Invalid operator code: (${prefix}). Enter valid Uzbekistan code (e.g.: 90, 91, 93, 94, 95, 97, 98, 99, 33, 50, 77, 88)`
        : `Noto'g'ri operator kodi: (${prefix}). Haqiqiy O'zbekiston kodi kiriting (masalan: 90, 91, 93, 94, 95, 97, 98, 99, 33, 50, 77, 88)`
    };
  }
  return { valid: true };
};

const MODULE_DEFINITIONS = [
  { key: "dashboard", label: "Boshqaruv paneli", labelRu: "Панель управления", labelEn: "Dashboard" },
  { key: "orders", label: "Buyurtmalar", labelRu: "Заказы", labelEn: "Orders" },
  { key: "customers", label: "Mijozlar", labelRu: "Клиенты", labelEn: "Customers" },
  { key: "chats", label: "Chat", labelRu: "Чат", labelEn: "Chat" },
  { key: "categories", label: "Kategoriyalar", labelRu: "Категории", labelEn: "Categories" },
  { key: "products", label: "Mahsulotlar", labelRu: "Товары", labelEn: "Products" },
  { key: "discounts", label: "Chegirma", labelRu: "Скидки", labelEn: "Discounts" },
  { key: "ikpu", label: "IKPU", labelRu: "ИКПУ", labelEn: "IKPU" },
  { key: "warehouse", label: "Omborxona", labelRu: "Склад", labelEn: "Warehouse" },
  { key: "broadcast", label: "Rassilka", labelRu: "Рассылка", labelEn: "Broadcast" },
  { key: "promocodes", label: "Promokod", labelRu: "Промокоды", labelEn: "Promo codes" },
  { key: "analytics", label: "Manbalar / Tahlil", labelRu: "Источники / Аналитика", labelEn: "Analytics" },
  { key: "banners", label: "Bannerlar", labelRu: "Баннеры", labelEn: "Banners" },
  { key: "telegram", label: "Telegram bot", labelRu: "Telegram бот", labelEn: "Telegram Bot" },
  { key: "payments", label: "To'lov turi", labelRu: "Способы оплаты", labelEn: "Payment Methods" },
  { key: "delivery", label: "Yetkazib berish", labelRu: "Доставка & Курьеры", labelEn: "Delivery & Couriers" },
  { key: "branches", label: "Filiallar", labelRu: "Филиалы", labelEn: "Branches" },
  { key: "staff", label: "Xodimlar", labelRu: "Сотрудники", labelEn: "Staff" },
  { key: "roles", label: "Rollar va Huquqlar", labelRu: "Роли и права", labelEn: "Roles & Permissions" },
  { key: "settings", label: "Sozlamalar", labelRu: "Настройки", labelEn: "Settings" },
  { key: "channels", label: "Kanal bo'yicha yuborish", labelRu: "Публикация в канал", labelEn: "Channel Posting" },
];

const getModuleLabel = (mod: typeof MODULE_DEFINITIONS[number], currentLang: string) => {
  if (currentLang === "ru") return mod.labelRu;
  if (currentLang === "en") return mod.labelEn;
  return mod.label;
};

const formatRoleName = (name: string, currentLang: string): string => {
  if (!name) return "";
  const lower = name.trim().toLowerCase();
  if (currentLang === "ru") {
    if (lower === "admin" || lower === "administrator") return "Администратор";
    if (lower === "menejer" || lower === "manager") return "Менеджер";
    if (lower === "kassir" || lower === "cashier") return "Кассир";
    if (lower === "kuryer" || lower === "courier") return "Курьер";
    if (lower === "operator") return "Оператор";
    if (lower === "do'kon egasi" || lower === "dokon egasi" || lower === "owner") return "Владелец магазина";
    if (lower === "superadmin" || lower === "super admin") return "Главный администратор";
  } else if (currentLang === "en") {
    if (lower === "admin" || lower === "administrator") return "Administrator";
    if (lower === "menejer" || lower === "manager") return "Manager";
    if (lower === "kassir" || lower === "cashier") return "Cashier";
    if (lower === "kuryer" || lower === "courier") return "Courier";
    if (lower === "operator") return "Operator";
    if (lower === "do'kon egasi" || lower === "dokon egasi" || lower === "owner") return "Store Owner";
    if (lower === "superadmin" || lower === "super admin") return "Super Admin";
  } else {
    if (lower === "admin" || lower === "administrator") return "Admin";
    if (lower === "menejer" || lower === "manager") return "Menejer";
    if (lower === "kassir" || lower === "cashier") return "Kassir";
    if (lower === "kuryer" || lower === "courier") return "Kuryer";
    if (lower === "operator") return "Operator";
    if (lower === "do'kon egasi" || lower === "dokon egasi" || lower === "owner") return "Do'kon egasi";
    if (lower === "superadmin" || lower === "super admin") return "Superadmin";
  }
  return name;
};

const formatRoleDescription = (desc: string, currentLang: string): string => {
  if (!desc) return "";
  const lower = desc.trim().toLowerCase();
  if (currentLang === "ru") {
    if (lower.includes("barcha huquqlar") || lower.includes("toliq") || lower.includes("to'liq")) {
      return "Полный доступ ко всем разделам и настройкам магазина";
    }
    if (lower.includes("buyurtmalar") && (lower.includes("tovarlar") || lower.includes("mijozlar"))) {
      return "Управление заказами, товарами, клиентами и складом";
    }
    if (lower.includes("kassa") || lower.includes("kassir")) {
      return "Работа с кассой и прием поступающих заказов";
    }
  } else if (currentLang === "en") {
    if (lower.includes("barcha huquqlar") || lower.includes("toliq") || lower.includes("to'liq")) {
      return "Full access to all store modules and settings";
    }
    if (lower.includes("buyurtmalar") && (lower.includes("tovarlar") || lower.includes("mijozlar"))) {
      return "Manage orders, products, customers and warehouse";
    }
    if (lower.includes("kassa") || lower.includes("kassir")) {
      return "Cash register and incoming orders processing";
    }
  }
  return desc;
};

export const StaffPage: React.FC<{ initialTab?: "staff" | "roles" | "couriers" }> = ({ initialTab = "staff" }) => {
  const { t, lang } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to resolve active tab from URL pathname or initialTab
  const getTabFromLocation = (): "staff" | "roles" | "couriers" => {
    const p = location.pathname;
    if (p.endsWith("/roles") || p.includes("/staff/roles")) return "roles";
    if (p.endsWith("/couriers") || p.includes("/staff/couriers")) return "couriers";
    if (p.endsWith("/staff")) return "staff";
    const urlTab = searchParams.get("tab") as "staff" | "roles" | "couriers" | null;
    return urlTab || initialTab;
  };

  const [activeTab, setActiveTab] = useState<"staff" | "roles" | "couriers">(getTabFromLocation);

  // Sync activeTab immediately whenever URL pathname changes (fixes navigation without refresh!)
  useEffect(() => {
    setActiveTab(getTabFromLocation());
  }, [location.pathname, initialTab]);

  const handleTabChange = (tab: "staff" | "roles" | "couriers") => {
    setActiveTab(tab);
    if (tab === "roles") {
      navigate("/settings/staff/roles");
    } else if (tab === "couriers") {
      navigate("/settings/staff/couriers");
    } else {
      navigate("/settings/staff");
    }
  };

  // Search queries for each tab
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // 1. DATA QUERIES
  // ==========================================
  const { data: staffData, isLoading: isStaffLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.get("/staff/");
      return res.data as { staff: StaffItem[]; total: number };
    },
  });

  const { data: rolesData, isLoading: isRolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/roles/");
      return res.data as { roles: StoreRoleItem[]; total: number };
    },
  });

  const { data: couriersData, isLoading: isCouriersLoading, refetch: refetchCouriers } = useQuery({
    queryKey: ["couriers"],
    queryFn: async () => {
      const res = await api.get("/couriers/");
      return res.data as { couriers: CourierItem[]; total: number };
    },
    refetchInterval: 6000, // Live poll every 6s for courier telemetry
  });

  // State for Live Courier Monitoring Modal
  const [monitorCourier, setMonitorCourier] = useState<CourierItem | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  // State for Courier Profile & Detailed Analytics Modal
  const [profileCourierId, setProfileCourierId] = useState<number | null>(null);
  const [historyTab, setHistoryTab] = useState<"ALL" | "IN_DELIVERY" | "COMPLETED" | "CANCELLED">("ALL");

  const {
    data: courierAnalyticsData,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
  } = useQuery({
    queryKey: ["courier-analytics", profileCourierId],
    queryFn: async () => {
      if (!profileCourierId) return null;
      const res = await api.get(`/couriers/${profileCourierId}/analytics/`);
      return res.data as {
        courier: {
          id: number;
          name: string;
          phone: string;
          role: string;
          is_active: boolean;
          is_online: boolean;
          last_seen_seconds_ago: number | null;
          current_lat: number | null;
          current_lng: number | null;
          created_at: string;
          working_days: number;
        };
        stats: {
          total_orders: number;
          completed_orders: number;
          cancelled_orders: number;
          in_delivery_orders: number;
          today_orders: number;
          success_rate: number;
          total_revenue: number;
          total_distance_km: number;
          avg_delivery_minutes: number;
          rating: number;
        };
        active_order: {
          id: number;
          order_number: string;
          status: string;
          status_display: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          delivery_lat: number | null;
          delivery_lng: number | null;
          total_amount: number;
          payment_method_display: string;
          created_at: string;
        } | null;
        orders_history: Array<{
          id: number;
          order_number: string;
          status: string;
          status_display: string;
          customer_name: string;
          customer_phone: string;
          delivery_address: string;
          total_amount: number;
          payment_method_display: string;
          payment_status: string;
          created_at: string;
          updated_at: string;
        }>;
      };
    },
    enabled: !!profileCourierId,
    refetchInterval: profileCourierId ? 6000 : false,
  });

  const staffList = staffData?.staff || [];
  const rolesList = rolesData?.roles || [];
  const couriersList = couriersData?.couriers || [];

  useEffect(() => {
    if (monitorCourier) {
      const updated = couriersList.find((c) => c.id === monitorCourier.id);
      if (updated) {
        setMonitorCourier(updated);
      }
    }
  }, [couriersList]);

  // Fetch real road route (OSRM driving road geometry) for courier monitor
  useEffect(() => {
    if (!monitorCourier || !monitorCourier.active_order) {
      setRouteCoords([]);
      setRouteInfo(null);
      return;
    }

    const cLat = monitorCourier.current_lat || (monitorCourier.active_order.delivery_lat ? monitorCourier.active_order.delivery_lat - 0.012 : 41.311087);
    const cLng = monitorCourier.current_lng || (monitorCourier.active_order.delivery_lng ? monitorCourier.active_order.delivery_lng - 0.012 : 69.240562);
    const dLat = monitorCourier.active_order.delivery_lat || (cLat + 0.012);
    const dLng = monitorCourier.active_order.delivery_lng || (cLng + 0.012);

    let cancelled = false;

    const loadRoadRoute = async () => {
      // 1. Try primary OSRM driving engine
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${cLng},${cLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (!cancelled && data.code === "Ok" && data.routes && data.routes.length > 0) {
          const pts: [number, number][] = data.routes[0].geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          setRouteCoords(pts);
          const distKm = (data.routes[0].distance / 1000).toFixed(1);
          const durMin = Math.round(data.routes[0].duration / 60);
          setRouteInfo({ distance: `${distKm} km`, duration: `~${Math.max(1, durMin)} daq` });
          return;
        }
      } catch (e) {
        console.warn("Primary OSRM route fetch failed, trying mirror:", e);
      }

      // 2. Try OpenStreetMap routing mirror
      try {
        const mirrorUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${cLng},${cLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        const res2 = await fetch(mirrorUrl);
        const data2 = await res2.json();
        if (!cancelled && data2.code === "Ok" && data2.routes && data2.routes.length > 0) {
          const pts: [number, number][] = data2.routes[0].geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          setRouteCoords(pts);
          const distKm = (data2.routes[0].distance / 1000).toFixed(1);
          const durMin = Math.round(data2.routes[0].duration / 60);
          setRouteInfo({ distance: `${distKm} km`, duration: `~${Math.max(1, durMin)} daq` });
          return;
        }
      } catch (e2) {
        console.warn("Mirror route fetch failed:", e2);
      }

      // 3. Fallback: intermediate waypoints along streets
      if (!cancelled) {
        setRouteCoords([
          [cLat, cLng],
          [(cLat + dLat) / 2 + 0.002, (cLng + dLng) / 2],
          [dLat, dLng],
        ]);
      }
    };

    loadRoadRoute();

    return () => {
      cancelled = true;
    };
  }, [monitorCourier?.id, monitorCourier?.current_lat, monitorCourier?.current_lng, monitorCourier?.active_order?.id]);

  // Filtered lists
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        (s.role_name && s.role_name.toLowerCase().includes(q))
      );
    });
  }, [staffList, searchQuery]);

  const filteredRoles = useMemo(() => {
    return rolesList.filter((r) => {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
    });
  }, [rolesList, searchQuery]);

  const filteredCouriers = useMemo(() => {
    return couriersList.filter((c) => {
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    });
  }, [couriersList, searchQuery]);

  // ==========================================
  // 2. TOGGLE ACTIVE MUTATIONS
  // ==========================================
  const toggleStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.post(`/staff/${id}/toggle/`)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.post(`/roles/${id}/toggle/`)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  const toggleCourierMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.post(`/couriers/${id}/toggle/`)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["couriers"] }),
  });

  // ==========================================
  // 3. DELETE STATE & MUTATION
  // ==========================================
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "staff" | "role" | "courier";
    id: number;
    title: string;
  }>({
    open: false,
    type: "staff",
    id: 0,
    title: "",
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (deleteModal.type === "staff") {
        await api.delete(`/staff/${deleteModal.id}/`);
      } else if (deleteModal.type === "role") {
        await api.delete(`/roles/${deleteModal.id}/`);
      } else {
        await api.delete(`/couriers/${deleteModal.id}/`);
      }
    },
    onSuccess: () => {
      if (deleteModal.type === "staff") queryClient.invalidateQueries({ queryKey: ["staff"] });
      else if (deleteModal.type === "role") queryClient.invalidateQueries({ queryKey: ["roles"] });
      else queryClient.invalidateQueries({ queryKey: ["couriers"] });
      setDeleteModal((prev) => ({ ...prev, open: false }));
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    },
  });

  // ==========================================
  // 4. STAFF MODAL STATE & MUTATION
  // ==========================================
  const [staffModal, setStaffModal] = useState<{
    open: boolean;
    editId: number | null;
    name: string;
    phone: string;
    password: string;
    confirmPassword: string;
    roleId: number | null;
    error: string;
  }>({
    open: false,
    editId: null,
    name: "",
    phone: "+998",
    password: "",
    confirmPassword: "",
    roleId: null,
    error: "",
  });

  const openAddStaff = () => {
    const defaultRoleId = rolesList.length > 0 ? rolesList[0].id : null;
    setStaffModal({
      open: true,
      editId: null,
      name: "",
      phone: "+998 ",
      password: "",
      confirmPassword: "",
      roleId: defaultRoleId,
      error: "",
    });
  };

  const openEditStaff = (staff: StaffItem) => {
    setStaffModal({
      open: true,
      editId: staff.id,
      name: staff.name,
      phone: formatUzbekPhone(staff.phone),
      password: "",
      confirmPassword: "",
      roleId: staff.role_id || (rolesList[0]?.id ?? null),
      error: "",
    });
  };

  const saveStaffMutation = useMutation({
    mutationFn: async () => {
      if (!staffModal.name.trim()) throw new Error(lang === "ru" ? "Введите имя сотрудника" : lang === "en" ? "Enter employee name" : "Xodim ismini kiriting");
      
      const phoneValidation = validateUzbekPhone(staffModal.phone, lang);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error);
      }
      const canonicalPhone = getCanonicalPhone(staffModal.phone);

      if (!staffModal.editId) {
        if (!staffModal.password) throw new Error(lang === "ru" ? "Пароль обязателен" : lang === "en" ? "Password is required" : "Parol kiritilishi shart");
        if (staffModal.password.length < 6) throw new Error(lang === "ru" ? "Пароль должен содержать минимум 6 символов" : lang === "en" ? "Password must be at least 6 characters" : "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        if (staffModal.password !== staffModal.confirmPassword) {
          throw new Error(lang === "ru" ? "Пароли не совпадают" : lang === "en" ? "Passwords do not match" : "Parol va parolni tasdiqlash mos kelmadi");
        }
      } else if (staffModal.password) {
        if (staffModal.password.length < 6) throw new Error(lang === "ru" ? "Пароль должен содержать минимум 6 символов" : lang === "en" ? "Password must be at least 6 characters" : "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        if (staffModal.password !== staffModal.confirmPassword) {
          throw new Error(lang === "ru" ? "Пароли не совпадают" : lang === "en" ? "Passwords do not match" : "Parol va parolni tasdiqlash mos kelmadi");
        }
      }

      const payload: any = {
        name: staffModal.name.trim(),
        phone: canonicalPhone,
        role_id: staffModal.roleId,
      };
      if (staffModal.password) {
        payload.password = staffModal.password;
      }

      if (staffModal.editId) {
        return (await api.put(`/staff/${staffModal.editId}/`, payload)).data;
      } else {
        return (await api.post("/staff/", payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      setStaffModal((prev) => ({ ...prev, open: false }));
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setStaffModal((prev) => ({ ...prev, error: typeof msg === "object" ? JSON.stringify(msg) : msg }));
    },
  });

  // ==========================================
  // 5. ROLE MODAL STATE & MUTATION (WITH MATRIX)
  // ==========================================
  const [roleModal, setRoleModal] = useState<{
    open: boolean;
    editId: number | null;
    name: string;
    description: string;
    permissions: RolePermissionMap;
    error: string;
  }>({
    open: false,
    editId: null,
    name: "",
    description: "",
    permissions: {},
    error: "",
  });

  const getEmptyPermissions = (): RolePermissionMap => {
    const map: RolePermissionMap = {};
    for (const mod of MODULE_DEFINITIONS) {
      map[mod.key] = { view: false, edit: false, delete: false };
    }
    return map;
  };

  const openAddRole = () => {
    setRoleModal({
      open: true,
      editId: null,
      name: "",
      description: "",
      permissions: getEmptyPermissions(),
      error: "",
    });
  };

  const openEditRole = (role: StoreRoleItem) => {
    const initialPerms = getEmptyPermissions();
    if (role.permissions) {
      for (const mod of MODULE_DEFINITIONS) {
        if (role.permissions[mod.key]) {
          initialPerms[mod.key] = {
            view: !!role.permissions[mod.key].view,
            edit: !!role.permissions[mod.key].edit,
            delete: !!role.permissions[mod.key].delete,
          };
        }
      }
    }
    setRoleModal({
      open: true,
      editId: role.id,
      name: role.name,
      description: role.description || "",
      permissions: initialPerms,
      error: "",
    });
  };

  const handleTogglePerm = (modKey: string, action: "view" | "edit" | "delete") => {
    setRoleModal((prev) => {
      const current = prev.permissions[modKey] || { view: false, edit: false, delete: false };
      const nextVal = !current[action];
      const updatedMod = { ...current, [action]: nextVal };

      // Logical integrity: if edit or delete is enabled, view must also be enabled
      if ((action === "edit" || action === "delete") && nextVal) {
        updatedMod.view = true;
      }
      // If view is disabled, edit and delete must also be disabled
      if (action === "view" && !nextVal) {
        updatedMod.edit = false;
        updatedMod.delete = false;
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [modKey]: updatedMod,
        },
      };
    });
  };

  const handleToggleColumn = (action: "view" | "edit" | "delete") => {
    setRoleModal((prev) => {
      const allSelected = MODULE_DEFINITIONS.every((m) => prev.permissions[m.key]?.[action]);
      const nextVal = !allSelected;

      const newPerms = { ...prev.permissions };
      for (const mod of MODULE_DEFINITIONS) {
        const cur = newPerms[mod.key] || { view: false, edit: false, delete: false };
        const updated = { ...cur, [action]: nextVal };
        if ((action === "edit" || action === "delete") && nextVal) {
          updated.view = true;
        }
        if (action === "view" && !nextVal) {
          updated.edit = false;
          updated.delete = false;
        }
        newPerms[mod.key] = updated;
      }

      return { ...prev, permissions: newPerms };
    });
  };

  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      if (!roleModal.name.trim()) throw new Error(lang === "ru" ? "Введите название роли" : lang === "en" ? "Enter role name" : "Rol nomini kiriting");

      const payload = {
        name: roleModal.name.trim(),
        description: roleModal.description.trim(),
        permissions: roleModal.permissions,
      };

      if (roleModal.editId) {
        return (await api.put(`/roles/${roleModal.editId}/`, payload)).data;
      } else {
        return (await api.post("/roles/", payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setRoleModal((prev) => ({ ...prev, open: false }));
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setRoleModal((prev) => ({ ...prev, error: typeof msg === "object" ? JSON.stringify(msg) : msg }));
    },
  });

  // ==========================================
  // 6. COURIER MODAL STATE & MUTATION
  // ==========================================
  const [courierModal, setCourierModal] = useState<{
    open: boolean;
    editId: number | null;
    name: string;
    phone: string;
    password: string;
    confirmPassword: string;
    error: string;
  }>({
    open: false,
    editId: null,
    name: "",
    phone: "+998 ",
    password: "",
    confirmPassword: "",
    error: "",
  });

  const openAddCourier = () => {
    setCourierModal({
      open: true,
      editId: null,
      name: "",
      phone: "+998 ",
      password: "",
      confirmPassword: "",
      error: "",
    });
  };

  const openEditCourier = (c: CourierItem) => {
    setCourierModal({
      open: true,
      editId: c.id,
      name: c.name,
      phone: formatUzbekPhone(c.phone),
      password: "",
      confirmPassword: "",
      error: "",
    });
  };

  const saveCourierMutation = useMutation({
    mutationFn: async () => {
      if (!courierModal.name.trim()) throw new Error(lang === "ru" ? "Введите имя курьера" : lang === "en" ? "Enter courier name" : "Kuryer ismini kiriting");
      
      const phoneValidation = validateUzbekPhone(courierModal.phone, lang);
      if (!phoneValidation.valid) {
        throw new Error(phoneValidation.error);
      }
      const canonicalPhone = getCanonicalPhone(courierModal.phone);

      if (!courierModal.editId) {
        if (!courierModal.password) throw new Error(lang === "ru" ? "Пароль обязателен" : lang === "en" ? "Password is required" : "Parol kiritilishi shart");
        if (courierModal.password.length < 6) throw new Error(lang === "ru" ? "Пароль должен содержать минимум 6 символов" : lang === "en" ? "Password must be at least 6 characters" : "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        if (courierModal.password !== courierModal.confirmPassword) {
          throw new Error(lang === "ru" ? "Пароли не совпадают" : lang === "en" ? "Passwords do not match" : "Parol va parolni tasdiqlash mos kelmadi");
        }
      } else if (courierModal.password) {
        if (courierModal.password.length < 6) throw new Error(lang === "ru" ? "Пароль должен содержать минимум 6 символов" : lang === "en" ? "Password must be at least 6 characters" : "Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        if (courierModal.password !== courierModal.confirmPassword) {
          throw new Error(lang === "ru" ? "Пароли не совпадают" : lang === "en" ? "Passwords do not match" : "Parol va parolni tasdiqlash mos kelmadi");
        }
      }

      const payload: any = {
        name: courierModal.name.trim(),
        phone: canonicalPhone,
      };
      if (courierModal.password) {
        payload.password = courierModal.password;
      }

      if (courierModal.editId) {
        return (await api.put(`/couriers/${courierModal.editId}/`, payload)).data;
      } else {
        return (await api.post("/couriers/", payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couriers"] });
      setCourierModal((prev) => ({ ...prev, open: false }));
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setCourierModal((prev) => ({ ...prev, error: typeof msg === "object" ? JSON.stringify(msg) : msg }));
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("staff_page_title") || (lang === "ru" ? "Сотрудники и роли" : lang === "en" ? "Staff & Permissions" : "Xodimlar va Huquqlar")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 font-medium">
            {t("staff_page_subtitle") || (lang === "ru" ? "Полное управление сотрудниками, ролями доступа и курьерами" : lang === "en" ? "Full management of staff team, access roles and courier dispatch" : "Xodimlar, kirish rollari va kuryerlar ro'yxatini to'liq boshqarish")}
          </p>
        </div>

        {/* Add / Action Buttons depending on Tab */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === "staff" && (
            <button
              type="button"
              onClick={openAddStaff}
              className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-bold hover:bg-brand-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t("add_staff_btn") || (lang === "ru" ? "Добавить сотрудника" : lang === "en" ? "Add Staff" : "Xodim qo'shish")}</span>
            </button>
          )}
          {activeTab === "roles" && (
            <button
              type="button"
              onClick={openAddRole}
              className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-bold hover:bg-brand-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t("add_role_btn") || (lang === "ru" ? "Добавить роль" : lang === "en" ? "Add Role" : "Rol qo'shish")}</span>
            </button>
          )}
          {activeTab === "couriers" && (
            <>
              {/* Courier Panel Quick Access Button */}
              <a
                href="/dashboard/courier/"
                target="_blank"
                rel="noopener noreferrer"
                title={t("open_courier_panel_desc") || (lang === "ru" ? "Открыть мобильный веб-терминал курьера в новой вкладке" : lang === "en" ? "Open mobile courier web terminal in a new tab" : "Kuryer mobil terminalini yangi oynada ochish")}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 border border-emerald-500/30"
              >
                <Smartphone className="w-4 h-4 text-emerald-200" />
                <span>{t("courier_panel_btn") || (lang === "ru" ? "Панель курьера" : lang === "en" ? "Courier Panel" : "Kuryer paneli")}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={openAddCourier}
                className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-bold hover:bg-brand-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{t("add_courier_btn") || (lang === "ru" ? "Добавить курьера" : lang === "en" ? "Add Courier" : "Kuryer qo'shish")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modern Pill Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-neutral-800 pb-3">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-neutral-800/60 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTabChange("staff")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "staff"
                ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{t("staff_tab_title") || (lang === "ru" ? "Сотрудники" : lang === "en" ? "Staff" : "Xodimlar")}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-neutral-600 font-bold">
              {staffList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("roles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "roles"
                ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t("roles_title") || (lang === "ru" ? "Роли и права" : lang === "en" ? "Roles & Permissions" : "Rollar va huquqlar")}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-neutral-600 font-bold">
              {rolesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("couriers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "couriers"
                ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t("courier_title") || (lang === "ru" ? "Курьеры" : lang === "en" ? "Couriers" : "Kuryerlar")}</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-neutral-600 font-bold">
              {couriersList.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "staff"
                ? (t("search_staff_ph") || (lang === "ru" ? "Поиск сотрудников..." : lang === "en" ? "Search staff..." : "Xodimlarni qidirish..."))
                : activeTab === "roles"
                ? (t("search_roles_ph") || (lang === "ru" ? "Поиск ролей..." : lang === "en" ? "Search roles..." : "Rollarni qidirish..."))
                : (t("search_couriers_ph") || (lang === "ru" ? "Поиск курьеров..." : lang === "en" ? "Search couriers..." : "Kuryerlarni qidirish..."))
            }
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand transition-colors"
          />
        </div>
      </div>

      {/* ==========================================
          TAB 1: XODIMLAR LIST TABLE
         ========================================== */}
      {activeTab === "staff" && (
        <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">{t("staff_col_name") || (lang === "ru" ? "Сотрудник" : lang === "en" ? "Staff Member" : "Xodim")}</th>
                  <th className="p-4">{t("staff_col_phone") || (lang === "ru" ? "Номер телефона" : lang === "en" ? "Phone Number" : "Telefon raqami")}</th>
                  <th className="p-4">{t("staff_col_role") || (lang === "ru" ? "Роль" : lang === "en" ? "Role" : "Rol")}</th>
                  <th className="p-4 text-center">{t("staff_col_orders") || (lang === "ru" ? "Кол-во заказов" : lang === "en" ? "Orders Count" : "Buyurtmalar soni")}</th>
                  <th className="p-4">{t("staff_col_date") || (lang === "ru" ? "Дата" : lang === "en" ? "Date" : "Sana")}</th>
                  <th className="p-4 text-center">{t("staff_col_status") || (lang === "ru" ? "Статус" : lang === "en" ? "Status" : "Holat")}</th>
                  <th className="p-4 text-right">{t("staff_col_action") || (lang === "ru" ? "Действия" : lang === "en" ? "Actions" : "Amal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs font-medium text-slate-700 dark:text-neutral-300">
                {filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-700 flex items-center justify-center font-bold text-slate-600 dark:text-neutral-300 shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-500 dark:text-neutral-400">{s.phone}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200/80 dark:border-neutral-700">
                        {formatRoleName(s.role_name || s.role || "", lang)}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900 dark:text-white">
                      {s.orders_count || 0}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-neutral-400">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU") : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.is_active}
                          onChange={() => toggleStaffMutation.mutate(s.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditStaff(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          title={t("edit") || (lang === "ru" ? "Редактировать" : lang === "en" ? "Edit" : "Tahrirlash")}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteModal({
                              open: true,
                              type: "staff",
                              id: s.id,
                              title: `'${s.name}'`,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title={t("delete") || (lang === "ru" ? "Удалить" : lang === "en" ? "Delete" : "O'chirish")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && !isStaffLoading && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 dark:text-neutral-500 text-xs">
                      {t("staff_not_found") || (lang === "ru" ? "Сотрудники не найдены." : lang === "en" ? "No staff found." : "Xodimlar topilmadi.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: ROLLAR LIST TABLE
         ========================================== */}
      {activeTab === "roles" && (
        <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">{t("roles_col_name") || (lang === "ru" ? "Название роли" : lang === "en" ? "Role Name" : "Rol nomi")}</th>
                  <th className="p-4 text-center">{t("roles_col_staff_count") || (lang === "ru" ? "Кол-во сотрудников" : lang === "en" ? "Staff Count" : "Xodimlar soni")}</th>
                  <th className="p-4">{t("roles_col_created") || (lang === "ru" ? "Дата создания" : lang === "en" ? "Created Date" : "Yaratilgan sana")}</th>
                  <th className="p-4">{t("roles_col_updated") || (lang === "ru" ? "Дата обновления" : lang === "en" ? "Updated Date" : "Yangilangan sana")}</th>
                  <th className="p-4 text-center">{t("roles_col_status") || (lang === "ru" ? "Статус" : lang === "en" ? "Status" : "Holat")}</th>
                  <th className="p-4 text-right">{t("roles_col_action") || (lang === "ru" ? "Действия" : lang === "en" ? "Actions" : "Amal")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs font-medium text-slate-700 dark:text-neutral-300">
                {filteredRoles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/60 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-900 dark:text-white">{formatRoleName(r.name, lang)}</div>
                        {r.is_system && (
                          <span className="px-2 py-0.5 text-[9px] font-semibold rounded-md bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700">
                            {t("system_role_badge") || (lang === "ru" ? "Системная роль" : lang === "en" ? "System Role" : "Tizim roli")}
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <div className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">{formatRoleDescription(r.description, lang)}</div>
                      )}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-900 dark:text-white">
                      {r.staff_count || 0}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-neutral-400">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU") : "—"}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-neutral-400">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString(lang === "en" ? "en-US" : "ru-RU") : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.is_active}
                          disabled={r.is_system}
                          onChange={() => toggleRoleMutation.mutate(r.id)}
                          className="sr-only peer disabled:cursor-not-allowed"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditRole(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                          title={t("edit_role_and_perms") || (lang === "ru" ? "Редактировать и права" : lang === "en" ? "Edit & Permissions" : "Tahrirlash va huquqlar")}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!r.is_system && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                type: "role",
                                id: r.id,
                                title: `'${r.name}'`,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            title={t("delete") || (lang === "ru" ? "Удалить" : lang === "en" ? "Delete" : "O'chirish")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRoles.length === 0 && !isRolesLoading && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-neutral-500 text-xs">
                      {t("roles_not_found") || (lang === "ru" ? "Роли не найдены." : lang === "en" ? "No roles found." : "Rollar topilmadi.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 3: KURYER LIST TABLE
         ========================================== */}
      {activeTab === "couriers" && (
        <div className="bg-white dark:bg-neutral-850 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">{t("courier_col_courier") || (lang === "ru" ? "КУРЬЕР" : lang === "en" ? "COURIER" : "KURYER")}</th>
                  <th className="p-4">{t("courier_col_phone") || (lang === "ru" ? "НОМЕР ТЕЛЕФОНА" : lang === "en" ? "PHONE NUMBER" : "TELEFON RAQAMI")}</th>
                  <th className="p-4 text-center">{t("courier_col_live_order") || (lang === "ru" ? "ЖИВОЙ СТАТУС & ЗАКАЗ" : lang === "en" ? "LIVE STATUS & ORDER" : "JONLI HOLAT & BUYURTMA")}</th>
                  <th className="p-4 text-center">{t("courier_col_delivered") || (lang === "ru" ? "ДОСТАВЛЕНО" : lang === "en" ? "DELIVERED" : "YETKAZILGAN")}</th>
                  <th className="p-4 text-center">{t("courier_col_status") || (lang === "ru" ? "СТАТУС" : lang === "en" ? "STATUS" : "HOLAT")}</th>
                  <th className="p-4 text-right">{t("courier_col_action") || (lang === "ru" ? "ДЕЙСТВИЯ" : lang === "en" ? "ACTIONS" : "AMAL")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs font-medium text-slate-700 dark:text-neutral-300">
                {filteredCouriers.map((c) => {
                  const isOnline = c.last_seen_seconds_ago !== null && c.last_seen_seconds_ago !== undefined && c.last_seen_seconds_ago < 180;
                  const hasOrder = !!c.active_order;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/60 transition-colors">
                      <td className="p-4">
                        <div
                          onClick={() => setProfileCourierId(c.id)}
                          className="flex items-center gap-3 cursor-pointer group select-none"
                          title={t("courier_profile_title") || (lang === "ru" ? "Профиль курьера и статистика" : lang === "en" ? "Courier profile and statistics" : "Kuryer profili va statistikasini ochish")}
                        >
                          <div className="relative">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                              <Truck className="w-4.5 h-4.5" />
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-900 ${
                                isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-neutral-600"
                              }`}
                              title={isOnline ? (t("online_status") || "Online") : (t("offline_status") || "Offline")}
                            />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span className="group-hover:text-slate-900 dark:group-hover:text-white transition-colors text-sm">
                                {c.name}
                              </span>
                              {hasOrder && (
                                <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                  {t("courier_badge_delivering") || (lang === "ru" ? "В пути" : lang === "en" ? "Delivering" : "Yetkazmoqda")}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>
                                {isOnline
                                  ? (lang === "ru" ? `Онлайн • сигнал: ${c.last_seen_seconds_ago}с назад` : lang === "en" ? `Online • signal: ${c.last_seen_seconds_ago}s ago` : `Online • signal: ${c.last_seen_seconds_ago}s oldin`)
                                  : c.last_seen_seconds_ago
                                  ? (lang === "ru" ? `Последний сигнал: ${Math.round(c.last_seen_seconds_ago / 60)} мин. назад` : lang === "en" ? `Last signal: ${Math.round(c.last_seen_seconds_ago / 60)} min ago` : `Oxirgi signal: ${Math.round(c.last_seen_seconds_ago / 60)} daq. oldin`)
                                  : (t("gps_waiting") || (lang === "ru" ? "Ожидание GPS сигнала" : lang === "en" ? "Awaiting GPS signal" : "GPS signali kutilmoqda"))}
                              </span>
                              <span className="text-slate-500 dark:text-neutral-400 font-medium group-hover:inline-block hidden">
                                • {t("courier_view_profile") || (lang === "ru" ? "Смотреть профиль →" : lang === "en" ? "View profile →" : "Profilni ko'rish →")}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-500 dark:text-neutral-400">{c.phone}</td>
                      <td className="p-4 text-center">
                        {hasOrder ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                              #{c.active_order?.order_number}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium max-w-[140px] truncate">
                              {c.active_order?.delivery_address || c.active_order?.customer_name}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
                            {t("courier_badge_idle") || (lang === "ru" ? "Свободен (Ожидает)" : lang === "en" ? "Idle (Waiting)" : "Bo'sh (Kutmoqda)")}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-900 dark:text-white">
                        {c.orders_count || 0}
                      </td>
                      <td className="p-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={c.is_active}
                            onChange={() => toggleCourierMutation.mutate(c.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Dedicated Courier Terminal Button */}
                          <a
                            href={`/dashboard/courier/?courier_id=${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200/80 dark:border-emerald-800/60"
                            title={t("open_courier_terminal_tooltip") || (lang === "ru" ? "Открыть мобильный терминал этого курьера в новой вкладке" : lang === "en" ? "Open this courier's mobile terminal in a new tab" : "Ushbu kuryer mobil terminalini yangi oynada ochish")}
                          >
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{t("courier_terminal_btn") || (lang === "ru" ? "Терминал" : lang === "en" ? "Terminal" : "Terminal")}</span>
                          </a>

                          {/* Profile & Statistics Button */}
                          <button
                            type="button"
                            onClick={() => setProfileCourierId(c.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-neutral-700"
                            title={t("courier_profile_title") || (lang === "ru" ? "Профиль курьера и статистика" : lang === "en" ? "Courier profile and statistics" : "Kuryer profili va statistikasi")}
                          >
                            <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-neutral-400" />
                            <span>{t("courier_stats_btn") || (lang === "ru" ? "Статистика" : lang === "en" ? "Statistics" : "Statistika")}</span>
                          </button>
                          {/* Real-time Tracking Button */}
                          <button
                            type="button"
                            onClick={() => setMonitorCourier(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            title={t("live_map_modal_title") || (lang === "ru" ? "Живое движение курьера и карта" : lang === "en" ? "Live courier movement and map" : "Kuryer jonli harakati va xaritasi")}
                          >
                            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                            <span>{t("courier_live_map_btn") || (lang === "ru" ? "Живая карта" : lang === "en" ? "Live Map" : "Jonli xarita")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCourier(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                            title={t("edit") || (lang === "ru" ? "Редактировать" : lang === "en" ? "Edit" : "Tahrirlash")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteModal({
                                open: true,
                                type: "courier",
                                id: c.id,
                                title: `'${c.name}'`,
                              })
                            }
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                            title={t("delete") || (lang === "ru" ? "Удалить" : lang === "en" ? "Delete" : "O'chirish")}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCouriers.length === 0 && !isCouriersLoading && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-400 dark:text-neutral-500 text-xs">
                      {t("couriers_not_found") || (lang === "ru" ? "Курьеры не найдены." : lang === "en" ? "No couriers found." : "Kuryerlar topilmadi.")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT STAFF
         ========================================== */}
      {staffModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-slate-100 dark:border-neutral-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {staffModal.editId
                  ? (t("staff_modal_edit_title") || (lang === "ru" ? "Редактировать сотрудника" : lang === "en" ? "Edit Staff Member" : "Xodimni tahrirlash"))
                  : (t("staff_modal_add_title") || (lang === "ru" ? "Добавить нового сотрудника" : lang === "en" ? "Add New Staff Member" : "Yangi xodim qo'shish"))}
              </h3>
              <button
                type="button"
                onClick={() => setStaffModal((prev) => ({ ...prev, open: false }))}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {staffModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{staffModal.error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("staff_name_input_label") || (lang === "ru" ? "Имя сотрудника *" : lang === "en" ? "Staff Name *" : "Xodim ismi *")}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={staffModal.name}
                    onChange={(e) => setStaffModal((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t("staff_name_ph") || (lang === "ru" ? "Например: Сардор Алиев" : lang === "en" ? "E.g.: Sardor Aliyev" : "Masalan: Sardor Aliyev")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("staff_phone_label") || (lang === "ru" ? "Номер телефона *" : lang === "en" ? "Phone Number *" : "Telefon raqami *")}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={staffModal.phone}
                    onChange={(e) => {
                      const formatted = formatUzbekPhone(e.target.value);
                      setStaffModal((prev) => ({ ...prev, phone: formatted, error: "" }));
                    }}
                    placeholder="+998 (90) 123-45-67"
                    maxLength={19}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">
                  {t("staff_phone_format_hint") || (lang === "ru" ? "Формат: +998 (XX) XXX-XX-XX (9 цифр)" : lang === "en" ? "Format: +998 (XX) XXX-XX-XX (9 digits)" : "Format: +998 (XX) XXX-XX-XX (faqat 9 ta raqam)")}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("staff_role_select_label") || (lang === "ru" ? "Должность / Роль *" : lang === "en" ? "Position / Role *" : "Lavozim / Rol *")}
                </label>
                <select
                  value={staffModal.roleId || ""}
                  onChange={(e) =>
                    setStaffModal((prev) => ({ ...prev, roleId: e.target.value ? Number(e.target.value) : null }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {formatRoleName(r.name, lang)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {staffModal.editId
                    ? (t("staff_password_new_label") || (lang === "ru" ? "Новый пароль (не обязательно)" : lang === "en" ? "New password (optional)" : "Yangi parol (o'zgartirish shart emas)"))
                    : (t("staff_password_label") || (lang === "ru" ? "Пароль *" : lang === "en" ? "Password *" : "Parol *"))}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={staffModal.password}
                    onChange={(e) => setStaffModal((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={t("staff_password_min_ph") || (lang === "ru" ? "Минимум 6 символов" : lang === "en" ? "At least 6 characters" : "Kamida 6 ta belgi")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("staff_password_confirm_label") || (lang === "ru" ? "Подтверждение пароля" : lang === "en" ? "Confirm Password" : "Parolni tasdiqlash")} {staffModal.editId ? (lang === "ru" ? "(если меняется)" : lang === "en" ? "(if updating)" : "(agar yangilansa)") : "*"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={staffModal.confirmPassword}
                    onChange={(e) => setStaffModal((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t("staff_password_confirm_ph") || (lang === "ru" ? "Повторите пароль" : lang === "en" ? "Re-enter password" : "Parolni qayta kiriting")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setStaffModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {t("cancel_btn") || (lang === "ru" ? "Отмена" : lang === "en" ? "Cancel" : "Bekor qilish")}
              </button>
              <button
                type="button"
                onClick={() => saveStaffMutation.mutate()}
                disabled={saveStaffMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saveStaffMutation.isPending
                  ? (t("saving_btn") || (lang === "ru" ? "Сохранение..." : "Saqlanmoqda..."))
                  : (t("save_btn") || (lang === "ru" ? "Сохранить" : "Saqlash"))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT ROLE WITH MATRIX
         ========================================== */}
      {roleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col border border-slate-100 dark:border-neutral-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {roleModal.editId
                    ? (t("role_modal_edit_title") || (lang === "ru" ? "Редактирование роли и прав" : lang === "en" ? "Edit Role & Permissions" : "Rolni tahrirlash va huquqlarni sozlash"))
                    : (t("role_modal_add_title") || (lang === "ru" ? "Новая роль и матрица прав" : lang === "en" ? "New Role & Permissions Matrix" : "Yangi rol va huquqlar matritsasi"))}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                  {t("role_modal_desc") || (lang === "ru" ? "Укажите права на просмотр, редактирование и удаление для каждого раздела" : lang === "en" ? "Set view, edit, and delete permissions for each module" : "Har bir bo'lim bo'yicha ko'rish, tahrirlash va o'chirish huquqlarini belgilang")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModal((prev) => ({ ...prev, open: false }))}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {roleModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{roleModal.error}</span>
              </div>
            )}

            {/* Inputs: Name & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("role_name_label") || (lang === "ru" ? "Название роли *" : lang === "en" ? "Role name *" : "Rol nomi *")}
                </label>
                <input
                  type="text"
                  value={roleModal.name}
                  onChange={(e) => setRoleModal((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder={t("role_name_ph") || (lang === "ru" ? "Например: Контент-менеджер, Оператор" : lang === "en" ? "E.g.: Content Manager, Operator" : "Masalan: Kontent menejer, Operator")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("role_desc_label") || (lang === "ru" ? "Описание (необязательно)" : lang === "en" ? "Description (optional)" : "Tavsif (ixtiyoriy)")}
                </label>
                <input
                  type="text"
                  value={roleModal.description}
                  onChange={(e) => setRoleModal((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder={t("role_desc_ph") || (lang === "ru" ? "Краткая информация об обязанностях" : lang === "en" ? "Brief information about duties" : "Vazifasi haqida qisqacha ma'lumot")}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Permissions Matrix Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-neutral-800 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-neutral-800 z-10">
                  <tr className="border-b border-slate-200 dark:border-neutral-700 text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="p-3">{t("matrix_col_module") || (lang === "ru" ? "Название раздела" : lang === "en" ? "Module Name" : "Bo'lim nomi")}</th>
                    <th className="p-3 text-center w-28">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn("view")}
                        className="inline-flex items-center gap-1 hover:text-brand cursor-pointer"
                        title={t("matrix_toggle_all") || (lang === "ru" ? "Выбрать / снять все" : lang === "en" ? "Select all / Deselect" : "Barchasini tanlash / bekor qilish")}
                      >
                        <span>{t("matrix_col_view") || (lang === "ru" ? "Просмотр" : lang === "en" ? "View" : "Ko'rish")}</span>
                      </button>
                    </th>
                    <th className="p-3 text-center w-28">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn("edit")}
                        className="inline-flex items-center gap-1 hover:text-brand cursor-pointer"
                        title={t("matrix_toggle_all") || (lang === "ru" ? "Выбрать / снять все" : lang === "en" ? "Select all / Deselect" : "Barchasini tanlash / bekor qilish")}
                      >
                        <span>{t("matrix_col_edit") || (lang === "ru" ? "Редактирование" : lang === "en" ? "Edit" : "Tahrirlash")}</span>
                      </button>
                    </th>
                    <th className="p-3 text-center w-28">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn("delete")}
                        className="inline-flex items-center gap-1 hover:text-brand cursor-pointer"
                        title={t("matrix_toggle_all") || (lang === "ru" ? "Выбрать / снять все" : lang === "en" ? "Select all / Deselect" : "Barchasini tanlash / bekor qilish")}
                      >
                        <span>{t("matrix_col_delete") || (lang === "ru" ? "Удаление" : lang === "en" ? "Delete" : "O'chirish")}</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-xs font-medium text-slate-700 dark:text-neutral-300">
                  {MODULE_DEFINITIONS.map((m) => {
                    const perm = roleModal.permissions[m.key] || { view: false, edit: false, delete: false };
                    return (
                      <tr key={m.key} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{getModuleLabel(m, lang)}</td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.view}
                            onChange={() => handleTogglePerm(m.key, "view")}
                            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.edit}
                            onChange={() => handleTogglePerm(m.key, "edit")}
                            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.delete}
                            onChange={() => handleTogglePerm(m.key, "delete")}
                            className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setRoleModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {t("cancel_btn") || (lang === "ru" ? "Отмена" : lang === "en" ? "Cancel" : "Bekor qilish")}
              </button>
              <button
                type="button"
                onClick={() => saveRoleMutation.mutate()}
                disabled={saveRoleMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saveRoleMutation.isPending
                  ? (t("saving_btn") || (lang === "ru" ? "Сохранение..." : "Saqlanmoqda..."))
                  : (t("save_btn") || (lang === "ru" ? "Сохранить" : "Saqlash"))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADD / EDIT COURIER
         ========================================== */}
      {courierModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 border border-slate-100 dark:border-neutral-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-neutral-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {courierModal.editId
                  ? (t("courier_modal_edit_title") || (lang === "ru" ? "Редактировать курьера" : "Kuryerni tahrirlash"))
                  : (t("courier_modal_add_title") || (lang === "ru" ? "Добавить нового курьера" : "Yangi kuryer qo'shish"))}
              </h3>
              <button
                type="button"
                onClick={() => setCourierModal((prev) => ({ ...prev, open: false }))}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {courierModal.error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{courierModal.error}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("courier_name_input_label") || (lang === "ru" ? "Имя курьера *" : "Kuryer ismi *")}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={courierModal.name}
                    onChange={(e) => setCourierModal((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t("courier_name_ph") || (lang === "ru" ? "Например: Джамшид Расулов" : "Masalan: Jamshid Rasulov")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("staff_col_phone") || (lang === "ru" ? "Номер телефона *" : "Telefon raqami *")}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={courierModal.phone}
                    onChange={(e) => {
                      const formatted = formatUzbekPhone(e.target.value);
                      setCourierModal((prev) => ({ ...prev, phone: formatted, error: "" }));
                    }}
                    placeholder="+998 (90) 123-45-67"
                    maxLength={19}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1 block">
                  {t("staff_phone_format_hint") || (lang === "ru" ? "Формат: +998 (XX) XXX-XX-XX (только 9 цифр)" : "Format: +998 (XX) XXX-XX-XX (faqat 9 ta raqam)")}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {courierModal.editId
                    ? (t("staff_password_new_label") || (lang === "ru" ? "Новый пароль (не обязательно)" : "Yangi parol (o'zgartirish shart emas)"))
                    : (t("staff_password_label") || (lang === "ru" ? "Пароль *" : "Parol *"))}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={courierModal.password}
                    onChange={(e) => setCourierModal((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder={t("staff_password_min_ph") || (lang === "ru" ? "Минимум 6 символов" : "Kamida 6 ta belgi")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1">
                  {t("staff_password_confirm_label") || (lang === "ru" ? "Подтверждение пароля" : "Parolni tasdiqlash")} {courierModal.editId ? (lang === "ru" ? "(если обновляется)" : "(agar yangilansa)") : "*"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={courierModal.confirmPassword}
                    onChange={(e) => setCourierModal((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={t("staff_password_confirm_ph") || (lang === "ru" ? "Повторите пароль" : "Parolni qayta kiriting")}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setCourierModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {t("cancel_btn") || (lang === "ru" ? "Отмена" : "Bekor qilish")}
              </button>
              <button
                type="button"
                onClick={() => saveCourierMutation.mutate()}
                disabled={saveCourierMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 cursor-pointer"
              >
                {saveCourierMutation.isPending
                  ? (t("saving_btn") || (lang === "ru" ? "Сохранение..." : "Saqlanmoqda..."))
                  : (t("save_btn") || (lang === "ru" ? "Сохранить" : "Saqlash"))}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: DELETE CONFIRMATION
         ========================================== */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center border border-slate-100 dark:border-neutral-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {t("confirm_delete_title") || (lang === "ru" ? "Подтверждение удаления" : "O'chirishni tasdiqlang")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {lang === "ru" ? (
                  <>
                    Вы действительно хотите удалить <strong className="text-slate-900 dark:text-white">{deleteModal.title}</strong>? Это действие невозможно отменить.
                  </>
                ) : lang === "en" ? (
                  <>
                    Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{deleteModal.title}</strong>? This action cannot be undone.
                  </>
                ) : (
                  <>
                    Haqiqatan ham <strong className="text-slate-900 dark:text-white">{deleteModal.title}</strong>ni o'chirmoqchimisiz? Ushbu amalni ortga qaytarib bo'lmaydi.
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                {t("cancel_btn") || (lang === "ru" ? "Отмена" : "Bekor qilish")}
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending
                  ? (t("deleting") || (lang === "ru" ? "Удаление..." : "O'chirilmoqda..."))
                  : (t("yes_delete") || (lang === "ru" ? "Да, удалить" : "Ha, o'chirish"))}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ==========================================
          MODAL: LIVE COURIER TRACKING (REAL-TIME GPS & ORDER STATUS)
         ========================================== */}
      {monitorCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 dark:border-neutral-800 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-semibold tracking-tight">{monitorCourier.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        monitorCourier.last_seen_seconds_ago !== null &&
                        monitorCourier.last_seen_seconds_ago !== undefined &&
                        monitorCourier.last_seen_seconds_ago < 180
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {monitorCourier.last_seen_seconds_ago !== null &&
                      monitorCourier.last_seen_seconds_ago !== undefined &&
                      monitorCourier.last_seen_seconds_ago < 180
                        ? (t("online_moving") || (lang === "ru" ? "Онлайн • В движении" : "Online • Harakatda"))
                        : (t("offline_status") || (lang === "ru" ? "Офлайн" : "Offline"))}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {monitorCourier.phone} •{" "}
                    {monitorCourier.last_seen_seconds_ago !== null && monitorCourier.last_seen_seconds_ago !== undefined
                      ? `${t("last_signal") || (lang === "ru" ? "Сигнал:" : "Signal:")} ${monitorCourier.last_seen_seconds_ago} ${t("seconds_ago") || (lang === "ru" ? "сек. назад" : "soniya oldin")}`
                      : (t("gps_waiting") || (lang === "ru" ? "Ожидание GPS сигнала" : "GPS signali kutilmoqda"))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/dashboard/courier/?courier_id=${monitorCourier.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                  title={t("open_courier_terminal_tooltip") || (lang === "ru" ? "Открыть мобильный веб-терминал курьера" : "Kuryer mobil terminalini ochish")}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t("courier_terminal_btn") || (lang === "ru" ? "Терминал" : "Terminal")}</span>
                </a>
                <button
                  type="button"
                  onClick={() => refetchCouriers()}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title={lang === "ru" ? "Обновить" : "Yangilash"}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonitorCourier(null)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Order / Current Status Banner */}
            {monitorCourier.active_order ? (
              <div className="p-4 bg-slate-50 dark:bg-neutral-800/40 border-b border-slate-200/80 dark:neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                      #{monitorCourier.active_order.order_number}
                    </span>
                    <span className="px-2 py-0.5 rounded-md font-medium text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                      {monitorCourier.active_order.status_display}
                    </span>
                    {routeInfo && (
                      <span className="px-2 py-0.5 rounded-md font-medium text-[10px] bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        <span>{routeInfo.duration} ({routeInfo.distance})</span>
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-neutral-300 font-semibold truncate flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{monitorCourier.active_order.delivery_address || (lang === "ru" ? "Адрес не указан" : "Manzil ko'rsatilmagan")}</span>
                  </p>
                  <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                    {lang === "ru" ? "Клиент:" : "Mijoz:"} <strong className="text-slate-800 dark:text-white">{monitorCourier.active_order.customer_name}</strong> ({monitorCourier.active_order.customer_phone})
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {t("order_amount_label") || (lang === "ru" ? "Сумма заказа" : "Buyurtma summasi")}
                  </span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base">
                    {monitorCourier.active_order.total_amount?.toLocaleString()} UZS
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-100 dark:border-neutral-800 text-center text-xs font-semibold text-slate-500 dark:text-neutral-400">
                {t("no_active_order_courier") || (lang === "ru" ? "Сейчас заказов нет — Курьер готов принять новый заказ" : "Kuryer hozirda yangi buyurtma olmagan (bo'sh holatda).")}
              </div>
            )}

            {/* Interactive Real-Time Map (Google Roadmap Tile Style) */}
            <div className="flex-1 w-full min-h-[480px] relative bg-slate-100 dark:bg-neutral-800">
              <MapContainer
                center={[
                  monitorCourier.current_lat || 41.2995,
                  monitorCourier.current_lng || 69.2401,
                ]}
                zoom={14}
                className="w-full h-full"
                style={{ height: "480px", width: "100%" }}
              >
                <MapAutoResize />
                <RouteBoundsFitter coords={routeCoords} />
                <TileLayer
                  attribution='&copy; Google Maps'
                  url="https://mt{s}.google.com/vt/lyrs=m&hl=ru&x={x}&y={y}&z={z}"
                  subdomains={["0", "1", "2", "3"]}
                  maxZoom={20}
                />

                {/* Courier Position & Destination Markers with Fallbacks */}
                {(() => {
                  const cLat = monitorCourier.current_lat || (monitorCourier.active_order?.delivery_lat ? monitorCourier.active_order.delivery_lat - 0.012 : 41.311087);
                  const cLng = monitorCourier.current_lng || (monitorCourier.active_order?.delivery_lng ? monitorCourier.active_order.delivery_lng - 0.012 : 69.240562);
                  const dLat = monitorCourier.active_order?.delivery_lat || (cLat + 0.012);
                  const dLng = monitorCourier.active_order?.delivery_lng || (cLng + 0.012);
                  const hasOrder = !!monitorCourier.active_order;

                  return (
                    <>
                      <Marker position={[cLat, cLng]} icon={courierCarIcon}>
                        <Popup>
                          <div className="text-xs space-y-1">
                            <strong className="block text-blue-600">{monitorCourier.name} ({lang === "ru" ? "Курьер" : "Kuryer"})</strong>
                            <span>{monitorCourier.last_seen_seconds_ago !== null && monitorCourier.last_seen_seconds_ago !== undefined ? `${t("last_signal") || (lang === "ru" ? "Сигнал:" : "Signal:")} ${monitorCourier.last_seen_seconds_ago} ${t("seconds_ago") || (lang === "ru" ? "сек. назад" : "s oldin")}` : (lang === "ru" ? "GPS активен" : "GPS signali faol")}</span>
                          </div>
                        </Popup>
                      </Marker>

                      {hasOrder && (
                        <Marker position={[dLat, dLng]} icon={destinationPinIcon}>
                          <Popup>
                            <div className="text-xs space-y-1">
                              <strong className="block text-rose-600">
                                #{monitorCourier.active_order?.order_number} {lang === "ru" ? "Адрес доставки" : "Manzili"}
                              </strong>
                              <p>{monitorCourier.active_order?.delivery_address}</p>
                              <p className="font-bold">{monitorCourier.active_order?.customer_name}</p>
                            </div>
                          </Popup>
                        </Marker>
                      )}

                      {/* Real Road Route Polyline (Traffic-Colored: Green -> Amber -> Red) */}
                      {hasOrder && routeCoords.length > 0 && (() => {
                        const total = routeCoords.length;
                        const s1 = routeCoords.slice(0, Math.ceil(total * 0.55));
                        const s2 = routeCoords.slice(Math.max(0, Math.floor(total * 0.50)), Math.ceil(total * 0.85));
                        const s3 = routeCoords.slice(Math.max(0, Math.floor(total * 0.80)));
                        return (
                          <>
                            <Polyline
                              positions={routeCoords}
                              pathOptions={{
                                color: "#0f172a",
                                weight: 8,
                                opacity: 0.85,
                                lineCap: "round",
                                lineJoin: "round",
                              }}
                            />
                            <Polyline
                              positions={s1}
                              pathOptions={{
                                color: "#22c55e",
                                weight: 5,
                                opacity: 1,
                                lineCap: "round",
                                lineJoin: "round",
                              }}
                            />
                            <Polyline
                              positions={s2}
                              pathOptions={{
                                color: "#f59e0b",
                                weight: 5,
                                opacity: 1,
                                lineCap: "round",
                                lineJoin: "round",
                              }}
                            />
                            <Polyline
                              positions={s3}
                              pathOptions={{
                                color: "#ef4444",
                                weight: 5,
                                opacity: 1,
                                lineCap: "round",
                                lineJoin: "round",
                              }}
                            />
                          </>
                        );
                      })()}
                    </>
                  );
                })()}
              </MapContainer>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>{t("live_tracking_updating") || (lang === "ru" ? "Живое отслеживание • Обновление каждые 6 сек" : "Jonli kuzatuv • Har 6 soniyada yangilanadi")}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonitorCourier(null)}
                  className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  {t("close_btn") || (lang === "ru" ? "Закрыть" : "Yopish")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: COURIER PROFILE & COMPLETE ANALYTICS
         ========================================== */}
      {profileCourierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  {courierAnalyticsData?.courier.name ? courierAnalyticsData.courier.name.slice(0, 1).toUpperCase() : "K"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold tracking-tight truncate">
                      {courierAnalyticsData?.courier.name || (lang === "ru" ? "Профиль курьера" : "Kuryer profili")}
                    </h3>
                    {courierAnalyticsData?.courier && (
                      <>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            courierAnalyticsData.courier.is_online
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {courierAnalyticsData.courier.is_online
                            ? (t("online_status") || (lang === "ru" ? "Онлайн" : "Online"))
                            : (t("offline_status") || (lang === "ru" ? "Офлайн" : "Offline"))}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-slate-200 border border-white/10">
                          {courierAnalyticsData.courier.is_active
                            ? (t("courier_active_badge") || (lang === "ru" ? "Активный курьер" : "Faol kuryer"))
                            : (t("courier_inactive_badge") || (lang === "ru" ? "Неактивен" : "Nofaol"))}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap font-mono">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {courierAnalyticsData?.courier.phone}
                    </span>
                    {courierAnalyticsData?.courier.created_at && (
                      <span className="text-slate-400 text-[11px] font-sans flex items-center gap-1">
                        <span>•</span>
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {courierAnalyticsData.courier.created_at}{" "}
                          {lang === "ru"
                            ? `(на службе ${courierAnalyticsData.courier.working_days} дн.)`
                            : lang === "en"
                            ? `(${courierAnalyticsData.courier.working_days} days in service)`
                            : `dan beri (${courierAnalyticsData.courier.working_days} kun xizmatda)`}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {courierAnalyticsData?.courier && (
                  <a
                    href={`/dashboard/courier/?courier_id=${courierAnalyticsData.courier.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
                    title={t("open_courier_terminal_tooltip") || (lang === "ru" ? "Открыть мобильный веб-терминал курьера" : "Kuryer mobil terminalini ochish")}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{t("courier_terminal_btn") || (lang === "ru" ? "Терминал" : "Terminal")}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => refetchAnalytics()}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={lang === "ru" ? "Обновить" : "Yangilash"}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setProfileCourierId(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {isAnalyticsLoading && !courierAnalyticsData ? (
                <div className="py-16 text-center text-sm font-bold text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>{lang === "ru" ? "Загрузка статистики курьера..." : lang === "en" ? "Loading courier analytics..." : "Kuryer statistikasi yuklanmoqda..."}</span>
                </div>
              ) : courierAnalyticsData ? (
                <>
                  {/* 6 Metric KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-slate-400 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("courier_kpi_total_orders") || (lang === "ru" ? "Всего заказов" : "Jami buyurtmalar")}
                        </span>
                        <Package className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {courierAnalyticsData.stats.total_orders}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {t("courier_kpi_assigned") || (lang === "ru" ? "назначено" : "biriktirilgan")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("courier_kpi_delivered") || (lang === "ru" ? "Доставлено" : "Yetkazilgan")}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-slate-600 dark:text-neutral-300" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {courierAnalyticsData.stats.completed_orders}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5">
                        {courierAnalyticsData.stats.success_rate}% {t("courier_kpi_success_rate") || (lang === "ru" ? "успешно" : "muvaffaqiyat")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("courier_kpi_today") || (lang === "ru" ? "Сегодня" : "Bugun")}
                        </span>
                        <Clock className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        {courierAnalyticsData.stats.today_orders}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {t("courier_kpi_successful") || (lang === "ru" ? "успешно" : "muvaffaqiyatli")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("courier_kpi_avg_time") || (lang === "ru" ? "Среднее время" : "O'rtacha vaqt")}
                        </span>
                        <Activity className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        ~{courierAnalyticsData.stats.avg_delivery_minutes} {lang === "ru" ? "мин" : "m"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {t("courier_kpi_per_order") || (lang === "ru" ? "на заказ" : "har buyurtmaga")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("courier_kpi_distance") || (lang === "ru" ? "Пройденное расст." : "Bosib o'tildi")}
                        </span>
                        <Route className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                        ~{courierAnalyticsData.stats.total_distance_km} {lang === "ru" ? "км" : "km"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {t("courier_kpi_total_distance") || (lang === "ru" ? "общее расстояние" : "umumiy masofa")}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 rounded-2xl border border-slate-200/80 dark:border-neutral-800">
                      <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("courier_kpi_revenue") || (lang === "ru" ? "Выручка" : "Tushum")}
                        </span>
                        <DollarSign className="w-4 h-4 text-slate-500 dark:text-neutral-400" />
                      </div>
                      <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
                        {courierAnalyticsData.stats.total_revenue.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                        {t("courier_kpi_delivered_money") || (lang === "ru" ? "UZS сдано" : "UZS topshirildi")}
                      </p>
                    </div>
                  </div>

                  {/* Current Active Delivery Highlight Card */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-neutral-400 mb-2">
                      {t("current_delivery_status") || (lang === "ru" ? "Текущий статус доставки" : "Hozirgi yetkazish holati")}
                    </h4>
                    {courierAnalyticsData.active_order ? (
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-700 shadow-xs relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-base">
                                #{courierAnalyticsData.active_order.order_number}
                              </span>
                              <span className="px-2 py-0.5 rounded-md font-medium text-[10px] bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                                {courierAnalyticsData.active_order.status_display}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                              <span>{courierAnalyticsData.active_order.delivery_address || (lang === "ru" ? "Адрес не указан" : "Manzil ko'rsatilmagan")}</span>
                            </p>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">
                              {lang === "ru" ? "Клиент:" : "Mijoz:"} <strong className="text-slate-800 dark:text-white">{courierAnalyticsData.active_order.customer_name}</strong>{" "}
                              {courierAnalyticsData.active_order.customer_phone && (
                                <a
                                  href={`tel:${courierAnalyticsData.active_order.customer_phone}`}
                                  className="text-slate-600 dark:text-neutral-300 hover:underline font-mono ml-1 font-semibold"
                                >
                                  ({courierAnalyticsData.active_order.customer_phone})
                                </a>
                              )}
                            </p>
                          </div>

                          <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0">
                            <div>
                              <span className="text-[10px] font-medium text-slate-400 block uppercase">
                                {t("order_amount_label") || (lang === "ru" ? "Сумма заказа" : "Buyurtma summasi")}
                              </span>
                              <span className="font-mono font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                                {courierAnalyticsData.active_order.total_amount.toLocaleString()} UZS
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const found = couriersList.find((c) => c.id === courierAnalyticsData.courier.id);
                                if (found) {
                                  setProfileCourierId(null);
                                  setMonitorCourier(found);
                                }
                              }}
                              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                            >
                              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                              <span>{t("live_track_on_map") || (lang === "ru" ? "Живое отслеживание на карте" : "Xaritada jonli kuzatish")}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-800 text-center text-xs font-semibold text-slate-500 dark:text-neutral-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>{t("no_active_order_courier") || (lang === "ru" ? "Сейчас заказов нет — Курьер готов принять новый заказ" : "Hozirda buyurtma yo'q — Kuryer yangi buyurtma qabul qilishga tayyor")}</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery History Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-neutral-400">
                        {t("orders_history_title") || (lang === "ru" ? "История заказов" : "Buyurtmalar tarixi")} ({courierAnalyticsData.orders_history.length})
                      </h4>
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-neutral-800 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setHistoryTab("ALL")}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            historyTab === "ALL"
                              ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs"
                              : "text-slate-500 dark:text-neutral-400 hover:text-slate-800"
                          }`}
                        >
                          {t("history_filter_all") || (lang === "ru" ? "Все" : "Barchasi")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryTab("IN_DELIVERY")}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            historyTab === "IN_DELIVERY"
                              ? "bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-2xs"
                              : "text-slate-500 dark:text-neutral-400 hover:text-slate-800"
                          }`}
                        >
                          {t("history_filter_in_delivery") || (lang === "ru" ? "В пути" : "Yo'lda")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryTab("COMPLETED")}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            historyTab === "COMPLETED"
                              ? "bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                              : "text-slate-500 dark:text-neutral-400 hover:text-slate-800"
                          }`}
                        >
                          {t("history_filter_completed") || (lang === "ru" ? "Доставлено" : "Yetkazilgan")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryTab("CANCELLED")}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            historyTab === "CANCELLED"
                              ? "bg-white dark:bg-neutral-700 text-rose-600 dark:text-rose-400 shadow-2xs"
                              : "text-slate-500 dark:text-neutral-400 hover:text-slate-800"
                          }`}
                        >
                          {t("history_filter_cancelled") || (lang === "ru" ? "Отменено" : "Bekor")}
                        </button>
                      </div>
                    </div>

                    {(() => {
                      const filteredHistory = courierAnalyticsData.orders_history.filter((o) => {
                        if (historyTab === "ALL") return true;
                        return o.status === historyTab;
                      });

                      if (filteredHistory.length === 0) {
                        return (
                          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-neutral-800/40 border border-slate-200/80 dark:border-neutral-800 text-center text-xs text-slate-400">
                            {t("no_orders_for_filter") || (lang === "ru" ? "Заказы по выбранному фильтру не найдены" : "Tanlangan filtr bo'yicha buyurtmalar topilmadi")}
                          </div>
                        );
                      }

                      return (
                        <div className="rounded-2xl border border-slate-200/80 dark:border-neutral-800 overflow-hidden divide-y divide-slate-100 dark:divide-neutral-800 max-h-72 overflow-y-auto">
                          {filteredHistory.map((o) => (
                            <div
                              key={o.id}
                              className="p-3 sm:p-3.5 hover:bg-slate-50/80 dark:hover:bg-neutral-800/50 transition-colors flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                                    #{o.order_number}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                      o.status === "COMPLETED"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                        : o.status === "IN_DELIVERY"
                                        ? "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700"
                                        : o.status === "CANCELLED"
                                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                        : "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300"
                                    }`}
                                  >
                                    {o.status_display}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    {o.created_at}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-neutral-300 truncate">
                                  {o.delivery_address} • <span className="font-semibold text-slate-800 dark:text-white">{o.customer_name}</span>
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono font-bold text-slate-900 dark:text-white block">
                                  {o.total_amount.toLocaleString()} UZS
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {o.payment_method_display || (lang === "ru" ? "Оплата" : "To'lov")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer Controls */}
            <div className="p-4 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {courierAnalyticsData?.courier.phone && (
                  <a
                    href={`tel:${courierAnalyticsData.courier.phone}`}
                    className="px-3.5 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-white font-medium text-xs hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-600 dark:text-neutral-300" />
                    <span>{t("call_action_btn") || (lang === "ru" ? "Позвонить" : "Qo'ng'iroq")}</span>
                  </a>
                )}
                {courierAnalyticsData?.courier && (
                  <button
                    type="button"
                    onClick={() => {
                      const found = couriersList.find((c) => c.id === courierAnalyticsData.courier.id);
                      if (found) {
                        setProfileCourierId(null);
                        setMonitorCourier(found);
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                    <span>{t("courier_live_map_btn") || (lang === "ru" ? "Живая карта" : "Jonli xarita")}</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setProfileCourierId(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold text-xs hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                {t("close_btn") || (lang === "ru" ? "Закрыть" : "Yopish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

