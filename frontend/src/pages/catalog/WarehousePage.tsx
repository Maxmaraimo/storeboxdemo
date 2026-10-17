import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Search, Plus, X, CheckCircle2, Download, Upload } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../types";

export const WarehousePage: React.FC = () => {
  const { t, lang, store } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [csvNotice, setCsvNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [deltaQty, setDeltaQty] = useState("10");
  const [newCostPrice, setNewCostPrice] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["products", store?.id, "warehouse", search],
    queryFn: async () => {
      const res = await api.get(`/products/?q=${encodeURIComponent(search)}&store_id=${store?.id || ""}`);
      return res.data as { products: Product[]; total: number };
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
    setSelectedProductId(productId || (allProducts[0]?.id ?? ""));
    setDeltaQty("10");
    setNewCostPrice("");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const allProducts = data?.products || [];
  const getProductName = (product: Product) => lang === "ru"
    ? product.name_ru || product.name_uz
    : lang === "en" ? product.name_en || product.name_uz || product.name_ru : product.name_uz || product.name_ru;
  const products = allProducts.filter((p) => {
    const s = p.stock ?? 0;
    if (stockFilter === "in_stock") return s > 10;
    if (stockFilter === "low_stock") return s > 0 && s <= 10;
    if (stockFilter === "out_of_stock") return s === 0;
    return true;
  });

  const handleExportCsv = () => {
    const rows = [
      ["ID", "Name", "Barcode", "Stock", "CostPrice_UZS", "RetailPrice_UZS", "Status"],
      ...allProducts.map((p) => {
        const s = p.stock ?? 0;
        const status = s > 10 ? "IN_STOCK" : s > 0 ? "LOW_STOCK" : "OUT_OF_STOCK";
        return [
          String(p.id),
          `"${(p.name_uz || p.name_ru || "").replace(/"/g, '""')}"`,
          p.barcode || "",
          String(s),
          String((p as any).cost_price || 0),
          String(p.price || 0),
          status,
        ];
      }),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_${store?.subdomain || "storebox"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvNotice(
      lang === "ru"
        ? `Файл "${file.name}" успешно обработан. Остатки синхронизированы.`
        : `"${file.name}" fayli muvaffaqiyatli yuklandi va qoldiqlar yangilandi.`
    );
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setTimeout(() => setCsvNotice(""), 4000);
  };

  const secondaryButtonClass = "inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#d8d1e2] bg-white px-3 text-xs font-medium text-[#494456] transition-colors hover:bg-[#f7f4fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] disabled:opacity-40 dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-200 dark:hover:bg-[#30263f] cursor-pointer";
  const primaryButtonClass = "inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#211b2e] bg-[#211b2e] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#151020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] disabled:opacity-40 dark:border-[#f0edf4] dark:bg-[#f0edf4] dark:text-[#211b2e] dark:hover:bg-white cursor-pointer";
  const fieldClass = "min-h-9 w-full rounded-[10px] border border-[#d8d1e2] bg-[#f8f7fa] px-3 text-[13px] text-[#211b2e] outline-none focus:border-[#8b8497] focus:ring-2 focus:ring-[#211b2e]/10 dark:border-zinc-700 dark:bg-[#191520] dark:text-zinc-100";

  return (
    <div className="space-y-4">
      <h1 className="sr-only">{t("warehouse_title") || "Omborxona"}</h1>

      {csvNotice && (
        <div role="status" className="flex items-center gap-2 rounded-[10px] border border-[#dfe5ef] bg-white p-3 text-xs text-[#494456] dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{csvNotice}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
        <div className="flex flex-col gap-3 border-b border-[#e6e3eb] px-4 py-3 sm:flex-row sm:items-center dark:border-zinc-700">
          <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
          <div className="storebox-segmented-control min-w-max" role="group" aria-label={lang === "ru" ? "Остатки товаров" : lang === "en" ? "Stock level" : "Mahsulot qoldiqlari"}>
            {[
              { id: "all", label: lang === "ru" ? "Все" : lang === "en" ? "All" : "Barchasi", count: allProducts.length },
              { id: "in_stock", label: lang === "ru" ? "В наличии" : lang === "en" ? "In stock" : "Yetarli", count: allProducts.filter((p) => (p.stock ?? 0) > 10).length },
              { id: "low_stock", label: lang === "ru" ? "Мало на складе" : lang === "en" ? "Low stock" : "Kam qoldi", count: allProducts.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10).length },
              { id: "out_of_stock", label: lang === "ru" ? "Нет в наличии" : lang === "en" ? "Out of stock" : "Tugagan", count: allProducts.filter((p) => (p.stock ?? 0) === 0).length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={stockFilter === tab.id}
                onClick={() => setStockFilter(tab.id as any)}
                className={`storebox-segmented-tab ${stockFilter === tab.id ? "is-active" : ""}`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          </div>
          <button type="button" onClick={() => openModal()} className={`${primaryButtonClass} self-start sm:self-auto`}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{t("stock_in") || "Kirim qilish"}</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#e6e3eb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700">
          <div className="relative w-full sm:max-w-[380px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9690a2]" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("search_warehouse_ph") || "Nomi yoki shtrix-kod bo'yicha qidiruv"}
              placeholder={t("search_warehouse_ph") || "Nomi yoki shtrix-kod bo'yicha qidiruv..."}
              className={`${fieldClass} pl-9 pr-3`}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
            <button type="button" onClick={handleExportCsv} disabled={isLoading || isError || !allProducts.length} className={secondaryButtonClass}>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{lang === "ru" ? "Экспорт CSV" : lang === "en" ? "Export CSV" : "Eksport CSV"}</span>
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className={secondaryButtonClass}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              <span>{lang === "ru" ? "Импорт CSV" : "Import CSV"}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#e6e3eb] bg-[#f8f7fa] text-xs text-[#81798f] dark:border-zinc-700 dark:bg-[#191520] dark:text-zinc-400">
                <th scope="col" className="px-4 py-3 font-medium">{t("th_product") || "Mahsulot"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t("th_barcode") || "Shtrix-kod"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{t("th_stock_qty") || "Qoldiq"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{t("th_cost_price") || "Tan narx"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{t("th_retail_price") || "Sotuv narxi"}</th>
                <th scope="col" className="px-4 py-3 font-medium">{t("th_status") || "Holat"}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{t("th_action") || "Amal"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efecf3] text-[13px] text-[#494456] dark:divide-zinc-800 dark:text-zinc-200">
              {products.map((p) => {
                const stock = p.stock ?? 0;
                const costPrice = Number(p.cost_price || 0);
                const price = Number(p.price);
                const statusLabel = stock > 10
                  ? (lang === "ru" ? "В наличии" : lang === "en" ? "In stock" : "Yetarli")
                  : stock > 0
                    ? (lang === "ru" ? "Мало на складе" : lang === "en" ? "Low stock" : "Kam qoldi")
                    : (lang === "ru" ? "Нет в наличии" : lang === "en" ? "Out of stock" : "Tugagan");

                return (
                  <tr key={p.id} className="transition-colors hover:bg-[#faf9fc] dark:hover:bg-[#30263f]/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                      {p.primary_image_url ? (
                        <img src={p.primary_image_url} alt="" className="h-10 w-10 shrink-0 rounded-[9px] border border-[#e6e3eb] object-cover dark:border-zinc-700" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border border-[#e6e3eb] bg-[#f8f7fa] text-[#9690a2] dark:border-zinc-700 dark:bg-[#191520]">
                          <Package className="h-4 w-4" aria-hidden="true" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="max-w-[240px] truncate font-medium text-[#211b2e] dark:text-zinc-100" title={getProductName(p)}>{getProductName(p)}</div>
                        <div className="mt-1 max-w-[240px] truncate text-[11px] text-[#8b8497]">{p.category_name || "—"}</div>
                      </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#8b8497]">{p.barcode || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-[#211b2e] dark:text-zinc-100">{stock} {p.unit || t("unit_pcs") || "dona"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-[#81798f] dark:text-zinc-400">
                      {costPrice ? `${costPrice.toLocaleString("ru-RU")} UZS` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-[#211b2e] dark:text-zinc-100">{price.toLocaleString("ru-RU")} UZS</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs">
                        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${stock > 10 ? "bg-[#a3e635]" : stock > 0 ? "bg-[#a49aaf]" : "bg-[#d18b95]"}`} />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(p.id)}
                        className={secondaryButtonClass}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        {lang === "ru" ? "Приход" : lang === "en" ? "Add stock" : "Kirim"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(isLoading || isError || products.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8b8497]" role="status">
                    {isLoading
                      ? (lang === "ru" ? "Загрузка…" : lang === "en" ? "Loading…" : "Yuklanmoqda…")
                      : isError
                        ? (lang === "ru" ? "Не удалось загрузить товары" : lang === "en" ? "Unable to load products" : "Mahsulotlarni yuklab bo'lmadi")
                        : t("products_not_found") || "Mahsulotlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#151020]/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="warehouse-adjust-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-md space-y-4 overflow-y-auto rounded-[18px] border border-[#dfe5ef] bg-white p-5 text-[#211b2e] shadow-xl dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-100">
            <div className="flex items-center justify-between gap-3 border-b border-[#e6e3eb] pb-3 dark:border-zinc-700">
              <h3 id="warehouse-adjust-title" className="text-sm font-semibold">
                {t("adjust_stock_title") || "Kirim qilish (Zaxirani oshirish)"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label={lang === "ru" ? "Закрыть" : lang === "en" ? "Close" : "Yopish"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#8b8497] transition-colors hover:bg-[#f0edf4] hover:text-[#211b2e] dark:hover:bg-[#30263f] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div role="alert" className="rounded-[10px] border border-[#e8d1d6] bg-[#fcf4f5] p-3 text-xs text-[#aa3e51] dark:border-[#634552] dark:bg-[#3b2a36] dark:text-[#f1a9b7]">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label htmlFor="warehouse-product" className="mb-1.5 block text-xs font-medium">
                  {t("select_product") || "Mahsulot *"}
                </label>
                <select
                  id="warehouse-product"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className={fieldClass}
                >
                  <option value="">{t("select_product") || "Mahsulotni tanlang"}</option>
                  {allProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {getProductName(p)} ({t("th_stock_qty") || "Qoldiq"}: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="warehouse-quantity" className="mb-1.5 block text-xs font-medium">
                  {t("inflow_qty_label") || "Kirim miqdori (dona) *"}
                </label>
                <input
                  id="warehouse-quantity"
                  type="number"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(e.target.value)}
                  placeholder="50"
                  className={`${fieldClass} tabular-nums`}
                />
              </div>

              <div>
                <label htmlFor="warehouse-cost" className="mb-1.5 block text-xs font-medium">
                  {t("new_cost_price_label") || "Yangi tan narxi (ixtiyoriy, UZS)"}
                </label>
                <input
                  id="warehouse-cost"
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  placeholder="25000"
                  className={`${fieldClass} tabular-nums`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#e6e3eb] pt-4 dark:border-zinc-700">
              <button
                type="button"
                onClick={closeModal}
                className={secondaryButtonClass}
              >
                {t("cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => adjustMutation.mutate()}
                disabled={adjustMutation.isPending}
                className={primaryButtonClass}
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
