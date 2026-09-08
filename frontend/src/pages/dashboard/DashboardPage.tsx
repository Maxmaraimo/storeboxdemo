import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  ExternalLink,
  MapPin,
  Calendar,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { DashboardMetrics, DashboardCharts, TopProduct, MapOrder } from "../../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export const DashboardPage: React.FC = () => {
  const { store, t } = useAuth();
  const [period, setPeriod] = useState("today");

  const { data, isLoading } = useQuery({
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
  });

  const metrics = data?.metrics;
  const charts = data?.charts;
  const topProducts = data?.top_products || [];
  const mapOrders = data?.map_orders || [];

  const periods = [
    { id: "today", label: t("period_today") || "Bugun" },
    { id: "week", label: t("period_week") || "Har hafta" },
    { id: "month", label: t("period_month") || "Har oy" },
    { id: "quarter", label: t("period_quarter") || "Chorak" },
    { id: "year", label: t("period_year") || "Har yil" },
  ];

  return (
    <div className="space-y-6">
      {/* PERIOD FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">{t("period_label") || "Muddati:"}</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  period === p.id ? "bg-brand text-white shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("revenue") || "Daromadlar"}</span>
            <span className="text-xs font-mono font-bold text-slate-400">UZS</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {metrics?.revenue?.toLocaleString() || 0} <span className="text-xs text-slate-400 font-normal">UZS</span>
          </div>
          <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100 font-semibold">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t("sales_sum") || "Sotuvlar summasi:"}
              </span>
              <span className="font-mono font-bold">{metrics?.sales_sum?.toLocaleString() || 0} UZS</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {t("delivery_fee") || "Yetkazib berish summasi:"}
              </span>
              <span className="font-mono font-bold">{metrics?.delivery_fee?.toLocaleString() || 0} UZS</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-black">
              <span>{t("net_income") || "Foyda:"}</span>
              <span className="font-mono">{metrics?.revenue?.toLocaleString() || 0} UZS</span>
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("orders_count_title") || "Buyurtmalar"}</span>
            <ShoppingCart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {metrics?.orders_count || 0} <span className="text-xs text-slate-400 font-normal">{t("pcs_unit") || "ta"}</span>
          </div>
          <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100 font-semibold">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                {t("new_orders") || "Yangi:"}
              </span>
              <span className="font-mono font-bold">{metrics?.new_orders || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t("ready_delivered") || "Tayyor / Yetkazilgan:"}
              </span>
              <span className="font-mono font-bold">{metrics?.ready_orders || 0}</span>
            </div>
            <div className="flex justify-between text-rose-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {t("cancelled_orders") || "Bekor qilindi:"}
              </span>
              <span className="font-mono font-bold">{metrics?.cancelled_orders || 0}</span>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("total_customers_title") || "Jami mijozlar"}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {metrics?.total_customers || 0} <span className="text-xs text-slate-400 font-normal">{t("pcs_unit") || "ta"}</span>
          </div>
          <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100 font-semibold">
            <div className="flex justify-between">
              <span>{t("new_customers") || "Yangi mijozlar:"}</span>
              <span className="font-mono font-bold">{metrics?.total_customers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("avg_order") || "O`rtacha buyurtma:"}</span>
              <span className="font-mono font-bold">{metrics?.avg_order?.toLocaleString() || 0} UZS</span>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: REVENUE + ORDERS BY CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Bar Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("revenue_stats") || "Daromadlar statistikasi"}</div>
          <div className="h-64">
            {charts && (
              <Bar
                data={{
                  labels: charts.labels,
                  datasets: [
                    {
                      label: `${t("revenue") || "Tushum"} (UZS)`,
                      data: charts.revenue,
                      backgroundColor: "#10B981",
                      borderRadius: 8,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { grid: { color: "#f1f5f9" }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Orders Stats by Channel */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("orders_stats") || "Buyurtmalar statistikasi"}</div>
            <div className="space-y-3 text-xs font-semibold">
              {/* Telegram bot */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black">T</div>
                  <div>
                    <div className="font-bold text-slate-900">Telegram bot</div>
                    <div className="text-[10px] text-slate-400">{metrics?.tma_cnt || 0} {t("orders_unit") || "ta buyurtma"}</div>
                  </div>
                </div>
                {store?.telegram_bot_username ? (
                  <a
                    href={`https://t.me/${store.telegram_bot_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <span>{t("open_bot") || "Botni ochish"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">{t("create_bot") || "Bot yaratish"}</span>
                )}
              </div>

              {/* Website */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-brand text-white flex items-center justify-center text-xs font-black">W</div>
                  <div>
                    <div className="font-bold text-slate-900">{t("website") || "Veb-sayt"}</div>
                    <div className="text-[10px] text-slate-400">{metrics?.web_cnt || 0} {t("orders_unit") || "ta buyurtma"}</div>
                  </div>
                </div>
                {store?.subdomain && (
                  <a
                    href={`/store/${store.subdomain}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-300"
                  >
                    {t("open_site") || "Saytni ochish"}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center pt-2">
            {t("all_channels_sync") || "Barcha savdo kanallari avtomatik ravishda bitta tizimda sinxronlanadi"}
          </div>
        </div>
      </div>

      {/* LOWER ROW: TRAFFIC SOURCE + TOP PRODUCTS + DELIVERIES MAP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Traffic source */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("traffic_source") || "Trafik manbai"}</div>
          <div className="h-44 flex items-center justify-center">
            {charts && (
              <Doughnut
                data={{
                  labels: [t("website") || "Veb-sayt", "Telegram"],
                  datasets: [
                    {
                      data: [charts.traffic.web || 0, charts.traffic.telegram || 0],
                      backgroundColor: ["#3B82F6", "#10B981"],
                      borderWidth: 0,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: "75%",
                  plugins: { legend: { display: false } },
                }}
              />
            )}
          </div>
          <div className="flex justify-around text-xs font-bold text-slate-600 pt-2 border-t border-slate-100">
            <span className="text-blue-500">• {t("website") || "Veb-sayt"} ({metrics?.web_cnt || 0})</span>
            <span className="text-brand">• Telegram ({metrics?.tma_cnt || 0})</span>
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("top_products") || "Top mahsulotlar"}</div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand">
              {periods.find((p) => p.id === period)?.label}
            </span>
          </div>
          <div className="space-y-2 text-xs font-semibold max-h-48 overflow-y-auto">
            {topProducts.map((tp, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="truncate max-w-[140px] font-bold text-slate-800">{tp.product_name}</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-brand">{tp.sold_qty} {t("pcs_unit") || "ta"}</span>
                  {tp.sold_sum && (
                    <span className="text-[10px] font-mono text-slate-400 block">{tp.sold_sum.toLocaleString()} UZS</span>
                  )}
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center text-slate-400 py-8">{t("no_sales_yet") || "Hozircha sotuvlar yo`q"}</div>
            )}
          </div>
        </div>

        {/* Orders Map (Leaflet) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs text-slate-500 uppercase tracking-wider">{t("orders_map") || "Buyurtma xaritasi"}</div>
            <span className="text-[10px] text-emerald-600 font-bold">{t("live_gps") || "Jonli GPS"}</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 h-44">
            <MapContainer center={[41.2995, 69.2401]} zoom={11} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {mapOrders.map((o, idx) => (
                <Marker key={idx} position={[o.lat, o.lng]}>
                  <Popup>
                    <b>#{o.num} — {o.client}</b><br />
                    {o.total?.toLocaleString()} UZS
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
