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
  LineChart as LineChartIcon
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
  const [chartType, setChartType] = useState<"bar" | "line" | "heatmap">("bar");
  const [productTab, setProductTab] = useState<"top" | "abc">("top");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState(startDateParam);
  const [customEnd, setCustomEnd] = useState(endDateParam);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
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
    refetchInterval: 30000, // auto-refresh every 30s
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

  // Chart configurations with pure neutral theme
  const chartData = {
    labels: charts?.labels || [],
    datasets: [
      {
        label: `${t("revenue") || "Tushum"} (${currency})`,
        data: (charts?.revenue || []).map((val) =>
          currency === "USD" ? Number((val / UZS_TO_USD_RATE).toFixed(2)) : val
        ),
        backgroundColor: chartType === "bar" ? "#c8ff6a" : "rgba(200, 255, 106, 0.25)",
        borderColor: "#c8ff6a",
        borderWidth: chartType === "line" ? 3 : 0,
        borderRadius: chartType === "bar" ? 8 : 0,
        fill: chartType === "line",
        tension: 0.35,
        pointBackgroundColor: "#211b2e",
        pointBorderColor: "#c8ff6a",
        pointBorderWidth: 2,
        pointRadius: chartType === "line" ? 4 : 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(24, 24, 27, 0.95)",
        titleColor: "#FFFFFF",
        bodyColor: "#E4E4E7",
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => {
            const rawVal = context.raw;
            if (currency === "USD") {
              return `Tushum: $${rawVal.toLocaleString()}`;
            }
            return `Tushum: ${Math.round(rawVal).toLocaleString("uz-UZ")} UZS`;
          },
        },
      },
    },
    scales: {
      y: {
        grid: {
          color: "rgba(160, 160, 160, 0.08)",
        },
        ticks: {
          font: { size: 11 },
          color: "#9CA3AF",
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
          color: "#9CA3AF",
        },
      },
    },
  };

  const doughnutData = {
    labels: ["Telegram Bot", "Veb-sayt"],
    datasets: [
      {
        data: [charts?.traffic?.telegram || 0, charts?.traffic?.web || 0],
        backgroundColor: ["#211b2e", "#c8ff6a"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR: STORE TITLE & WORKING PERIOD CONTROLS */}
      {/* ======================================================== */}
      <div className="relative z-40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("live_monitoring") || "Jonli monitoring tizimi"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {store?.name || t("dashboard") || "Boshqaruv paneli"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t("live_monitoring_sub") || "Real vaqtdagi savdolar, buyurtmalar, mijozlar va logistika ko'rsatkichlari"}
          </p>
        </div>

        {/* Action Controls: Periods, Currency, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Working Period filter pills + Custom Date Picker */}
          <div className="relative flex items-center gap-1 bg-white/70 dark:bg-[#141722] p-1 rounded-2xl border border-white/80 dark:border-white/10 text-xs font-semibold shadow-2xs backdrop-blur-xl">
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
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === p.id && !startDateParam
                    ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs font-bold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Date Range Toggle Button & Popover with Click-Away Ref */}
            <div ref={datePickerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setCustomStart(startDateParam || metrics?.store_inception_date || "2026-05-10");
                  setCustomEnd(endDateParam || metrics?.today_date || "2026-09-24");
                  setShowDatePicker(!showDatePicker);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  period === "custom" || (startDateParam && endDateParam)
                    ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs font-bold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {period === "custom" && startDateParam && endDateParam
                    ? `${startDateParam.split("-").slice(1).reverse().join(".")} - ${endDateParam.split("-").slice(1).reverse().join(".")}`
                    : (lang === "ru" ? "Выбрать дату" : lang === "en" ? "Custom date" : "Sana tanlash")}
                </span>
              </button>

              {/* Date Range Popover */}
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2.5 z-50 w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-[#161b26] border border-neutral-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.22)] space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/10">
                    <div className="font-bold text-neutral-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#211b2e] dark:text-[#c8ff6a]" />
                      <span>{lang === "ru" ? "Диапазон дат" : lang === "en" ? "Date Range" : "Sana oralig'i"}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {lang === "ru" ? "Реальные даты" : lang === "en" ? "Valid dates only" : "Haqiqiy sanalar"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                        {lang === "ru" ? "От (не раньше даты магазина)" : lang === "en" ? "From (after store creation)" : "Boshlanish (do'kon ochilishidan)"}
                      </label>
                      <input
                        type="date"
                        value={customStart}
                        min={metrics?.store_inception_date || "2026-05-10"}
                        max={metrics?.today_date || "2026-09-24"}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-white/80 dark:bg-white/5 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#c8ff6a]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 mb-1">
                        {lang === "ru" ? "До (не позже сегодня)" : lang === "en" ? "To (no future dates)" : "Tugash (bugundan oshmasin)"}
                      </label>
                      <input
                        type="date"
                        value={customEnd}
                        min={customStart || metrics?.store_inception_date || "2026-05-10"}
                        max={metrics?.today_date || "2026-09-24"}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-white/10 bg-white/80 dark:bg-white/5 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#c8ff6a]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/10">
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
                      className="flex-1 py-1.5 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer text-center"
                    >
                      {lang === "ru" ? "Применить" : lang === "en" ? "Apply" : "Qo'llash"}
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
                        setCustomStart("");
                        setCustomEnd("");
                        setShowDatePicker(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      {lang === "ru" ? "Сброс" : lang === "en" ? "Reset" : "Tozalash"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-white/70 dark:bg-[#141722] p-1 rounded-2xl border border-white/80 dark:border-white/10 text-xs font-bold shadow-2xs backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setCurrency("UZS")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                currency === "UZS"
                  ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs font-bold"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              UZS
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                currency === "USD"
                  ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs font-bold"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              USD
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            className="w-9 h-9 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
            title={t("refresh_data") || "Ma'lumotlarni yangilash"}
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-slate-600 dark:text-slate-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP 4 GLASSMORPHISM & NEUMORPHISM REAL KPI CARDS     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jami tushum (Total Revenue) */}
        <div className="bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                {t("total_revenue") || "Jami tushum"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {formatMoney(metrics?.revenue || 0)}
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                {t("with_delivery") || "Yetkazib berish bilan:"} {formatMoney(metrics?.sales_sum || 0)}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {t("active_sales") || "Faol savdolar"}
            </span>
            <span className="text-neutral-400 text-[11px]">
              {periods.find((p) => p.id === period)?.label}
            </span>
          </div>
        </div>

        {/* Card 2: Buyurtmalar soni (Total Orders) */}
        <div className="bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                {t("orders") || "Buyurtmalar"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {metrics?.orders_count || 0} <span className="text-base font-normal text-neutral-400">{t("pcs_unit") || "ta"}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span className="text-slate-600 dark:text-slate-400 font-bold">{metrics?.new_orders || 0} {t("new") || "yangi"}</span>
                <span>•</span>
                <span>{metrics?.ready_orders || 0} {t("status_ready") || "tayyor"}</span>
                {metrics?.cancelled_orders ? (
                  <>
                    <span>•</span>
                    <span className="text-rose-500">{metrics.cancelled_orders} {t("status_cancelled") || "bekor"}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <Link
              to="/orders"
              className="text-neutral-900 dark:text-white font-bold hover:underline flex items-center gap-1"
            >
              <span>{t("go_to_orders") || "Buyurtmalarga o'tish"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-neutral-400 text-[11px]">{t("management") || "Boshqaruv"}</span>
          </div>
        </div>

        {/* Card 3: Faol mijozlar (Active Customers) */}
        <div className="bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                {t("customer_base") || "Mijozlar bazasi"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {metrics?.total_customers || 0}
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                {t("regular_repeat_buyers") || "Doimiy va qayta xarid qilganlar"}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <Link
              to="/customers"
              className="text-neutral-900 dark:text-white font-bold hover:underline flex items-center gap-1"
            >
              <span>{t("go_to_customers") || "Mijozlar ro'yxati"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-neutral-400 text-[11px]">CRM</span>
          </div>
        </div>

        {/* Card 4: O'rtacha chek (Average Check) */}
        <div className="bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-lg transition-all flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                {t("avg_check_title") || "O'rtacha chek"}
              </span>
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 shadow-md flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {formatMoney(metrics?.avg_order || 0)}
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                {t("single_order_value") || "Bitta xarid uchun o'rtacha qiymat"}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("stable_metric") || "Barqaror"}
            </span>
            <span className="text-neutral-400 text-[11px]">{t("indicator") || "Ko'rsatkich"}</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MIDDLE SECTION: REVENUE DYNAMICS & SALES CHANNELS     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Revenue Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 sm:p-6 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {chartType === "heatmap" ? "Faollik taqvimi" : "Savdolar grafigi"}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                {chartType === "heatmap" ? "Yillik buyurtmalar xaritasi" : (t("revenue_dynamics") || "Tushum dinamikasi")}
              </h2>
            </div>

            {/* Bar vs Line vs GitHub Heatmap Switcher */}
            <div className="flex items-center gap-1 bg-white/70 dark:bg-[#141722] p-1 rounded-xl border border-white/80 dark:border-white/10 shadow-2xs">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartType === "bar"
                    ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-2xs font-bold"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
                title="Ustunli grafik"
              >
                <BarChart3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("line")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartType === "line"
                    ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-2xs font-bold"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
                title="Chiziqli grafik"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setChartType("heatmap")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartType === "heatmap"
                    ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-2xs font-bold"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
                title="GitHub uslubidagi faollik xaritasi (Heatmap)"
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

          <div className="min-h-[16rem] sm:min-h-[18rem] w-full flex items-center">
            {chartType === "heatmap" ? (
              <ContributionHeatmap
                heatmap={charts?.heatmap}
                currency={currency}
                formatMoney={formatMoney}
              />
            ) : charts && charts.labels && charts.labels.length > 0 ? (
              <div className="h-64 sm:h-72 w-full">
                {chartType === "bar" ? (
                  <Bar data={chartData} options={chartOptions} />
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs font-medium">
                {t("no_sales_yet") || "Tanlangan davr uchun savdo ma'lumotlari mavjud emas"}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sales Channels & Traffic (4 cols) */}
        <div className="lg:col-span-4 bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 sm:p-6 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              {t("traffic_source") || "Savdo kanallari"}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5 mb-4">
              {t("order_sources") || "Buyurtmalar manbai"}
            </h2>

            {/* Channels Cards */}
            <div className="space-y-3">
              {/* Telegram Bot */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] flex items-center justify-center font-bold shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">Telegram Bot</div>
                    <div className="text-[10px] text-neutral-400">
                      {metrics?.tma_cnt || 0} {t("orders_count_format") || "ta buyurtma"} ({tmaTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.telegram_bot_username ? (
                  <a
                    href={`https://t.me/${store.telegram_bot_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] text-[11px] font-bold hover:opacity-90 flex items-center gap-1 transition-opacity"
                  >
                    <span>{t("open") || "Ochish"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    to="/platforms"
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 text-[11px] font-bold hover:bg-neutral-300 transition-colors"
                  >
                    {t("connect") || "Ulash"}
                  </Link>
                )}
              </div>

              {/* Web Storefront */}
              <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] flex items-center justify-center font-bold shadow-xs">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">{t("website_channel") || "Veb-sayt"}</div>
                    <div className="text-[10px] text-neutral-400">
                      {metrics?.web_cnt || 0} {t("orders_count_format") || "ta buyurtma"} ({webTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.subdomain && (
                  <a
                    href={store.storefront_url || `/store/${store.subdomain}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] text-[11px] font-bold hover:opacity-90 flex items-center gap-1 transition-opacity"
                  >
                    <span>{t("website") || "Sayt"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Doughnut Traffic chart */}
          <div className="pt-4 mt-4 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between">
            <div className="w-24 h-24 relative">
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
              <div className="flex items-center justify-end gap-1.5 font-bold text-neutral-600 dark:text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-[#211b2e] dark:bg-white/40"></span>
                <span>Telegram: {tmaTrafficPct}%</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 font-bold text-[#211b2e] dark:text-[#c8ff6a]">
                <span className="w-2 h-2 rounded-full bg-[#c8ff6a]"></span>
                <span>{t("website_channel") || "Veb-sayt"}: {webTrafficPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. LOWER ROW: TOP PRODUCTS & LIVE ORDERS MAP             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Top Products List & ABC-XYZ Analysis (6 cols) */}
        <div className="lg:col-span-6 bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 sm:p-6 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {productTab === "top" ? (t("sales_leaders") || (lang === "ru" ? "Лидеры продаж" : lang === "en" ? "Sales Leaders" : "Sotuvlar yetakchilari")) : "FanRuan Sales Methodology"}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                  {productTab === "top" ? (t("top_products") || (lang === "ru" ? "Топ товары" : lang === "en" ? "Top Products" : "Top mahsulotlar")) : (lang === "ru" ? "ABC-анализ продаж" : lang === "en" ? "ABC Sales Analysis" : "ABC savdo tahlili")}
                </h2>
              </div>

              {/* Segmented Switcher: Top vs ABC */}
              <div className="flex items-center gap-1 bg-white/70 dark:bg-[#141722] p-1 rounded-xl border border-white/80 dark:border-white/10 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProductTab("top")}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                    productTab === "top"
                      ? "bg-[#18181b] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#18181b] shadow-2xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  {lang === "ru" ? "Топ" : lang === "en" ? "Top" : (t("top_products") || "Top")}
                </button>
                <button
                  type="button"
                  onClick={() => setProductTab("abc")}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 font-bold ${
                    productTab === "abc"
                      ? "bg-[#18181b] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#18181b] shadow-2xs"
                      : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                  title="FanRuan ABC Analysis (80% / 15% / 5%)"
                >
                  <Layers className="w-3 h-3 text-[#c8ff6a]" />
                  <span>{lang === "ru" ? "ABC-анализ" : lang === "en" ? "ABC Analysis" : "ABC-tahlil"}</span>
                </button>
              </div>
            </div>

            {productTab === "top" ? (
              <div className="space-y-2.5">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/5 hover:bg-white/90 dark:hover:bg-white/10 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-white to-[#edf3f9] dark:from-white/10 dark:to-white/5 border border-white/90 dark:border-white/10 text-neutral-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {p.product_name}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {p.sold_qty} {t("pcs_unit") || (lang === "ru" ? "шт" : lang === "en" ? "pcs" : "dona")}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-xs font-bold text-neutral-900 dark:text-white">
                      {formatMoney(p.sold_sum || 0)}
                    </div>
                  </div>
                ))}

                {topProducts.length === 0 && (
                  <div className="py-10 text-center space-y-2">
                    <Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                    <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      {t("no_sales_yet") || (lang === "ru" ? "Пока нет продаж" : lang === "en" ? "No sales yet" : "Hozircha sotilgan mahsulotlar mavjud emas")}
                    </div>
                    <Link
                      to="/products"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#18181b] text-xs font-bold shadow-xs hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t("products") || (lang === "ru" ? "Добавить товар" : lang === "en" ? "Add Product" : "Mahsulot qo'shish")}</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              /* ABC Analysis (FanRuan Methodology - StoreBox Brand Colors) */
              <div className="space-y-3.5">
                {/* 3 Summary Groups Badges: Signature StoreBox Black + Neon Lime Theme */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {/* Group A (80% Locomotives) */}
                  <div className="p-3 rounded-2xl bg-[#18181b] border border-[#a3e635]/40 text-center shadow-md relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-14 h-14 bg-[#a3e635]/15 rounded-full blur-xl pointer-events-none"></div>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-[#a3e635] text-[#18181b] font-black text-xs flex items-center justify-center shadow-xs">A</span>
                      <span className="text-xs font-black text-[#a3e635]">~80%</span>
                    </div>
                    <div className="text-xs font-black text-white mt-1.5">
                      {abcAnalysis?.group_a.count || 0} {lang === "ru" ? "тов." : lang === "en" ? "items" : "ta"} ({abcAnalysis?.group_a.pct || 0}%)
                    </div>
                    <div className="text-[10px] font-medium text-neutral-400 truncate mt-0.5">
                      {lang === "ru" ? "Главные драйверы" : lang === "en" ? "Core Drivers" : "Lokomotivlar"}
                    </div>
                  </div>

                  {/* Group B (15% Stable Demand) */}
                  <div className="p-3 rounded-2xl bg-[#18181b] border border-white/15 text-center shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-white/20 text-white font-black text-xs flex items-center justify-center">B</span>
                      <span className="text-xs font-bold text-neutral-200">~15%</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1.5">
                      {abcAnalysis?.group_b.count || 0} {lang === "ru" ? "тов." : lang === "en" ? "items" : "ta"} ({abcAnalysis?.group_b.pct || 0}%)
                    </div>
                    <div className="text-[10px] font-medium text-neutral-400 truncate mt-0.5">
                      {lang === "ru" ? "Стабильный спрос" : lang === "en" ? "Stable Demand" : "Barqaror tovarlar"}
                    </div>
                  </div>

                  {/* Group C (5% Long Tail) */}
                  <div className="p-3 rounded-2xl bg-[#18181b] border border-white/10 text-center shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-white/10 text-neutral-400 font-bold text-xs flex items-center justify-center">C</span>
                      <span className="text-xs font-semibold text-neutral-400">~5%</span>
                    </div>
                    <div className="text-xs font-bold text-neutral-300 mt-1.5">
                      {abcAnalysis?.group_c.count || 0} {lang === "ru" ? "тов." : lang === "en" ? "items" : "ta"} ({abcAnalysis?.group_c.pct || 0}%)
                    </div>
                    <div className="text-[10px] font-medium text-neutral-500 truncate mt-0.5">
                      {lang === "ru" ? "Хвост продаж" : lang === "en" ? "Long Tail" : "Kam aylanuvchi"}
                    </div>
                  </div>
                </div>

                {/* Table of items */}
                <div className="overflow-x-auto max-h-72 no-scrollbar rounded-xl border border-black/[0.06] dark:border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181b] text-[10px] uppercase text-neutral-300 font-bold sticky top-0 border-b border-white/10">
                      <tr>
                        <th className="py-2.5 px-2.5">{lang === "ru" ? "Группа" : lang === "en" ? "Group" : "Guruh"}</th>
                        <th className="py-2.5 px-2.5">{lang === "ru" ? "Товар" : lang === "en" ? "Product" : "Mahsulot"}</th>
                        <th className="py-2.5 px-2 text-right">{lang === "ru" ? "Кол-во" : lang === "en" ? "Qty" : "Soni"}</th>
                        <th className="py-2.5 px-2 text-right">{lang === "ru" ? "Выручка" : lang === "en" ? "Revenue" : "Tushum"}</th>
                        <th className="py-2.5 px-2 text-right">{lang === "ru" ? "Доля" : lang === "en" ? "Share" : "Ulush"}</th>
                        <th className="py-2.5 px-2 text-right">{lang === "ru" ? "Итог" : lang === "en" ? "Cumul." : "Jamlanma"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/5 bg-white/40 dark:bg-transparent">
                      {(abcAnalysis?.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/60 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2 px-2.5">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-black ${
                                item.group === "A"
                                  ? "bg-[#18181b] text-[#a3e635] border border-[#a3e635]/60 shadow-xs"
                                  : item.group === "B"
                                  ? "bg-neutral-800 text-neutral-200 border border-neutral-600"
                                  : "bg-neutral-900 text-neutral-400 border border-neutral-700"
                              }`}
                            >
                              {item.group}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-neutral-800 dark:text-white truncate max-w-[130px]">
                            {item.product_name}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-500 font-mono">
                            {item.sold_qty}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-neutral-900 dark:text-white whitespace-nowrap">
                            {formatMoney(item.sold_sum)}
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                            {item.share_pct}%
                          </td>
                          <td className="py-2 px-2 text-right text-neutral-500 font-mono text-[11px]">
                            {item.cum_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between pt-1">
                  <span>{lang === "ru" ? "Методология FanRuan ABC: A (80%), B (15%), C (5%)" : lang === "en" ? "FanRuan ABC Methodology: A (80%), B (15%), C (5%)" : "FanRuan ABC tahlili: A (80%), B (15%), C (5%)"}</span>
                  <Link to="/products" className="text-slate-600 dark:text-slate-400 font-bold hover:underline">
                    {t("all_products") || (lang === "ru" ? "Все товары" : lang === "en" ? "All Products" : "Barcha mahsulotlar")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Deliveries Map (6 cols) */}
        <div className="lg:col-span-6 bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl rounded-[28px] border border-white/85 dark:border-white/10 p-5 sm:p-6 shadow-[0_16px_36px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {t("logistics_addresses") || "Logistika & Manzillar"}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight mt-0.5">
                  {t("orders_map") || "Jonli buyurtmalar xaritasi"}
                </h2>
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping"></span>
                <span>{t("live_gps") || "GPS faol"}</span>
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/10 h-64 relative z-10">
              <MapContainer
                center={[41.2995, 69.2401]}
                zoom={11}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; Google Maps'
                  url="https://mt{s}.google.com/vt/lyrs=m&hl=ru&x={x}&y={y}&z={z}"
                  subdomains={["0", "1", "2", "3"]}
                  maxZoom={20}
                />
                {mapOrders.map((o, idx) => (
                  <Marker key={idx} position={[o.lat, o.lng]} icon={defaultPinIcon}>
                    <Popup>
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-900">#{o.num} — {o.client}</div>
                        <div className="text-neutral-900 dark:text-white font-bold">{formatMoney(o.total)}</div>
                        <div className="text-[10px] text-slate-500">{o.status}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs text-neutral-400">
            <span>{mapOrders.length} {t("orders_unit") || "ta buyurtma"}</span>
            <Link to="/orders" className="text-neutral-900 dark:text-white font-bold hover:underline">
              {t("all_orders") || "Barcha buyurtmalar"}
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. QUICK ACTIONS ROW (Direct access to platform features) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/products"
          className="p-3.5 rounded-2xl bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl border border-white/85 dark:border-white/10 hover:border-white dark:hover:border-white/30 transition-all shadow-[0_8px_20px_-6px_rgba(15,23,42,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-md flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-[#edf3f9] dark:from-white/10 dark:to-white/5 border border-white/95 dark:border-white/10 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08),inset_0_2px_3px_#fff,inset_0_-2px_3px_rgba(148,163,184,0.18)] text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              {t("products") || "Mahsulotlar"}
            </div>
            <div className="text-[10px] text-neutral-400">{t("catalog_management") || "Katalog boshqaruvi"}</div>
          </div>
        </Link>

        <Link
          to="/orders"
          className="p-3.5 rounded-2xl bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl border border-white/85 dark:border-white/10 hover:border-white dark:hover:border-white/30 transition-all shadow-[0_8px_20px_-6px_rgba(15,23,42,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-md flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-[#edf3f9] dark:from-white/10 dark:to-white/5 border border-white/95 dark:border-white/10 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08),inset_0_2px_3px_#fff,inset_0_-2px_3px_rgba(148,163,184,0.18)] text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              {t("orders") || "Buyurtmalar"}
            </div>
            <div className="text-[10px] text-neutral-400">{t("status_and_delivery") || "Holat va yetkazish"}</div>
          </div>
        </Link>

        <Link
          to="/chats"
          className="p-3.5 rounded-2xl bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl border border-white/85 dark:border-white/10 hover:border-white dark:hover:border-white/30 transition-all shadow-[0_8px_20px_-6px_rgba(15,23,42,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-md flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-[#edf3f9] dark:from-white/10 dark:to-white/5 border border-white/95 dark:border-white/10 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08),inset_0_2px_3px_#fff,inset_0_-2px_3px_rgba(148,163,184,0.18)] text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              {t("chat") || "Mijozlar chati"}
            </div>
            <div className="text-[10px] text-neutral-400">{t("quick_replies") || "Tezkor javoblar"}</div>
          </div>
        </Link>

        <Link
          to="/marketing"
          className="p-3.5 rounded-2xl bg-white/75 dark:bg-[#161b26]/75 backdrop-blur-2xl border border-white/85 dark:border-white/10 hover:border-white dark:hover:border-white/30 transition-all shadow-[0_8px_20px_-6px_rgba(15,23,42,0.05),inset_0_1.5px_2px_rgba(255,255,255,0.95)] hover:shadow-md flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-[#edf3f9] dark:from-white/10 dark:to-white/5 border border-white/95 dark:border-white/10 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.08),inset_0_2px_3px_#fff,inset_0_-2px_3px_rgba(148,163,184,0.18)] text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              {t("marketing") || "Marketing"}
            </div>
            <div className="text-[10px] text-neutral-400">{t("promotions_and_alerts") || "Aksiya va xabarnoma"}</div>
          </div>
        </Link>
      </div>
    </div>
  );
};
