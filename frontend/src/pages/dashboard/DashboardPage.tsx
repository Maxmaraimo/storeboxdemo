import React, { useState } from "react";
import { Link } from "react-router-dom";
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

interface MapOrder {
  num: string;
  client: string;
  lat: number;
  lng: number;
  total: number;
  status: string;
}

export const DashboardPage: React.FC = () => {
  const { store } = useAuth();
  const [period, setPeriod] = useState<string>("today");
  const [currency, setCurrency] = useState<"UZS" | "USD">("UZS");
  const [chartType, setChartType] = useState<"bar" | "line" | "heatmap">("bar");

  const UZS_TO_USD_RATE = 12800;

  const formatMoney = (sum: number) => {
    if (currency === "USD") {
      const usd = sum / UZS_TO_USD_RATE;
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${Math.round(sum).toLocaleString("uz-UZ")} UZS`;
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["dashboard-summary", period],
    queryFn: async () => {
      const res = await api.get(`/dashboard/summary/?period=${period}`);
      return res.data as {
        metrics: DashboardMetrics;
        charts: DashboardCharts;
        top_products: TopProduct[];
        map_orders: MapOrder[];
      };
    },
    refetchInterval: 30000, // auto-refresh every 30s
  });

  const metrics = data?.metrics;
  const charts = data?.charts;
  const topProducts = data?.top_products || [];
  const mapOrders = data?.map_orders || [];

  const periods = [
    { id: "today", label: "Bugun" },
    { id: "week", label: "Oxirgi 7 kun" },
    { id: "month", label: "Oxirgi 30 kun" },
    { id: "quarter", label: "Shu chorak" },
    { id: "year", label: "Har yil" },
  ];

  const totalTraffic = (charts?.traffic?.web || 0) + (charts?.traffic?.telegram || 0);
  const webTrafficPct = totalTraffic > 0 ? Math.round(((charts?.traffic?.web || 0) / totalTraffic) * 100) : 50;
  const tmaTrafficPct = totalTraffic > 0 ? 100 - webTrafficPct : 50;

  // Chart configurations with pure neutral theme
  const chartData = {
    labels: charts?.labels || [],
    datasets: [
      {
        label: `Tushum (${currency})`,
        data: (charts?.revenue || []).map((val) =>
          currency === "USD" ? Number((val / UZS_TO_USD_RATE).toFixed(2)) : val
        ),
        backgroundColor: chartType === "bar" ? "rgba(16, 185, 129, 0.85)" : "rgba(16, 185, 129, 0.15)",
        borderColor: "#10B981",
        borderWidth: chartType === "line" ? 3 : 0,
        borderRadius: chartType === "bar" ? 8 : 0,
        fill: chartType === "line",
        tension: 0.35,
        pointBackgroundColor: "#10B981",
        pointBorderColor: "#FFFFFF",
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
        backgroundColor: ["#10B981", "#3B82F6"],
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Jonli monitoring tizimi
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            {store?.name || "Boshqaruv paneli"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Real vaqtdagi savdolar, buyurtmalar, mijozlar va logistika ko'rsatkichlari
          </p>
        </div>

        {/* Action Controls: Periods, Currency, Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Working Period filter pills */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-white/5 p-1 rounded-2xl border border-black/[0.06] dark:border-white/10 text-xs font-semibold shadow-2xs backdrop-blur-xl">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  period === p.id
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1 bg-white/80 dark:bg-white/5 p-1 rounded-2xl border border-black/[0.06] dark:border-white/10 text-xs font-bold shadow-2xs backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setCurrency("UZS")}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                currency === "UZS"
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold"
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
                  ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-bold"
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
            className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
            title="Ma'lumotlarni yangilash"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP 4 APPLE GLASSMORPHISM REAL KPI CARDS             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jami tushum (Total Revenue) */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Jami tushum
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                {formatMoney(metrics?.revenue || 0)}
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Yetkazib berish bilan: {formatMoney(metrics?.sales_sum || 0)}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Faol savdolar
            </span>
            <span className="text-neutral-400 text-[11px]">
              {periods.find((p) => p.id === period)?.label}
            </span>
          </div>
        </div>

        {/* Card 2: Buyurtmalar soni (Total Orders) */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Buyurtmalar
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                {metrics?.orders_count || 0} <span className="text-base font-normal text-neutral-400">ta</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                <span className="text-emerald-600 font-bold">{metrics?.new_orders || 0} yangi</span>
                <span>•</span>
                <span>{metrics?.ready_orders || 0} tayyor</span>
                {metrics?.cancelled_orders ? (
                  <>
                    <span>•</span>
                    <span className="text-rose-500">{metrics.cancelled_orders} bekor</span>
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
              <span>Buyurtmalarga o'tish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-neutral-400 text-[11px]">Boshqaruv</span>
          </div>
        </div>

        {/* Card 3: Faol mijozlar (Active Customers) */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Mijozlar bazasi
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                {metrics?.total_customers || 0} <span className="text-base font-normal text-neutral-400">nafar</span>
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Doimiy va qayta xarid qilganlar
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <Link
              to="/customers"
              className="text-neutral-900 dark:text-white font-bold hover:underline flex items-center gap-1"
            >
              <span>Mijozlar ro'yxati</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-neutral-400 text-[11px]">CRM</span>
          </div>
        </div>

        {/* Card 4: O'rtacha chek (Average Check) */}
        <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                O'rtacha chek
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono tracking-tight">
                {formatMoney(metrics?.avg_order || 0)}
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                Bitta xarid uchun o'rtacha qiymat
              </div>
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Barqaror
            </span>
            <span className="text-neutral-400 text-[11px]">Ko'rsatkich</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MIDDLE SECTION: REVENUE DYNAMICS & SALES CHANNELS     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Revenue Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                {chartType === "heatmap" ? "Faollik taqvimi" : "Savdolar grafigi"}
              </div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight mt-0.5">
                {chartType === "heatmap" ? "Yillik buyurtmalar xaritasi" : "Tushum dinamikasi"}
              </h2>
            </div>

            {/* Bar vs Line vs GitHub Heatmap Switcher */}
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-white/5 p-1 rounded-xl border border-black/[0.04] dark:border-white/10">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  chartType === "bar"
                    ? "bg-white dark:bg-white/20 text-neutral-900 dark:text-white shadow-2xs"
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
                    ? "bg-white dark:bg-white/20 text-neutral-900 dark:text-white shadow-2xs"
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
                    ? "bg-white dark:bg-white/20 text-emerald-600 dark:text-emerald-400 shadow-2xs"
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
                Tanlangan davr uchun savdo ma'lumotlari mavjud emas
              </div>
            )}
          </div>
        </div>

        {/* Right: Sales Channels & Traffic (4 cols) */}
        <div className="lg:col-span-4 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Savdo kanallari
            </div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight mt-0.5 mb-4">
              Buyurtmalar manbai
            </h2>

            {/* Channels Cards */}
            <div className="space-y-3">
              {/* Telegram Bot */}
              <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">Telegram Bot</div>
                    <div className="text-[10px] text-neutral-400">
                      {metrics?.tma_cnt || 0} ta buyurtma ({tmaTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.telegram_bot_username ? (
                  <a
                    href={`https://t.me/${store.telegram_bot_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 text-[11px] font-bold hover:bg-sky-100 dark:hover:bg-sky-900/60 flex items-center gap-1 transition-colors"
                  >
                    <span>Ochish</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <Link
                    to="/platforms"
                    className="px-2.5 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 text-[11px] font-bold hover:bg-neutral-300 transition-colors"
                  >
                    Ulash
                  </Link>
                )}
              </div>

              {/* Web Storefront */}
              <div className="p-3.5 rounded-2xl bg-neutral-50/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">Veb-sayt</div>
                    <div className="text-[10px] text-neutral-400">
                      {metrics?.web_cnt || 0} ta buyurtma ({webTrafficPct}%)
                    </div>
                  </div>
                </div>

                {store?.subdomain && (
                  <a
                    href={`/store/${store.subdomain}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-1 transition-colors"
                  >
                    <span>Sayt</span>
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
              <div className="flex items-center justify-end gap-1.5 font-bold text-sky-500">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span>Telegram: {tmaTrafficPct}%</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 font-bold text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Veb-sayt: {webTrafficPct}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. LOWER ROW: TOP PRODUCTS & LIVE ORDERS MAP             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Top Products List (6 cols) */}
        <div className="lg:col-span-6 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Sotuvlar yetakchilari
                </div>
                <h2 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight mt-0.5">
                  Top mahsulotlar
                </h2>
              </div>
              <Link
                to="/products"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Barcha mahsulotlar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {topProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/5 hover:bg-neutral-100/80 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="w-6 h-6 rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {p.product_name}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {p.sold_qty} dona sotildi
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-xs font-bold text-neutral-900 dark:text-white">
                    {formatMoney(p.sold_sum || 0)}
                  </div>
                </div>
              ))}

              {topProducts.length === 0 && (
                <div className="py-10 text-center space-y-2">
                  <Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                  <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Hozircha sotilgan mahsulotlar mavjud emas
                  </div>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold shadow-xs hover:bg-black transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mahsulot qo'shish</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Deliveries Map (6 cols) */}
        <div className="lg:col-span-6 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-[28px] border border-black/[0.06] dark:border-white/10 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Logistika & Manzillar
                </div>
                <h2 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight mt-0.5">
                  Jonli buyurtmalar xaritasi
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>GPS faol</span>
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapOrders.map((o, idx) => (
                  <Marker key={idx} position={[o.lat, o.lng]} icon={defaultPinIcon}>
                    <Popup>
                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-900">#{o.num} — {o.client}</div>
                        <div className="font-mono text-emerald-600 font-bold">{formatMoney(o.total)}</div>
                        <div className="text-[10px] text-slate-500">{o.status}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/5 flex items-center justify-between text-xs text-neutral-400">
            <span>Xaritadagi nuqtalar: {mapOrders.length} ta yetkazuv manzili</span>
            <Link to="/orders" className="text-neutral-900 dark:text-white font-bold hover:underline">
              Barcha buyurtmalar
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
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-xs flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              Mahsulotlar
            </div>
            <div className="text-[10px] text-neutral-400">Katalog boshqaruvi</div>
          </div>
        </Link>

        <Link
          to="/orders"
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-xs flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              Buyurtmalar
            </div>
            <div className="text-[10px] text-neutral-400">Holat va yetkazish</div>
          </div>
        </Link>

        <Link
          to="/chats"
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-xs flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              Mijozlar chati
            </div>
            <div className="text-[10px] text-neutral-400">Tezkor javoblar</div>
          </div>
        </Link>

        <Link
          to="/marketing"
          className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all shadow-xs flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white flex items-center justify-center group-hover:scale-105 transition-transform">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
              Marketing
            </div>
            <div className="text-[10px] text-neutral-400">Aksiya va xabarnoma</div>
          </div>
        </Link>
      </div>
    </div>
  );
};
