import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Printer,
  ShoppingBag,
  MapPin,
  ExternalLink,
  Phone,
  Send,
  Globe,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  User,
  CreditCard,
  Layers,
  Save
} from "lucide-react";
import { api } from "../../api/client";
import { Order } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const OrderDetailPage: React.FC = () => {
  const { t } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [statusVal, setStatusVal] = useState<string>("");
  const [paymentStatusVal, setPaymentStatusVal] = useState<string>("");
  const [courierVal, setCourierVal] = useState<string>("");
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  const { data: couriersData } = useQuery<{ couriers: any[] }>({
    queryKey: ["couriers"],
    queryFn: async () => {
      const res = await api.get("/couriers/");
      return res.data;
    },
  });

  const couriersList = couriersData?.couriers || [];

  useEffect(() => {
    if (order) {
      setStatusVal(order.status);
      setPaymentStatusVal(order.payment_status || "PENDING");
      setCourierVal(order.courier ? String(order.courier.id) : "");
    }
  }, [order]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { status: string; payment_status: string; courier_id?: number | null }) => {
      const res = await api.patch(`/orders/${id}/status/`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["order", id], data.order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "Xatolik yuz berdi");
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusVal) return;
    saveMutation.mutate({
      status: statusVal,
      payment_status: paymentStatusVal,
      courier_id: courierVal ? Number(courierVal) : null,
    });
  };

  const getOrderStatusLabel = (st: string) => {
    switch (st?.toUpperCase()) {
      case "NEW":
        return t("status_new") || "Yangi";
      case "PROCESSING":
        return t("status_accepted") || "Jarayonda";
      case "READY":
        return t("status_ready") || "Tayyor";
      case "IN_DELIVERY":
        return t("status_delivering") || "Yo`lda";
      case "COMPLETED":
        return t("status_completed") || "Bajarildi";
      case "CANCELLED":
        return t("status_cancelled") || "Bekor qilindi";
      default:
        return st;
    }
  };

  const handleQuickStatus = (newStatus: string) => {
    if (newStatus === "CANCELLED") {
      if (!confirm("Buyurtmani bekor qilishni tasdiqlaysizmi? Mahsulotlar qoldiqqa qaytariladi.")) {
        return;
      }
    }
    setStatusVal(newStatus);
    saveMutation.mutate({
      status: newStatus,
      payment_status: paymentStatusVal,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-400">{t("loading") || "Yuklanmoqda..."}</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-[#18181b] rounded-2xl border border-black/[0.06] dark:border-white/10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t("order_not_found") || "Buyurtma topilmadi"}</h2>
        <p className="text-xs text-slate-500">
          {t("order_not_found_desc") || "Ushbu buyurtma mavjud emas yoki o'chirib yuborilgan bo'lishi mumkin."}
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" /> {t("back_to_orders") || "Buyurtmalar ro'yxatiga qaytish"}
        </button>
      </div>
    );
  }

  const itemsCount = order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const subtotal = order.items?.reduce((acc, item) => acc + Number(item.total_price), 0) || (Number(order.total_amount) - Number(order.delivery_fee || 0));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/orders"
            className="text-slate-500 hover:text-brand font-bold transition-colors flex items-center gap-1.5"
          >
            {t("orders") || "Buyurtmalar"}
          </Link>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-mono font-black text-slate-900 dark:text-white">
            #{order.order_number}
          </span>
          <span
            className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-black border ${
              order.status === "COMPLETED"
                ? "bg-[#211b2e] text-[#c8ff6a] border-[#211b2e] dark:bg-[#c8ff6a] dark:text-[#211b2e]"
                : order.status === "CANCELLED"
                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                : order.status === "IN_DELIVERY"
                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                : order.status === "READY"
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
            }`}
          >
            {getOrderStatusLabel(order.status) || order.status_display}
          </span>
          {order.source === "TMA" ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <Send className="w-3 h-3" /> TG Bot
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#211b2e] text-[#c8ff6a] border border-[#211b2e] dark:bg-[#c8ff6a] dark:text-[#211b2e]">
              <Globe className="w-3 h-3" /> Sayt
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#18181b] border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{t("print_receipt") || "Chop etish"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("back_to_orders") || "Ro'yxatga qaytish"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Products, Customer, Delivery & Map (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Buyurtma tarkibi */}
          <div className="bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("order_contents") || "Buyurtma tarkibi"}
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {(t("order_items_qty") || "{count} ta mahsulot").replace("{count}", String(itemsCount))}
              </span>
            </div>

            {/* Items List */}
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {order.items?.map((item, index) => (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-mono text-xs font-bold text-slate-400">
                      {index + 1}
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-sm shrink-0 overflow-hidden border border-slate-200/60 dark:border-white/10">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.product_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        {Number(item.unit_price).toLocaleString()} UZS × {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                    {Number(item.total_price).toLocaleString()} UZS
                  </div>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t("no_items") || "Mahsulotlar mavjud emas"}
                </div>
              )}
            </div>

            {/* Total Summary */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/10 space-y-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{t("subtotal") || "Mahsulotlar jami:"}</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {Number(subtotal).toLocaleString()} UZS
                </span>
              </div>
              {order.delivery_fee && Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{t("delivery_fee") || "Yetkazib berish:"}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    +{Number(order.delivery_fee).toLocaleString()} UZS
                  </span>
                </div>
              )}
              {order.discount_amount && Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-xs text-rose-500">
                  <span>{t("discount") || "Chegirma:"}</span>
                  <span className="font-mono font-bold">
                    -{Number(order.discount_amount).toLocaleString()} UZS
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-base sm:text-lg font-black pt-3 border-t border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-sans">
                <span className="uppercase tracking-wider">{t("total_payable_caps") || "JAMI TO'LOV:"}</span>
                <span className="text-[#211b2e] dark:text-[#c8ff6a] font-mono text-xl">
                  {Number(order.total_amount).toLocaleString()} UZS
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Mijoz va yetkazish ma'lumotlari */}
          <div className="bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-black/[0.06] dark:border-white/10 pb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t("customer_and_delivery_info") || "Mijoz va yetkazish ma'lumotlari"}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {t("customer_caps") || "MIJOZ"}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-base">
                  {order.customer_name}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${order.customer_phone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-emerald-50 text-slate-700 dark:text-slate-200 hover:text-emerald-700 font-mono text-xs font-bold border border-slate-200 dark:border-white/10 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {order.customer_phone}
                  </a>
                  {order.customer_phone && (
                    <a
                      href={`https://t.me/+${order.customer_phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Telegram
                    </a>
                  )}
                </div>
              </div>

              {/* Delivery Details Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {t("delivery_type_caps") || "YETKAZISH TURI"}
                </div>
                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-purple-600" />
                  {order.delivery_type === "PICKUP" ? (t("pickup_self") || "Olib ketish") : (t("courier_delivery") || "Kuryer orqali yetkazish")}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                  {order.delivery_address || (t("address_not_specified") || "Manzil ko'rsatilmagan")}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Xaritadagi yetkazish nuqtasi */}
          <div className="bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("delivery_point_on_map") || "Xaritadagi yetkazish nuqtasi:"}
                </h3>
              </div>

              {order.delivery_lat && order.delivery_lng && (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://yandex.uz/maps/?rtext=~${order.delivery_lat},${order.delivery_lng}&rtt=auto`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#211b2e] hover:bg-[#2c243d] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] text-xs font-bold transition shadow-2xs"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{t("yandex_navigator") || "Yandex Navigator"}</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold border border-blue-200 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> {t("google_map") || "Google Xarita"}
                  </a>
                </div>
              )}
            </div>

            {order.delivery_lat && order.delivery_lng ? (
              <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative">
                <iframe
                  title={t("delivery_point_on_map") || "Xaritadagi yetkazish nuqtasi"}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}&hl=ru&z=15&output=embed`}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                {t("no_gps_coordinates") || "Ushbu buyurtmada GPS lokatsiya koordinatalari mavjud emas"}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Status Management Form & Metadata (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Statusni boshqarish */}
          <div className="bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-black/[0.06] dark:border-white/10 pb-4">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t("manage_status") || "Statusni boshqarish"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Buyurtma holati */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t("order_status_label") || "Buyurtma holati"}
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="NEW">{t("status_new") || "Yangi"}</option>
                  <option value="PROCESSING">{t("status_processing") || "Jarayonda"}</option>
                  <option value="READY">{t("ready") || "Tayyor"}</option>
                  <option value="IN_DELIVERY">{t("in_courier") || "Yetkazilmoqda"}</option>
                  <option value="COMPLETED">{t("status_completed") || "Bajarildi"}</option>
                  <option value="CANCELLED">{t("status_cancelled") || "Bekor qilindi"}</option>
                </select>
              </div>

              {/* To'lov holati */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t("payment_status_label") || "To'lov holati"}
                </label>
                <select
                  value={paymentStatusVal}
                  onChange={(e) => setPaymentStatusVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="PENDING">{t("status_pending") || "Kutilmoqda"}</option>
                  <option value="PAID">{t("status_paid") || "To'langan"}</option>
                  <option value="FAILED">{t("status_failed") || "Xatolik / Bekor qilingan"}</option>
                  <option value="REFUNDED">{t("status_refunded") || "Qaytarilgan"}</option>
                </select>
              </div>

              {/* Kuryer biriktirish */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Yetkazib beruvchi kuryer</span>
                  </span>
                  {order?.courier && (
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {order.courier.name}
                    </span>
                  )}
                </label>
                <select
                  value={courierVal}
                  onChange={(e) => setCourierVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="">-- Kuryer biriktirilmagan --</option>
                  {couriersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
                {order?.courier && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{order.courier.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.courier.phone}</div>
                    </div>
                    <a
                      href={`tel:${order.courier.phone}`}
                      className="px-2.5 py-1 rounded-lg bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] font-bold text-[11px] flex items-center gap-1 hover:opacity-90 transition-colors shadow-2xs"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Qo'ng'iroq</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Telegram Notification Checkbox */}
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="notifyTelegram"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand"
                />
                <label
                  htmlFor="notifyTelegram"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {t("send_tg_notification") || "Telegramga bildirishnoma yuborish"}
                </label>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-[#211b2e] hover:bg-[#2c243d] dark:bg-[#c8ff6a] dark:hover:bg-[#b8f550] text-[#c8ff6a] dark:text-[#211b2e] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {saveMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{t("saved_badge") || "Saqlandi!"}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t("save_status") || "Statusni saqlash"}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Status Buttons */}
            <div className="pt-3 border-t border-black/[0.06] dark:border-white/10 space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                {t("quick_actions") || "Tezkor amallar"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickStatus("PROCESSING")}
                  className="py-2 px-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <Clock className="w-3 h-3" /> {t("to_processing") || "Jarayonga"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("READY")}
                  className="py-2 px-3 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> {t("ready") || "Tayyor"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("IN_DELIVERY")}
                  className="py-2 px-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <Truck className="w-3 h-3" /> {t("in_courier") || "Kuryerda"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("COMPLETED")}
                  className="py-2 px-3 rounded-lg bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] hover:opacity-90 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> {t("delivered") || "Yetkazildi"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("CANCELLED")}
                  className="py-2 px-3 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] col-span-2 transition flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> {t("cancel_return_stock_btn") || t("cancel_return_stock") || "Bekor qilish (Qoldiqni qaytarish)"}
                </button>
              </div>
            </div>

            {/* Order Metadata Footer */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/10 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>{t("source_label") || "Manba:"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {order.source_display || (order.source === "TMA" ? "Telegram Mini App" : "Veb-vitrina")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("payment_method_label") || "To'lov turi:"}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {order.payment_method_display || "Naqd pul"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t("order_time") || "Yaratilgan vaqti:"}</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
