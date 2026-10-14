import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  RefreshCw,
  DollarSign,
  Package,
  Plus,
  MessageSquare,
  Boxes,
  Megaphone,
  CheckCircle2,
  Clock,
  Send,
  Globe,
  Bot,
  BarChart3,
  LineChart as LineChartIcon,
  Store as StoreIcon,
  CreditCard,
  Truck
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import {
  ContributionHeatmap,
  DashboardHeatmap,
} from "../../components/charts/ContributionHeatmap";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Fix leaflet default pin icon issue
const defaultPinIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface DashboardMetrics {
  period: string;
  start_date?: string;
  end_date?: string;
  store_inception_date?: string;
  today_date?: string;
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

interface DashboardCharts {
  labels: string[];
  revenue: number[];
  traffic: {
    web: number;
    telegram: number;
  };
  heatmap?: DashboardHeatmap;
}

interface TopProduct {
  product_name: string;
  sold_qty: number;
  sold_sum: number;
}

interface AbcItem {
  product_name: string;
  sold_qty: number;
  sold_sum: number;
  share_pct: number;
  cum_pct: number;
  group: "A" | "B" | "C";
}

interface AbcAnalysis {
  total_revenue: number;
  total_products: number;
  group_a: { count: number; revenue: number; pct: number };
  group_b: { count: number; revenue: number; pct: number };
  group_c: { count: number; revenue: number; pct: number };
  items: AbcItem[];
}

interface MapOrder {
  num: string;
  client: string;
  lat: number;
  lng: number;
  total: number;
  status: string;
}

interface RegionBreakdown {
  code: string;
  name_ru: string;
  name_uz: string;
  orders: number;
  revenue: number;
  share_pct: number;
}

export const DashboardPage: React.FC = () => {
  const { store, lang, t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get("period") || "month";
  const branch = searchParams.get("branch") || "all";
  const startDateParam = searchParams.get("start_date") || "";
  const endDateParam = searchParams.get("end_date") || "";

  const [currency, setCurrency] = useState<"UZS" | "USD">("UZS");
  const [chartType, setChartType] = useState<"line" | "bar" | "heatmap">("line");
  const [productTab, setProductTab] = useState<"top" | "abc">("top");
  const [geoTab, setGeoTab] = useState<"regions" | "map">("regions");
  const [heroPrompt, setHeroPrompt] = useState<string>("");

  // Custom Date Range state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState(startDateParam);
  const [customEnd, setCustomEnd] = useState(endDateParam);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close datepicker popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  const UZS_TO_USD_RATE = 12800;

  const formatMoney = (sum: number) => {
    if (currency === "USD") {
      const usd = sum / UZS_TO_USD_RATE;
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${Math.round(sum).toLocaleString("uz-UZ")} UZS`;
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["dashboard-summary", store?.id, period, branch, startDateParam, endDateParam],
    queryFn: async () => {
      const storeParam = store?.id ? `&store_id=${store.id}` : "";
      const branchParam = branch !== "all" ? `&branch=${branch}` : "";
      const dateParams =
        period === "custom" && startDateParam && endDateParam
          ? `&start_date=${startDateParam}&end_date=${endDateParam}`
          : "";
      const res = await api.get(
        `/dashboard/summary/?period=${period}${storeParam}${branchParam}${dateParams}`
      );
      return res.data as {
        metrics: DashboardMetrics;
        charts: DashboardCharts;
        top_products: TopProduct[];
        abc_analysis?: AbcAnalysis;
        map_orders: MapOrder[];
        regions_breakdown?: RegionBreakdown[];
      };
    },
    refetchInterval: 30000,
  });

  const metrics = data?.metrics;
  const charts = data?.charts;
  const topProducts = data?.top_products || [];
  const abcAnalysis = data?.abc_analysis;
  const mapOrders = data?.map_orders || [];
  const regionsBreakdown = data?.regions_breakdown || [];
  const periods = [
    { id: "today", label: t("today") || (lang === "ru" ? "Сегодня" : lang === "en" ? "Today" : "Bugun") },
    { id: "week", label: t("last_7_days") || (lang === "ru" ? "7 дней" : lang === "en" ? "7 days" : "Oxirgi 7 kun") },
    { id: "month", label: t("last_30_days") || (lang === "ru" ? "30 дней" : lang === "en" ? "30 days" : "Oxirgi 30 kun") },
    { id: "quarter", label: t("this_quarter") || (lang === "ru" ? "Квартал" : lang === "en" ? "Quarter" : "Shu chorak") },
    { id: "year", label: t("this_year") || (lang === "ru" ? "Год" : lang === "en" ? "Year" : "Har yil") },
  ];

  const totalTraffic = (charts?.traffic?.web || 0) + (charts?.traffic?.telegram || 0);
  const webTrafficPct = totalTraffic > 0 ? Math.round(((charts?.traffic?.web || 0) / totalTraffic) * 100) : 50;
  const tmaTrafficPct = totalTraffic > 0 ? 100 - webTrafficPct : 50;

  // Chart configuration: Clean minimal Shopify Polaris style with vibrant #6d5a88 Shopify Blue accent
  const chartData = {
    labels: charts?.labels || [],
    datasets: [
      {
        label: `${t("revenue") || (lang === "ru" ? "Выручка" : lang === "en" ? "Revenue" : "Tushum")} (${currency})`,
        data: (charts?.revenue || []).map((val) =>
          currency === "USD" ? Number((val / UZS_TO_USD_RATE).toFixed(2)) : val
        ),
        backgroundColor: chartType === "bar" ? "#6d5a88" : "rgba(0, 91, 211, 0.14)",
        borderColor: "#6d5a88",
        borderWidth: chartType === "line" ? 2.5 : 0,
        borderRadius: chartType === "bar" ? 5 : 0,
        fill: chartType === "line",
        tension: 0.35,
        pointBackgroundColor: "#6d5a88",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 1.5,
        pointRadius: chartType === "line" ? 3 : 0,
        pointHoverRadius: 5.5,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#211b2e",
        titleColor: "#FFFFFF",
        bodyColor: "#E4E4E7",
        padding: 8,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const rawVal = context.raw;
            if (currency === "USD") {
              return `Выручка: $${rawVal.toLocaleString()}`;
            }
            return `Выручка: ${Math.round(rawVal).toLocaleString("uz-UZ")} UZS`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        suggestedMax: currency === "USD" ? 100 : 100000,
        grid: {
          color: "rgba(225, 227, 229, 0.7)",
        },
        ticks: {
          font: { size: 11 },
          color: "#6d7175",
          callback: (value: any) => {
            if (currency === "USD") return `$${value}`;
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11 },
          color: "#6d7175",
        },
      },
    },
  };

  const doughnutData = {
    labels: ["Telegram Bot", "Veb-sayt"],
    datasets: [
      {
        data: [charts?.traffic?.telegram || 0, charts?.traffic?.web || 0],
        backgroundColor: ["#6d5a88", "#00a86b"],
        borderWidth: 0,
        hoverOffset: 3,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header Bar: Store Title & Period Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#211b2e] dark:text-white tracking-tight">
            {store?.name || (lang === "ru" ? "Панель управления" : "Boshqaruv paneli")}
          </h1>
          <p className="text-xs text-[#6d7175] font-normal mt-0.5">
            {lang === "ru"
              ? "Сводка показателей продаж, заказов и региональной активности по магазину"
              : "Savdo, buyurtmalar va hududiy ko'rsatkichlar"}
          </p>
        </div>

        {/* Action Controls: Periods, Currency, Refresh */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Period selector */}
          <div className="inline-flex max-w-full overflow-x-auto no-scrollbar rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setShowDatePicker(false);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("period", p.id);
                    next.delete("start_date");
                    next.delete("end_date");
                    return next;
                  });
                }}
                className={`px-2.5 py-1 text-xs rounded-[9px] transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  period === p.id && !startDateParam
                    ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                    : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] dark:hover:text-white font-normal"
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Date Range Popover */}
            <div ref={datePickerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCustomStart(startDateParam || metrics?.store_inception_date || "2026-05-10");
                  setCustomEnd(endDateParam || metrics?.today_date || "2026-10-11");
                  setShowDatePicker(!showDatePicker);
                }}
                className={`px-2.5 py-1 text-xs rounded-[9px] transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  period === "custom" || (startDateParam && endDateParam)
                    ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                    : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] dark:hover:text-white font-normal"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>
                  {period === "custom" && startDateParam && endDateParam
                    ? `${startDateParam.slice(5)} - ${endDateParam.slice(5)}`
                    : lang === "ru"
                    ? "Даты"
                    : "Sana"}
                </span>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 z-30 w-72 p-4 rounded-[18px] bg-white dark:bg-zinc-900 border border-[#dfe5ef] dark:border-zinc-800 shadow-xl space-y-3">
                  <div className="text-xs font-semibold text-[#211b2e] dark:text-white">
                    {lang === "ru" ? "Выбор периода" : "Sana oralig'i"}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-[#6d7175] mb-1">
                        {lang === "ru" ? "От" : "Dan"}
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6d7175] mb-1">
                        {lang === "ru" ? "До" : "Gacha"}
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#dfe5ef] dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        if (!customStart || !customEnd) return;
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.set("period", "custom");
                          next.set("start_date", customStart);
                          next.set("end_date", customEnd);
                          return next;
                        });
                        setShowDatePicker(false);
                      }}
                      className="flex-1 py-1.5 rounded-[12px] bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] font-medium text-xs hover:bg-[#151020] transition-colors cursor-pointer"
                    >
                      {lang === "ru" ? "Применить" : "Qo'llash"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.delete("period");
                          next.delete("start_date");
                          next.delete("end_date");
                          return next;
                        });
                        setShowDatePicker(false);
                      }}
                      className="px-2.5 py-1.5 rounded-[12px] border border-[#dfe5ef] text-[#686475] text-xs hover:bg-[#f6f6f7] cursor-pointer"
                    >
                      {lang === "ru" ? "Сброс" : "Tozalash"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="inline-flex rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={() => setCurrency("UZS")}
              className={`px-2 py-1 text-xs rounded-[9px] transition-colors cursor-pointer ${
                currency === "UZS"
                  ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                  : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] font-normal"
              }`}
            >
              UZS
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 text-xs rounded-[9px] transition-colors cursor-pointer ${
                currency === "USD"
                  ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                  : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] font-normal"
              }`}
            >
              USD
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-[#686475] dark:text-zinc-300 hover:bg-[#f6f6f7] dark:hover:bg-zinc-800 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.05)] cursor-pointer"
            title={lang === "ru" ? "Обновить данные" : "Ma'lumotlarni yangilash"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-[#00a86b]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Pure Shopify Polaris Metric Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 @3xl:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-[#6d7175] dark:text-zinc-400">
              {lang === "ru" ? "Общая выручка" : "Jami tushum"}
            </div>
            <div className="text-2xl font-semibold text-[#211b2e] dark:text-white tracking-tight mt-1">
              {isLoading ? "..." : formatMoney(metrics?.revenue || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#dfe5ef] dark:border-zinc-800/80 flex items-center justify-between text-xs text-[#6d7175]">
            <span className="truncate">
              {lang === "ru" ? "Оборот:" : "Aylanma:"} {formatMoney(metrics?.sales_sum || 0)}
            </span>
            <span className="text-[#00a86b] font-semibold">● Live</span>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-[#6d7175] dark:text-zinc-400">
              {lang === "ru" ? "Всего заказов" : "Buyurtmalar"}
            </div>
            <div className="text-2xl font-semibold text-[#211b2e] dark:text-white tracking-tight mt-1">
              {isLoading ? "..." : metrics?.orders_count || 0}{" "}
              <span className="text-sm font-normal text-[#6d7175]">
                {lang === "ru" ? "заказов" : "ta"}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#dfe5ef] dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[#6d7175]">
              <span className="text-[#00a86b] font-semibold">
                {metrics?.new_orders || 0} {lang === "ru" ? "новых" : "yangi"}
              </span>
              <span>•</span>
              <span>
                {metrics?.ready_orders || 0} {lang === "ru" ? "готовых" : "tayyor"}
              </span>
            </div>
            <Link to="/orders" className="text-[#6d5a88] hover:underline font-medium">
              {lang === "ru" ? "Все →" : "Barchasi →"}
            </Link>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-[#6d7175] dark:text-zinc-400">
              {lang === "ru" ? "База клиентов" : "Mijozlar bazasi"}
            </div>
            <div className="text-2xl font-semibold text-[#211b2e] dark:text-white tracking-tight mt-1">
              {isLoading ? "..." : metrics?.total_customers || 0}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#dfe5ef] dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-[#6d7175]">
              {lang === "ru" ? "Покупатели магазина" : "Do'kon xaridorlari"}
            </span>
            <Link to="/customers" className="text-[#6d5a88] hover:underline font-medium">
              CRM →
            </Link>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-[#6d7175] dark:text-zinc-400">
              {lang === "ru" ? "Средний чек" : "O'rtacha chek"}
            </div>
            <div className="text-2xl font-semibold text-[#211b2e] dark:text-white tracking-tight mt-1">
              {isLoading ? "..." : formatMoney(metrics?.avg_order || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-[#dfe5ef] dark:border-zinc-800/80 flex items-center justify-between text-xs text-[#6d7175]">
            <span>{lang === "ru" ? "За одну покупку" : "Bitta xarid uchun"}</span>
            <span className="text-[#00a86b] font-semibold">✓ {lang === "ru" ? "В норме" : "Barqaror"}</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Revenue Dynamics Chart & Sales Channels */}
      <div className="sidekick-adaptive-grid grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Revenue Dynamics Chart (8 cols) */}
        <div className="xl:col-span-8 bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
                {chartType === "heatmap"
                  ? lang === "ru"
                    ? "Карта активности заказов"
                    : "Faollik taqvimi"
                  : lang === "ru"
                  ? "Динамика выручки"
                  : "Tushum dinamikasi"}
              </h2>
              <div className="text-xs text-[#6d7175] mt-0.5">
                {formatMoney(metrics?.revenue || 0)}{" "}
                {lang === "ru" ? `(${store?.name || ""})` : ""}
              </div>
            </div>

            {/* View Switcher: Line / Bar / Heatmap */}
            <div className="inline-flex rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded-[9px] transition-colors cursor-pointer ${
                  chartType === "line"
                    ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e]"
                    : "text-[#686475] hover:text-[#211b2e]"
                }`}
                title={lang === "ru" ? "Линейный график" : "Chiziqli"}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-[9px] transition-colors cursor-pointer ${
                  chartType === "bar"
                    ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e]"
                    : "text-[#686475] hover:text-[#211b2e]"
                }`}
                title={lang === "ru" ? "Столбчатый график" : "Ustunli"}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("heatmap")}
                className={`p-1.5 rounded-[9px] transition-colors cursor-pointer ${
                  chartType === "heatmap"
                    ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e]"
                    : "text-[#686475] hover:text-[#211b2e]"
                }`}
                title={lang === "ru" ? "Тепловая карта активности" : "Heatmap"}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="2" width="3" height="3" rx="0.75" />
                  <rect x="5" y="2" width="3" height="3" rx="0.75" />
                  <rect x="9" y="2" width="3" height="3" rx="0.75" />
                  <rect x="13" y="2" width="3" height="3" rx="0.75" />
                  <rect x="1" y="6.5" width="3" height="3" rx="0.75" />
                  <rect x="5" y="6.5" width="3" height="3" rx="0.75" />
                  <rect x="9" y="6.5" width="3" height="3" rx="0.75" />
                  <rect x="13" y="6.5" width="3" height="3" rx="0.75" />
                  <rect x="1" y="11" width="3" height="3" rx="0.75" />
                  <rect x="5" y="11" width="3" height="3" rx="0.75" />
                  <rect x="9" y="11" width="3" height="3" rx="0.75" />
                  <rect x="13" y="11" width="3" height="3" rx="0.75" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-[16rem] w-full flex items-center">
            {chartType === "heatmap" ? (
              <ContributionHeatmap
                heatmap={charts?.heatmap}
                currency={currency}
                formatMoney={formatMoney}
              />
            ) : charts && charts.labels && charts.labels.length > 0 ? (
              <div className="w-full h-64">
                {chartType === "line" ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <Bar data={chartData} options={chartOptions} />
                )}
              </div>
            ) : (
              <div className="w-full py-12 text-center text-xs text-[#6d7175]">
                {lang === "ru" ? "Нет данных за выбранный период" : "Tanlangan davr uchun ma'lumotlar mavjud emas"}
              </div>
            )}
          </div>
        </div>

        {/* Right: Channels & Distribution (4 cols) */}
        <div className="xl:col-span-4 bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between min-w-0">
          <div>
            <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
              {lang === "ru" ? "Каналы продаж" : "Savdo kanallari"}
            </h2>
            <div className="text-xs text-[#6d7175] mt-0.5 mb-4">
              {lang === "ru" ? "Распределение заказов по источникам" : "Buyurtmalar manbai"}
            </div>

            <div className="space-y-3">
              {/* Telegram Bot */}
              <div className="p-3 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-[#f6f6f7] dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-[#6d5a88]" />
                  <div>
                    <div className="text-xs font-medium text-[#211b2e] dark:text-white">Telegram Mini App</div>
                    <div className="text-[11px] text-[#6d7175]">
                      {metrics?.tma_cnt || 0} {lang === "ru" ? "заказов" : "buyurtma"} ({tmaTrafficPct}%)
                    </div>
                  </div>
                </div>

                <Link
                  to="/platforms"
                  className="text-xs text-[#6d5a88] font-medium hover:underline flex items-center gap-1"
                >
                  <span>{lang === "ru" ? "Бот →" : "Bot →"}</span>
                </Link>
              </div>

              {/* Web Storefront */}
              <div className="p-3 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-[#f6f6f7] dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#00a86b]" />
                  <div>
                    <div className="text-xs font-medium text-[#211b2e] dark:text-white">
                      {lang === "ru" ? "Веб-витрина" : "Veb-sayt"}
                    </div>
                    <div className="text-[11px] text-[#6d7175]">
                      {metrics?.web_cnt || 0} {lang === "ru" ? "заказов" : "buyurtma"} ({webTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.subdomain && (
                  <a
                    href={store.storefront_url || `/store/${store.subdomain}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00a86b] font-medium hover:underline flex items-center gap-1"
                  >
                    <span>{lang === "ru" ? "Витрина" : "Sayt"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Minimalist doughnut indicator */}
          <div className="pt-4 mt-4 border-t border-[#dfe5ef] dark:border-zinc-800 flex items-center justify-between">
            <div className="w-20 h-20 relative">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "75%",
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="space-y-1 text-right text-xs">
              <div className="flex items-center justify-end gap-1.5 text-[#6d5a88] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#6d5a88]"></span>
                <span>Telegram: {tmaTrafficPct}%</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-[#00a86b] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00a86b]"></span>
                <span>{lang === "ru" ? "Веб-сайт" : lang === "en" ? "Website" : "Sayt"}: {webTrafficPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Lower Row: Top Products & Uzbekistan Regional Activity / Map (Block 3.6) */}
      <div className="sidekick-adaptive-grid grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Top Products (6 cols) */}
        <div className="xl:col-span-6 bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
                  {productTab === "top"
                    ? lang === "ru"
                      ? "Лидеры продаж"
                      : lang === "en"
                      ? "Top Products"
                      : "Sotuv yetakchilari"
                    : lang === "ru"
                    ? "ABC-анализ продаж"
                    : lang === "en"
                    ? "ABC Sales Analysis"
                    : "ABC tahlil"}
                </h2>
                <div className="text-xs text-[#6d7175] mt-0.5">
                  {lang === "ru"
                    ? "Товары с наибольшим вкладом в выручку"
                    : lang === "en"
                    ? "Products with the highest revenue contribution"
                    : "Eng ko'p sotilgan tovarlar"}
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="inline-flex rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setProductTab("top")}
                  className={`px-2.5 py-1 text-xs rounded-[9px] transition-colors cursor-pointer ${
                    productTab === "top"
                      ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                      : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] font-normal"
                  }`}
                >
                  {lang === "ru" ? "Топ" : "Top"}
                </button>
                <button
                  type="button"
                  onClick={() => setProductTab("abc")}
                  className={`px-2.5 py-1 text-xs rounded-[9px] transition-colors cursor-pointer ${
                    productTab === "abc"
                      ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                      : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] font-normal"
                  }`}
                >
                  ABC
                </button>
              </div>
            </div>

            {productTab === "top" ? (
              <div className="space-y-2">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800/80 hover:bg-[#f6f6f7] dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-md bg-[#e6f7f0] text-[#00a86b] text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-medium text-[#211b2e] dark:text-white truncate">
                          {p.product_name}
                        </div>
                        <div className="text-[11px] text-[#6d7175]">
                          {p.sold_qty} {lang === "ru" ? "шт" : lang === "en" ? "pcs" : "dona"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs font-semibold text-[#211b2e] dark:text-white">
                      {formatMoney(p.sold_sum || 0)}
                    </div>
                  </div>
                ))}

                {topProducts.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#6d7175]">
                    {lang === "ru" ? "Пока нет проданных товаров" : lang === "en" ? "No products sold yet" : "Sotilgan tovarlar yo'q"}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-[#f6f6f7] text-center">
                    <span className="text-xs font-semibold text-[#211b2e] dark:text-white">Группа A (~80%)</span>
                    <div className="text-xs text-[#00a86b] font-semibold mt-1">
                      {abcAnalysis?.group_a.count || 0} {lang === "ru" ? "тов." : "ta"}
                    </div>
                  </div>
                  <div className="p-3 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-[#f6f6f7] text-center">
                    <span className="text-xs font-semibold text-[#211b2e] dark:text-white">Группа B (~15%)</span>
                    <div className="text-xs text-[#6d5a88] font-semibold mt-1">
                      {abcAnalysis?.group_b.count || 0} {lang === "ru" ? "тов." : "ta"}
                    </div>
                  </div>
                  <div className="p-3 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-[#f6f6f7] text-center">
                    <span className="text-xs font-semibold text-[#211b2e] dark:text-white">Группа C (~5%)</span>
                    <div className="text-xs text-[#686475] mt-1">
                      {abcAnalysis?.group_c.count || 0} {lang === "ru" ? "тов." : "ta"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Uzbekistan Regional Activity & Delivery Map (6 cols) */}
        <div className="xl:col-span-6 bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
                  {geoTab === "regions"
                    ? lang === "ru"
                      ? "Активность по регионам Узбекистана"
                      : lang === "en"
                      ? "Regional Activity in Uzbekistan"
                      : "O'zbekiston viloyatlari bo'yicha faollik"
                    : lang === "ru"
                    ? "Карта доставок (GPS)"
                    : lang === "en"
                    ? "Delivery Map (GPS)"
                    : "Yetkazib berish xaritasi"}
                </h2>
                <div className="text-xs text-[#6d7175] mt-0.5">
                  {lang === "ru"
                    ? "Распределение заказов по областям РУз и точкам доставки"
                    : lang === "en"
                    ? "Order distribution across regions of Uzbekistan"
                    : "Viloyatlar kesimida buyurtmalar taqsimoti"}
                </div>
              </div>

              <div className="inline-flex rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setGeoTab("regions")}
                  className={`px-2.5 py-1 text-xs rounded-[9px] transition-colors cursor-pointer ${
                    geoTab === "regions"
                      ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                      : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] font-normal"
                  }`}
                >
                  {lang === "ru" ? "Регионы РУз" : lang === "en" ? "Regions" : "Viloyatlar"}
                </button>
                <button
                  type="button"
                  onClick={() => setGeoTab("map")}
                  className={`px-2.5 py-1 text-xs rounded-[9px] transition-colors cursor-pointer ${
                    geoTab === "map"
                      ? "bg-[#211b2e] text-white shadow-[0_4px_10px_rgba(33,27,46,0.24)] dark:bg-white dark:text-[#211b2e] font-medium"
                      : "text-[#686475] dark:text-zinc-400 hover:text-[#211b2e] font-normal"
                  }`}
                >
                  {lang === "ru" ? "GPS Карта" : lang === "en" ? "GPS Map" : "Xarita"}
                </button>
              </div>
            </div>

            {geoTab === "regions" ? (
              <div className="space-y-2.5">
                {regionsBreakdown.slice(0, 6).map((reg) => (
                  <div
                    key={reg.code}
                    className="p-2.5 rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-[#f6f6f7]/60 dark:bg-zinc-900/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 font-medium text-[#211b2e] dark:text-white truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#6d5a88] shrink-0" />
                        <span className="truncate">{lang === "ru" ? reg.name_ru : reg.name_uz}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs shrink-0">
                        <span className="text-[#6d7175]">
                          {reg.orders} {lang === "ru" ? "зак." : "ta"} ({reg.share_pct}%)
                        </span>
                        <span className="font-semibold text-[#211b2e] dark:text-white">
                          {formatMoney(reg.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#e1e3e5] dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-[#6d5a88] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(reg.orders > 0 ? 6 : 0, reg.share_pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 rounded-[12px] overflow-hidden border border-[#dfe5ef] dark:border-zinc-800 relative z-0">
                <MapContainer
                  center={[41.3111, 69.2797]}
                  zoom={11}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {mapOrders.map((ord, i) => (
                    <Marker key={i} position={[ord.lat, ord.lng]} icon={defaultPinIcon}>
                      <Popup>
                        <div className="text-xs font-medium">
                          <div>
                            #{ord.num} - {ord.client}
                          </div>
                          <div className="text-[#008060]">{formatMoney(ord.total)}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

