import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Search, Plus, AlertCircle, ArrowDownUp, X, RefreshCw, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../types";

export const WarehousePage: React.FC = () => {
  const { t, lang } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [deltaQty, setDeltaQty] = useState("10");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      const res = await api.get(`/products/?q=${encodeURIComponent(search)}`);
      return res.data as { products: Product[]; total: number };
    },
  });

  const { data: integrationsData } = useQuery({
    queryKey: ["integrations-list"],
    queryFn: async () => {
      const res = await api.get("/integrations/");
      return res.data as { integrations: any[] };
    },
  });

  const connectedIntegration = (integrationsData?.integrations || []).find(
    (i: any) => i.is_connected && (i.category === "warehouse" || i.category === "pos")
  );

  const syncMutation = useMutation({
    mutationFn: async (slug: string) => {
      return (await api.post(`/integrations/${slug}/sync/`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["integrations-list"] });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!selectedProductId) throw new Error("Mahsulotni tanlang");
      if (!deltaQty || isNaN(Number(deltaQty))) throw new Error("Kirim miqdorini kiriting");

      const payload: any = {
        product_id: Number(selectedProductId),
        delta: Number(deltaQty),
      };
      if (newCostPrice) {
        payload.cost_price = Number(newCostPrice);
      }

      return (await api.post("/warehouse/adjust-stock/", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setFormError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  const openModal = (productId?: number) => {
    setSelectedProductId(productId || (products[0]?.id ?? ""));
    setDeltaQty("10");
    setNewCostPrice("");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const products = data?.products || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t("warehouse_title") || t("warehouse") || "Omborxona"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">{t("warehouse_subtitle") || "Mahsulot qoldiqlari, minimal zaxira va ombor harakati"}</p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("stock_in") || "Kirim qilish"}</span>
        </button>
      </div>

      {/* Active Warehouse Integration Live Sync Banner */}
      {connectedIntegration && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/30 dark:to-neutral-900 border border-emerald-200/90 dark:border-emerald-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-800 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {connectedIntegration.name} {lang === 'ru' ? 'интеграция активна' : 'integratsiyasi faol'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE SYNC
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                {lang === 'ru'
                  ? `Остатки и товары синхронизируются с ${connectedIntegration.name}. Последнее обновление: `
                  : `Qoldiqlar va mahsulotlar ${connectedIntegration.name} bilan sinxronlanmoqda. Oxirgi yangilanish: `}
                <span className="font-mono font-medium text-slate-700 dark:text-neutral-300">
                  {connectedIntegration.last_synced
                    ? new Date(connectedIntegration.last_synced).toLocaleString(lang === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
                    : (lang === 'ru' ? 'Недавно' : 'Yaqinda')}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => syncMutation.mutate(connectedIntegration.slug)}
              disabled={syncMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 text-slate-700 dark:text-neutral-200 text-xs font-medium transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              <span>
                {syncMutation.isPending
                  ? (lang === 'ru' ? 'Синхронизация...' : 'Sinxronlanmoqda...')
                  : (lang === 'ru' ? 'Синхронизировать' : 'Sinxronlash')}
              </span>
            </button>
            <Link
              to="/settings/integrations"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium hover:bg-white/60 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{lang === 'ru' ? 'Настройки' : 'Sozlamalar'}</span>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search_warehouse_ph") || "Nomi yoki shtrix-kod bo'yicha qidiruv..."}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                <th className="p-3.5">{t("th_product") || "Mahsulot"}</th>
                <th className="p-3.5">{t("th_barcode") || "Shtrix-kod"}</th>
                <th className="p-3.5 text-right">{t("th_stock_qty") || "Qoldiq"}</th>
                <th className="p-3.5 text-right">{t("th_cost_price") || "Tan narx"}</th>
                <th className="p-3.5 text-right">{t("th_retail_price") || "Sotuv narxi"}</th>
                <th className="p-3.5 text-center">{t("th_status") || "Holat"}</th>
                <th className="p-3.5 text-right">{t("th_action") || "Amal"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-normal text-slate-700">
              {products.map((p) => {
                const stock = p.stock ?? 0;
                const costPrice = (p as any).cost_price ? Number((p as any).cost_price) : 0;
                const price = Number(p.price);

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-medium text-slate-900 flex items-center gap-3">
                      {p.primary_image_url ? (
                        <img src={p.primary_image_url} alt="" className="w-9 h-9 rounded-md object-cover border border-slate-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div>{p.name_uz || p.name_ru}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{p.category_name || "—"}</div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{p.barcode || "—"}</td>
                    <td className="p-3.5 text-right font-medium text-slate-900">{stock} {t("unit_pcs") || p.unit || "dona"}</td>
                    <td className="p-3.5 text-right font-mono text-slate-500">
                      {costPrice ? `${costPrice.toLocaleString()} UZS` : "—"}
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium text-slate-900">{price.toLocaleString()} UZS</td>
                    <td className="p-3.5 text-center">
                      {stock > 10 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {t("stock_sufficient") || "Yetarli"}
                        </span>
                      )}
                      {stock > 0 && stock <= 10 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {t("stock_low") || "Kam qoldi"}
                        </span>
                      )}
                      {stock === 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          {t("stock_empty") || "Tugagan"}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(p.id)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-[11px] font-medium cursor-pointer"
                      >
                        {t("btn_add_stock") || "+ Kirim"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    {t("products_not_found") || "Mahsulotlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                {t("adjust_stock_title") || "Kirim qilish (Zaxirani oshirish)"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("select_product") || "Mahsulot *"}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal focus:outline-none focus:border-blue-600"
                >
                  <option value="">{t("select_product") || "Mahsulotni tanlang"}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_uz || p.name_ru} ({t("th_stock_qty") || "Qoldiq"}: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("inflow_qty_label") || "Kirim miqdori (dona) *"}
                </label>
                <input
                  type="number"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {t("new_cost_price_label") || "Yangi tan narxi (ixtiyoriy, UZS)"}
                </label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  placeholder="25000"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => adjustMutation.mutate()}
                disabled={adjustMutation.isPending}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {adjustMutation.isPending ? (t("saving") || "Saqlanmoqda...") : (t("save") || "Saqlash")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
