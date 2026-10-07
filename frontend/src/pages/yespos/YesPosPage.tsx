import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Link2,
  Unlink,
  Layers,
  Package,
  Check,
  Search,
  ShieldCheck,
  DownloadCloud
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import yesposLogo from "../../assets/yespos_logo.png";

interface YesPosStatus {
  is_connected: boolean;
  branch_id?: string;
  branch_name?: string;
  last_sync_at?: string;
  api_key?: string;
  api_key_masked?: string;
  linked_products_count: number;
  total_store_products_count?: number;
  suggested_api_key?: string;
  branches?: BranchItem[];
}

interface BranchItem {
  id: string;
  name: string;
}

interface RemoteProduct {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  ikpu?: string;
  price: number;
  stock: number;
  description?: string;
  image?: string;
  raw_image?: string;
  category_id?: string;
  category_name?: string;
  category_image?: string;
  category_raw_image?: string;
  is_linked?: boolean;
}

interface RemoteCategory {
  id: string;
  name: string;
  image?: string;
  raw_image?: string;
  products: RemoteProduct[];
}

export const YesPosPage: React.FC = () => {
  const { t, lang, store } = useAuth();
  const queryClient = useQueryClient();

  // Status & notifications
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Connection form state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [branchCooldown, setBranchCooldown] = useState(0);

  // Catalog Explorer & Import state
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // 1. Fetch current status
  const { data: status, isLoading: isStatusLoading } = useQuery<YesPosStatus>({
    queryKey: ["yespos-status", store?.id],
    queryFn: async () => {
      const url = store?.id ? `/yespos/status/?store_id=${store.id}` : "/yespos/status/";
      const res = await api.get(url);
      return res.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Auto-fill API key from status (persisted across reloads)
  useEffect(() => {
    const key = status?.api_key || status?.suggested_api_key;
    if (key && !apiKeyInput) {
      setApiKeyInput(key);
    }
  }, [status]);

  // Prepopulate branches from status
  useEffect(() => {
    if (status?.branches && status.branches.length > 0) {
      setBranches(status.branches);
    }
    if (status?.branch_id && !selectedBranchId) {
      setSelectedBranchId(String(status.branch_id));
    }
  }, [status]);

  const effectiveBranchId = selectedBranchId || status?.branch_id || "1";

  // 1.1 Auto-fetch catalog immediately on mount using React Query!
  const {
    data: catalogData,
    isLoading: isCatalogLoading,
    isFetching: isCatalogFetching,
    refetch: refetchCatalog,
  } = useQuery<RemoteCategory[]>({
    queryKey: ["yespos-catalog", store?.id, effectiveBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (store?.id) params.set("store_id", String(store.id));
      if (effectiveBranchId) params.set("branch_id", effectiveBranchId);
      const res = await api.get(`/yespos/catalog/?${params.toString()}`);
      if (res.data?.success && res.data?.categories) {
        return res.data.categories;
      }
      return [];
    },
    enabled: !isStatusLoading,
    staleTime: 60000,
  });

  const catalog = catalogData || [];
  const totalCatalogProducts = catalog.reduce((acc, cat) => acc + (cat.products ? cat.products.length : 0), 0);

  // Update selectedProductIds whenever catalog loads
  useEffect(() => {
    if (catalog.length > 0) {
      const unlinked = new Set<string>();
      catalog.forEach((cat: RemoteCategory) => {
        cat.products.forEach((p: RemoteProduct) => {
          if (!p.is_linked) unlinked.add(p.id);
        });
      });
      setSelectedProductIds(unlinked);
    }
  }, [catalog]);

  // Decrement branch cooldown timer
  useEffect(() => {
    if (branchCooldown > 0) {
      const timer = setTimeout(() => setBranchCooldown(branchCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [branchCooldown]);

  // 2. Test connection & fetch branches
  const handleTestConnection = async () => {
    if (testingConnection || branchCooldown > 0) return;
    const keyToUse = apiKeyInput.trim() || status?.api_key || status?.suggested_api_key || "";
    if (!keyToUse) {
      setMsg({ type: "error", text: "Iltimos, YES POS API kalitini kiriting." });
      return;
    }
    setTestingConnection(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/test/", {
        api_key: keyToUse,
        store_id: store?.id
      });
      if (res.data?.success && res.data?.branches?.length) {
        const fetchedBranches = res.data.branches;
        setBranches(fetchedBranches);
        const currentActive = selectedBranchId || status?.branch_id;
        const exists = fetchedBranches.some((b: BranchItem) => String(b.id) === String(currentActive));
        setSelectedBranchId(exists ? String(currentActive) : String(fetchedBranches[0].id));
        setBranchCooldown(5);
        setMsg({
          type: "success",
          text: `Ulanish muvaffaqiyatli! ${fetchedBranches.length} ta filial topildi. Kerakli filialni tanlang va saqlang.`
        });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Filiallar topilmadi." });
      }
    } catch (err: any) {
      setMsg({
        type: "error",
        text: err?.response?.data?.error || "YES POS serveriga ulanib bo'lmadi. API kalitni tekshiring."
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // 3. Connect store to chosen branch
  const handleConnect = async () => {
    const keyToUse = apiKeyInput.trim() || status?.api_key || status?.suggested_api_key || "";
    const branchToUse = selectedBranchId || status?.branch_id || (branches[0]?.id ? String(branches[0].id) : "1");
    if (!keyToUse || !branchToUse) {
      setMsg({ type: "error", text: "API kalit va filial tanlanishi shart." });
      return;
    }
    const chosenBranch = branches.find((b) => String(b.id) === String(branchToUse));
    setConnecting(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/connect/", {
        api_key: keyToUse,
        branch_id: branchToUse,
        branch_name: chosenBranch?.name || branchToUse,
        store_id: store?.id
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data.message || "YES POS muvaffaqiyatli ulandi!" });
        queryClient.setQueryData(["yespos-status", store?.id], (old: any) => ({
          ...old,
          is_connected: true,
          api_key: keyToUse,
          branch_id: branchToUse,
          branch_name: chosenBranch?.name || branchToUse,
          last_sync_at: new Date().toISOString()
        }));
        queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
        queryClient.invalidateQueries({ queryKey: ["yespos-catalog"] });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Ulashda xatolik." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Ulashda xatolik yuz berdi." });
    } finally {
      setConnecting(false);
    }
  };

  // 4. Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm("Rostdan ham YES POS ulanishini uzmoqchimisiz?")) return;
    setDisconnecting(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/disconnect/", { store_id: store?.id });
      if (res.data?.success) {
        setMsg({ type: "success", text: "YES POS ulanishi uzildi." });
        queryClient.setQueryData(["yespos-status", store?.id], (old: any) => ({
          ...old,
          is_connected: false,
          branch_id: undefined,
          branch_name: undefined,
          linked_products_count: 0
        }));
        queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
        queryClient.invalidateQueries({ queryKey: ["yespos-catalog"] });
        setSelectedProductIds(new Set());
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Uzishda xatolik yuz berdi." });
    } finally {
      setDisconnecting(false);
    }
  };

  // 5. Live Sync: updates prices, stock, new items and photos immediately
  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/sync/", { store_id: store?.id });
      setMsg({
        type: "success",
        text: res.data?.message || "YES POS bilan tovarlar va narxlar muvaffaqiyatli yangilandi!"
      });
      // Invalidate queries so that products list, category list, and status update
      queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["yespos-catalog"] });

      // Live fetch fresh catalog with force=1 to refresh the catalog tree and images on screen
      try {
        const catRes = await api.get(`/yespos/catalog/?store_id=${store?.id || ""}&branch_id=${effectiveBranchId}&force=1`);
        if (catRes.data?.success && catRes.data?.categories) {
          queryClient.setQueryData(["yespos-catalog", store?.id, effectiveBranchId], catRes.data.categories);
        }
      } catch (catErr) {
        console.debug("Error fetching catalog after sync:", catErr);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Sinxronizatsiya xatosi." });
    } finally {
      setSyncing(false);
    }
  };

  // 6. Refresh Catalog with force=1 to bypass any cache
  const handleLoadCatalog = async () => {
    if (isCatalogFetching) return;
    setMsg(null);
    try {
      const res = await api.get(`/yespos/catalog/?store_id=${store?.id || ""}&branch_id=${effectiveBranchId}&force=1`);
      if (res.data?.success && res.data?.categories) {
        queryClient.setQueryData(["yespos-catalog", store?.id, effectiveBranchId], res.data.categories);
        const tpl = t("yespos_catalog_loaded") || "YES POS katalogidan {count} ta kategoriya yuklandi.";
        setMsg({
          type: "success",
          text: tpl.replace("{count}", String(res.data.categories.length))
        });
      } else {
        await refetchCatalog();
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Katalogni yuklashda xatolik yuz berdi." });
    }
  };

  // 7. Toggle item selection
  const toggleSelect = (pid: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(pid)) {
      next.delete(pid);
    } else {
      next.add(pid);
    }
    setSelectedProductIds(next);
  };

  // 8. Import Selected Products
  const handleImportSelected = async () => {
    if (importing) return;
    const itemsToImport: any[] = [];
    catalog.forEach((cat) => {
      cat.products.forEach((p) => {
        if (selectedProductIds.has(p.id)) {
          itemsToImport.push({
            id: p.id,
            remote_id: p.id,
            name: p.name,
            sku: p.sku || "",
            barcode: p.barcode || "",
            ikpu: p.ikpu || "",
            price: p.price,
            stock: p.stock,
            description: p.description || "",
            image: p.image || "",
            raw_image: p.raw_image || "",
            category_name: cat.name,
            category_id: cat.id,
            category_image: cat.image || "",
            category_raw_image: cat.raw_image || ""
          });
        }
      });
    });

    if (itemsToImport.length === 0) {
      setMsg({ type: "error", text: "Import qilish uchun tovar tanlanmagan." });
      return;
    }

    setImporting(true);
    setMsg(null);
    try {
      const BATCH_SIZE = 50;
      let totalCreated = 0;
      let totalUpdated = 0;
      for (let i = 0; i < itemsToImport.length; i += BATCH_SIZE) {
        const chunk = itemsToImport.slice(i, i + BATCH_SIZE);
        const res = await api.post("/yespos/import/", { items: chunk, store_id: store?.id });
        if (!res.data?.success) {
          throw new Error(res.data?.error || "Import jarayonida xatolik yuz berdi.");
        }
        totalCreated += res.data.created || 0;
        totalUpdated += res.data.updated || 0;
      }
      setMsg({
        type: "success",
        text: `Muvaffaqiyatli import qilindi: ${totalCreated} yangi tovar, ${totalUpdated} yangilandi.`
      });
      queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
      queryClient.invalidateQueries({ queryKey: ["yespos-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-list"] });
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || err.message || "Import qilishda server xatosi." });
    } finally {
      setImporting(false);
    }
  };

  const isConnected = status?.is_connected;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {t("yespos_title") || (lang === "ru" ? "Интеграция YES POS" : "YES POS Integratsiyasi")}
            </h1>
            {isConnected ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{lang === "ru" ? "Подключено" : "Ulangan"}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {lang === "ru" ? "Не подключено" : "Ulanmagan"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            {t("yespos_subtitle") || (lang === "ru" ? "Синхронизация каталога, остатков и цен из кассовой системы YES POS" : "Kassadagi tovarlar, qoldiqlar va narxlarni bir zumda do'konga yuklang.")}
          </p>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>
              {syncing
                ? (t("yespos_syncing") || "Sinxronlanmoqda...")
                : (t("yespos_sync_now") || (lang === "ru" ? "Синхронизировать остатки" : "Qoldiqlarni sinxronlash"))}
            </span>
          </button>
        )}
      </div>

      {/* EXPLICIT CONNECTION STATUS BANNER */}
      {isConnected ? (
        <div className="p-4 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t("yespos_connected_active") || (lang === "ru" ? "YES POS успешно подключен и активен" : "YES POS muvaffaqiyatli ulangan!")}</span>
              </div>
              <div className="text-slate-500 text-xs font-normal mt-0.5">
                {lang === "ru" ? "Филиал:" : "Filial:"} <strong className="text-slate-800 dark:text-zinc-200">{status?.branch_name || status?.branch_id}</strong> • {lang === "ru" ? "Синхронизировано товаров:" : "Ulangan tovarlar:"} <strong className="text-slate-800 dark:text-zinc-200">{status?.linked_products_count || 0}</strong>
                {status?.total_store_products_count ? (
                  <span className="text-slate-400 ml-1">
                    • {lang === "ru" ? "Всего в магазине:" : "Jami:"} {status.total_store_products_count}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-800 dark:text-zinc-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>
              {syncing
                ? (t("yespos_updating") || "Yangilanmoqda...")
                : (lang === "ru" ? "Обновить цены" : "Narxlarni yangilash")}
            </span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="text-xs font-semibold text-amber-950">
              {lang === "ru" ? "YES POS еще не подключен" : "YES POS hali ulanmagan"}
            </div>
            <div className="text-amber-800 text-xs font-normal mt-0.5">
              {lang === "ru"
                ? "Укажите API-ключ вашей кассы YES POS ниже и нажмите «Получить филиалы»."
                : "Kassadagi tovarlarni do'konga yuklash uchun pastdagi maydonga API kalitingizni kiriting."}
            </div>
          </div>
        </div>
      )}

      {/* ALERT MESSAGE */}
      {msg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 shadow-2xs ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* 1. STATUS SUMMARY CARD */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              <img src={yesposLogo} alt="YesPOS" className="h-6 w-auto max-w-[120px] object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-slate-900">
                  {status?.branch_name ? status.branch_name : "YES POS Smart Cloud"}
                </h3>
                {status?.branch_id && (
                  <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    ID: {status.branch_id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isConnected
                  ? `${t("yespos_last_sync") || "Oxirgi sinxronizatsiya:"} ${status?.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : (t("yespos_just_now") || "Hozirgina")}`
                  : (t("yespos_branch_not_connected_hint") || "Filial hali ulanmagan. Quyidagi maydonga API kalitingizni kiriting.")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("yespos_linked_products_header") || "Ulangan tovarlar"}</div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {isConnected ? (status?.linked_products_count || 0) : 0} <span className="text-xs text-slate-400 font-normal">{t("yespos_items_unit") || "ta"}</span>
              </div>
              {status?.total_store_products_count ? (
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {t("yespos_total_in_store") || "Do'konda jami:"} {status.total_store_products_count} {t("yespos_items_unit") || "ta"}
                </div>
              ) : null}
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={t("yespos_disconnect_title") || "Ulanishni uzish"}
              >
                <Unlink className="w-4 h-4" />
                <span>{t("yespos_disconnect") || "Uzish"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Protection badge */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
            <span>{t("yespos_safe_fallback") || "Avtomatik so'rov cheklovchisi va DNS xatoliklardan himoyalangan (Rate-limiting & Safe Fallback)."}</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">2.0 ENGINE</span>
        </div>
      </div>

      {/* 2. CONNECTION / BRANCH CONFIG CARD */}
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{isConnected ? (lang === "ru" ? "Настройки подключения" : "Ulanish sozlamalari") : (lang === "ru" ? "Подключение к YES POS" : "YES POS bilan ulanish")}</span>
          </div>
          {status?.api_key_masked && (
            <span className="text-xs font-mono text-slate-400">{lang === "ru" ? "Ключ:" : "Kalit:"} {status.api_key_masked}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
              {lang === "ru" ? "API-ключ YES POS:" : "YES POS API Kaliti:"}
            </label>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="yp_live_xxxxxxxxxx"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection || branchCooldown > 0}
              className="w-full py-2 px-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-800 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
              <span>
                {testingConnection
                  ? (lang === "ru" ? "Проверка..." : "Tekshirilmoqda...")
                  : branchCooldown > 0
                  ? `${lang === "ru" ? "Филиалы" : "Filiallar"} (${branchCooldown}s)`
                  : (lang === "ru" ? "Получить филиалы" : "Filiallarni olish")}
              </span>
            </button>
          </div>

          {branches.length > 0 && (
            <div className="md:col-span-6">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                {lang === "ru" ? "Выберите филиал:" : "Filialni tanlang:"}
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-slate-900"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {branches.length > 0 && (
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-black text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{connecting ? (lang === "ru" ? "Сохранение..." : "Ulanmoqda...") : (lang === "ru" ? "Сохранить филиал" : "Filialni saqlash")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. CATALOG EXPLORER & 1-CLICK IMPORT */}
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center flex-wrap gap-2">
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === "ru" ? "Каталог товаров YES POS" : "YES POS Katalogi"}</span>
              {totalCatalogProducts > 0 && (
                <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                  {totalCatalogProducts} {lang === "ru" ? "товаров" : "ta tovar"}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              {lang === "ru" ? "Просмотр товаров в кассе и импорт в интернет-магазин" : "Kassadagi tovarlarni ko'rish va nusxalash"}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {catalog.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedProductIds.size === totalCatalogProducts) {
                    setSelectedProductIds(new Set());
                  } else {
                    const allIds = new Set<string>();
                    catalog.forEach((cat) => {
                      cat.products.forEach((p) => allIds.add(p.id));
                    });
                    setSelectedProductIds(allIds);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
              >
                {selectedProductIds.size === totalCatalogProducts
                  ? (lang === "ru" ? "Снять выбор" : "Bekor qilish")
                  : `${lang === "ru" ? "Выбрать все" : "Barchasini tanlash"} (${totalCatalogProducts})`}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleLoadCatalog()}
              disabled={isCatalogFetching}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 text-slate-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isCatalogFetching ? "animate-bounce" : ""}`} />
              <span>
                {isCatalogFetching
                  ? (lang === "ru" ? "Загрузка..." : "Yuklanmoqda...")
                  : (lang === "ru" ? "Загрузить каталог" : "Katalogni yangilash")}
              </span>
            </button>

            {catalog.length > 0 && selectedProductIds.size > 0 && (
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={importing}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{importing ? (lang === "ru" ? "Импорт..." : "Yuklanmoqda...") : `${lang === "ru" ? "Импортировать" : "Yuklash"} (${selectedProductIds.size})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search within catalog */}
        {catalog.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder={t("yespos_search_catalog_ph") || "Yuklangan tovarlar ichidan qidirish..."}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
            />
          </div>
        )}

        {/* Catalog Categories Grid */}
        {isCatalogLoading ? (
          <div className="text-center py-12 text-slate-500 space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto text-brand animate-spin" />
            <p className="text-xs font-bold">{t("yespos_loading_catalog") || "YES POS katalogi yuklanmoqda..."}</p>
          </div>
        ) : catalog.length > 0 ? (
          <div className="space-y-6">
            {catalog.map((cat) => {
              const filteredProducts = cat.products.filter(
                (p) =>
                  !catalogSearch ||
                  p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                  (p.sku && p.sku.toLowerCase().includes(catalogSearch.toLowerCase()))
              );

              if (filteredProducts.length === 0) return null;

              return (
                <div key={cat.id} className="border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.style.display = "none";
                          }}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Layers className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                          <span>{cat.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            ({filteredProducts.length} {t("yespos_items_unit") || "tovar"})
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = filteredProducts.every((p) => selectedProductIds.has(p.id));
                        const next = new Set(selectedProductIds);
                        filteredProducts.forEach((p) => {
                          if (allSelected) next.delete(p.id);
                          else next.add(p.id);
                        });
                        setSelectedProductIds(next);
                      }}
                      className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                    >
                      {filteredProducts.every((p) => selectedProductIds.has(p.id))
                        ? (t("yespos_deselect_all") || "Tanlovni bekor qilish")
                        : (t("yespos_select_all") || "Barchasini tanlash")}
                    </button>
                  </div>

                  {/* Full-width horizontal row list as requested in video */}
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {filteredProducts.map((prod) => {
                      const isSelected = selectedProductIds.has(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleSelect(prod.id)}
                          className={`px-4 py-3 flex items-center justify-between gap-4 text-xs transition-colors cursor-pointer hover:bg-slate-50/80 ${
                            isSelected ? "bg-blue-50/40" : "bg-white"
                          }`}
                        >
                          {/* Checkbox + Image + Title */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(prod.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer shrink-0"
                            />
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = "none";
                                }}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate text-sm">
                                {prod.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                {prod.sku && (
                                  <span className="font-mono text-slate-400">
                                    {lang === "ru" ? "Арт:" : "SKU:"} {prod.sku}
                                  </span>
                                )}
                                {prod.barcode && (
                                  <span className="font-mono text-slate-400">
                                    {prod.barcode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Inventory / Stock */}
                          <div className="hidden sm:block text-right shrink-0 w-28">
                            <div className="text-xs font-semibold text-slate-700">
                              {prod.stock > 0 ? (
                                <span className="text-emerald-600 font-bold">
                                  {prod.stock} {lang === "ru" ? "в наличии" : "dona qoldiq"}
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  {lang === "ru" ? "Нет в наличии" : "Qoldiq yo'q"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0 w-32">
                            <div className="text-sm font-bold text-slate-900 font-mono">
                              {prod.price?.toLocaleString()} UZS
                            </div>
                          </div>

                          {/* Linked / Connection Badge */}
                          <div className="shrink-0 w-28 text-right hidden md:block">
                            {prod.is_linked ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {lang === "ru" ? "В каталоге" : "Uланган"}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                {lang === "ru" ? "Не импортирован" : "Yangi"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <Package className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs">{t("yespos_empty_catalog") || "Katalog bo'sh yoki topilmadi."}</p>
          </div>
        )}
      </div>
    </div>
  );
};
