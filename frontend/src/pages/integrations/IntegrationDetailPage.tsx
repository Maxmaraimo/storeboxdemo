import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  RotateCw,
  Boxes,
  DollarSign,
  SlidersHorizontal,
  X,
  Star,
  Eye,
  EyeOff,
  Image as ImageIcon,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ServiceLogo } from "../settings/IntegrationsMarketPage";

interface PosCatalogProduct {
  id: string;
  name: string;
  status: number;
  status_label_ru?: string;
  status_label_uz?: string;
  giftable?: boolean;
  giftable_label_ru?: string;
  giftable_label_uz?: string;
  type: "GOODS" | "DISH" | "TIMER" | string;
  type_label_ru?: string;
  type_label_uz?: string;
  category_name?: string;
  station_name?: string;
  tax_name?: string;
  cost_price: number;
  price: number;
  markup_rate: number;
  gross_margin: number;
  stock: number;
  unit?: string;
  barcode?: string;
  sku?: string;
  image_url?: string;
  color?: string;
  is_linked?: boolean;
}

interface PosCatalogCategory {
  id: string;
  name: string;
  count: number;
}

interface PosCatalogResponse {
  success: boolean;
  slug: string;
  service_name: string;
  venue_id: string;
  venue_name: string;
  source: string;
  total_count: number;
  linked_count: number;
  type_counts: {
    all: number;
    GOODS: number;
    DISH: number;
    TIMER: number;
  };
  categories: PosCatalogCategory[];
  stations: PosCatalogCategory[];
  products: PosCatalogProduct[];
}

export const IntegrationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, store } = useAuth();
  const queryClient = useQueryClient();

  const [formState, setFormState] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // POS Catalog Explorer state
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedTypeTab, setSelectedTypeTab] = useState<"all" | "GOODS" | "DISH" | "TIMER">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // 1. Fetch integration detail
  const { data: item, isLoading, isError } = useQuery({
    queryKey: ["integration-detail", slug, store?.id],
    queryFn: async () => {
      const url = store?.id ? `/integrations/${slug}/?store_id=${store.id}` : `/integrations/${slug}/`;
      const res = await api.get(url);
      return res.data;
    },
    enabled: !!slug,
  });

  const isPosOrWarehouse = item?.category === "pos" || item?.category === "warehouse";

  // 2. Fetch live POS / Warehouse catalog when applicable
  const {
    data: catalogData,
    isLoading: isCatalogLoading,
    isFetching: isCatalogFetching,
    refetch: refetchCatalog,
  } = useQuery<PosCatalogResponse>({
    queryKey: ["integration-catalog", slug, store?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (store?.id) params.set("store_id", String(store.id));
      const res = await api.get(`/integrations/${slug}/catalog/?${params.toString()}`);
      return res.data;
    },
    enabled: !!slug && !!item && isPosOrWarehouse,
    staleTime: 30000,
  });

  const productsList = catalogData?.products || [];
  const categoriesList = catalogData?.categories || [];
  const stationsList = catalogData?.stations || [];
  const typeCounts = catalogData?.type_counts || {
    all: productsList.length,
    GOODS: productsList.filter((p) => p.type === "GOODS").length,
    DISH: productsList.filter((p) => p.type === "DISH").length,
    TIMER: productsList.filter((p) => p.type === "TIMER").length,
  };

  // Prepopulate form
  useEffect(() => {
    if (item) {
      const initial: Record<string, any> = {
        is_active: item.is_active ?? true,
      };
      (item.fields || []).forEach((f: any) => {
        if (item.saved_config && item.saved_config[f.key] !== undefined) {
          initial[f.key] = item.saved_config[f.key];
        } else if (item.masked_credentials && item.masked_credentials[f.key]) {
          initial[f.key] = item.masked_credentials[f.key];
        } else if (f.default !== undefined) {
          initial[f.key] = f.default;
        } else {
          initial[f.key] = "";
        }
      });
      setFormState(initial);
    }
  }, [item]);

  // Preselect unlinked products when catalog loads for the first time
  useEffect(() => {
    if (productsList.length > 0 && selectedProductIds.size === 0) {
      const unlinked = new Set<string>();
      productsList.forEach((p) => {
        if (!p.is_linked) unlinked.add(p.id);
      });
      setSelectedProductIds(unlinked);
    }
  }, [productsList]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/integrations/${slug}/save/`, {
        ...payload,
        store_id: store?.id,
      });
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["integration-detail", slug] });
      queryClient.invalidateQueries({ queryKey: ["integration-catalog", slug] });
      queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
      setToastMessage({
        type: "success",
        text:
          res?.message ||
          (lang === "ru"
            ? `${item?.name || "Интеграция"} успешно подключена! Выберите нужные товары ниже для импорта.`
            : "Integratsiya muvaffaqiyatli saqlandi!"),
      });
    },
    onError: (err: any) => {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.error || (lang === "ru" ? "Ошибка сохранения." : "Saqlashda xatolik yuz berdi."),
      });
    },
  });

  // Disconnect Mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/integrations/${slug}/disconnect/`, { store_id: store?.id });
      return res.data;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["integration-detail", slug] });
      queryClient.invalidateQueries({ queryKey: ["integration-catalog", slug] });
      queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
      setToastMessage({
        type: "success",
        text: res?.message || (lang === "ru" ? "Интеграция отключена." : "Ulanish uzildi."),
      });
    },
  });

  // Test Connection
  const handleTest = async () => {
    if (testingConnection) return;
    setTestingConnection(true);
    setToastMessage(null);
    try {
      const res = await api.post(`/integrations/${slug}/test/`, {
        ...formState,
        store_id: store?.id,
      });
      if (res.data?.success) {
        setToastMessage({
          type: "success",
          text:
            res.data?.message ||
            (lang === "ru" ? "Связь успешно проверена (200 OK)!" : "Aloqa muvaffaqiyatli tekshirildi (200 OK)!"),
        });
        refetchCatalog();
      } else {
        setToastMessage({
          type: "error",
          text:
            res.data?.message ||
            res.data?.error ||
            (lang === "ru" ? "Не удалось установить связь." : "Aloqa o'rnatib bo'lmadi."),
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          (lang === "ru" ? "Ошибка подключения к серверу." : "Server bilan aloqa xatosi."),
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Sync All Products & Stock
  const handleSyncAll = async () => {
    if (syncing) return;
    setSyncing(true);
    setToastMessage(null);
    try {
      const res = await api.post(`/integrations/${slug}/sync/`, { store_id: store?.id });
      if (res.data?.success) {
        setToastMessage({
          type: "success",
          text:
            res.data?.message ||
            (lang === "ru"
              ? "Синхронизация каталога, цен и остатков успешно завершена!"
              : "Sinxronizatsiya muvaffaqiyatli yakunlandi!"),
        });
        queryClient.invalidateQueries({ queryKey: ["integration-detail", slug] });
        queryClient.invalidateQueries({ queryKey: ["integration-catalog", slug] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        setToastMessage({
          type: "error",
          text: res.data?.error || (lang === "ru" ? "Ошибка синхронизации." : "Sinxronizatsiya xatosi."),
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.error || (lang === "ru" ? "Ошибка синхронизации." : "Sinxronizatsiya xatosi."),
      });
    } finally {
      setSyncing(false);
    }
  };

  // Import Selected Products
  const handleImportSelected = async () => {
    if (importing || selectedProductIds.size === 0) return;
    setImporting(true);
    setToastMessage(null);
    try {
      const selectedItems = productsList.filter((p) => selectedProductIds.has(p.id));
      const res = await api.post(`/integrations/${slug}/import/`, {
        items: selectedItems,
        store_id: store?.id,
      });
      if (res.data?.success) {
        setToastMessage({
          type: "success",
          text:
            res.data?.message ||
            (lang === "ru"
              ? `Успешно импортировано товаров: ${res.data?.total_synced || selectedItems.length}!`
              : `Muvaffaqiyatli import qilindi: ${res.data?.total_synced || selectedItems.length} ta tovar!`),
        });
        queryClient.invalidateQueries({ queryKey: ["integration-detail", slug] });
        queryClient.invalidateQueries({ queryKey: ["integration-catalog", slug] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        setToastMessage({
          type: "error",
          text: res.data?.error || (lang === "ru" ? "Ошибка импорта товаров." : "Import jarayonida xatolik."),
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.error || (lang === "ru" ? "Ошибка импорта товаров." : "Import xatosi."),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      if (selectedTypeTab !== "all" && p.type !== selectedTypeTab) {
        return false;
      }
      if (selectedCategory !== "all") {
        const pCat = p.category_name || "Без категории";
        if (pCat !== selectedCategory) return false;
      }
      if (selectedStation !== "all") {
        const pSt = p.station_name || "Без отдела";
        if (pSt !== selectedStation) return false;
      }
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesBarcode = p.barcode && p.barcode.toLowerCase().includes(q);
        const matchesCat = p.category_name && p.category_name.toLowerCase().includes(q);
        const matchesStation = p.station_name && p.station_name.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesBarcode && !matchesCat && !matchesStation) {
          return false;
        }
      }
      return true;
    });
  }, [productsList, selectedTypeTab, selectedCategory, selectedStation, catalogSearch]);

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

  const formatMoney = (val: number) => {
    return Number(val || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercent = (val: number) => {
    const n = Number(val || 0);
    if (Number.isInteger(n)) return `${n} %`;
    return `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-20 text-center space-y-3">
        <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">
          {lang === "ru" ? "Загрузка параметров интеграции..." : "Integratsiya sozlamalari yuklanmoqda..."}
        </p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {lang === "ru" ? "Интеграция не найдена" : "Integratsiya topilmadi"}
        </h2>
        <button
          type="button"
          onClick={() => navigate("/robo-market")}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          {lang === "ru" ? "Вернуться в Маркет" : "Marketga qaytish"}
        </button>
      </div>
    );
  }

  const isConnected = item.is_connected;
  const linkedCount = catalogData?.linked_count ?? item.linked_products_count ?? 0;
  const totalStoreCount = item.total_store_products_count ?? 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* 1. TOP BAR: BACK NAVIGATION & SYNC BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/robo-market")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors text-xs font-bold shadow-2xs cursor-pointer group self-start"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>
            {lang === "ru"
              ? "Назад в Маркет интеграций"
              : lang === "en"
              ? "Back to Integrations Market"
              : "Orqaga: Integratsiyalar marketi"}
          </span>
        </button>

        {isPosOrWarehouse && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={syncing || !isConnected}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>
                {syncing
                  ? lang === "ru"
                    ? "Синхронизация..."
                    : "Sinxronlanmoqda..."
                  : lang === "ru"
                  ? "Синхронизировать все товары"
                  : "Barcha tovarlarni sinxronlash"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleSyncAll}
              disabled={syncing || !isConnected}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === "ru" ? "Обновить цены и себестоимость" : "Narx va tannarxni yangilash"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200/80"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. HERO STATUS BANNER */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <ServiceLogo slug={item.slug} name={item.name} size={60} />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {item.name}
                </h1>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  {item.category_title}
                </span>
                {isConnected ? (
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
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{item.rating}</span>
                </div>
                <span>
                  • {item.reviews_count} {lang === "ru" ? "отзывов" : "sharh"}
                </span>
                {catalogData?.venue_name && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {lang === "ru" ? "Филиал:" : "Filial:"} {catalogData.venue_name} (#{catalogData.venue_id || "1"})
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {isPosOrWarehouse && (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-neutral-850 px-4 py-3 rounded-2xl border border-slate-200/70 dark:border-neutral-800">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {lang === "ru" ? "Импортировано в магазин:" : "Ulangan tovarlar:"}
                  </div>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {linkedCount}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      / {productsList.length || totalStoreCount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isConnected && (
              <button
                type="button"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                {disconnectMutation.isPending
                  ? "..."
                  : lang === "ru"
                  ? "Отключить интеграцию"
                  : "Ulanishni uzish"}
              </button>
            )}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
          {item.desc || item.short_desc}
        </p>

        {/* Security badge */}
        <div className="pt-4 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xavfsiz 256-bitli shifrlash (AES/HMAC) • Open API v1/v2</span>
          </div>
          {item.last_synced && (
            <div>
              {lang === "ru" ? "Последняя синхронизация:" : "Oxirgi sinxronizatsiya:"}{" "}
              <strong className="text-slate-800 dark:text-white">
                {new Date(item.last_synced).toLocaleString()}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 4. CONFIGURATION FORM */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-xs font-black text-slate-500 tracking-wider uppercase flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span>{lang === "ru" ? "ПАРАМЕТРЫ ПОДКЛЮЧЕНИЯ" : "ULANISH SOZLAMALARI"}</span>
          </h2>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
              {lang === "ru" ? "Активно в магазине" : "Do'konda faol"}
            </span>
            <input
              type="checkbox"
              checked={!!formState.is_active}
              onChange={(e) => handleFieldChange("is_active", e.target.checked)}
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(item.fields || []).map((f: any) => {
            const isSecret = f.secret || f.type === "password";
            const isVisible = showSecrets[f.key];

            return (
              <div key={f.key} className={f.type === "checkbox" ? "sm:col-span-2" : ""}>
                {f.type === "checkbox" ? (
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-750 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formState[f.key]}
                      onChange={(e) => handleFieldChange(f.key, e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{f.label}</span>
                  </label>
                ) : f.type === "select" ? (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                      {f.label} {f.required && "*"}
                    </label>
                    <select
                      value={formState[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white"
                    >
                      {(f.options || []).map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-neutral-300">
                      {f.label} {f.required && "*"}
                    </label>
                    <div className="relative">
                      <input
                        type={isSecret && !isVisible ? "password" : "text"}
                        value={formState[f.key] ?? ""}
                        onChange={(e) => handleFieldChange(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        autoComplete="off"
                        name={`integration_field_${f.key}`}
                        data-lpignore="true"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(f.key)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-neutral-800 flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
            <span>
              {testingConnection
                ? lang === "ru"
                  ? "Проверка..."
                  : "Tekshirilmoqda..."
                : lang === "ru"
                ? "Проверить связь"
                : "Aloqani tekshirish"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate(formState)}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {saveMutation.isPending
                ? lang === "ru"
                  ? "Сохранение..."
                  : "Saqlanmoqda..."
                : lang === "ru"
                ? "Сохранить и подключить"
                : "Saqlash va ulash"}
            </span>
          </button>
        </div>
      </div>

      {/* 5. LIVE POS / WAREHOUSE CATALOG EXPLORER & SELECTIVE IMPORT TABLE */}
      {isPosOrWarehouse && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200/90 dark:border-neutral-800 shadow-xs overflow-hidden space-y-5 p-6">
          {/* Header & Bulk Import Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase">
                  {lang === "ru"
                    ? `КАТАЛОГ ТОВАРОВ ${item.name}`
                    : `${item.name} TOVARLAR KATALOGI`}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70">
                  {productsList.length} {lang === "ru" ? "ТОВАРОВ" : "TA TOVAR"}
                </span>
                {catalogData?.venue_name && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70">
                    {lang === "ru" ? "Филиал:" : "Filial:"} {catalogData.venue_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-normal">
                {lang === "ru"
                  ? `Выберите нужные товары и тех. карты из кассы ${item.name} и нажмите «Импортировать», чтобы добавить их в каталог магазина.`
                  : `${item.name} kassasidagi tovarlar va tex. kartalarni tanlab, do'kon katalogiga import qiling.`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {lang === "ru" ? "Выбрать все" : "Barchasini tanlash"} ({filteredProducts.length})
              </button>
              <button
                type="button"
                onClick={handleDeselectAllFiltered}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {lang === "ru" ? "Снять выбор" : "Tanlovni bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => refetchCatalog()}
                disabled={isCatalogFetching}
                className="p-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                title={lang === "ru" ? "Обновить каталог из кассы" : "Katalogni yangilash"}
              >
                <RotateCw className={`w-3.5 h-3.5 ${isCatalogFetching ? "animate-spin" : ""}`} />
              </button>

              <button
                type="button"
                onClick={handleImportSelected}
                disabled={importing || selectedProductIds.size === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <DownloadCloud className={`w-4 h-4 ${importing ? "animate-bounce" : ""}`} />
                <span>
                  {importing
                    ? lang === "ru"
                      ? "Импорт..."
                      : "Import qilinmoqda..."
                    : `${lang === "ru" ? "Импортировать" : "Import qilish"} (${selectedProductIds.size})`}
                </span>
              </button>
            </div>
          </div>

          {/* Clopos Type Tabs: Все | Товар | Тех. карты | Таймер */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 dark:border-neutral-800">
            {[
              {
                id: "all",
                label: lang === "ru" ? "Все" : "Barchasi",
                count: typeCounts.all,
              },
              {
                id: "GOODS",
                label: lang === "ru" ? "Товар" : "Tovar",
                count: typeCounts.GOODS,
              },
              {
                id: "DISH",
                label: lang === "ru" ? "Тех. карты" : "Tex. kartalar",
                count: typeCounts.DISH,
              },
              {
                id: "TIMER",
                label: lang === "ru" ? "Таймер" : "Taymer",
                count: typeCounts.TIMER,
              },
            ].map((tab) => {
              const active = selectedTypeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedTypeTab(tab.id as any);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Category / Station Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={
                  lang === "ru"
                    ? "Поиск по названию, ID (4212, 4213...), категории или отделу..."
                    : "Nomi, ID (4212, 4213...), kategoriya bo'yicha qidirish..."
                }
                autoComplete="off"
                name="pos_catalog_search"
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

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {lang === "ru" ? "Все категории" : "Barcha kategoriyalar"} ({productsList.length})
                </option>
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedStation}
                onChange={(e) => {
                  setSelectedStation(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-700 dark:text-neutral-200 focus:outline-none cursor-pointer"
              >
                <option value="all">
                  {lang === "ru" ? "Все отделы (Кухня / Бар)" : "Barcha bo'limlar"}
                </option>
                {stationsList.map((st) => (
                  <option key={st.id} value={st.name}>
                    {st.name} ({st.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clopos POS Products Table */}
          {isCatalogLoading ? (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                {lang === "ru"
                  ? `Загрузка товаров из ${item.name} API...`
                  : `${item.name} API dan tovarlar yuklanmoqda...`}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200">
                {lang === "ru" ? "Товары не найдены" : "Tovarlar topilmadi"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {lang === "ru"
                  ? "По выбранному фильтру или поисковому запросу товары не найдены."
                  : "Qidiruv so'rovi bo'yicha tovarlar topilmadi."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-neutral-850 border-b border-slate-200 dark:border-neutral-800 text-[11px] font-bold text-slate-600 dark:text-neutral-400">
                    <tr>
                      <th className="p-3 w-10 text-center">
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
                      <th className="p-3 whitespace-nowrap">Id</th>
                      <th className="p-3 whitespace-nowrap">
                        {lang === "ru" ? "Изображение" : "Rasm"}
                      </th>
                      <th className="p-3 whitespace-nowrap">
                        {lang === "ru" ? "Наименование" : "Nomi"}
                      </th>
                      <th className="p-3 text-center whitespace-nowrap">
                        {lang === "ru" ? "Статус" : "Holat"}
                      </th>
                      <th className="p-3 text-center whitespace-nowrap">
                        {lang === "ru" ? "Угощение" : "Mehmon"}
                      </th>
                      <th className="p-3 whitespace-nowrap">
                        {lang === "ru" ? "Тип" : "Turi"}
                      </th>
                      <th className="p-3 whitespace-nowrap">
                        {lang === "ru" ? "Категория" : "Kategoriya"}
                      </th>
                      <th className="p-3 whitespace-nowrap">
                        {lang === "ru" ? "Отдел" : "Bo'lim"}
                      </th>
                      <th className="p-3 whitespace-nowrap">
                        {lang === "ru" ? "Налог" : "Soliq"}
                      </th>
                      <th className="p-3 text-right whitespace-nowrap">
                        {lang === "ru" ? "Себестоимость" : "Tannarx"}
                      </th>
                      <th className="p-3 text-right whitespace-nowrap">
                        {lang === "ru" ? "Цена" : "Narx"}
                      </th>
                      <th className="p-3 text-right whitespace-nowrap">
                        {lang === "ru" ? "Торговая наценка" : "Ustama %"}
                      </th>
                      <th className="p-3 text-right whitespace-nowrap">
                        {lang === "ru" ? "Валовая маржа" : "Marja %"}
                      </th>
                      <th className="p-3 text-center whitespace-nowrap">
                        {lang === "ru" ? "В магазине" : "Do'konda"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
                    {paginatedProducts.map((p) => {
                      const isSelected = selectedProductIds.has(p.id);
                      const hasPhoto = Boolean(p.image_url && p.image_url.trim().startsWith("http"));

                      return (
                        <tr
                          key={p.id}
                          onClick={() => toggleSelectProduct(p.id)}
                          className={`hover:bg-slate-50/90 dark:hover:bg-neutral-850/60 transition-colors cursor-pointer ${
                            isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(p.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>

                          {/* ID */}
                          <td className="p-3 font-mono text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                            {p.id}
                          </td>

                          {/* Изображение (Clopos color bar + real photo ONLY if present; otherwise clean no-photo indicator) */}
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-1.5 h-9 rounded-full shrink-0"
                                style={{ backgroundColor: p.color || "#64748b" }}
                              />
                              {hasPhoto ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback =
                                      e.currentTarget.parentElement?.querySelector(".clopos-no-img");
                                    if (fallback) fallback.classList.remove("hidden");
                                  }}
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-neutral-700 bg-white shrink-0"
                                />
                              ) : null}
                              <div
                                className={`w-9 h-9 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-dashed border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-300 dark:text-neutral-600 shrink-0 ${
                                  hasPhoto ? "hidden clopos-no-img" : ""
                                }`}
                                title={lang === "ru" ? "Без фотографии" : "Rasmsiz"}
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </td>

                          {/* Наименование */}
                          <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {p.name}
                          </td>

                          {/* Статус */}
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block w-2.5 h-2.5 rounded-full ${
                                p.status === 1 ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              title={
                                p.status === 1
                                  ? lang === "ru"
                                    ? "Активный"
                                    : "Faol"
                                  : lang === "ru"
                                  ? "Неактивный"
                                  : "Nofaol"
                              }
                            />
                          </td>

                          {/* Угощение */}
                          <td className="p-3 text-center text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                            {lang === "ru"
                              ? p.giftable_label_ru || (p.giftable ? "Да" : "Нет")
                              : p.giftable_label_uz || (p.giftable ? "Ha" : "Yo'q")}
                          </td>

                          {/* Тип */}
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                p.type === "DISH"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                                  : p.type === "TIMER"
                                  ? "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300"
                                  : "bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300"
                              }`}
                            >
                              {lang === "ru"
                                ? p.type_label_ru ||
                                  (p.type === "DISH"
                                    ? "Тех. карта"
                                    : p.type === "TIMER"
                                    ? "Таймер"
                                    : "Товар")
                                : p.type_label_uz ||
                                  (p.type === "DISH"
                                    ? "Tex. karta"
                                    : p.type === "TIMER"
                                    ? "Taymer"
                                    : "Tovar")}
                            </span>
                          </td>

                          {/* Категория */}
                          <td className="p-3 text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                            {p.category_name || "—"}
                          </td>

                          {/* Отдел */}
                          <td className="p-3 text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                            {p.station_name || "—"}
                          </td>

                          {/* Налог */}
                          <td className="p-3 text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                            {p.tax_name || "—"}
                          </td>

                          {/* Себестоимость */}
                          <td className="p-3 text-right font-mono text-slate-700 dark:text-neutral-300 whitespace-nowrap">
                            {formatMoney(p.cost_price)} UZS
                          </td>

                          {/* Цена */}
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {formatMoney(p.price)} UZS
                          </td>

                          {/* Торговая наценка */}
                          <td className="p-3 text-right font-mono text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                            {formatPercent(p.markup_rate)}
                          </td>

                          {/* Валовая маржа */}
                          <td className="p-3 text-right font-mono text-slate-600 dark:text-neutral-400 whitespace-nowrap">
                            {formatPercent(p.gross_margin)}
                          </td>

                          {/* В магазине */}
                          <td className="p-3 text-center whitespace-nowrap">
                            {p.is_linked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                <Check className="w-3 h-3" />
                                <span>{lang === "ru" ? "В каталоге" : "Katalogda"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                                {lang === "ru" ? "Новый" : "Yangi"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Clopos-style Table Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                <div>
                  Total Rows: <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong>
                </div>
                <div className="flex items-center gap-3">
                  <span>
                    {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredProducts.length)} of{" "}
                    {filteredProducts.length}
                  </span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        ‹
                      </button>
                      <span className="font-bold px-2">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-neutral-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. WAREHOUSE LINK BANNER */}
      {isPosOrWarehouse && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-3xl border border-blue-200/80 dark:border-blue-800/50 p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-blue-950 dark:text-blue-200">
              {lang === "ru"
                ? "Управление складскими остатками и каталогом"
                : "Omborxona va katalog boshqaruvi"}
            </h3>
            <p className="text-xs text-blue-800/80 dark:text-blue-300">
              {lang === "ru"
                ? "Импортированные товары сразу появляются в разделах «Товары» и «Складской учет»."
                : "Import qilingan barcha tovarlar «Tovarlar» va «Omborxona hisobi» bo'limlarida aks etadi."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/products"
              className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 text-xs font-bold shrink-0 transition-colors shadow-2xs"
            >
              {lang === "ru" ? "Перейти в Товары" : "Tovarlarga o'tish"}
            </Link>
            <Link
              to="/warehouse"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs"
            >
              {lang === "ru" ? "Перейти в Склад" : "Omborxonaga o'tish"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
