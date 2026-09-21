import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ShoppingBag,
  BellRing,
  Truck,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Globe,
  ChevronRight,
  X,
  MapPin,
  ExternalLink,
  Printer,
  Phone,
  Maximize2,
  Minimize2,
  Eye,
  AlertTriangle
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Order } from "../../types";

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const branch = searchParams.get("branch") || "all";
  const urlQ = searchParams.get("q") || "";

  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState(urlQ);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isWideModal, setIsWideModal] = useState(true);

  useEffect(() => {
    if (urlQ) {
      setSearch(urlQ);
    }
  }, [urlQ]);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", status, search, branch],
    queryFn: async () => {
      const branchParam = branch !== "all" ? `&branch=${branch}` : "";
      const res = await api.get(`/orders/?status=${status}&q=${encodeURIComponent(search)}${branchParam}`);
      return res.data as {
        counts: Record<string, number>;
        orders: Order[];
        total: number;
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: number; newStatus: string }) => {
      const res = await api.post(`/orders/${orderId}/status/`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setSelectedOrder(null);
    },
  });

  const counts = data?.counts || { all: 0, new: 0, processing: 0, ready: 0, in_delivery: 0, history: 0 };
  const orders = data?.orders || [];

  const tabs = [
    { id: "ALL", label: t("status_all") || "Barchasi", count: counts.all },
    { id: "NEW", label: t("status_new") || "Yangi", count: counts.new, badgeColor: "bg-amber-100 text-amber-800" },
    { id: "PROCESSING", label: t("status_accepted") || "Jarayonda", count: counts.processing, badgeColor: "bg-blue-100 text-blue-800" },
    { id: "READY", label: t("status_ready") || "Tayyor", count: counts.ready, badgeColor: "bg-indigo-100 text-indigo-800" },
    { id: "IN_DELIVERY", label: t("status_delivering") || "Yo`lda", count: counts.in_delivery, badgeColor: "bg-purple-100 text-purple-800" },
    { id: "HISTORY", label: t("status_completed") || "Tarixi", count: counts.history },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("orders_list_title") || "Buyurtmalar ro`yxati"}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{t("orders_list_subtitle") || "Barcha kelib tushgan buyurtmalar"}</p>
        </div>
      </div>

      {/* STATUS TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-black/[0.06] dark:border-white/10 text-xs font-bold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              status === tab.id
                ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 shadow-xs font-black"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                status === tab.id
                  ? "bg-[#c8ff6a]/20 text-[#c8ff6a] dark:bg-[#211b2e]/20 dark:text-[#211b2e]"
                  : "bg-black/10 dark:bg-white/10 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_order_ph") || "Buyurtma ID si (#RB-...), mijoz ismi yoki telefon..."}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-[#211b2e] focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <div className="text-xs font-bold text-slate-500">
          {t("showing_orders_format") ? t("showing_orders_format").replace("{count}", String(orders.length)) : `Ko'rsatilmoqda: ${orders.length} ta buyurtma`}
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{t("th_order_num") || "Buyurtma"}</th>
                <th className="py-3 px-4">{t("th_client") || "Mijoz"}</th>
                <th className="py-3 px-4">{t("th_payment") || "To`lov"}</th>
                <th className="py-3 px-4">{t("th_delivery") || "Yetkazish"}</th>
                <th className="py-3 px-4">{t("th_status") || "Holat"}</th>
                <th className="py-3 px-4 text-right">{t("th_action") || "Amal"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="hover:bg-slate-500/5 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 group-hover:text-[#211b2e] transition-colors">
                        #{order.order_number}
                      </span>
                      {order.source === "TMA" ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Send className="w-2.5 h-2.5" /> TG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30">
                          <Globe className="w-2.5 h-2.5" /> {t("website_channel") || "Sayt"}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(order.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{order.customer_name}</div>
                    <div className="text-[11px] font-mono text-slate-500">{order.customer_phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-black text-slate-900">
                      {Number(order.total_amount).toLocaleString()} UZS
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">{order.payment_method_display}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                    {order.delivery_address || (t("address_not_specified") || "Manzil ko`rsatilmagan")}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                      {order.status_display}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title={t("view_details") || "Batafsil ko`rish"}
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link
                        title={t("open_full_page") || "To`liq sahifada ochish"}
                        to={`/orders/${order.id}`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-brand hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t("no_orders_found") || "Buyurtmalar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL / SLIDE-OVER ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full ${
              isWideModal ? "max-w-5xl" : "max-w-xl"
            } bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200`}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-zinc-900/50">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-mono font-black text-xl sm:text-2xl text-neutral-900 dark:text-white">
                  #{selectedOrder.order_number}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                    selectedOrder.status === "COMPLETED"
                      ? "bg-[#211b2e] text-[#c8ff6a] border-[#211b2e]/30 dark:bg-[#c8ff6a] dark:text-[#211b2e]"
                      : selectedOrder.status === "CANCELLED"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                      : selectedOrder.status === "IN_DELIVERY"
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                      : selectedOrder.status === "READY"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                  }`}
                >
                  {selectedOrder.status_display}
                </span>
                {selectedOrder.source === "TMA" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    <Send className="w-3 h-3" /> Telegram Bot
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30">
                    <Globe className="w-3 h-3" /> {t("website_channel") || "Veb-sayt"}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${selectedOrder.id}`)}
                  title={t("open_full_page") || "To`liq sahifada ochish"}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden md:inline">{t("open_full_page") || "To`liq sahifa"}</span>
                </button>
                <button
                  type="button"
                  title={t("print_receipt") || "Chek chiqarish"}
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden md:inline">{t("print_receipt") || "Chop etish"}</span>
                </button>
                <button
                  type="button"
                  title={isWideModal ? (t("collapse") || "Kichraytirish") : (t("expand") || "Kengaytirish")}
                  onClick={() => setIsWideModal(!isWideModal)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors hidden sm:flex"
                >
                  {isWideModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
              <div className={`grid grid-cols-1 ${isWideModal ? "lg:grid-cols-12" : ""} gap-6`}>
                {/* Left Column: Products & Financials */}
                <div className={`${isWideModal ? "lg:col-span-7" : ""} space-y-6`}>
                  {/* Products List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black tracking-wider uppercase text-slate-400">
                        {t("order_contents") || "Buyurtma tarkibi"} ({selectedOrder.items?.length || 0})
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        {selectedOrder.items?.reduce((acc, it) => acc + it.quantity, 0) || 0} {t("unit_pcs") || "dona"}
                      </span>
                    </div>
                    <div className="border border-slate-100 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                      {selectedOrder.items?.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-base shrink-0 overflow-hidden border border-slate-200/60 dark:border-white/10">
                              {item.product_image ? (
                                <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-neutral-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-sm">
                                {item.product_name}
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                {item.quantity} × {Number(item.unit_price).toLocaleString()} UZS
                              </div>
                            </div>
                          </div>
                          <div className="font-mono font-black text-slate-900 dark:text-white text-sm whitespace-nowrap">
                            {Number(item.total_price).toLocaleString()} UZS
                          </div>
                        </div>
                      ))}
                      {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Tovarlar ko`rsatilmagan
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 space-y-2.5 font-mono text-xs">
                    <div className="text-[11px] font-black uppercase text-slate-400 tracking-wider font-sans mb-3">
                      {t("financial_report") || "Moliyaviy hisobot"}
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{t("delivery_service_fee") || "Yetkazib berish xizmati:"}</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {Number(selectedOrder.delivery_fee || 0).toLocaleString()} UZS
                      </span>
                    </div>
                    {Number(selectedOrder.discount_amount) > 0 && (
                      <div className="flex justify-between text-rose-600 dark:text-rose-400">
                        <span>{t("discount_label") || "Chegirma:"}</span>
                        <span className="font-bold">
                          -{Number(selectedOrder.discount_amount).toLocaleString()} UZS
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-base sm:text-lg font-black pt-3 border-t border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-sans">
                      <span>{t("total_payment") || "Jami to'lov:"}</span>
                      <span className="text-slate-900 dark:text-white font-mono">
                        {Number(selectedOrder.total_amount).toLocaleString()} UZS
                      </span>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-sans border-t border-slate-200/60 dark:border-white/5 text-slate-500">
                      <span>{t("payment_method_label") || "To'lov usuli:"} <b>{selectedOrder.payment_method_display || (t("cash") || "Naqd pul")}</b></span>
                      <span>{t("payment_status_label") || "Holati:"} <b className="text-slate-800 dark:text-slate-200">{selectedOrder.payment_status_display || (t("pending") || "Kutilmoqda")}</b></span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Actions, Customer & Delivery Map */}
                <div className={`${isWideModal ? "lg:col-span-5" : ""} space-y-5`}>
                  {/* Status Progression Buttons */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/10 space-y-2.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                      {t("change_status_title") || "Holatni o'zgartirish"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "PROCESSING" })}
                        className="py-2.5 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" /> {t("to_processing") || "Jarayonga"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "READY" })}
                        className="py-2.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> {t("ready") || "Tayyor"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "IN_DELIVERY" })}
                        className="py-2.5 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" /> {t("in_courier") || "Kuryerda"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "COMPLETED" })}
                        className="py-2.5 px-3 rounded-xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> {t("delivered") || "Yetkazildi"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(t("cancel_order_confirm") || "Buyurtmani bekor qilishni tasdiqlaysizmi? Mahsulotlar qoldiqqa qaytariladi.")) {
                            updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "CANCELLED" });
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs col-span-2 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> {t("cancel_return_stock_btn") || "Bekor qilish (Qoldiqni qaytarish)"}
                      </button>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 space-y-2">
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      {t("customer_details_title") || "Mijoz ma'lumotlari"}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedOrder.customer_name}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {selectedOrder.customer_phone}
                      </a>
                      {selectedOrder.customer_phone && (
                        <a
                          href={`https://t.me/+${selectedOrder.customer_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Telegram
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Delivery Location & Map */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {t("delivery_address_title") || "Yetkazib berish manzili"}
                      </div>
                      {selectedOrder.delivery_lat && selectedOrder.delivery_lng && (
                        <div className="text-[10px] font-mono text-slate-400">
                          {Number(selectedOrder.delivery_lat).toFixed(4)}, {Number(selectedOrder.delivery_lng).toFixed(4)}
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-white/5">
                      {selectedOrder.delivery_address || (t("address_not_specified") || "Manzil ko'rsatilmagan")}
                    </div>

                    {/* Interactive External Map Links & Route Buttons */}
                    {selectedOrder.delivery_lat && selectedOrder.delivery_lng ? (
                      <div className="space-y-2.5">
                        {/* Primary Route Buttons: Yandex Navigator & Google Maps */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <a
                            href={`https://yandex.uz/maps/?rtext=~${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}&rtt=auto`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-3 rounded-xl bg-[#211b2e] hover:bg-[#2c243d] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{t("yandex_navigator") || "Yandex Navigator"}</span>
                          </a>
                          <a
                            href={`https://maps.google.com/?q=${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200/80"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                            <span>Google Maps</span>
                          </a>
                        </div>
                        {/* Map Preview Frame */}
                        <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative">
                          <iframe
                            title="Xarita"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}&hl=ru&z=15&output=embed`}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl text-center">
                        {t("no_gps_coordinates") || "Geolokatsiya koordinatalari mavjud emas"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
