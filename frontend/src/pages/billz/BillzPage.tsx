import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Package,
  Check,
  Search,
  ShieldCheck,
  DownloadCloud,
  Layers,
  ExternalLink,
  Power,
  RotateCw,
  Boxes,
  Tag,
  DollarSign,
  Sparkles,
  SlidersHorizontal,
  X,
  Image as ImageIcon
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface BillzStatus {
  success: boolean;
  is_connected: boolean;
  is_active: boolean;
  api_key?: string;
  api_key_masked?: string;
  company_id?: string;
  shop_id?: string;
  shop_name?: string;
  last_sync_at?: string;
  linked_products_count: number;
  total_store_products_count: number;
}

interface BillzProduct {
  id: string;
  name: string;
  category_name?: string;
  barcode?: string;
  sku?: string;
  price: number;
  cost_price?: number;
  stock: number;
  unit?: string;
  image_url?: string;
  description?: string;
  is_linked?: boolean;
}

interface BillzCategory {
  id: string;
  name: string;
  count: number;
}

export const BillzPage: React.FC = () => {
  const { lang, store } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Status & notifications
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Connection form state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [companyIdInput, setCompanyIdInput] = useState("");
  const [shopIdInput, setShopIdInput] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Catalog Explorer & Import state
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 30;

  // Localized texts
  const t = {
    backToMarket: lang === "ru" ? "Назад в Маркет интеграций" : lang === "en" ? "Back to Market" : "Orqaga: Integratsiyalar marketi",
    title: lang === "ru" ? "Импорт товаров из Billz" : lang === "en" ? "Billz Catalog Import" : "Billz dan tovarlarni import qilish",
    subtitle: lang === "ru" 
      ? "Подключите интеграцию, чтобы связать склад Billz, загрузить каталог товаров и обновлять остатки с ценами в StoreBox."
      : lang === "en"
      ? "Connect Billz POS to sync warehouse inventory, products catalog and stock prices."
      : "Integratsiyani ulang, Billz omborini bog'lang, tovarlar katalogini yuklang va qoldiqlarni narxlar bilan yangilang.",
    connectedStatus: lang === "ru" ? "Billz успешно подключен и активен!" : "Billz muvaffaqiyatli ulangan va faol ishlamoqda!",
    notConnectedStatus: lang === "ru" ? "Billz еще не подключен. Укажите API-ключ (Token) ниже и нажмите «Сохранить и подключить»." : "Billz hali ulanmagan. API kalitni kiriting va «Saqlash va ulash» tugmasini bosing.",
    shopLabel: lang === "ru" ? "Склад / Филиал:" : "Ombor / Filial:",
    linkedProducts: lang === "ru" ? "Синхронизировано товаров:" : "Ulangan tovarlar:",
    totalInStore: lang === "ru" ? "Всего в магазине:" : "Do'konda jami:",
    syncStockBtn: lang === "ru" ? "Синхронизировать остатки" : "Qoldiqlarni sinxronlash",
    updatePricesBtn: lang === "ru" ? "Обновить цены" : "Narxlarni yangilash",
    syncNowBtn: lang === "ru" ? "Синхронизировать сейчас" : "Hozir sinxronlash",
    connSettingsTitle: lang === "ru" ? "НАСТРОЙКИ ПОДКЛЮЧЕНИЯ" : "ULANISH SOZLAMALARI",
    apiKeyPlaceholder: lang === "ru" ? "Введите Billz Secret Token (API kalit)" : "Billz Secret Token (API kalit) kiriting",
    companyIdPlaceholder: lang === "ru" ? "ID Компании (Company ID)" : "Kompaniya ID (Company ID)",
    shopIdPlaceholder: lang === "ru" ? "ID Магазина (Shop ID)" : "Do'kon ID (Shop ID)",
    testBtn: lang === "ru" ? "Проверить связь" : "Aloqani tekshirish",
    saveBtn: lang === "ru" ? "Сохранить и подключить" : "Saqlash va ulash",
    disconnectBtn: lang === "ru" ? "Отключить" : "Ulanishni uzish",
    catalogTitle: lang === "ru" ? "КАТАЛОГ ТОВАРОВ BILLZ" : "BILLZ TOVARLAR KATALOGI",
    catalogDesc: lang === "ru" ? "Просмотр товаров на складе Billz и импорт в интернет-магазин" : "Kassadagi tovarlarni ko'rish va internet-do'konga import qilish",
    selectAll: lang === "ru" ? "Выбрать все" : "Barchasini tanlash",
    deselectAll: lang === "ru" ? "Снять выбор" : "Tanlovni bekor qilish",
    reloadCatalog: lang === "ru" ? "Загрузить каталог" : "Katalogni yangilash",
    importBtn: lang === "ru" ? "Импортировать" : "Yuklash",
    searchPlaceholder: lang === "ru" ? "Поиск среди загруженных товаров Billz..." : "Yuklangan tovarlar ichidan qidirish...",
    inStock: lang === "ru" ? "в наличии" : "dona qoldiq",
    outOfStock: lang === "ru" ? "Нет в наличии" : "Qoldiq yo'q",
    statusLinked: lang === "ru" ? "В каталоге" : "Ulangan",
    statusNew: lang === "ru" ? "Не импортирован" : "Yangi",
    allCategories: lang === "ru" ? "Все категории" : "Barcha toifalar",
  };

  // 1. Fetch current Billz status
  const { data: status, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery<BillzStatus>({
    queryKey: ["billz-status", store?.id],
    queryFn: async () => {
      const url = store?.id ? `/billz/status/?store_id=${store.id}` : "/billz/status/";
      const res = await api.get(url);
      return res.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Prepopulate inputs from status
  useEffect(() => {
    if (status?.api_key && !apiKeyInput) {
      setApiKeyInput(status.api_key);
    }
    if (status?.company_id && !companyIdInput) {
      setCompanyIdInput(status.company_id);
    }
    if (status?.shop_id && !shopIdInput) {
      setShopIdInput(status.shop_id);
    }
  }, [status]);

  // 2. Fetch full catalog from Billz
  const {
    data: catalogData,
    isLoading: isCatalogLoading,
    isFetching: isCatalogFetching,
    refetch: refetchCatalog,
  } = useQuery<{ success: boolean; products: BillzProduct[]; categories: BillzCategory[]; total_count: number }>({
    queryKey: ["billz-catalog", store?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (store?.id) params.set("store_id", String(store.id));
      const res = await api.get(`/billz/catalog/?${params.toString()}`);
      return res.data;
    },
    enabled: !isStatusLoading,
    staleTime: 60000,
  });

  const productsList = catalogData?.products || [];
  const categoriesList = catalogData?.categories || [];

  // Update selectedProductIds initially to unlinked items
  useEffect(() => {
    if (productsList.length > 0 && selectedProductIds.size === 0) {
      const unlinked = new Set<string>();
      productsList.forEach((p) => {
        if (!p.is_linked) unlinked.add(p.id);
      });
      setSelectedProductIds(unlinked);
    }
  }, [productsList]);

  // Test connection
  const handleTestConnection = async () => {
    if (testingConnection) return;
    const key = apiKeyInput.trim() || status?.api_key || "";
    if (!key) {
      setMsg({ type: "error", text: "Iltimos, Billz API kalitini kiriting." });
      return;
    }
    setTestingConnection(true);
    setMsg(null);
    try {
      const res = await api.post("/billz/test/", {
        api_key: key,
        company_id: companyIdInput.trim(),
        shop_id: shopIdInput.trim(),
        store_id: store?.id,
      });
      if (res.data?.success) {
        setMsg({
          type: "success",
          text: res.data?.message || "Billz serveri bilan aloqa muvaffaqiyatli tekshirildi! (200 OK)"
        });
      } else {
        setMsg({ type: "error", text: res.data?.message || res.data?.error || "Aloqa o'rnatib bo'lmadi." });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.error || err?.response?.data?.message || "Billz serveriga ulanib bo'lmadi."
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Connect & Save
  const handleConnect = async () => {
    if (connecting) return;
    const key = apiKeyInput.trim();
    if (!key) {
      setMsg({ type: "error", text: "Iltimos, Billz API kalitini (Secret Token) kiriting." });
      return;
    }
    setConnecting(true);
    setMsg(null);
    try {
      const res = await api.post("/billz/connect/", {
        api_key: key,
        company_id: companyIdInput.trim(),
        shop_id: shopIdInput.trim(),
        store_id: store?.id,
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data?.message || "Billz muvaffaqiyatli ulandi!" });
        queryClient.invalidateQueries({ queryKey: ["billz-status"] });
        queryClient.invalidateQueries({ queryKey: ["billz-catalog"] });
        queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Ulanishda xatolik yuz berdi." });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.error || "Billz ulanishida xatolik yuz berdi."
      });
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (disconnecting) return;
    setDisconnecting(true);
    setMsg(null);
    try {
      const res = await api.post("/billz/disconnect/", { store_id: store?.id });
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data?.message || "Billz ulanishi uzildi." });
        queryClient.invalidateQueries({ queryKey: ["billz-status"] });
        queryClient.invalidateQueries({ queryKey: ["billz-catalog"] });
        queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: "Ulanishni uzishda xatolik." });
    } finally {
      setDisconnecting(false);
    }
  };

  // Sync Stock & Prices
  const handleSyncAll = async () => {
    if (syncing) return;
    setSyncing(true);
    setMsg(null);
    try {
      const res = await api.post("/billz/sync/", { store_id: store?.id });
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data?.message || "Sinxronizatsiya muvaffaqiyatli yakunlandi!" });
        queryClient.invalidateQueries({ queryKey: ["billz-status"] });
        queryClient.invalidateQueries({ queryKey: ["billz-catalog"] });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Sinxronizatsiya amalga oshmadi." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Sinxronizatsiya xatosi." });
    } finally {
      setSyncing(false);
    }
  };

  // Import selected items
  const handleImportSelected = async () => {
    if (importing || selectedProductIds.size === 0) return;
    setImporting(true);
    setMsg(null);
    try {
      const selectedItems = productsList.filter((p) => selectedProductIds.has(p.id));
      const res = await api.post("/billz/import/", {
        items: selectedItems,
        store_id: store?.id,
      });
      if (res.data?.success) {
        setMsg({
          type: "success",
          text: res.data?.message || `Muvaffaqiyatli import qilindi: ${res.data?.created} yangi tovar!`
        });
        queryClient.invalidateQueries({ queryKey: ["billz-status"] });
        queryClient.invalidateQueries({ queryKey: ["billz-catalog"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Import jarayonida xatolik yuz berdi." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Import xatosi yuz berdi." });
    } finally {
      setImporting(false);
    }
  };

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchesSearch =
        !catalogSearch.trim() ||
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (p.barcode && p.barcode.includes(catalogSearch.trim())) ||
        (p.sku && p.sku.toLowerCase().includes(catalogSearch.toLowerCase()));

      const matchesCat =
        selectedCategory === "all" || p.category_name === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [productsList, catalogSearch, selectedCategory]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      filteredProducts.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleDeselectAllFiltered = () => {
    setSelectedProductIds(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* 1. TOP HEADER & BACK NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/robo-market")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-xs font-bold shadow-2xs cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>{t.backToMarket}</span>
          </button>
        </div>

        {/* Global Sync Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || !status?.is_connected}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Sinxronlanmoqda..." : t.syncStockBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || !status?.is_connected}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.updatePricesBtn}</span>
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATIONS ALERT */}
      {msg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in ${
            msg.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200/80"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. HERO STATUS BANNER */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#1D4ED8] rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0">
              <span className="text-white font-black text-2xl tracking-tighter select-none">B</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t.title}
                </h1>
                {status?.is_connected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {lang === "ru" ? "Подключено" : "Ulangan"}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-500">
                    {lang === "ru" ? "Не подключено" : "Ulanmagan"}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 font-normal leading-relaxed max-w-2xl">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-neutral-850 p-4 rounded-2xl border border-slate-200/70 dark:border-neutral-800 shrink-0">
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-500 font-medium">{t.linkedProducts}</div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {status?.linked_products_count || 0}{" "}
                <span className="text-xs font-normal text-slate-400">/ {status?.total_store_products_count || 0}</span>
              </div>
            </div>
            {status?.is_connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
              >
                {disconnecting ? "..." : t.disconnectBtn}
              </button>
            )}
          </div>
        </div>

        {/* Diagnostic info strip */}
        <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xavfsiz 256-bitli shifrlash (AES/HMAC)</span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              {t.shopLabel}{" "}
              <strong className="text-slate-800 dark:text-white">
                {status?.shop_name || "Billz Asosiy Ombor"}
              </strong>
            </span>
            {status?.last_sync_at && (
              <span>
                Oxirgi sinxronizatsiya:{" "}
                <strong className="text-slate-800 dark:text-white">
                  {new Date(status.last_sync_at).toLocaleString()}
                </strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. CONNECTION SETTINGS CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-500 tracking-wider uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>{t.connSettingsTitle}</span>
          </h2>
          {status?.api_key_masked && (
            <span className="text-[11px] font-mono text-slate-400">
              Token: {status.api_key_masked}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
              Billz Secret Token (API Kalit) *
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={t.apiKeyPlaceholder}
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
              Company ID (ixtiyoriy)
            </label>
            <input
              type="text"
              value={companyIdInput}
              onChange={(e) => setCompanyIdInput(e.target.value)}
              placeholder={t.companyIdPlaceholder}
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
            <span>{testingConnection ? "Tekshirilmoqda..." : t.testBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{connecting ? "Saqlanmoqda..." : t.saveBtn}</span>
          </button>
        </div>
      </div>

      {/* 5. CATALOG EXPLORER CARD */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 shadow-xs overflow-hidden space-y-4 p-6">
        {/* Header & Main Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Boxes className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {t.catalogTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                {productsList.length} {lang === "ru" ? "ТОВАРОВ" : "TA TOVAR"}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              {t.catalogDesc}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {t.selectAll} ({filteredProducts.length})
            </button>
            <button
              type="button"
              onClick={handleDeselectAllFiltered}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {t.deselectAll}
            </button>
            <button
              type="button"
              onClick={() => refetchCatalog()}
              disabled={isCatalogFetching}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title={t.reloadCatalog}
            >
              <RotateCw className={`w-3.5 h-3.5 ${isCatalogFetching ? "animate-spin" : ""}`} />
            </button>

            {/* IMPORT ACTION BUTTON */}
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={importing || selectedProductIds.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`w-4 h-4 ${importing ? "animate-bounce" : ""}`} />
              <span>
                {importing ? "Import qilinmoqda..." : `${t.importBtn} (${selectedProductIds.size})`}
              </span>
            </button>
          </div>
        </div>

        {/* Toolbar: Full-width search bar & Category pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => {
                setCatalogSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t.searchPlaceholder}
              autoComplete="off"
              name="billz_catalog_search"
              data-lpignore="true"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {catalogSearch && (
              <button
                type="button"
                onClick={() => setCatalogSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
            >
              <option value="all">{t.allCategories} ({productsList.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Table */}
        {isCatalogLoading ? (
          <div className="py-16 text-center space-y-3">
            <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Billz omboridan tovarlar yuklanmoqda...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Tovarlar topilmadi</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Qidiruv so'rovi bo'yicha hech qanday tovar topilmadi. Qidiruvni tozalab ko'ring.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-neutral-850 border-b border-slate-200 dark:border-neutral-800 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedProducts.length > 0 &&
                          paginatedProducts.every((p) => selectedProductIds.has(p.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds((prev) => {
                              const next = new Set(prev);
                              paginatedProducts.forEach((p) => next.add(p.id));
                              return next;
                            });
                          } else {
                            setSelectedProductIds((prev) => {
                              const next = new Set(prev);
                              paginatedProducts.forEach((p) => next.delete(p.id));
                              return next;
                            });
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Tovar nomi</th>
                    <th className="p-3.5">Kategoriya</th>
                    <th className="p-3.5">Artikul / Shtrixkod</th>
                    <th className="p-3.5 text-center">Qoldiq</th>
                    <th className="p-3.5 text-right">Narx</th>
                    <th className="p-3.5 text-center">Holat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                  {paginatedProducts.map((p) => {
                    const isSelected = selectedProductIds.has(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => toggleSelectProduct(p.id)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-neutral-850/60 transition-colors cursor-pointer ${
                          isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProduct(p.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-3">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget.parentElement?.querySelector(".img-fallback");
                                  if (fallback) fallback.classList.remove("hidden");
                                }}
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-neutral-700 shrink-0 bg-white"
                              />
                            ) : null}
                            <div className={`w-9 h-9 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-750 text-slate-400 flex items-center justify-center shrink-0 ${p.image_url ? 'hidden img-fallback' : ''}`}>
                              <ImageIcon className="w-4 h-4 text-slate-300 dark:text-neutral-500" />
                            </div>
                            <div className="space-y-0.5">
                              <div className="font-bold line-clamp-1">{p.name}</div>
                              {p.sku && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  SKU: {p.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                          {p.category_name || "—"}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                          {p.barcode || p.sku || "—"}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {p.stock > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              {p.stock} {t.inStock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              {t.outOfStock}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                          {Number(p.price || 0).toLocaleString()} UZS
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {p.is_linked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3" />
                              <span>{t.statusLinked}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              {t.statusNew}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500">
                  Jami <strong>{filteredProducts.length}</strong> tovardan{" "}
                  <strong>{(page - 1) * pageSize + 1}</strong>-
                  <strong>{Math.min(page * pageSize, filteredProducts.length)}</strong> ko'rsatilmoqda
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Oldingi
                  </button>
                  <span className="text-xs font-bold px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Keyingi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
