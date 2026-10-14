import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Calendar,
  RefreshCw,
  Globe,
  Bot,
  Instagram,
  BarChart3,
  LineChart as LineChartIcon,
  Store as StoreIcon,
  WalletCards,
  ShoppingBag,
  UsersRound,
  ReceiptText,
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
  Filler
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { DashboardOrderMap } from "./DashboardOrderMap";
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
  Filler
);
ChartJS.defaults.font.family = 'Inter, "Segoe UI", Arial, sans-serif';

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
  instagram_cnt: number;
}

interface DashboardCharts {
  labels: string[];
  revenue: number[];
  hourly_orders?: {
    labels: string[];
    new: number[];
    cancelled: number[];
    completed: number[];
  };
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

interface MapBranch {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface TopCustomer {
  customer_phone: string;
  name: string;
  orders_count: number;
  total_spent: number;
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
  const [chartType, setChartType] = useState<"line" | "bar" | "heatmap">("bar");
  const [productTab, setProductTab] = useState<"top" | "abc">("top");
  const [showBranches, setShowBranches] = useState(true);
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
        top_customers?: TopCustomer[];
        abc_analysis?: AbcAnalysis;
        map_orders: MapOrder[];
        map_branches?: MapBranch[];
        regions_breakdown?: RegionBreakdown[];
      };
    },
    refetchInterval: 30000,
  });

  const metrics = data?.metrics;
  const charts = data?.charts;
  const topProducts = data?.top_products || [];
  const topCustomers = data?.top_customers || [];
  const abcAnalysis = data?.abc_analysis;
  const validCoordinates = (lat: number, lng: number) =>
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const mapOrders = useMemo(
    () => (data?.map_orders || []).filter((order) => validCoordinates(order.lat, order.lng)),
    [data?.map_orders]
  );
  const mapBranches = useMemo(
    () => (data?.map_branches || []).filter((location) => validCoordinates(location.latitude, location.longitude)),
    [data?.map_branches]
  );
  const regionsBreakdown = data?.regions_breakdown || [];
  const periods = [
    { id: "today", label: t("today") || (lang === "ru" ? "Сегодня" : lang === "en" ? "Today" : "Bugun") },
    { id: "week", label: t("last_7_days") || (lang === "ru" ? "7 дней" : lang === "en" ? "7 days" : "Oxirgi 7 kun") },
    { id: "month", label: t("last_30_days") || (lang === "ru" ? "30 дней" : lang === "en" ? "30 days" : "Oxirgi 30 kun") },
    { id: "quarter", label: t("this_quarter") || (lang === "ru" ? "Квартал" : lang === "en" ? "Quarter" : "Shu chorak") },
    { id: "year", label: t("this_year") || (lang === "ru" ? "Год" : lang === "en" ? "Year" : "Har yil") },
  ];

  const channelTotal = (metrics?.web_cnt || 0) + (metrics?.tma_cnt || 0) + (metrics?.instagram_cnt || 0);
  const channels = [
    { key: "telegram", label: "Telegram Mini App", count: metrics?.tma_cnt || 0, color: "#6d5a88", icon: Bot },
    { key: "website", label: lang === "ru" ? "Веб-сайт" : lang === "en" ? "Website" : "Veb-sayt", count: metrics?.web_cnt || 0, color: "#7d9bd0", icon: Globe },
    ...(metrics?.instagram_cnt ? [{ key: "instagram", label: "Instagram", count: metrics.instagram_cnt, color: "#c071a8", icon: Instagram }] : []),
  ];

  // Use the marketing site's ink and violet palette for dashboard charts.
  const chartData = {
    labels: charts?.labels || [],
    datasets: [
      {
        label: `${t("revenue") || (lang === "ru" ? "Выручка" : lang === "en" ? "Revenue" : "Tushum")} (${currency})`,
        data: (charts?.revenue || []).map((val) =>
          currency === "USD" ? Number((val / UZS_TO_USD_RATE).toFixed(2)) : val
        ),
        backgroundColor: chartType === "bar" ? "#211b2e" : "rgba(33, 27, 46, 0.13)",
        borderColor: "#211b2e",
        borderWidth: chartType === "line" ? 2.5 : 0,
        borderRadius: chartType === "bar" ? 5 : 0,
        fill: chartType === "line",
        tension: 0.35,
        pointBackgroundColor: "#211b2e",
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

  const hourlyOrders = charts?.hourly_orders;
  const hourlyOrderData = {
    labels: hourlyOrders?.labels || [],
    datasets: [
      {
        label: lang === "ru" ? "Новые" : lang === "en" ? "New" : "Yangi",
        data: hourlyOrders?.new || [],
        backgroundColor: "#a3e635",
        borderRadius: 4,
        maxBarThickness: 12,
      },
      {
        label: lang === "ru" ? "Отменены" : lang === "en" ? "Cancelled" : "Bekor qilingan",
        data: hourlyOrders?.cancelled || [],
        backgroundColor: "#ef8294",
        borderRadius: 4,
        maxBarThickness: 12,
      },
      {
        label: lang === "ru" ? "Завершены" : lang === "en" ? "Completed" : "Bajarilgan",
        data: hourlyOrders?.completed || [],
        backgroundColor: "#8e7bae",
        borderRadius: 4,
        maxBarThickness: 12,
      },
    ],
  };
  const hourlyOrderOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, color: "#686475", font: { size: 11 } },
      },
      tooltip: { backgroundColor: "#211b2e", padding: 10, cornerRadius: 9 },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0, color: "#8a8497" }, grid: { color: "#ebe8f0" }, border: { display: false } },
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12, color: "#8a8497" }, grid: { display: false }, border: { display: false } },
    },
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header Bar: Store Title & Period Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold text-[#171321] dark:text-white tracking-[-0.04em] leading-tight">
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
          <div ref={datePickerRef} className="relative max-w-full">
            <div className="dashboard-period-switcher max-w-full overflow-x-auto no-scrollbar" role="group" aria-label={lang === "ru" ? "Период статистики" : lang === "en" ? "Statistics period" : "Statistika davri"}>
              {periods.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={period === p.id && !startDateParam}
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
                  className={`dashboard-period-tab ${period === p.id && !startDateParam ? "is-active" : ""}`}
                >
                  {p.label}
                </button>
              ))}

              {/* Custom date range */}
              <button
                type="button"
                aria-pressed={period === "custom" || Boolean(startDateParam && endDateParam)}
                aria-expanded={showDatePicker}
                aria-haspopup="dialog"
                onClick={() => {
                  setCustomStart(startDateParam || metrics?.store_inception_date || "2026-05-10");
                  setCustomEnd(endDateParam || metrics?.today_date || "2026-10-11");
                  setShowDatePicker(!showDatePicker);
                }}
                className={`dashboard-period-tab ${period === "custom" || (startDateParam && endDateParam) ? "is-active" : ""}`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {period === "custom" && startDateParam && endDateParam
                    ? `${startDateParam.slice(5)} - ${endDateParam.slice(5)}`
                    : lang === "ru"
                    ? "Даты"
                    : "Sana"}
                </span>
              </button>
            </div>

            {showDatePicker && (
                <div role="dialog" aria-label={lang === "ru" ? "Выбор периода" : lang === "en" ? "Choose date range" : "Sana oralig'i"} className="absolute right-0 top-full mt-2 z-30 w-72 max-w-[calc(100vw-2rem)] p-4 rounded-[18px] bg-white dark:bg-zinc-900 border border-[#dfe5ef] dark:border-zinc-800 shadow-xl space-y-3">
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

      {/* Four site-styled metrics in one row on desktop. */}
      <div className="dashboard-kpi-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="dashboard-kpi-card flex min-w-0 flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#686475] dark:text-zinc-400">
              <span>{lang === "ru" ? "Общая выручка" : "Jami tushum"}</span>
              <span className="dashboard-kpi-icon"><WalletCards className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 break-words text-xl font-bold tabular-nums tracking-[-0.04em] text-[#171321] dark:text-white">
              {isLoading ? "..." : formatMoney(metrics?.revenue || 0)}
            </div>
          </div>
          <div className="mt-4 border-t border-[#dfe5ef] pt-3 text-[11px] text-[#686475] dark:border-zinc-700">
            <span className="truncate">
              {lang === "ru" ? "Оборот:" : "Aylanma:"} {formatMoney(metrics?.sales_sum || 0)}
            </span>
          </div>
        </div>

        {/* Card 2: Orders Count */}
        <div className="dashboard-kpi-card flex min-w-0 flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#686475] dark:text-zinc-400">
              <span>{lang === "ru" ? "Всего заказов" : "Buyurtmalar"}</span>
              <span className="dashboard-kpi-icon"><ShoppingBag className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 text-xl font-bold tabular-nums tracking-[-0.04em] text-[#171321] dark:text-white">
              {isLoading ? "..." : metrics?.orders_count || 0}{" "}
              <span className="text-xs font-medium tracking-normal text-[#686475]">
                {lang === "ru" ? "заказов" : "ta"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#dfe5ef] pt-3 text-[11px] dark:border-zinc-700">
            <div className="flex min-w-0 items-center gap-1 text-[#686475]">
              <span className="font-semibold text-[#50465f] dark:text-[#c7badb]">
                {metrics?.new_orders || 0} {lang === "ru" ? "новых" : "yangi"}
              </span>
              <span>•</span>
              <span className="truncate">
                {metrics?.ready_orders || 0} {lang === "ru" ? "готовых" : "tayyor"}
              </span>
            </div>
            <Link to="/orders" className="shrink-0 font-semibold text-[#211b2e] hover:underline dark:text-white">
              {lang === "ru" ? "Все →" : "Barchasi →"}
            </Link>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="dashboard-kpi-card flex min-w-0 flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#686475] dark:text-zinc-400">
              <span>{lang === "ru" ? "База клиентов" : "Mijozlar bazasi"}</span>
              <span className="dashboard-kpi-icon"><UsersRound className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 text-xl font-bold tabular-nums tracking-[-0.04em] text-[#171321] dark:text-white">
              {isLoading ? "..." : metrics?.total_customers || 0}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#dfe5ef] pt-3 text-[11px] dark:border-zinc-700">
            <span className="truncate text-[#686475]">
              {lang === "ru" ? "Покупатели магазина" : "Do'kon xaridorlari"}
            </span>
            <Link to="/customers" className="shrink-0 font-semibold text-[#211b2e] hover:underline dark:text-white">
              CRM →
            </Link>
          </div>
        </div>

        {/* Card 4: Average Order Value */}
        <div className="dashboard-kpi-card flex min-w-0 flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#686475] dark:text-zinc-400">
              <span>{lang === "ru" ? "Средний чек" : "O'rtacha chek"}</span>
              <span className="dashboard-kpi-icon"><ReceiptText className="h-4 w-4" /></span>
            </div>
            <div className="mt-2 break-words text-xl font-bold tabular-nums tracking-[-0.04em] text-[#171321] dark:text-white">
              {isLoading ? "..." : formatMoney(metrics?.avg_order || 0)}
            </div>
          </div>
          <div className="mt-4 border-t border-[#dfe5ef] pt-3 text-[11px] text-[#686475] dark:border-zinc-700">
            <span className="truncate">{lang === "ru" ? "За одну покупку" : "Bitta xarid uchun"}</span>
          </div>
        </div>
      </div>

      {/* Order geography: delivery addresses and optional branch locations. */}
      <section className="dashboard-panel overflow-hidden rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
              {lang === "ru" ? "Карта заказов" : lang === "en" ? "Order map" : "Buyurtma xaritasi"}
            </h2>
            <p className="mt-1 text-xs text-[#6d7175] dark:text-zinc-400">
              {lang === "ru"
                ? `${mapOrders.length} адресов доставки с координатами за выбранный период`
                : lang === "en"
                ? `${mapOrders.length} delivery locations with coordinates in this period`
                : `Tanlangan davrda koordinatali ${mapOrders.length} ta yetkazib berish manzili`}
            </p>
          </div>
          <button
            type="button"
            aria-pressed={showBranches}
            onClick={() => setShowBranches((visible) => !visible)}
            className={`inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d5a88] ${showBranches ? "border-[#211b2e] bg-[#211b2e] text-white shadow-[0_6px_16px_rgba(33,27,46,.18)]" : "border-[#dfe5ef] bg-white text-[#686475] hover:border-[#6d5a88] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"}`}
          >
            <StoreIcon className="h-3.5 w-3.5" />
            {lang === "ru" ? "Филиалы" : lang === "en" ? "Branches" : "Filiallar"}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${showBranches ? "bg-white/20" : "bg-[#f0edf4] dark:bg-zinc-800"}`}>{mapBranches.length}</span>
          </button>
        </div>
        <div className="relative h-[320px] w-full border-t border-[#dfe5ef] sm:h-[390px] dark:border-zinc-800">
          {isLoading ? (
            <div className="h-full animate-pulse bg-[#eef0f5] dark:bg-zinc-900" />
          ) : (
            <DashboardOrderMap orders={mapOrders} branches={mapBranches} showBranches={showBranches} currency={currency} />
          )}
          {!isLoading && mapOrders.length === 0 && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-[400] rounded-xl border border-[#e4e0ea] bg-white/95 px-3 py-2 text-xs text-[#686475] shadow-sm backdrop-blur-sm">
              {lang === "ru" ? "У заказов за этот период пока нет GPS-координат" : lang === "en" ? "No order GPS coordinates for this period yet" : "Bu davr buyurtmalarida hali GPS koordinatalari yo'q"}
            </div>
          )}
        </div>
      </section>

      {/* Revenue dynamics and order source statistics. */}
      <div className="sidekick-adaptive-grid grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Revenue Dynamics Chart (8 cols) */}
        <div className="dashboard-panel xl:col-span-8 bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between min-w-0">
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

            {/* Bar is the primary view; line and heatmap remain available. */}
            <div className="inline-flex rounded-[12px] border border-[#dfe5ef] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                aria-pressed={chartType === "bar"}
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
                onClick={() => setChartType("line")}
                aria-pressed={chartType === "line"}
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
                onClick={() => setChartType("heatmap")}
                aria-pressed={chartType === "heatmap"}
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

        {/* Channel totals and progress bars, based on orders in the selected period. */}
        <div className="dashboard-panel xl:col-span-4 min-w-0 rounded-[18px] border border-[#dfe5ef] bg-white p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
          <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
            {lang === "ru" ? "Статистика заказов" : lang === "en" ? "Order statistics" : "Buyurtmalar statistikasi"}
          </h2>
          <div className="mt-4 border-t border-[#e8e5ed] pt-4 dark:border-zinc-700">
            <span className="text-3xl font-semibold tracking-tight text-[#211b2e] dark:text-white">{channelTotal}</span>
            <span className="ml-2 text-xs text-[#6d7175] dark:text-zinc-400">
              {lang === "ru" ? "заказов по каналам" : lang === "en" ? "orders by channel" : "kanallar bo'yicha buyurtma"}
            </span>
          </div>
          <div className="mt-6 space-y-6">
            {channels.map((channel) => {
              const ChannelIcon = channel.icon;
              const share = channelTotal ? Math.round((channel.count / channelTotal) * 100) : 0;
              return (
                <div key={channel.key}>
                  <div className="mb-2 flex items-center gap-3 text-xs">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2eff6] dark:bg-zinc-800">
                      <ChannelIcon className="h-4 w-4" style={{ color: channel.color }} />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-[#211b2e] dark:text-white">{channel.label}</span>
                    <span className="font-semibold tabular-nums text-[#211b2e] dark:text-white">{channel.count}</span>
                  </div>
                  <div className="ml-11 h-1.5 overflow-hidden rounded-full bg-[#eae7ef] dark:bg-zinc-800" role="progressbar" aria-label={channel.label} aria-valuenow={share} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${share}%`, backgroundColor: channel.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {channelTotal === 0 && <p className="mt-6 text-xs text-[#6d7175]">{lang === "ru" ? "За выбранный период заказов нет" : lang === "en" ? "No orders in this period" : "Tanlangan davrda buyurtmalar yo'q"}</p>}
        </div>
      </div>

      <section className="rounded-[18px] border border-[#dfe5ef] bg-white p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
        <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
          {lang === "ru" ? "Заказы по часам" : lang === "en" ? "Orders by hour" : "Soatlar bo'yicha buyurtmalar"}
        </h2>
        <p className="mt-1 text-xs text-[#6d7175] dark:text-zinc-400">
          {lang === "ru" ? "Новые, отменённые и завершённые за выбранный период" : lang === "en" ? "New, cancelled and completed in the selected period" : "Tanlangan davrdagi yangi, bekor qilingan va bajarilgan buyurtmalar"}
        </p>
        <div className="mt-4 h-[260px] w-full sm:h-[310px]">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-xl bg-[#f0edf4] dark:bg-zinc-900" />
          ) : (
            <Bar data={hourlyOrderData} options={hourlyOrderOptions} />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
              {lang === "ru" ? "Топ-10 покупателей" : lang === "en" ? "Top 10 customers" : "10 ta eng yaxshi mijozlar"}
            </h2>
            <p className="mt-1 text-xs text-[#6d7175] dark:text-zinc-400">
              {lang === "ru" ? "По числу неотменённых заказов за выбранный период" : lang === "en" ? "By non-cancelled orders in this period" : "Tanlangan davrdagi bekor qilinmagan buyurtmalar soni bo'yicha"}
            </p>
          </div>
          <Link to="/customers" className="shrink-0 text-xs font-medium text-[#6d5a88] hover:underline dark:text-[#bcacd1]">
            {lang === "ru" ? "Все клиенты →" : lang === "en" ? "All customers →" : "Barcha mijozlar →"}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-xs">
            <thead className="border-y border-[#e6e3eb] bg-[#f7f6f9] text-[#767084] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3 font-medium">{lang === "ru" ? "Клиент" : lang === "en" ? "Customer" : "Mijoz ismi"}</th>
                <th className="px-5 py-3 font-medium">{lang === "ru" ? "Телефон" : lang === "en" ? "Phone" : "Telefon raqami"}</th>
                <th className="px-5 py-3 text-right font-medium">{lang === "ru" ? "Заказы" : lang === "en" ? "Orders" : "Buyurtmalar soni"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeebf1] dark:divide-zinc-800">
              {topCustomers.map((customer, index) => (
                <tr key={`${customer.customer_phone}-${index}`} className="hover:bg-[#faf9fc] dark:hover:bg-zinc-800/40">
                  <td className="px-5 py-3 font-medium text-[#211b2e] dark:text-white">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ebe5f2] font-semibold text-[#5a4770] dark:bg-zinc-700 dark:text-white">
                        {(customer.name || "?").trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <span className="truncate">{customer.name || (lang === "ru" ? "Без имени" : "Nomsiz")}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 tabular-nums text-[#686475] dark:text-zinc-300">{customer.customer_phone}</td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-[#211b2e] dark:text-white">{customer.orders_count}</td>
                </tr>
              ))}
              {!isLoading && topCustomers.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-[#6d7175]">{lang === "ru" ? "За выбранный период покупателей нет" : lang === "en" ? "No customers in this period" : "Tanlangan davrda mijozlar yo'q"}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top products and regional activity. */}
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
                      <span className="w-5 shrink-0 text-center text-[11px] font-semibold tabular-nums text-[#6d5a88] dark:text-[#c7badb]">
                        {String(idx + 1).padStart(2, "0")}
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

        {/* Right: regional activity. The map now has its own full-width section above. */}
        <div className="xl:col-span-6 bg-white dark:bg-[#211b2e] rounded-[18px] border border-[#dfe5ef] dark:border-zinc-800 p-5 shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] flex flex-col justify-between min-w-0">
          <div>
            <div className="mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#211b2e] dark:text-white">
                  {lang === "ru" ? "Активность по регионам Узбекистана" : lang === "en" ? "Regional Activity in Uzbekistan" : "O'zbekiston viloyatlari bo'yicha faollik"}
                </h2>
                <div className="text-xs text-[#6d7175] mt-0.5">
                  {lang === "ru"
                    ? "Распределение заказов по областям РУз"
                    : lang === "en"
                    ? "Order distribution across regions of Uzbekistan"
                    : "Viloyatlar kesimida buyurtmalar taqsimoti"}
                </div>
              </div>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
};

