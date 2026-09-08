import React, { useState } from "react";
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

interface YesPosStatus {
  is_connected: boolean;
  branch_id?: string;
  branch_name?: string;
  last_sync_at?: string;
  api_key_masked?: string;
  linked_products_count: number;
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
  const { t } = useAuth();
  const queryClient = useQueryClient();

  // Status & notifications
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Connection form state
  const [apiKeyInput, setApiKeyInput] = useState("demo-yespos-key");
  const [testingConnection, setTestingConnection] = useState(false);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);

  // Catalog Explorer & Import state
  const [catalog, setCatalog] = useState<RemoteCategory[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  // 1. Fetch current status
  const { data: status } = useQuery<YesPosStatus>({
    queryKey: ["yespos-status"],
    queryFn: async () => {
      const res = await api.get("/yespos/status/");
      return res.data;
    },
  });

  // 2. Test connection & fetch branches
  const handleTestConnection = async () => {
    if (!apiKeyInput.trim()) {
      setMsg({ type: "error", text: "Iltimos, YES POS API kalitini kiriting." });
      return;
    }
    setTestingConnection(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/test/", { api_key: apiKeyInput.trim() });
      if (res.data?.success && res.data?.branches?.length) {
        setBranches(res.data.branches);
        setSelectedBranchId(res.data.branches[0].id);
        setMsg({
          type: "success",
          text: `Ulanish muvaffaqiyatli! ${res.data.branches.length} ta filial topildi. Kerakli filialni tanlang va saqlang.`
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
    if (!apiKeyInput || !selectedBranchId) {
      setMsg({ type: "error", text: "API kalit va filial tanlanishi shart." });
      return;
    }
    const chosenBranch = branches.find((b) => b.id === selectedBranchId);
    setConnecting(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/connect/", {
        api_key: apiKeyInput.trim(),
        branch_id: selectedBranchId,
        branch_name: chosenBranch?.name || selectedBranchId
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: res.data.message || "YES POS muvaffaqiyatli ulandi!" });
        queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
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
      const res = await api.post("/yespos/disconnect/");
      if (res.data?.success) {
        setMsg({ type: "success", text: "YES POS ulanishi uzildi." });
        queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
        setCatalog([]);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Uzishda xatolik yuz berdi." });
    } finally {
      setDisconnecting(false);
    }
  };

  // 5. Fast Sync
  const handleSync = async () => {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await api.post("/yespos/sync/");
      setMsg({
        type: "success",
        text: res.data?.message || "YES POS bilan tovarlar va narxlar muvaffaqiyatli yangilandi!"
      });
      queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
      queryClient.invalidateQueries({ queryKey: ["products-list"] });
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Sinxronizatsiya xatosi." });
    } finally {
      setSyncing(false);
    }
  };

  // 6. Fetch Catalog
  const handleLoadCatalog = async () => {
    setLoadingCatalog(true);
    setMsg(null);
    try {
      const res = await api.get("/yespos/catalog/");
      if (res.data?.success && res.data?.categories) {
        setCatalog(res.data.categories);
        const unlinked = new Set<string>();
        res.data.categories.forEach((cat: RemoteCategory) => {
          cat.products.forEach((p: RemoteProduct) => {
            if (!p.is_linked) unlinked.add(p.id);
          });
        });
        setSelectedProductIds(unlinked);
        setMsg({
          type: "success",
          text: `YES POS katalogidan ${res.data.categories.length} ta kategoriya yuklandi.`
        });
      } else {
        setMsg({ type: "error", text: res.data?.error || "Katalog bo'sh yoki topilmadi." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Katalogni yuklashda xatolik yuz berdi." });
    } finally {
      setLoadingCatalog(false);
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
      const res = await api.post("/yespos/import/", { items: itemsToImport });
      if (res.data?.success) {
        setMsg({
          type: "success",
          text: res.data.message || `Muvaffaqiyatli import qilindi: ${res.data.created} yangi tovar.`
        });
        queryClient.invalidateQueries({ queryKey: ["yespos-status"] });
        queryClient.invalidateQueries({ queryKey: ["products-list"] });
        queryClient.invalidateQueries({ queryKey: ["categories-list"] });
        handleLoadCatalog();
      } else {
        setMsg({ type: "error", text: res.data?.error || "Import jarayonida xatolik yuz berdi." });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Import qilishda server xatosi." });
    } finally {
      setImporting(false);
    }
  };

  const isConnected = status?.is_connected;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>YES POS Integratsiyasi</span>
            {isConnected ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                ULANGAN
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                ULANMAGAN
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kassangizdagi tovarlar, qoldiqlar va narxlarni bir zumda do`koningizga yuklang va avtomatik yangilab turing.
          </p>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Sinxronlanmoqda..." : "Hozir sinxronlash"}</span>
          </button>
        )}
      </div>

      {/* ALERT MESSAGE */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
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
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
              YES
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-900">
                  {status?.branch_name ? status.branch_name : "YES POS Smart Cloud"}
                </h3>
                {status?.branch_id && (
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    ID: {status.branch_id}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isConnected
                  ? `Oxirgi sinxronizatsiya: ${status?.last_sync_at ? new Date(status.last_sync_at).toLocaleString() : "Hozirgina"}`
                  : "Filial hali ulanmagan. Quyidagi maydonga API kalitingizni kiriting."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ulangan tovarlar</div>
              <div className="text-xl font-black text-slate-900 font-mono">
                {status?.linked_products_count || 0} <span className="text-xs text-slate-400 font-normal">ta</span>
              </div>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ulanishni uzish"
              >
                <Unlink className="w-4 h-4" />
                <span>Uzish</span>
              </button>
            )}
          </div>
        </div>

        {/* Protection badge */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Avtomatik so'rov cheklovchisi va DNS xatoliklardan himoyalangan (Rate-limiting & Safe Fallback).</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">2.0 ENGINE</span>
        </div>
      </div>

      {/* 2. CONNECTION / BRANCH CONFIG CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm text-slate-900">
            <Link2 className="w-4 h-4 text-brand" />
            <span>{isConnected ? "Ulanish sozlamalari" : "YES POS bilan ulanish"}</span>
          </div>
          {status?.api_key_masked && (
            <span className="text-xs font-mono text-slate-400">Kalit: {status.api_key_masked}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              YES POS API Kaliti (API-Key):
            </label>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Masalan: yp_live_xxxxxxxxxx yoki demo-yespos-key"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:border-brand"
            />
          </div>

          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? "animate-spin" : ""}`} />
              <span>{testingConnection ? "Tekshirilmoqda..." : "Filiallarni olish"}</span>
            </button>
          </div>

          {branches.length > 0 && (
            <div className="md:col-span-6">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Filialni tanlang:
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand"
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
                className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-dark text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{connecting ? "Ulanmoqda..." : "Filialni saqlash"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. CATALOG EXPLORER & 1-CLICK IMPORT */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>YES POS Katalogi va 1-bosqichli Import</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kassadagi barcha kategoriyalar va tovarlarni ko'rish hamda do'konga nusxalash
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadCatalog}
              disabled={loadingCatalog}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className={`w-4 h-4 ${loadingCatalog ? "animate-bounce" : ""}`} />
              <span>{loadingCatalog ? "Yuklanmoqda..." : "Katalogni yuklash"}</span>
            </button>

            {catalog.length > 0 && selectedProductIds.size > 0 && (
              <button
                type="button"
                onClick={handleImportSelected}
                disabled={importing}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{importing ? "Import qilinmoqda..." : `${selectedProductIds.size} ta tovarni yuklash`}</span>
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
              placeholder="Yuklangan tovarlar ichidan qidirish..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
            />
          </div>
        )}

        {/* Catalog Categories Grid */}
        {catalog.length > 0 ? (
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
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="font-black text-xs text-slate-800">{cat.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({filteredProducts.length} tovar)</span>
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
                      Barchasini tanlash
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts.map((prod) => {
                      const isSelected = selectedProductIds.has(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleSelect(prod.id)}
                          className={`p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? "border-brand bg-emerald-50/40 ring-1 ring-brand"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(prod.id)}
                            className="mt-1 rounded text-brand focus:ring-brand"
                          />
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-900 truncate leading-tight">{prod.name}</div>
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span className="font-mono font-bold text-slate-900">
                                {prod.price?.toLocaleString()} UZS
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 font-medium">Qoldiq: {prod.stock}</span>
                            </div>
                            {prod.is_linked && (
                              <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                Do'konga ulangan
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
            <p className="text-xs">Katalogni ko'rish uchun yuqoridagi "Katalogni yuklash" tugmasini bosing.</p>
          </div>
        )}
      </div>
    </div>
  );
};
