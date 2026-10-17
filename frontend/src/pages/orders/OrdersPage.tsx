import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Send,
  X,
  ExternalLink,
  Printer,
  ChevronDown,
  Maximize2,
  Minimize2,
  Eye,
  Plus,
  SlidersHorizontal
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { Order, OrderItem } from "../../types";
import { PaginationMetadata } from "../../types/pagination";
import { TablePagination } from "../../components/ui/TablePagination";
import { useTablePagination } from "../../hooks/useTablePagination";

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

const ORDER_FLOW_STATUSES = ["NEW", "PROCESSING", "READY", "IN_DELIVERY", "COMPLETED"] as const;

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
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const paginationScope = JSON.stringify([store?.id, status, search, branch, sourceFilter, paymentFilter, urlTab]);
  const { page, pageSize, setPage, setPageSize } = useTablePagination(paginationScope);
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const createOrderButtonRef = useRef<HTMLButtonElement>(null);
  const [actionButtonWidth, setActionButtonWidth] = useState<number | null>(null);
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
    setPage(1);
    setSearchParams({ tab: "drafts" });
    notify(`Черновик заказа #${item.number} успешно создан`, "success");
  };

  useEffect(() => {
    if (urlQ) {
      setSearch(urlQ);
    }
  }, [urlQ]);

  useEffect(() => {
    if (!showFilters) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFilters(false);
        filterButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showFilters]);

  useEffect(() => {
    const button = createOrderButtonRef.current;
    if (!button) return;
    const syncButtonWidth = () => setActionButtonWidth(button.getBoundingClientRect().width);
    syncButtonWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(syncButtonWidth);
    observer.observe(button);
    return () => observer.disconnect();
  }, [lang, urlTab]);

  const { data, isLoading, isFetching, isPlaceholderData, isError } = useQuery({
    queryKey: ["orders", store?.id, paginationScope, page, pageSize, urlOrderId],
    enabled: Boolean(store?.id) && urlTab !== "drafts" && urlTab !== "abandoned",
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === paginationScope ? previous : undefined,
    queryFn: async () => {
      const res = await api.get("/orders/", { params: {
        status, q: search, store_id: store?.id,
        branch: branch !== "all" ? branch : undefined,
        source: sourceFilter !== "ALL" ? sourceFilter : undefined,
        payment_status: paymentFilter !== "ALL" ? paymentFilter : undefined,
        page, page_size: pageSize, focus_order: urlOrderId || undefined,
      } });
      return res.data as PaginationMetadata & {
        counts: Record<string, number>;
        orders: Order[];
      };
    },
  });

  useEffect(() => {
    if (data && !isPlaceholderData && data.page !== page) setPage(data.page);
  }, [data, isPlaceholderData, page, setPage]);

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

  const getOrderItemDetails = (item: OrderItem): string[] => {
    const options = (item.custom_options || {}) as Record<string, any>;
    const details: string[] = [];
    const choiceName = (choice: any) =>
      typeof choice === "string"
        ? choice
        : [choice?.group_name, choice?.name || choice?.name_ru || choice?.name_uz]
            .filter(Boolean)
            .join(": ");
    const appendChoices = (choices: any[] | undefined, prefix = "") => {
      if (Array.isArray(choices)) {
        choices.forEach((choice) => {
          const name = choiceName(choice);
          if (name) details.push(`${prefix}${name}${choice?.count > 1 ? ` × ${choice.count}` : ""}`);
        });
      }
    };

    if (options.style === "spicy") details.push("Sriracha");
    if (options.style === "classic") details.push(lang === "ru" ? "Классический" : lang === "en" ? "Classic" : "Klassik");
    if (options.crust) details.push(`${lang === "ru" ? "Основа" : lang === "en" ? "Base" : "Asos"}: ${choiceName(options.crust)}`);
    appendChoices(options.single_choices);
    appendChoices(options.multiple_choices);
    appendChoices(options.quantity_choices, "+ ");
    appendChoices(options.removed_ingredients, "− ");
    if (options.bun) details.push(`${lang === "ru" ? "Булочка" : lang === "en" ? "Bun" : "Bulochka"}: ${choiceName(options.bun)}`);
    appendChoices(options.patties);
    appendChoices(options.cheeses);
    appendChoices(options.toppings, "+ ");
    appendChoices(options.sauces);

    if (!details.length && (item.custom_summary || item.variation_name)) {
      details.push(...(item.custom_summary || item.variation_name || "").split("•").map((part) => part.trim()).filter(Boolean));
    }
    return details;
  };

  const tabs = [
    { id: "ALL", label: t("status_all") || "Все", count: counts.all },
    { id: "NEW", label: t("status_new") || "Новые", count: counts.new },
    { id: "PROCESSING", label: t("status_accepted") || "В обработке", count: counts.processing },
    { id: "READY", label: t("status_ready") || "Готовы", count: counts.ready },
    { id: "IN_DELIVERY", label: t("status_delivering") || "Доставка", count: counts.in_delivery },
    { id: "HISTORY", label: t("status_completed") || "Выполненные", count: counts.history },
  ];
  const activeFilterCount = Number(sourceFilter !== "ALL") + Number(paymentFilter !== "ALL");

  const draftsList = draftOrders.filter((d) => d.type === "draft");
  const abandonedList = draftOrders.filter((d) => d.type === "abandoned");
  const draftRows = urlTab === "drafts" ? draftsList : abandonedList;
  const draftPage = Math.min(page, Math.max(1, Math.ceil(draftRows.length / pageSize)));
  const visibleDraftRows = draftRows.slice((draftPage - 1) * pageSize, draftPage * pageSize);
  const draftActionLabel = urlTab === "drafts"
    ? lang === "ru" ? "Отправить счёт" : lang === "en" ? "Send invoice" : "Hisob yuborish"
    : lang === "ru" ? "Напомнить в Telegram" : lang === "en" ? "Remind in Telegram" : "Telegramda eslatish";
  const createOrderButton = (
    <button
      ref={createOrderButtonRef}
      type="button"
      onClick={() => setShowCreateModal(true)}
      className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#211b2e] bg-[#211b2e] px-3.5 py-2 text-xs font-medium text-white shadow-[0_4px_10px_rgba(33,27,46,0.2)] transition-colors hover:bg-[#151020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:border-[#f0edf4] dark:bg-[#f0edf4] dark:text-[#211b2e] dark:hover:bg-white cursor-pointer"
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
                {visibleDraftRows.map((d) => (
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
                {draftRows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-[#767084] dark:text-zinc-400">
                    {lang === "ru" ? "Записей пока нет" : lang === "en" ? "No records yet" : "Hozircha yozuvlar yo'q"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination total={draftRows.length} page={draftPage} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      ) : (
        <>
          {/* ORDER CONTROLS AND TABLE */}
          <div className="overflow-visible rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
            <div className="flex items-center gap-3 border-b border-[#e6e3eb] px-4 py-3 dark:border-zinc-700">
              <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
                <div className="storebox-segmented-control min-w-max" role="group" aria-label={lang === "ru" ? "Статус заказа" : "Buyurtma holati"}>
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
              {createOrderButton}
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[#e6e3eb] px-4 py-3 dark:border-zinc-700">
              <div className="relative min-w-0 flex-1 sm:max-w-[380px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9690a2]" aria-hidden="true" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("search_order_ph") || "Поиск по номеру заказа, имени или телефону..."}
                  className="w-full rounded-[10px] border border-[#e6e3eb] bg-[#f7f6f9] py-2 pl-10 pr-3 text-xs text-[#211b2e] placeholder:text-[#9690a2] focus:border-[#211b2e] focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-[#30263f] dark:text-white dark:focus:border-white"
                />
              </div>
              <div ref={filtersRef} className="relative shrink-0">
                <button
                  ref={filterButtonRef}
                  type="button"
                  aria-expanded={showFilters}
                  aria-controls={showFilters ? "order-additional-filters" : undefined}
                  onClick={() => setShowFilters((open) => !open)}
                  style={actionButtonWidth === null ? undefined : { width: actionButtonWidth }}
                  className={`inline-flex min-h-9 w-[150px] items-center justify-center gap-2 rounded-[10px] border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] cursor-pointer ${showFilters || activeFilterCount ? "border-[#211b2e] bg-[#f0edf4] text-[#211b2e] dark:border-[#b9acc9] dark:bg-[#30263f] dark:text-white" : "border-[#e6e3eb] bg-white text-[#494456] hover:bg-[#f7f6f9] dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-200 dark:hover:bg-[#30263f]"}`}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span>{lang === "ru" ? "Фильтр" : lang === "en" ? "Filter" : "Filtr"}</span>
                  {activeFilterCount > 0 && <span className="tabular-nums">{activeFilterCount}</span>}
                </button>
                {showFilters && (
                  <div id="order-additional-filters" role="group" aria-label={lang === "ru" ? "Фильтры заказов" : lang === "en" ? "Order filters" : "Buyurtma filtrlari"} className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[12px] border border-[#e6e3eb] bg-white p-3 shadow-[0_14px_32px_rgba(33,27,46,0.18)] dark:border-zinc-700 dark:bg-[#30263f]">
                    <label className="grid gap-1.5 text-xs font-medium text-[#494456] dark:text-zinc-200">
                      <span>{lang === "ru" ? "Канал заказа" : lang === "en" ? "Order channel" : "Buyurtma kanali"}</span>
                      <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="min-h-9 w-full rounded-[9px] border border-[#e6e3eb] bg-white px-2.5 text-xs text-[#211b2e] focus:border-[#211b2e] focus:outline-none dark:border-zinc-700 dark:bg-[#211b2e] dark:text-white">
                        <option value="ALL">{lang === "ru" ? "Все каналы" : lang === "en" ? "All channels" : "Barcha kanallar"}</option>
                        <option value="WEB">{lang === "ru" ? "Веб-сайт" : lang === "en" ? "Website" : "Veb-sayt"}</option>
                        <option value="TMA">Telegram Mini App</option>
                        <option value="INSTAGRAM">Instagram</option>
                      </select>
                    </label>
                    <label className="mt-3 grid gap-1.5 text-xs font-medium text-[#494456] dark:text-zinc-200">
                      <span>{lang === "ru" ? "Оплата" : lang === "en" ? "Payment" : "To'lov"}</span>
                      <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="min-h-9 w-full rounded-[9px] border border-[#e6e3eb] bg-white px-2.5 text-xs text-[#211b2e] focus:border-[#211b2e] focus:outline-none dark:border-zinc-700 dark:bg-[#211b2e] dark:text-white">
                        <option value="ALL">{lang === "ru" ? "Любая" : lang === "en" ? "Any" : "Barchasi"}</option>
                        <option value="PENDING">{lang === "ru" ? "Ожидает оплаты" : lang === "en" ? "Pending" : "To'lov kutilmoqda"}</option>
                        <option value="PAID">{lang === "ru" ? "Оплачено" : lang === "en" ? "Paid" : "To'langan"}</option>
                        <option value="FAILED">{lang === "ru" ? "Ошибка оплаты" : lang === "en" ? "Failed" : "To'lov xatosi"}</option>
                        <option value="REFUNDED">{lang === "ru" ? "Возврат" : lang === "en" ? "Refunded" : "Qaytarilgan"}</option>
                      </select>
                    </label>
                    {activeFilterCount > 0 && (
                      <button type="button" onClick={() => { setSourceFilter("ALL"); setPaymentFilter("ALL"); }} className="mt-3 text-xs font-medium text-[#686475] hover:text-[#211b2e] focus-visible:outline-2 focus-visible:outline-[#211b2e] dark:text-zinc-300 dark:hover:text-white cursor-pointer">
                        {lang === "ru" ? "Сбросить" : lang === "en" ? "Reset" : "Tozalash"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto" aria-busy={isFetching}>
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
                          : isError ? lang === "ru" ? "Не удалось загрузить заказы" : lang === "en" ? "Could not load orders" : "Buyurtmalarni yuklab bo'lmadi"
                          : lang === "ru" ? "Заказов пока нет" : lang === "en" ? "No orders yet" : "Hozircha buyurtmalar yo'q"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination total={data?.total ?? 0} page={data?.page ?? page} pageSize={data?.page_size ?? pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} busy={isFetching || isError} />
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

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17131f]/60 p-3 sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="selected-order-title"
            className={(isWideModal ? "max-w-4xl" : "max-w-2xl") + " flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-[#e6e3eb] bg-white shadow-2xl dark:border-zinc-700 dark:bg-[#211b2e]"}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-[#e6e3eb] px-5 py-4 dark:border-zinc-700 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h2 id="selected-order-title" className="text-[17px] font-semibold tracking-tight text-[#211b2e] dark:text-white">
                    #{selectedOrder.order_number}
                  </h2>
                  {getOrderStatusBadge(selectedOrder.status)}
                </div>
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-1.5 sm:w-auto">
                <button type="button" onClick={() => navigate("/orders/" + selectedOrder.id)} title={t("open_full_page") || "Open full page"} aria-label={t("open_full_page") || "Open full page"} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e6e3eb] px-2.5 text-xs font-medium text-[#494456] hover:bg-[#f7f6f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-white/10">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">{t("open_full_page")}</span>
                </button>
                <button type="button" onClick={() => window.print()} title={t("print_receipt") || "Print receipt"} aria-label={t("print_receipt") || "Print receipt"} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e6e3eb] px-2.5 text-xs font-medium text-[#494456] hover:bg-[#f7f6f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-white/10">
                  <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">{t("print_receipt")}</span>
                </button>
                {confirmCancelOrderId !== selectedOrder.id && selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                  <button type="button" onClick={() => setConfirmCancelOrderId(selectedOrder.id)} className="inline-flex min-h-9 items-center rounded-lg border border-[#e4c4ca] px-3 text-xs font-medium text-[#a33b4c] hover:bg-[#fbf4f5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a33b4c] dark:border-[#67404d] dark:hover:bg-white/5">
                    {t("cancel_return_stock_btn") || "Cancel order"}
                  </button>
                )}
                <span className="mx-0.5 hidden h-5 w-px bg-[#e6e3eb] dark:bg-zinc-700 sm:block" aria-hidden="true" />
                <button type="button" onClick={() => setIsWideModal(!isWideModal)} title={isWideModal ? t("collapse") : t("expand")} aria-label={isWideModal ? t("collapse") : t("expand")} className="hidden h-9 w-9 items-center justify-center rounded-lg text-[#767084] hover:bg-[#f7f6f9] hover:text-[#211b2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:hover:bg-white/10 dark:hover:text-white sm:inline-flex">
                  {isWideModal ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
                </button>
                <button type="button" onClick={() => { setSelectedOrder(null); setConfirmCancelOrderId(null); }} title={lang === "ru" ? "Закрыть" : lang === "en" ? "Close" : "Yopish"} aria-label={lang === "ru" ? "Закрыть" : lang === "en" ? "Close" : "Yopish"} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#767084] hover:bg-[#f7f6f9] hover:text-[#211b2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:hover:bg-white/10 dark:hover:text-white">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <section className="pb-5">
                <h3 className="text-[13px] font-semibold text-[#211b2e] dark:text-white">{t("change_status_title") || "Change status"}</h3>
                <div className="mt-3 overflow-x-auto pb-1 no-scrollbar">
                  <div className="storebox-segmented-control min-w-max" role="group" aria-label={t("change_status_title") || "Change status"}>
                    {ORDER_FLOW_STATUSES.map((step) => (
                      <button
                        key={step}
                        type="button"
                        aria-pressed={selectedOrder.status === step}
                        disabled={step === "NEW" || updateStatusMutation.isPending || selectedOrder.status === step}
                        onClick={() => updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: step })}
                        className={`storebox-segmented-tab disabled:cursor-default ${selectedOrder.status === step ? "is-active" : ""}`}
                      >
                        {getOrderStatusLabel(step)}
                      </button>
                    ))}
                  </div>
                </div>
                {confirmCancelOrderId === selectedOrder.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#ebe8ef] pt-3 text-xs dark:border-zinc-700">
                    <span className="mr-auto text-[#a33b4c]">
                      {lang === "ru" ? "Отменить заказ? Товары вернутся на склад." : lang === "en" ? "Cancel this order? Items will return to stock." : "Buyurtma bekor qilinsinmi? Mahsulotlar qoldiqqa qaytariladi."}
                    </span>
                    <button type="button" onClick={() => setConfirmCancelOrderId(null)} className="min-h-9 rounded-lg border border-[#e6e3eb] px-3 font-medium text-[#494456] hover:bg-[#f7f6f9] dark:border-zinc-600 dark:text-zinc-200">{lang === "ru" ? "Нет" : lang === "en" ? "No" : "Yo'q"}</button>
                    <button type="button" disabled={updateStatusMutation.isPending} onClick={() => { updateStatusMutation.mutate({ orderId: selectedOrder.id, newStatus: "CANCELLED" }); setConfirmCancelOrderId(null); }} className="min-h-9 rounded-lg bg-[#a33b4c] px-3 font-medium text-white hover:bg-[#8e2c3e] disabled:opacity-50">{lang === "ru" ? "Да, отменить" : lang === "en" ? "Yes, cancel" : "Ha, bekor qilish"}</button>
                  </div>
                ) : null}
              </section>

              <section aria-label={t("order_contents") || "Order items"} className="border-t border-[#ebe8ef] py-5 dark:border-zinc-700">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[13px] font-semibold text-[#211b2e] dark:text-white">{t("order_contents") || "Order items"}</h3>
                  <span className="text-xs font-medium tabular-nums text-[#767084] dark:text-zinc-400">
                    {selectedOrder.items?.reduce((count, item) => count + item.quantity, 0) || 0} {t("unit_pcs") || "pcs"}
                  </span>
                </div>
                <div className="mt-3 divide-y divide-[#ebe8ef] border-t border-[#ebe8ef] dark:divide-zinc-700 dark:border-zinc-700">
                  {selectedOrder.items?.map((item) => {
                    const itemImage = item.custom_image_url || item.product_image;
                    const details = getOrderItemDetails(item);
                    return (
                      <div key={item.id} className="flex items-start gap-3 py-3">
                        {itemImage && (
                          <button type="button" onClick={() => setPreviewImage(itemImage)} className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#e6e3eb] bg-[#f7f6f9] focus-visible:outline-2 focus-visible:outline-[#211b2e] dark:border-zinc-700" aria-label={lang === "ru" ? "Показать фото товара" : lang === "en" ? "View product image" : "Mahsulot rasmini ko'rish"}>
                            <img src={itemImage} alt="" className="h-full w-full object-cover" />
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-medium text-[#211b2e] dark:text-white">{item.product_name}</div>
                          {details.length > 0 && (
                            <div className="mt-0.5 text-xs leading-5 text-[#767084] dark:text-zinc-400">{details.join(" · ")}</div>
                          )}
                          <div className="mt-1 text-xs tabular-nums text-[#767084] dark:text-zinc-400">
                            {item.quantity} × {Number(item.unit_price).toLocaleString()} UZS
                          </div>
                        </div>
                        <div className="shrink-0 pt-0.5 text-[13px] font-semibold tabular-nums text-[#211b2e] dark:text-white">
                          {Number(item.total_price).toLocaleString()} UZS
                        </div>
                      </div>
                    );
                  })}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <p className="py-5 text-sm text-[#767084] dark:text-zinc-400">
                      {lang === "ru" ? "Товары не указаны" : lang === "en" ? "No items listed" : "Mahsulotlar ko'rsatilmagan"}
                    </p>
                  )}
                </div>
              </section>

              <div className="space-y-3 border-t border-[#ebe8ef] pt-5 dark:border-zinc-700">
                <details open key={"order-info-" + selectedOrder.id} className="group overflow-hidden rounded-lg border border-[#e6e3eb] dark:border-zinc-700">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold text-[#211b2e] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#211b2e] dark:text-white [&::-webkit-details-marker]:hidden">
                    {lang === "ru" ? "Информация о заказе" : lang === "en" ? "Order information" : "Buyurtma haqida ma'lumot"}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#767084] transition-transform group-open:rotate-180 dark:text-zinc-400" aria-hidden="true" />
                  </summary>
                  <dl className="divide-y divide-[#ebe8ef] border-t border-[#ebe8ef] px-4 py-1 text-[13px] dark:divide-zinc-700 dark:border-zinc-700">
                    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-[#767084] dark:text-zinc-400">{t("th_name") || "Name"}</dt>
                      <dd className="min-w-0 font-medium text-[#211b2e] dark:text-white">{selectedOrder.customer_name}</dd>
                    </div>
                    {selectedOrder.customer_phone && (
                      <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                        <dt className="text-[#767084] dark:text-zinc-400">{t("phone_number_label") || "Phone"}</dt>
                        <dd className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
                          <a href={"tel:" + selectedOrder.customer_phone} className="text-[#211b2e] underline decoration-[#c8c2d0] underline-offset-2 hover:decoration-[#211b2e] dark:text-white">{selectedOrder.customer_phone}</a>
                          <a href={"https://t.me/+" + selectedOrder.customer_phone.replace(/\D/g, "")} target="_blank" rel="noreferrer" className="text-[#494456] underline decoration-[#c8c2d0] underline-offset-2 hover:text-[#211b2e] dark:text-zinc-300">Telegram</a>
                        </dd>
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-[#767084] dark:text-zinc-400">{t("order_date") || "Date"}</dt>
                      <dd className="min-w-0 text-[#211b2e] dark:text-white">{new Date(selectedOrder.created_at).toLocaleString(lang === "ru" ? "ru-RU" : lang === "en" ? "en-US" : "uz-UZ")}</dd>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-[#767084] dark:text-zinc-400">{t("th_source") || "Source"}</dt>
                      <dd className="min-w-0 text-[#211b2e] dark:text-white">{selectedOrder.source === "TMA" ? "Telegram Mini App" : t("website_channel") || "Veb-sayt"}</dd>
                    </div>
                  </dl>
                </details>
                <details open key={"delivery-info-" + selectedOrder.id} className="group overflow-hidden rounded-lg border border-[#e6e3eb] dark:border-zinc-700">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[13px] font-semibold text-[#211b2e] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#211b2e] dark:text-white [&::-webkit-details-marker]:hidden">
                    {t("delivery_info") || "Delivery information"}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#767084] transition-transform group-open:rotate-180 dark:text-zinc-400" aria-hidden="true" />
                  </summary>
                  <dl className="divide-y divide-[#ebe8ef] border-t border-[#ebe8ef] px-4 py-1 text-[13px] dark:divide-zinc-700 dark:border-zinc-700">
                    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-[#767084] dark:text-zinc-400">{t("branch_assigned") || "Branch"}</dt>
                      <dd className="min-w-0 text-[#211b2e] dark:text-white">
                        {selectedOrder.branch_name ? (
                          <>
                            <span className="font-medium">{selectedOrder.branch_name}</span>
                            {selectedOrder.branch_address && <span className="mt-1 block text-xs leading-5 text-[#767084] dark:text-zinc-400">{selectedOrder.branch_address}</span>}
                            {selectedOrder.branch_phone && (
                              <a href={"tel:" + selectedOrder.branch_phone} className="mt-1 inline-block text-xs text-[#494456] underline decoration-[#c8c2d0] underline-offset-2 hover:text-[#211b2e] dark:text-zinc-300">{selectedOrder.branch_phone}</a>
                            )}
                          </>
                        ) : (
                          <span className="text-[#767084] dark:text-zinc-400">{t("branch_unassigned") || "No branch assigned"}</span>
                        )}
                      </dd>
                    </div>
                    <div className="grid grid-cols-1 gap-0.5 py-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                      <dt className="text-[#767084] dark:text-zinc-400">{t("delivery_address_title") || "Address"}</dt>
                      <dd className="min-w-0 leading-5 text-[#211b2e] dark:text-white">
                        {selectedOrder.delivery_address || t("address_not_specified")}
                        {selectedOrder.delivery_lat != null && selectedOrder.delivery_lng != null && (
                          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            <a href={"https://yandex.uz/maps/?rtext=~" + selectedOrder.delivery_lat + "," + selectedOrder.delivery_lng + "&rtt=auto"} target="_blank" rel="noreferrer" className="text-[#494456] underline decoration-[#c8c2d0] underline-offset-2 hover:text-[#211b2e] dark:text-zinc-300">{t("yandex_navigator") || "Yandex Maps"}</a>
                            <a href={"https://maps.google.com/?q=" + selectedOrder.delivery_lat + "," + selectedOrder.delivery_lng} target="_blank" rel="noreferrer" className="text-[#494456] underline decoration-[#c8c2d0] underline-offset-2 hover:text-[#211b2e] dark:text-zinc-300">Google Maps</a>
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </details>
              </div>
            </div>

            <div className="border-t border-[#e6e3eb] px-5 py-4 dark:border-zinc-700 sm:px-6">
              <h3 className="text-[13px] font-semibold text-[#211b2e] dark:text-white">
                {lang === "ru" ? "Оплата" : lang === "en" ? "Payment" : "To'lov"}
              </h3>
              <div className="mt-3 grid gap-x-8 gap-y-3 text-[13px] sm:grid-cols-2">
                <div className="flex justify-between gap-3">
                  <span className="text-[#767084] dark:text-zinc-400">{t("payment_method_label") || "Payment method"}</span>
                  <span className="text-right font-medium text-[#211b2e] dark:text-white">{selectedOrder.payment_method_display || (lang === "ru" ? "Наличные" : lang === "en" ? "Cash" : "Naqd pul")}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#767084] dark:text-zinc-400">{t("payment_status_label") || "Payment status"}</span>
                  <span className="text-right font-medium text-[#211b2e] dark:text-white">{selectedOrder.payment_status_display || (lang === "ru" ? "Ожидается" : lang === "en" ? "Pending" : "Kutilmoqda")}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-[#767084] dark:text-zinc-400">{t("delivery_service_fee") || "Delivery"}</span>
                  <span className="font-medium tabular-nums text-[#211b2e] dark:text-white">{Number(selectedOrder.delivery_fee || 0).toLocaleString()} UZS</span>
                </div>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-[#767084] dark:text-zinc-400">{t("discount_label") || "Discount"}</span>
                    <span className="font-medium tabular-nums text-[#211b2e] dark:text-white">−{Number(selectedOrder.discount_amount).toLocaleString()} UZS</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-3 border-t border-[#ebe8ef] pt-3 dark:border-zinc-700 sm:col-span-2">
                  <span className="font-medium text-[#494456] dark:text-zinc-300">{t("total_payment") || "Total"}</span>
                  <span className="text-[15px] font-semibold tabular-nums text-[#211b2e] dark:text-white">{Number(selectedOrder.total_amount).toLocaleString()} UZS</span>
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
