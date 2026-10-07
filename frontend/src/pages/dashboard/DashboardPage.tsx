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
  ArrowUpRight,
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

export const DashboardPage: React.FC = () => {
  const { store, lang, t } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get("period") || "today";
  const branch = searchParams.get("branch") || "all";
  const startDateParam = searchParams.get("start_date") || "";
  const endDateParam = searchParams.get("end_date") || "";

  const [currency, setCurrency] = useState<"UZS" | "USD">("UZS");
  const [chartType, setChartType] = useState<"line" | "bar" | "heatmap">("line");
  const [productTab, setProductTab] = useState<"top" | "abc">("top");

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
    queryKey: ["dashboard-summary", period, branch, startDateParam, endDateParam, store?.id],
    queryFn: async () => {
      const branchParam = branch !== "all" ? `&branch=${branch}` : "";
      const dateParams = (period === "custom" && startDateParam && endDateParam)
        ? `&start_date=${startDateParam}&end_date=${endDateParam}`
        : "";
      const res = await api.get(`/dashboard/summary/?period=${period}${branchParam}${dateParams}`);
      return res.data as {
        metrics: DashboardMetrics;
        charts: DashboardCharts;
        top_products: TopProduct[];
        abc_analysis?: AbcAnalysis;
        map_orders: MapOrder[];
      };
    },
    refetchInterval: 30000,
  });

  const metrics = data?.metrics;
  const charts = data?.charts;
  const topProducts = data?.top_products || [];
  const abcAnalysis = data?.abc_analysis;
  const mapOrders = data?.map_orders || [];

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

  // Chart configuration: Clean minimal Shopify Analytics style with blue accent
  const chartData = {
    labels: charts?.labels || [],
    datasets: [
      {
        label: `${t("revenue") || (lang === "ru" ? "Выручка" : "Tushum")} (${currency})`,
        data: (charts?.revenue || []).map((val) =>
          currency === "USD" ? Number((val / UZS_TO_USD_RATE).toFixed(2)) : val
        ),
        backgroundColor: chartType === "bar" ? "#2563EB" : "rgba(37, 99, 235, 0.06)",
        borderColor: "#2563EB",
        borderWidth: chartType === "line" ? 2 : 0,
        borderRadius: chartType === "bar" ? 4 : 0,
        fill: chartType === "line",
        tension: 0.3,
        pointBackgroundColor: "#2563EB",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 1.5,
        pointRadius: chartType === "line" ? 2 : 0,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18181B",
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
          color: "rgba(226, 232, 240, 0.6)",
        },
        ticks: {
          font: { size: 11 },
          color: "#94A3B8",
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
          color: "#94A3B8",
        },
      },
    },
  };

  const doughnutData = {
    labels: ["Telegram Bot", "Veb-sayt"],
    datasets: [
      {
        data: [charts?.traffic?.telegram || 0, charts?.traffic?.web || 0],
        backgroundColor: ["#18181B", "#2563EB"],
        borderWidth: 0,
        hoverOffset: 2,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header Bar: Store Title & Period Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {store?.name || (lang === "ru" ? "Панель управления" : "Boshqaruv paneli")}
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            {lang === "ru"
              ? "Сводка показателей продаж, заказов и каналов дистрибуции"
              : "Savdo, buyurtmalar va kanallar ko'rsatkichlari"}
          </p>
        </div>

        {/* Action Controls: Periods, Currency, Refresh */}
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          {/* Period selector */}
          <div className="inline-flex max-w-full overflow-x-auto no-scrollbar rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setShowDatePicker(false);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (p.id === "today") {
                      next.delete("period");
                    } else {
                      next.set("period", p.id);
                    }
                    next.delete("start_date");
                    next.delete("end_date");
                    return next;
                  });
                }}
                className={`px-2.5 py-1 text-xs font-normal rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  period === p.id && !startDateParam
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
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
                  setCustomEnd(endDateParam || metrics?.today_date || "2026-09-24");
                  setShowDatePicker(!showDatePicker);
                }}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap ${
                  period === "custom" || (startDateParam && endDateParam)
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white font-normal"
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>
                  {period === "custom" && startDateParam && endDateParam
                    ? `${startDateParam.slice(5)} - ${endDateParam.slice(5)}`
                    : (lang === "ru" ? "Даты" : "Sana")}
                </span>
              </button>

              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 z-30 w-72 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl space-y-3">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {lang === "ru" ? "Выбор периода" : "Sana oralig'i"}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        {lang === "ru" ? "От" : "Dan"}
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        {lang === "ru" ? "До" : "Gacha"}
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
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
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 text-white font-medium text-xs hover:bg-black transition-colors"
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
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
                    >
                      {lang === "ru" ? "Сброс" : "Tozalash"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setCurrency("UZS")}
              className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                currency === "UZS"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 font-normal"
              }`}
            >
              UZS
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                currency === "USD"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 font-normal"
              }`}
            >
              USD
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
            title={lang === "ru" ? "Обновить данные" : "Ma'lumotlarni yangilash"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Pure Shopify Polaris Metric Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-normal text-slate-500 dark:text-zinc-400">
              {lang === "ru" ? "Общая выручка" : "Jami tushum"}
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-1">
              {formatMoney(metrics?.revenue || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500">
            <span className="truncate">
              {lang === "ru" ? "С учетом доставки:" : "Yetkazib berish:"} {formatMoney(metrics?.sales_sum || 0)}
            </span>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-normal text-slate-500 dark:text-zinc-400">
              {lang === "ru" ? "Всего заказов" : "Buyurtmalar"}
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-1">
              {metrics?.orders_count || 0}{" "}
              <span className="text-sm font-normal text-slate-500">
                {lang === "ru" ? "заказов" : "ta"}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="text-blue-600 font-medium">{metrics?.new_orders || 0} {lang === "ru" ? "новых" : "yangi"}</span>
              <span>•</span>
              <span>{metrics?.ready_orders || 0} {lang === "ru" ? "готовых" : "tayyor"}</span>
            </div>
            <Link to="/orders" className="text-blue-600 hover:underline font-normal">
              {lang === "ru" ? "Все →" : "Barchasi →"}
            </Link>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-normal text-slate-500 dark:text-zinc-400">
              {lang === "ru" ? "База клиентов" : "Mijozlar bazasi"}
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-1">
              {metrics?.total_customers || 0}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {lang === "ru" ? "Постоянные клиенты" : "Doimiy xaridorlar"}
            </span>
            <Link to="/customers" className="text-blue-600 hover:underline font-normal">
              CRM →
            </Link>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-normal text-slate-500 dark:text-zinc-400">
              {lang === "ru" ? "Средний чек" : "O'rtacha chek"}
            </div>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight mt-1">
              {formatMoney(metrics?.avg_order || 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>{lang === "ru" ? "За одну покупку" : "Bitta xarid uchun"}</span>
            <span className="text-emerald-600 font-medium">✓ {lang === "ru" ? "Стабильно" : "Barqaror"}</span>
          </div>
        </div>
      </div>

      {/* 3. Setup & Onboarding Guide (Shopify Polaris Setup Cards) */}
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              {lang === "ru"
                ? `Настройка магазина ${store?.name || "StoreBox"}`
                : `Do'konni sozlash`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "ru"
                ? "Завершите ключевые шаги для приема заказов и онлайн-оплат"
                : "Savdo va to'lovlarni qabul qilish uchun asosiy qadamlar"}
            </p>
          </div>
          <Link
            to="/analytics"
            className="text-xs font-normal text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <span>{lang === "ru" ? "Перейти в полную аналитику →" : "Batafsil tahlil →"}</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Step 1: Theme */}
          <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">
                {lang === "ru" ? "1. Тема витрины" : "1. Do'kon dizayni"}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === "ru"
                  ? "13 премиальных тем StoreBox для десктопов и смартфонов."
                  : "13 ta premium vitrina mavzusi."}
              </p>
            </div>
            <Link
              to="/robo-market"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>{lang === "ru" ? "Выбрать тему" : "Mavzu tanlash"}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

          {/* Step 2: Payments */}
          <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">
                {lang === "ru" ? "2. Способы оплаты" : "2. To'lov tizimlari"}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === "ru"
                  ? "Payme, Click, Uzum Pay и оплата картой или наличными."
                  : "Payme, Click va Uzum Pay to'lovlarini sozlash."}
              </p>
            </div>
            <Link
              to="/settings/payments"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>{lang === "ru" ? "Настроить" : "Sozlash"}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

          {/* Step 3: Delivery */}
          <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">
                {lang === "ru" ? "3. Доставка" : "3. Yetkazib berish"}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === "ru"
                  ? "Зоны курьерской доставки, фиксированная цена и самовывоз."
                  : "Kuryerlik zonalari va o'zi olib ketish tariflari."}
              </p>
            </div>
            <Link
              to="/settings/delivery"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>{lang === "ru" ? "Тарифы" : "Tariflar"}</span>
              <ArrowUpRight className="w-3 h-3 text-slate-400" />
            </Link>
          </div>

          {/* Step 4: Launch */}
          <div className="rounded-lg border border-slate-200/80 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-medium text-slate-900 dark:text-white">
                {lang === "ru" ? "4. Витрина магазина" : "4. Do'kon vitrinasi"}
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {lang === "ru"
                  ? "Проверьте как витрина выглядит для ваших покупателей."
                  : "Xaridorlar uchun vitrina qanday ko'rinishini tekshiring."}
              </p>
            </div>
            <a
              href={store?.storefront_url || (store?.subdomain ? `/store/${store.subdomain}/` : "#")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-black transition-colors shadow-2xs"
            >
              <span>{lang === "ru" ? "Открыть витрину" : "Vitrinasini ochish"}</span>
              <ExternalLink className="w-3 h-3 text-slate-300" />
            </a>
          </div>
        </div>
      </div>

      {/* 4. Middle Section: Revenue Dynamics Chart & Sales Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Revenue Dynamics Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                {chartType === "heatmap"
                  ? (lang === "ru" ? "Карта активности" : "Faollik taqvimi")
                  : (lang === "ru" ? "Динамика выручки" : "Tushum dinamikasi")}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatMoney(metrics?.revenue || 0)} {lang === "ru" ? "за выбранный период" : "tanlangan davrda"}
              </div>
            </div>

            {/* View Switcher: Line / Bar / Heatmap */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setChartType("line")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  chartType === "line"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title={lang === "ru" ? "Линейный график" : "Chiziqli"}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  chartType === "bar"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title={lang === "ru" ? "Столбчатый график" : "Ustunli"}
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("heatmap")}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  chartType === "heatmap"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:text-slate-900"
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
              <div className="w-full py-12 text-center text-xs text-slate-400">
                {lang === "ru" ? "Нет данных за выбранный период" : "Tanlangan davr uchun ma'lumotlar mavjud emas"}
              </div>
            )}
          </div>
        </div>

        {/* Right: Channels & Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {lang === "ru" ? "Каналы продаж" : "Savdo kanallari"}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5 mb-4">
              {lang === "ru" ? "Распределение заказов по источникам" : "Buyurtmalar manbai"}
            </div>

            <div className="space-y-3">
              {/* Telegram Bot */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-slate-700 dark:text-zinc-300" />
                  <div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white">Telegram Bot</div>
                    <div className="text-[11px] text-slate-500">
                      {metrics?.tma_cnt || 0} {lang === "ru" ? "заказов" : "buyurtma"} ({tmaTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.telegram_bot_username ? (
                  <a
                    href={`https://t.me/${store.telegram_bot_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{lang === "ru" ? "Открыть" : "Ochish"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    to="/platforms"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {lang === "ru" ? "Подключить" : "Ulash"}
                  </Link>
                )}
              </div>

              {/* Web Storefront */}
              <div className="p-3 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                      {lang === "ru" ? "Веб-витрина" : "Veb-sayt"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {metrics?.web_cnt || 0} {lang === "ru" ? "заказов" : "buyurtma"} ({webTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.subdomain && (
                  <a
                    href={store.storefront_url || `/store/${store.subdomain}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>{lang === "ru" ? "Сайт" : "Sayt"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Minimalist doughnut indicator */}
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
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
              <div className="flex items-center justify-end gap-1.5 text-slate-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></span>
                <span>Telegram: {tmaTrafficPct}%</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>{lang === "ru" ? "Веб-сайт" : "Sayt"}: {webTrafficPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Lower Row: Top Products & Orders Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Top Products (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {productTab === "top"
                    ? (lang === "ru" ? "Лидеры продаж" : "Sotuv yetakchilari")
                    : (lang === "ru" ? "ABC-анализ продаж" : "ABC tahlil")}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {lang === "ru" ? "Товары с наибольшим вкладом в выручку" : "Eng ko'p sotilgan tovarlar"}
                </div>
              </div>

              {/* Segmented Switcher */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setProductTab("top")}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    productTab === "top"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 font-normal"
                  }`}
                >
                  {lang === "ru" ? "Топ" : "Top"}
                </button>
                <button
                  type="button"
                  onClick={() => setProductTab("abc")}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    productTab === "abc"
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-medium"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 font-normal"
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
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-zinc-800/80 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-medium flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {p.product_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {p.sold_qty} {lang === "ru" ? "шт" : "dona"}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs font-semibold text-slate-900 dark:text-white">
                      {formatMoney(p.sold_sum || 0)}
                    </div>
                  </div>
                ))}

                {topProducts.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    {lang === "ru" ? "Пока нет проданных товаров" : "Sotilgan tovarlar yo'q"}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 text-center">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Группа A (~80%)</span>
                    <div className="text-xs text-slate-500 mt-1">
                      {abcAnalysis?.group_a.count || 0} {lang === "ru" ? "тов." : "ta"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 text-center">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Группа B (~15%)</span>
                    <div className="text-xs text-slate-500 mt-1">
                      {abcAnalysis?.group_b.count || 0} {lang === "ru" ? "тов." : "ta"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 text-center">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">Группа C (~5%)</span>
                    <div className="text-xs text-slate-500 mt-1">
                      {abcAnalysis?.group_c.count || 0} {lang === "ru" ? "тов." : "ta"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Orders Map (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {lang === "ru" ? "География доставки заказов" : "Buyurtma xaritasi"}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  {mapOrders.length} {lang === "ru" ? "активных точек доставки" : "ta manzil"}
                </div>
              </div>
              <Link to="/orders" className="text-xs text-blue-600 hover:underline">
                {lang === "ru" ? "Все заказы →" : "Barchasi →"}
              </Link>
            </div>

            <div className="h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 relative z-0">
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
                  <Marker
                    key={i}
                    position={[ord.lat, ord.lng]}
                    icon={defaultPinIcon}
                  >
                    <Popup>
                      <div className="text-xs font-medium">
                        <div>#{ord.num} - {ord.client}</div>
                        <div className="text-blue-600">{formatMoney(ord.total)}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
