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
  Save,
  Eye,
  X,
  Building2,
  ChefHat,
  Sliders,
  Flame
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
            className={`ml-2 px-2.5 py-0.5 rounded-md text-xs font-medium border ${
              order.status === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
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
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
              <Send className="w-3 h-3" /> TG Bot
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <Globe className="w-3 h-3" /> Sayt
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>{t("print_receipt") || "Chop etish"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
          <div className="bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white flex items-center justify-center">
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
              {order.items?.map((item, index) => {
                const isCustom = Boolean(
                  item.custom_image_url ||
                  (item.custom_options && Object.keys(item.custom_options).length > 0) ||
                  (item.variation_name && item.variation_name.includes("•")) ||
                  (item.product_name && item.product_name.includes("Конструктор"))
                );
                const opts = item.custom_options || {};
                const hasStructuredOpts = Boolean(
                  opts.bun ||
                  (opts.patties && opts.patties.length > 0) ||
                  (opts.cheeses && opts.cheeses.length > 0) ||
                  (opts.toppings && opts.toppings.length > 0) ||
                  (opts.sauces && opts.sauces.length > 0) ||
                  (opts.single_choices && opts.single_choices.length > 0) ||
                  (opts.removed_ingredients && opts.removed_ingredients.length > 0)
                );

                if (isCustom) {
                  return (
                    <div
                      key={item.id}
                      className="py-4 bg-gradient-to-r from-amber-500/[0.06] via-orange-500/[0.02] to-transparent dark:from-amber-500/[0.08] border-l-4 border-l-amber-500 pl-3 sm:pl-4 pr-2 space-y-3 rounded-r-2xl my-2"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <span className="w-5 text-center font-mono text-xs font-bold text-slate-400 mt-2 shrink-0">
                            {index + 1}
                          </span>

                          {/* Composite Burger/Custom Photo or Icon */}
                          <div
                            onClick={() => item.product_image && setPreviewImage(item.product_image)}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/10 dark:bg-zinc-800 border-2 border-amber-300/80 dark:border-amber-500/30 p-1 flex flex-col items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer shadow-xs hover:border-amber-400 transition-colors"
                            title="Нажмите для просмотра фото"
                          >
                            {item.product_image ? (
                              <img
                                src={item.product_image}
                                alt="Собранный товар"
                                className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <ChefHat className="w-8 h-8 text-amber-500" />
                            )}
                            {item.product_image && (
                              <span className="absolute bottom-1 inset-x-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold py-0.5 rounded text-center opacity-90 group-hover:opacity-100 flex items-center justify-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" /> Фото
                              </span>
                            )}
                          </div>

                          {/* Item Info & Ingredients */}
                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                                {item.product_name}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-2xs">
                                <Sliders className="w-3 h-3" /> Рецепт / Конструктор
                              </span>
                            </div>

                            {/* Structured Ingredients / Options List */}
                            <div className="bg-white/90 dark:bg-zinc-850 rounded-xl p-3 border border-amber-200/80 dark:border-amber-900/40 space-y-2.5 text-xs shadow-2xs">
                              {/* 1. Style / Crust */}
                              {(opts.style || opts.crust) && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {opts.style === 'spicy' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <Flame className="w-3 h-3 text-rose-500" />
                                      Острый (Sriracha)
                                    </span>
                                  )}
                                  {opts.style === 'classic' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                      Классический
                                    </span>
                                  )}
                                  {opts.crust && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                      Основа: {opts.crust}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* 2. Single Choices & Multiple Choices */}
                              {((opts.single_choices && opts.single_choices.length > 0) || (opts.multiple_choices && opts.multiple_choices.length > 0)) && (
                                <div className="flex flex-wrap gap-1">
                                  {[...(opts.single_choices || []), ...(opts.multiple_choices || [])].map((sc: any, scIdx: number) => {
                                    const text = typeof sc === 'string' ? sc : `${sc.group_name ? sc.group_name + ': ' : ''}${sc.name}`;
                                    return (
                                      <span key={scIdx} className="bg-amber-50 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-amber-200/70">
                                        {text}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {/* 3. Added Toppings (Quantity Choices) */}
                              {opts.quantity_choices && opts.quantity_choices.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Добавлено к блюду:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {opts.quantity_choices.map((qc: any, qcIdx: number) => (
                                      <span key={qcIdx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-zinc-700 text-emerald-800 dark:text-emerald-300 border border-emerald-200/70">
                                        + {qc.name} ({qc.count}×)
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 4. Removed Ingredients */}
                              {opts.removed_ingredients && opts.removed_ingredients.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Убрать / Исключить:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {opts.removed_ingredients.map((rem: any, remIdx: number) => {
                                      const remText = typeof rem === 'string' ? rem : (rem.name || rem.name_ru || rem.name_uz);
                                      return (
                                        <span key={remIdx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/70">
                                          {remText.startsWith('-') ? remText : `- ${remText}`}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 5. Legacy 3D Burger Options */}
                              {opts.bun && (
                                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                  Булочка: <b>{opts.bun.name}</b>
                                </div>
                              )}
                              {opts.patties && opts.patties.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {opts.patties.map((p: any, idx: number) => (
                                    <span key={idx} className="bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700 border border-amber-200">
                                      {p.count > 1 ? `${p.count}× ` : ''}{p.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {opts.cheeses && opts.cheeses.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {opts.cheeses.map((c: any, idx: number) => (
                                    <span key={idx} className="bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-700 border border-amber-200">
                                      {c.count > 1 ? `${c.count}× ` : ''}{c.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {opts.toppings && opts.toppings.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {opts.toppings.map((t: any, idx: number) => (
                                    <span key={idx} className="bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                      + {t.count > 1 ? `${t.count}× ` : ''}{t.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {opts.sauces && opts.sauces.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {opts.sauces.map((s: any, idx: number) => (
                                    <span key={idx} className="bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-semibold text-rose-700 border border-rose-200">
                                      {s.name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* 6. Fallback string if structured arrays not populated */}
                              {!opts.quantity_choices?.length && !opts.single_choices?.length && !opts.removed_ingredients?.length && !opts.bun && (item.custom_summary || item.variation_name) && (
                                <div className="flex flex-wrap gap-1">
                                  {(item.custom_summary || item.variation_name).split('•').map((part: string, idx: number) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-zinc-700 text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
                                      {part.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-slate-500 font-mono font-bold">
                              {item.quantity} шт. × {Number(item.unit_price).toLocaleString()} UZS
                            </div>
                          </div>
                        </div>

                        <div className="font-black text-slate-900 dark:text-white text-base sm:text-lg whitespace-nowrap self-end sm:self-center font-mono">
                          {Number(item.total_price).toLocaleString()} UZS
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
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
                        {item.variation_name && (
                          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-2">
                            {item.variation_name}
                          </div>
                        )}
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          {Number(item.unit_price).toLocaleString()} UZS × {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-black text-slate-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                      {Number(item.total_price).toLocaleString()} UZS
                    </div>
                  </div>
                );
              })}
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
                <span className="text-slate-900 dark:text-white font-mono text-xl font-bold">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Branch Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("branch_assigned") || "FILIAL"}</span>
                  </div>
                  {order.branch?.is_accepting_orders !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.branch?.is_accepting_orders ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                      {order.branch?.is_accepting_orders ? (t("branch_open") || "Ochiq") : (t("branch_closed") || "Yopiq")}
                    </span>
                  )}
                </div>
                {order.branch_name ? (
                  <>
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {order.branch_name}
                    </div>
                    {order.branch_address && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {order.branch_address}
                      </div>
                    )}
                    {order.branch_phone && (
                      <div className="pt-1">
                        <a
                          href={`tel:${order.branch_phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-amber-50 text-slate-700 dark:text-slate-200 hover:text-amber-700 font-mono text-xs font-bold border border-slate-200 dark:border-white/10 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-amber-600" />
                          {order.branch_phone}
                        </a>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-400 italic pt-1">
                      {t("branch_auto_routed_notice") || "Mijoz manziliga eng yaqin ochiq filialga yo'naltirildi"}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic pt-2">
                    {t("branch_unassigned") || "Filial biriktirilmagan"}
                  </div>
                )}
              </div>

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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition shadow-2xs"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t("yandex_navigator") || "Yandex Navigator"}</span>
                  </a>
                  <a
                    href={`https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-medium border border-blue-200 transition"
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
          <div className="bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("manage_status") || "Statusni boshqarish"}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Buyurtma holati */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  {t("order_status_label") || "Buyurtma holati"}
                </label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-normal text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
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
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                  {t("payment_status_label") || "To'lov holati"}
                </label>
                <select
                  value={paymentStatusVal}
                  onChange={(e) => setPaymentStatusVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-normal text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="PENDING">{t("status_pending") || "Kutilmoqda"}</option>
                  <option value="PAID">{t("status_paid") || "To'langan"}</option>
                  <option value="FAILED">{t("status_failed") || "Xatolik / Bekor qilingan"}</option>
                  <option value="REFUNDED">{t("status_refunded") || "Qaytarilgan"}</option>
                </select>
              </div>

              {/* Kuryer biriktirish */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Yetkazib beruvchi kuryer</span>
                  </span>
                  {order?.courier && (
                    <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {order.courier.name}
                    </span>
                  )}
                </label>
                <select
                  value={courierVal}
                  onChange={(e) => setCourierVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-xs font-normal text-slate-800 dark:text-white focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Kuryer biriktirilmagan --</option>
                  {couriersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
                {order?.courier && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-medium text-slate-800 dark:text-slate-200">{order.courier.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{order.courier.phone}</div>
                    </div>
                    <a
                      href={`tel:${order.courier.phone}`}
                      className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-medium text-[11px] flex items-center gap-1 hover:bg-slate-800 transition-colors shadow-2xs"
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
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="notifyTelegram"
                  className="text-xs font-normal text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  {t("send_tg_notification") || "Telegramga bildirishnoma yuborish"}
                </label>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
            <div className="pt-3 border-t border-slate-100 dark:border-white/10 space-y-2">
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                {t("quick_actions") || "Tezkor amallar"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickStatus("PROCESSING")}
                  className="py-2 px-3 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3 h-3" /> {t("to_processing") || "Jarayonga"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("READY")}
                  className="py-2 px-3 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="w-3 h-3" /> {t("ready") || "Tayyor"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("IN_DELIVERY")}
                  className="py-2 px-3 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3 h-3" /> {t("in_courier") || "Kuryerda"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("COMPLETED")}
                  className="py-2 px-3 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-medium text-[11px] transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <CheckCircle className="w-3 h-3" /> {t("delivered") || "Yetkazildi"}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickStatus("CANCELLED")}
                  className="py-2 px-3 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium text-[11px] col-span-2 transition flex items-center justify-center gap-1 cursor-pointer"
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

      {/* BURGER PHOTO PREVIEW LIGHTBOX */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-zoom-out animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/20 flex flex-col items-center gap-4 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>🍔</span>
                <span>Реальное фото собранного бургера</span>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center p-3 bg-gradient-to-b from-amber-500/5 to-amber-500/15 rounded-2xl border border-amber-200/60 dark:border-amber-500/20">
              <img
                src={previewImage}
                alt="Burger Preview"
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </div>
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Точный внешний вид кастомного бургера с учетом всех выбранных булочек, слоев котлет, плавленых сыров, топпингов и соусов.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
