import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Search, Plus, AlertCircle, ArrowDownUp, X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Product } from "../../types";

export const WarehousePage: React.FC = () => {
  const { t } = useAuth();
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("warehouse")}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mahsulot qoldiqlari, minimal zaxira va ombor harakati</p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Kirim qilish</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nomi yoki shtrix-kod bo'yicha qidiruv..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Mahsulot</th>
                <th className="p-4">Shtrix-kod</th>
                <th className="p-4 text-right">Qoldiq</th>
                <th className="p-4 text-right">Tan narx</th>
                <th className="p-4 text-right">Sotuv narxi</th>
                <th className="p-4 text-center">Holat</th>
                <th className="p-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {products.map((p) => {
                const stock = p.stock ?? 0;
                const costPrice = (p as any).cost_price ? Number((p as any).cost_price) : 0;
                const price = Number(p.price);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                      {p.primary_image_url ? (
                        <img src={p.primary_image_url} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div>{p.name_uz || p.name_ru}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{p.category_name || "Kategoriyasiz"}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{p.barcode || "—"}</td>
                    <td className="p-4 text-right font-bold text-slate-900">{stock} {p.unit || "dona"}</td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      {costPrice ? `${costPrice.toLocaleString()} UZS` : "—"}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-brand">{price.toLocaleString()} UZS</td>
                    <td className="p-4 text-center">
                      {stock > 10 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Yetarli</span>
                      )}
                      {stock > 0 && stock <= 10 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Kam qoldi</span>
                      )}
                      {stock === 0 && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Tugagan</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openModal(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-brand hover:text-white transition-colors text-[11px] font-bold"
                      >
                        + Kirim
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Mahsulotlar topilmadi
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Omborga tovar kirim qilish
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mahsulot *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="">Mahsulotni tanlang</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name_uz || p.name_ru} (Hozirgi qoldiq: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qo'shiladigan miqdor (+dona) *
                </label>
                <input
                  type="number"
                  value={deltaQty}
                  onChange={(e) => setDeltaQty(e.target.value)}
                  placeholder="Masalan: 50"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yangi tan narxi (UZS, ixtiyoriy)
                </label>
                <input
                  type="number"
                  value={newCostPrice}
                  onChange={(e) => setNewCostPrice(e.target.value)}
                  placeholder="Masalan: 25000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => adjustMutation.mutate()}
                disabled={adjustMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-black hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {adjustMutation.isPending ? "Kirim qilinmoqda..." : "Kirim qilish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
