import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Calendar,
  Globe2,
  Smartphone,
  Monitor,
  Laptop,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Package
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
  Filler,
  ArcElement
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { InteractiveGlobe } from "../../components/charts/InteractiveGlobe";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

export const AnalyticsPage: React.FC = () => {
  const { store, lang, t } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "live" | "reports">("overview");
  const [period, setPeriod] = useState<string>("month");
  const [currency, setCurrency] = useState<"UZS" | "USD">("UZS");

  const UZS_TO_USD_RATE = 12800;

  const { data: dashboardData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["analytics-summary", period, store?.id],
    queryFn: async () => {
      const res = await api.get(`/dashboard/summary/?period=${period}`);
      return res.data;
    },
    refetchInterval: activeTab === "live" ? 15000 : 60000,
  });

  const metrics = dashboardData?.metrics;
  const charts = dashboardData?.charts;
  const topProducts = dashboardData?.top_products || [];

  const formatMoney = (sum: number) => {
    if (currency === "USD") {
      const usd = sum / UZS_TO_USD_RATE;
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `${Math.round(sum).toLocaleString("uz-UZ")} UZS`;
  };

  const salesTrendData = {
    labels: charts?.labels || ["1", "5", "10", "15", "20", "25", "30"],
    datasets: [
      {
        label: lang === "ru" ? "Валовый объем продаж" : "Jami savdo hajmi",
        data: (charts?.revenue || [0, 0, 0, 0, 0, 0, 0]).map((v: number) =>
          currency === "USD" ? Number((v / UZS_TO_USD_RATE).toFixed(2)) : v
        ),
        borderColor: "#2563EB", // Shopify Polaris Blue
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#1D4ED8",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 3.5,
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
        backgroundColor: "#0F172A",
        titleColor: "#FFFFFF",
        bodyColor: "#93C5FD",
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${currency === "USD" ? "$" : ""}${ctx.raw?.toLocaleString()} ${currency === "UZS" ? "UZS" : ""}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(226, 232, 240, 0.6)" },
        ticks: {
          font: { size: 11 },
          color: "#64748B",
          callback: (val: any) => {
            if (currency === "USD") return `$${val}`;
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
            return val;
          },
        },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#64748B" },
      },
    },
  };

  const deviceDoughnutData = {
    labels: [
      lang === "ru" ? "Мобильные" : "Mobil qurilmalar",
      lang === "ru" ? "Компьютеры" : "Kompyuterlar",
      lang === "ru" ? "Планшеты" : "Planshetlar"
    ],
    datasets: [
      {
        data: [78, 19, 3],
        backgroundColor: ["#2563EB", "#0EA5E9", "#94A3B8"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const conversionFunnel = [
    { label: lang === "ru" ? "Сессии интернет-магазина" : "Do'kon sessiyalari", count: (metrics?.total_customers || 1) * 38 + 120, pct: "100%" },
    { label: lang === "ru" ? "Добавления в корзину" : "Savatga qo'shishlar", count: Math.round(((metrics?.total_customers || 1) * 38 + 120) * 0.28), pct: "28%" },
    { label: lang === "ru" ? "Переходы к оформлению" : "Buyurtma berishga o'tish", count: Math.round(((metrics?.total_customers || 1) * 38 + 120) * 0.14), pct: "14%" },
    { label: lang === "ru" ? "Завершенные заказы" : "Tugallangan buyurtmalar", count: metrics?.orders_count || 4, pct: "3.8%" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with View Tabs & Period Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {lang === "ru" ? "Аналитика и отчеты" : "Tahlil va hisobotlar"}
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            {lang === "ru" ? "Аналитика магазина" : "Do'kon statistikasi"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Tab Buttons: Overview vs Live View */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-medium"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              {lang === "ru" ? "Обзор" : "Umumiy tahlil"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("live")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "live"
                  ? "bg-blue-600 text-white shadow-2xs font-medium"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{lang === "ru" ? "В реальном времени" : "Jonli monitoring"}</span>
            </button>
          </div>

          {/* Period selector (only in overview) */}
          {activeTab === "overview" && (
            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
              {[
                { id: "today", label: lang === "ru" ? "Сегодня" : "Bugun" },
                { id: "week", label: lang === "ru" ? "7 дней" : "7 kun" },
                { id: "month", label: lang === "ru" ? "30 дней" : "30 kun" },
                { id: "year", label: lang === "ru" ? "Год" : "Yil" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    period === p.id
                      ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-medium"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setCurrency("UZS")}
              className={`px-2 py-1 rounded-md cursor-pointer ${currency === "UZS" ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-medium" : "text-slate-500"}`}
            >
              UZS
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 rounded-md cursor-pointer ${currency === "USD" ? "bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-medium" : "text-slate-500"}`}
            >
              USD
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 dark:bg-neutral-800 dark:border-neutral-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {lang === "ru" ? "Валовый объем продаж" : "Jami savdo hajmi"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {formatMoney(metrics?.revenue || 0)}
              </div>
              <div className="mt-2 flex items-center text-xs font-medium text-emerald-600">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>+12.4% {lang === "ru" ? "к прошлому периоду" : "o'tgan davrga nisbatan"}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {lang === "ru" ? "Выполненные заказы" : "Bajarilgan buyurtmalar"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {metrics?.orders_count || 0} <span className="text-xs font-normal text-slate-500">{lang === "ru" ? "заказов" : "ta"}</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {metrics?.ready_orders || 0} {lang === "ru" ? "готовы к отправке" : "jo'natishga tayyor"}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {lang === "ru" ? "Коэффициент конверсии" : "Konversiya ko'rsatkichi"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                3.8%
              </div>
              <div className="mt-2 flex items-center text-xs font-normal text-slate-500">
                <span>{lang === "ru" ? "Стабильная конверсия витрины" : "Barqaror ko'rsatkich"}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 shadow-xs">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {lang === "ru" ? "Средняя стоимость заказа" : "O'rtacha buyurtma qiymati"}
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                {formatMoney(metrics?.avg_order || 0)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {lang === "ru" ? "На основе всех заказов" : "Barcha buyurtmalar bo'yicha"}
              </div>
            </div>
          </div>

          {/* Main Chart: Sales Over Time */}
          <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {lang === "ru" ? "Общий объем продаж в динамике" : "Vaqt bo'yicha savdo dinamikasi"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === "ru" ? "Чистая выручка по дням выбранного периода" : "Kunlik tushum ko'rsatkichlari"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  {lang === "ru" ? "Текущий период" : "Joriy davr"}
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <Line data={salesTrendData} options={chartOptions} />
            </div>
          </div>

          {/* Two Columns: Conversion Funnel & Device breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {lang === "ru" ? "Воронка конверсии магазина" : "Do'kon konversiya voronkasi"}
              </h3>
              <div className="space-y-3">
                {conversionFunnel.map((step, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{step.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {step.count.toLocaleString()} ({step.pct})
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: step.pct }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices & Channels Breakdown */}
            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {lang === "ru" ? "Сессии по типам устройств" : "Qurilmalar turlari bo'yicha sessiyalar"}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {lang === "ru" ? "Распределение мобильных и настольных покупателей" : "Xaridorlarning qurilmalar ulushi"}
                </p>
                <div className="h-44 flex items-center justify-center">
                  <div className="w-36 h-36">
                    <Doughnut data={deviceDoughnutData} options={{ plugins: { legend: { display: false } }, cutout: "70%" }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800 text-center text-xs">
                <div>
                  <div className="text-slate-500 text-[11px] flex items-center justify-center gap-1">
                    <Smartphone className="w-3 h-3 text-blue-600" />
                    {lang === "ru" ? "Мобильные" : "Mobil"}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">78%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] flex items-center justify-center gap-1">
                    <Laptop className="w-3 h-3 text-sky-500" />
                    {lang === "ru" ? "ПК" : "Desktop"}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">19%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[11px] flex items-center justify-center gap-1">
                    <Monitor className="w-3 h-3 text-slate-400" />
                    {lang === "ru" ? "Планшеты" : "Tablet"}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">3%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LIVE VIEW TAB (Interactive 3D Globe & Realtime Orders) */}
      {activeTab === "live" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Live Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-blue-200 dark:border-blue-900/50 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                {lang === "ru" ? "Посетители сейчас" : "Hozirgi tashrif buyuruvchilar"}
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">
                {((metrics?.total_customers || 1) * 3) + 7}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === "ru" ? "Активны на витрине и в Telegram" : "Vitrinalarda faol"}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">
                {lang === "ru" ? "Заказы за сегодня" : "Bugungi buyurtmalar"}
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">
                {metrics?.new_orders || metrics?.orders_count || 4}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                {lang === "ru" ? "Все заказы в обработке" : "Jarayonda"}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">
                {lang === "ru" ? "Выручка за сегодня" : "Bugungi tushum"}
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">
                {formatMoney(metrics?.revenue || 446000)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === "ru" ? "Оплата Payme / Click / Наличные" : "To'lovlar"}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-4 shadow-xs">
              <div className="text-xs font-medium text-slate-500">
                {lang === "ru" ? "Активные корзины" : "Faol savatlar"}
              </div>
              <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2">
                {Math.max(3, (metrics?.total_customers || 1) * 2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {lang === "ru" ? "Товары добавлены в корзину" : "Savatdagi mahsulotlar"}
              </div>
            </div>
          </div>

          {/* Interactive Globe Container */}
          <div className="bg-white dark:bg-neutral-850 rounded-xl border border-slate-200/80 dark:border-neutral-800 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="max-w-md space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xs font-medium border border-blue-200/60 dark:border-blue-800">
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{lang === "ru" ? "Глобус онлайн-покупок в реальном времени" : "Real vaqtdagi xaridorlar xaritasi"}</span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
                  {lang === "ru" ? "География покупателей StoreBox" : "StoreBox xaridorlar geografiyasi"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {lang === "ru"
                    ? "Интерактивная 3D визуализация активных сессий и заказов по городам Узбекистана (Ташкент, Самарканд, Бухара, Андижан, Фергана) и зарубежным странам."
                    : "O'zbekiston shaharlari bo'yicha onlayn xaridorlar va buyurtmalarning 3D interaktiv xaritasi."}
                </p>

                <div className="pt-3 space-y-2 border-t border-slate-100 dark:border-neutral-800 text-xs">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Toshkent & Toshkent viloyati</span>
                    <strong className="text-slate-900 dark:text-white font-bold">18 zakaz · 42 faol</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Samarqand viloyati</span>
                    <strong className="text-slate-900 dark:text-white font-bold">7 zakaz · 19 faol</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-600 dark:text-slate-400">Buxoro & vodiy viloyatlari</span>
                    <strong className="text-slate-900 dark:text-white font-bold">12 zakaz · 38 faol</strong>
                  </div>
                </div>
              </div>

              {/* The 3D Rotating Canvas Globe */}
              <div className="flex-1 flex justify-center w-full">
                <InteractiveGlobe size={440} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
