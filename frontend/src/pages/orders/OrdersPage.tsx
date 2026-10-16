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
  AlertTriangle,
  Building2,
  ChefHat,
  Sliders,
  Flame,
  Plus,
  FileEdit,
  ShoppingCart
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { Order } from "../../types";

interface DraftOrderItem {
  id: string;
  number: string;
  customer_name: string;
  customer_phone: string;
  product_title: string;
  amount: number;
  payment_method: string;
  created_at: string;
  type: "draft" | "abandoned";
}

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, store, lang } = useAuth();
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const branch = searchParams.get("branch") || "all";
  const urlQ = searchParams.get("q") || "";
  const urlTab = searchParams.get("tab") || "";
  const urlOrderId = searchParams.get("orderId") || "";

  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState(urlQ);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<number | null>(null);
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<number | null>(null);
  const [isWideModal, setIsWideModal] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Create Draft Order Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("+998 90 ");
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newAmount, setNewAmount] = useState("185000");
  const [newPaymentMethod, setNewPaymentMethod] = useState("Payme / Click");

  const draftStorageKey = `storebox_draft_orders_${store?.id || "default"}`;
  const [draftOrders, setDraftOrders] = useState<DraftOrderItem[]>(() => {
    try {
      const saved = localStorage.getItem(draftStorageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "dr-1",
        number: "D-1042",
        customer_name: "Сардор Каримов",
        customer_phone: "+998 90 945 12 34",
        product_title: "Индивидуальный заказ (2 позиции)",
        amount: 245000,
        payment_method: "Ссылка на оплату Payme",
        created_at: "Сегодня, 14:20",
        type: "draft",
      },
      {
        id: "ab-1",
        number: "CHK-8891",
        customer_name: "Дильноза Рустамова",
        customer_phone: "+998 93 511 88 90",
        product_title: "Оставлена корзина в Telegram Mini App",
        amount: 168000,
        payment_method: "Не завершено (Click)",
        created_at: "Сегодня, 12:05",
        type: "abandoned",
      },
      {
        id: "ab-2",
        number: "CHK-8890",
        customer_name: "Азизбек Турсунов",
        customer_phone: "+998 97 702 44 19",
        product_title: "Оставлена корзина на веб-витрине",
        amount: 390000,
        payment_method: "Не завершено (Uzum)",
        created_at: "Вчера, 19:40",
        type: "abandoned",
      },
    ];
  });

  const handleCreateDraftOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    const item: DraftOrderItem = {
      id: "dr-" + Date.now(),
      number: "D-" + Math.floor(1050 + Math.random() * 900),
      customer_name: newCustomerName.trim(),
      customer_phone: newCustomerPhone.trim(),
      product_title: newProductTitle.trim() || "Товары из каталога магазина",
      amount: Number(newAmount) || 150000,
      payment_method: newPaymentMethod,
      created_at: "Только что",
      type: "draft",
    };
    const next = [item, ...draftOrders];
    setDraftOrders(next);
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(next));
    } catch {}
    setShowCreateModal(false);
    setNewCustomerName("");
    setNewProductTitle("");
    setSearchParams({ tab: "drafts" });
    notify(`Черновик заказа #${item.number} успешно создан`, "success");
  };

  useEffect(() => {
    if (urlQ) {
      setSearch(urlQ);
    }
  }, [urlQ]);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", store?.id, status, search, branch],
    queryFn: async () => {
      const branchParam = branch !== "all" ? `&branch=${branch}` : "";
      const res = await api.get(`/orders/?status=${status}&q=${encodeURIComponent(search)}${branchParam}&store_id=${store?.id || ""}`);
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

  useEffect(() => {
    if (!urlOrderId || !orders.length) return;
    const cleanTarget = urlOrderId.replace(/^#/, "").trim();
    const matched = orders.find(
      (o) => String(o.id) === cleanTarget || String(o.order_number) === cleanTarget
    );
    if (matched) {
      setSelectedOrder(matched);
      setHighlightedOrderId(matched.id);
      setTimeout(() => {
        const rowEl = document.getElementById(`order-row-${matched.id}`);
        if (rowEl) {
          rowEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 120);
      // Clear orderId from URL so closing the modal doesn't immediately reopen it
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("orderId");
      setSearchParams(nextParams, { replace: true });
    }
  }, [urlOrderId, orders, searchParams, setSearchParams]);

  const getOrderStatusLabel = (st: string) => {
    switch (st?.toUpperCase()) {
      case "NEW":
        return t("status_new") || "Новый";
      case "PROCESSING":
        return t("status_accepted") || "В работе";
      case "READY":
        return t("status_ready") || "Готов";
      case "IN_DELIVERY":
        return t("status_delivering") || "В пути";
      case "COMPLETED":
        return t("status_completed") || "Выполнен";
      case "CANCELLED":
        return t("status_cancelled") || "Отменен";
      default:
        return st;
    }
  };

  const getOrderStatusBadge = (st: string) => {
    const normalizedStatus = st?.toUpperCase();
    const dotColor = normalizedStatus === "NEW"
      ? "bg-[#a3e635]"
      : normalizedStatus === "CANCELLED"
      ? "bg-[#d18b95]"
      : normalizedStatus === "COMPLETED"
      ? "bg-[#211b2e] dark:bg-white"
      : "bg-[#a49aaf]";

    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#494456] dark:text-zinc-200">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
        {getOrderStatusLabel(st)}
      </span>
    );
  };

  const tabs = [
    { id: "ALL", label: t("status_all") || "Все", count: counts.all },
    { id: "NEW", label: t("status_new") || "Новые", count: counts.new },
    { id: "PROCESSING", label: t("status_accepted") || "В обработке", count: counts.processing },
    { id: "READY", label: t("status_ready") || "Готовы", count: counts.ready },
    { id: "IN_DELIVERY", label: t("status_delivering") || "Доставка", count: counts.in_delivery },
    { id: "HISTORY", label: t("status_completed") || "Выполненные", count: counts.history },
  ];

  const draftsList = draftOrders.filter((d) => d.type === "draft");
  const abandonedList = draftOrders.filter((d) => d.type === "abandoned");
  const draftActionLabel = urlTab === "drafts"
    ? lang === "ru" ? "Отправить счёт" : lang === "en" ? "Send invoice" : "Hisob yuborish"
    : lang === "ru" ? "Напомнить в Telegram" : lang === "en" ? "Remind in Telegram" : "Telegramda eslatish";
  const createOrderButton = (
    <button
      type="button"
      onClick={() => setShowCreateModal(true)}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-[10px] border border-[#211b2e] bg-[#211b2e] px-3.5 py-2 text-xs font-medium text-white shadow-[0_4px_10px_rgba(33,27,46,0.2)] transition-colors hover:bg-[#151020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:border-[#f0edf4] dark:bg-[#f0edf4] dark:text-[#211b2e] dark:hover:bg-white cursor-pointer"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      <span>{lang === "ru" ? "Создать заказ" : lang === "en" ? "Create order" : "Buyurtma yaratish"}</span>
    </button>
  );

  return (
    <div className="space-y-5">
      {/* DRAFTS OR ABANDONED CHECKOUTS VIEW */}
      {(urlTab === "drafts" || urlTab === "abandoned") ? (
        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="flex justify-end px-4 py-3 border-b border-[#e3e5e7] dark:border-zinc-800">
            {createOrderButton}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f6f6f7] dark:bg-zinc-900 text-[#6d7175] font-semibold border-b border-[#e3e5e7] dark:border-zinc-800 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Номер</th>
                  <th className="py-3 px-4">Дата</th>
                  <th className="py-3 px-4">Клиент</th>
                  <th className="py-3 px-4">Состав корзины</th>
                  <th className="py-3 px-4">Статус оплаты</th>
                  <th className="py-3 px-4">Итого</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f2f4] dark:divide-zinc-800 text-[#202223] dark:text-zinc-200">
                {(urlTab === "drafts" ? draftsList : abandonedList).map((d) => (
                  <tr key={d.id} className="hover:bg-[#f6f6f7]/60 transition">
                    <td className="py-3.5 px-4 font-bold">#{d.number}</td>
                    <td className="py-3.5 px-4 text-[#6d7175]">{d.created_at}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{d.customer_name}</div>
                      <div className="text-[11px] text-[#6d7175]">{d.customer_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">{d.product_title}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f1f2f4] text-[#202223]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {d.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold tabular-nums">
                      {d.amount.toLocaleString("ru-RU")} UZS
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          notify(
                            urlTab === "drafts"
                              ? `Ссылка на оплату черновика #${d.number} отправлена клиенту ${d.customer_name}`
                              : `Напоминание о корзине #${d.number} отправлено в Telegram клиенту ${d.customer_name}`,
                            "success"
                          )
                        }
                        className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#d8d1e2] bg-white px-3 py-1.5 text-xs font-medium text-[#211b2e] transition-colors hover:border-[#b9acc9] hover:bg-[#f7f4fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-[#30263f] cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {draftActionLabel}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* STATUS TABS */}
          <div className="w-full overflow-x-auto no-scrollbar">
            <div className="storebox-segmented-control storebox-segmented-control--full !flex mx-auto min-w-[760px] max-w-[980px]" role="group" aria-label={lang === "ru" ? "Статус заказа" : "Buyurtma holati"}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={status === tab.id}
                  onClick={() => setStatus(tab.id)}
                  className={`storebox-segmented-tab ${status === tab.id ? "is-active" : ""}`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[11px] tabular-nums ${status === tab.id ? "text-white/75" : "text-[#9690a2] dark:text-[#a9a1b6]"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH AND ORDERS TABLE */}
          <div className="overflow-hidden rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
            <div className="flex flex-col gap-3 border-b border-[#e6e3eb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700">
              <div className="relative w-full sm:max-w-[380px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9690a2]" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_order_ph") || "Поиск по номеру заказа, имени или телефону..."}
                  className="w-full rounded-[10px] border border-[#e6e3eb] bg-[#f7f6f9] py-2 pl-10 pr-3 text-xs text-[#211b2e] placeholder:text-[#9690a2] focus:border-[#211b2e] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-[#30263f] dark:text-white dark:focus:border-white"
                />
              </div>
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                <span className="whitespace-nowrap text-xs font-medium text-[#686475] dark:text-zinc-400">
                  {t("showing_orders_format")
                    ? t("showing_orders_format").replace("{count}", String(orders.length))
                    : `Показано заказов: ${orders.length}`}
                </span>
                {createOrderButton}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead className="border-b border-[#e6e3eb] bg-[#f7f6f9] text-[11px] text-[#767084] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-3 font-medium">{t("th_order_num") || "Заказ"}</th>
                    <th className="px-3 py-3 font-medium">{t("th_client") || "Клиент"}</th>
                    <th className="px-3 py-3 font-medium">{t("th_branch") || "Филиал"}</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium">{t("th_payment") || "Оплата"}</th>
                    <th className="px-3 py-3 font-medium">{t("th_delivery") || "Доставка"}</th>
                    <th className="whitespace-nowrap px-3 py-3 font-medium">{t("th_status") || "Статус"}</th>
                    <th className="whitespace-nowrap px-3 py-3 text-right font-medium">{t("th_action") || "Действие"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eeebf1] font-normal text-[#211b2e] dark:divide-zinc-800 dark:text-zinc-200">
                  {orders.map((order) => (
                    <tr
                      id={`order-row-${order.id}`}
                      key={order.id}
                      onClick={() => {
                        setHighlightedOrderId(order.id);
                        setSelectedOrder(order);
                      }}
                      className={`group cursor-pointer transition-colors hover:bg-[#faf9fc] dark:hover:bg-[#30263f] ${
                        highlightedOrderId === order.id ? "bg-[#f3f0f8] ring-1 ring-inset ring-[#d8d1e2] dark:bg-[#30263f]" : ""
                      }`}
                    >
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-[#211b2e] dark:text-white">
                            #{order.order_number}
                          </span>
                          <span className="text-[11px] text-[#8b8497] dark:text-zinc-400">
                            {order.source === "TMA" ? "Telegram" : t("website_channel") || "Сайт"}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8b8497] dark:text-zinc-400">
                          {new Date(order.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="min-w-[120px] max-w-[160px] px-3 py-3.5">
                        <div className="truncate font-medium text-[#211b2e] dark:text-white" title={order.customer_name}>{order.customer_name}</div>
                        <div className="mt-1 whitespace-nowrap text-[11px] text-[#8b8497] dark:text-zinc-400">{order.customer_phone}</div>
                      </td>
                      <td className="px-3 py-3.5">
                        {order.branch_name ? (
                          <span className="block max-w-[130px] truncate text-[#494456] dark:text-zinc-300" title={order.branch_name}>
                            {order.branch_name}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-[#8b8497] dark:text-zinc-400">
                            {t("branch_unassigned") || "Основной склад"}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">
                        <div className="font-semibold tabular-nums text-[#211b2e] dark:text-white">
                          {Number(order.total_amount).toLocaleString()} UZS
                        </div>
                        <div className="mt-1 max-w-[120px] truncate text-[11px] text-[#8b8497] dark:text-zinc-400">{order.payment_method_display}</div>
                      </td>
                      <td className="px-3 py-3.5 text-[#686475] dark:text-zinc-300">
                        <span className="block max-w-[150px] truncate" title={order.delivery_address || undefined}>
                          {order.delivery_address || (t("address_not_specified") || "Адрес не указан")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5">{getOrderStatusBadge(order.status)}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            title={t("view_details") || "Просмотр"}
                            aria-label={t("view_details") || "Просмотр"}
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-[#8b8497] transition-colors hover:bg-[#f0edf4] hover:text-[#211b2e] focus-visible:outline-2 focus-visible:outline-[#211b2e] dark:hover:bg-[#3b304e] dark:hover:text-white cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            title={t("open_full_page") || "Открыть заказ"}
                            aria-label={t("open_full_page") || "Открыть заказ"}
                            to={`/orders/${order.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[9px] text-[#8b8497] transition-colors hover:bg-[#f0edf4] hover:text-[#211b2e] focus-visible:outline-2 focus-visible:outline-[#211b2e] dark:hover:bg-[#3b304e] dark:hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-sm text-[#767084] dark:text-zinc-400">
                        {isLoading
                          ? lang === "ru" ? "Загрузка заказов..." : lang === "en" ? "Loading orders..." : "Buyurtmalar yuklanmoqda..."
                          : lang === "ru" ? "Заказов пока нет" : lang === "en" ? "No orders yet" : "Hozircha buyurtmalar yo'q"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* CREATE DRAFT ORDER MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202223] dark:text-white">
                Создать черновик заказа
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-[#6d7175] hover:text-[#202223] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDraftOrder} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#202223] mb-1">Имя покупателя *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Напр.: Рустам Алимов"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] text-xs focus:outline-none focus:border-[#202223]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#202223] mb-1">Телефон *</label>
                <input
                  type="text"
                  required
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] text-xs focus:outline-none focus:border-[#202223]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#202223] mb-1">Товары в заказе</label>
                <input
                  type="text"
                  value={newProductTitle}
                  onChange={(e) => setNewProductTitle(e.target.value)}
                  placeholder="Напр.: Двойной Чизбургер Комбо x2"
                  className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] text-xs focus:outline-none focus:border-[#202223]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202223] mb-1">Сумма (UZS)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] text-xs focus:outline-none focus:border-[#202223]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] mb-1">Способ оплаты</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-[8px] border border-[#d2d5d8] bg-white text-xs"
                  >
                    <option value="Payme / Click">Payme / Click</option>
                    <option value="Uzum Bank">Uzum Bank</option>
                    <option value="Наличными курьеру">Наличными курьеру</option>
                  </select>
                </div>
              </div>
              <div className="pt-3 border-t border-[#e3e5e7] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 rounded-[8px] border border-[#d2d5d8] text-[#202223] text-xs font-medium hover:bg-[#f6f6f7] cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[8px] bg-[#202223] hover:bg-black text-white text-xs font-semibold cursor-pointer"
                >
                  Сохранить черновик
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL / SLIDE-OVER ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full ${
              isWideModal ? "max-w-5xl" : "max-w-xl"
            } bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-200`}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-zinc-900/50">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="font-semibold text-xl text-neutral-900 dark:text-white">
                  #{selectedOrder.order_number}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                    selectedOrder.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : selectedOrder.status === "CANCELLED"
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                      : selectedOrder.status === "IN_DELIVERY"
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                      : selectedOrder.status === "READY"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                  }`}
                >
                  {getOrderStatusLabel(selectedOrder.status) || selectedOrder.status_display}
                </span>
                {selectedOrder.source === "TMA" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                    <Send className="w-3 h-3" /> Telegram Bot
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Globe className="w-3 h-3" /> {t("website_channel") || "Veb-sayt"}
                  </span>
                )}
                <span className="text-xs text-slate-400 hidden sm:inline">
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
                      <h4 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                        {t("order_contents") || "Buyurtma tarkibi"} ({selectedOrder.items?.length || 0})
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        {selectedOrder.items?.reduce((acc, it) => acc + it.quantity, 0) || 0} {t("unit_pcs") || "dona"}
                      </span>
                    </div>
                    <div className="border border-slate-100 dark:border-white/5 rounded-2xl divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                      {selectedOrder.items?.map((item) => {
                        const opts = (item.custom_options || {}) as any;
                        const isCustom = Boolean(
                          item.custom_image_url ||
                          (item.custom_options && Object.keys(item.custom_options).length > 0) ||
                          item.custom_summary ||
                          (item.variation_name && (item.variation_name.includes("•") || item.variation_name.includes("retsept") || item.variation_name.includes("рецепт"))) ||
                          (item.product_name && (item.product_name.includes("Конструктор") || item.product_name.includes("Custom")))
                        );

                        if (isCustom) {
                          return (
                            <div
                              key={item.id}
                              className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-500/[0.06] via-orange-500/[0.02] to-transparent dark:from-amber-500/[0.08] border-l-4 border-l-amber-500 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                                  {/* Composite Photo or Image */}
                                  <div
                                    onClick={() => item.product_image && setPreviewImage(item.product_image)}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500/10 dark:bg-zinc-800 border-2 border-amber-300/80 dark:border-amber-500/30 p-1 flex flex-col items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer shadow-xs hover:border-amber-400 transition-colors"
                                    title="Нажмите для просмотра фото"
                                  >
                                    {item.product_image ? (
                                      <img
                                        src={item.product_image}
                                        alt={item.product_name}
                                        className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-200"
                                      />
                                    ) : (
                                      <ShoppingBag className="w-8 h-8 text-amber-500" />
                                    )}
                                    <span className="absolute bottom-1 inset-x-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold py-0.5 rounded text-center opacity-90 group-hover:opacity-100 flex items-center justify-center gap-0.5">
                                      <Eye className="w-2.5 h-2.5" /> Фото
                                    </span>
                                  </div>

                                  {/* Item Info & Ingredients */}
                                  <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                                        {item.product_name}
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs">
                                        <Sliders className="w-3 h-3 stroke-[2.5]" /> Кастомный рецепт
                                      </span>
                                    </div>

                                    {/* Structured Ingredients / Recipe for Kitchen Staff */}
                                    <div className="bg-white/95 dark:bg-zinc-800/95 rounded-xl p-2.5 sm:p-3 border border-amber-200/80 dark:border-amber-800/40 space-y-2 text-xs shadow-2xs">
                                      <div className="flex items-center justify-between border-b border-amber-100 dark:border-white/5 pb-1">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                                          <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                                          <span>Состав и модификаторы для кухни:</span>
                                        </div>
                                      </div>

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
                                {item.variation_name && (
                                  <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 line-clamp-2">
                                    {item.variation_name}
                                  </div>
                                )}
                                <div className="text-xs text-slate-400 mt-1">
                                  {item.quantity} × {Number(item.unit_price).toLocaleString()} UZS
                                </div>
                              </div>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm whitespace-nowrap font-mono">
                              {Number(item.total_price).toLocaleString()} UZS
                            </div>
                          </div>
                        );
                      })}
                      {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Tovarlar ko`rsatilmagan
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 space-y-2.5 text-xs">
                    <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-3">
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
                    <div className="flex justify-between items-center text-base sm:text-lg font-bold pt-3 border-t border-slate-200 dark:border-white/10 text-slate-900 dark:text-white">
                      <span>{t("total_payment") || "Jami to'lov:"}</span>
                      <span className="text-slate-900 dark:text-white">
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
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
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
                        className="py-2.5 px-3 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> {t("delivered") || "Yetkazildi"}
                      </button>
                      {confirmCancelOrderId === selectedOrder.id ? (
                        <div className="col-span-2 p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                          <div className="text-[11px] font-bold text-rose-800">
                            {lang === "ru"
                              ? "Подтверждаете отмену заказа? Товары вернутся на склад."
                              : lang === "en"
                              ? "Confirm order cancellation? Items will return to stock."
                              : "Buyurtmani bekor qilishni tasdiqlaysizmi? Mahsulotlar qoldiqqa qaytariladi."}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "CANCELLED" });
                                setConfirmCancelOrderId(null);
                              }}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              {lang === "ru" ? "Да, отменить заказ" : lang === "en" ? "Yes, cancel order" : "Ha, bekor qilish"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelOrderId(null)}
                              className="py-1.5 px-3 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors cursor-pointer"
                            >
                              {lang === "ru" ? "Нет" : lang === "en" ? "No" : "Yo'q"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmCancelOrderId(selectedOrder.id)}
                          className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs col-span-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> {t("cancel_return_stock_btn") || "Bekor qilish (Qoldiqni qaytarish)"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Branch Information */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t("branch_assigned") || "Biriktirilgan filial"}</span>
                      </div>
                      {selectedOrder.branch?.is_accepting_orders !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedOrder.branch?.is_accepting_orders ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {selectedOrder.branch?.is_accepting_orders ? (t("branch_open") || "Ochiq") : (t("branch_closed") || "Yopiq")}
                        </span>
                      )}
                    </div>
                    {selectedOrder.branch_name ? (
                      <div className="space-y-1.5">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {selectedOrder.branch_name}
                        </div>
                        {selectedOrder.branch_address && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{selectedOrder.branch_address}</span>
                          </div>
                        )}
                        {selectedOrder.branch_phone && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`tel:${selectedOrder.branch_phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-zinc-800 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-bold transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-amber-600" />
                              <span>{selectedOrder.branch_phone}</span>
                            </a>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 italic pt-1">
                          {t("branch_auto_routed_notice") || "Mijoz manziliga eng yaqin ochiq filialga yo'naltirildi"}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        {t("branch_unassigned") || "Filial biriktirilmagan"}
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/10 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {t("customer_details_title") || "Mijoz ma'lumotlari"}
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {selectedOrder.customer_name}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${selectedOrder.customer_phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
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
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> {t("delivery_address_title") || "Yetkazib berish manzili"}
                      </div>
                      {selectedOrder.delivery_lat && selectedOrder.delivery_lng && (
                        <div className="text-[10px] text-slate-400">
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
                            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          >
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
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
