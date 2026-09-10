import React, { useState } from "react";
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
  X
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Order } from "../../types";

export const OrdersPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", status, search],
    queryFn: async () => {
      const res = await api.get(`/orders/?status=${status}&q=${encodeURIComponent(search)}`);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setSelectedOrder(data.order);
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
                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs font-black"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                status === tab.id
                  ? "bg-white/20 dark:bg-black/20 text-white dark:text-neutral-900"
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Ko`rsatilmoqda: <strong className="text-slate-900">{orders.length} ta buyurtma</strong>
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
                  className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 group-hover:text-brand transition-colors">
                        #{order.order_number}
                      </span>
                      {order.source === "TMA" ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Send className="w-2.5 h-2.5" /> TG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Globe className="w-2.5 h-2.5" /> Sayt
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
                    {order.delivery_address || "Manzil ko`rsatilmagan"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                      {order.status_display}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button className="p-1.5 rounded-lg text-slate-400 group-hover:text-brand group-hover:bg-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OVER ORDER DETAIL DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#18181b] border-l border-black/[0.06] dark:border-white/10 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono font-black text-lg text-neutral-900 dark:text-white">#{selectedOrder.order_number}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedOrder.status_display}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Holatni o`zgartirish</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "PROCESSING" })}
                    className="py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs"
                  >
                    Jarayonga olish
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "READY" })}
                    className="py-2 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-xs"
                  >
                    Tayyor deb belgilash
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "IN_DELIVERY" })}
                    className="py-2 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs"
                  >
                    Kuryerga berish
                  </button>
                  <button
                    onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "COMPLETED" })}
                    className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs"
                  >
                    Yetkazildi (Yopish)
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Buyurtmani bekor qilishni tasdiqlaysizmi? Mahsulotlar qoldiqqa qaytariladi.")) {
                        updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "CANCELLED" });
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs col-span-2"
                  >
                    Bekor qilish (Qoldiqni qaytarish)
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mijoz ma`lumotlari</div>
                <div className="font-bold text-slate-900 text-sm">{selectedOrder.customer_name}</div>
                <div className="font-mono text-xs text-brand font-bold">{selectedOrder.customer_phone}</div>
                <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  📍 {selectedOrder.delivery_address || "Manzil yo`q"}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tovarlar ({selectedOrder.items?.length || 0})
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                          {item.product_image ? (
                            <img src={item.product_image} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            "🛍️"
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{item.product_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.quantity} × {Number(item.unit_price).toLocaleString()} UZS
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {Number(item.total_price).toLocaleString()} UZS
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 font-mono">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Yetkazib berish:</span>
                  <span>{Number(selectedOrder.delivery_fee).toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between text-base font-black pt-2 border-t border-slate-800 text-emerald-400">
                  <span>Jami summa:</span>
                  <span>{Number(selectedOrder.total_amount).toLocaleString()} UZS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
