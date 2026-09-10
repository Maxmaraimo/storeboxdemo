import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit2, Package, X, Check } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Product, Category } from "../../types";

export const ProductsPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formNameUz, setFormNameUz] = useState("");
  const [formNameRu, setFormNameRu] = useState("");
  const [formCategory, setFormCategory] = useState<number | "">("");
  const [formPrice, setFormPrice] = useState("");
  const [formOldPrice, setFormOldPrice] = useState("");
  const [formCostPrice, setFormCostPrice] = useState("");
  const [formStock, setFormStock] = useState("10");
  const [formUnit, setFormUnit] = useState("dona");
  const [formBarcode, setFormBarcode] = useState("");
  const [formIkpu, setFormIkpu] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDescUz, setFormDescUz] = useState("");
  const [formError, setFormError] = useState("");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", selectedCategory, search],
    queryFn: async () => {
      let url = `/products/?q=${encodeURIComponent(search)}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      const res = await api.get(url);
      return res.data as { products: Product[]; total: number };
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return res.data as { categories: Category[]; total: number };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formNameUz.trim()) throw new Error("Mahsulot nomini kiriting");
      if (!formPrice || Number(formPrice) <= 0) throw new Error("Sotuv narxini to'g'ri kiriting");

      const payload: any = {
        name_uz: formNameUz.trim(),
        name_ru: formNameRu.trim() || formNameUz.trim(),
        price: Number(formPrice),
        old_price: formOldPrice ? Number(formOldPrice) : null,
        cost_price: formCostPrice ? Number(formCostPrice) : null,
        stock: Number(formStock) || 0,
        unit: formUnit || "dona",
        barcode: formBarcode.trim(),
        ikpu_code: formIkpu.trim(),
        primary_image_url: formImage.trim() || null,
        description_uz: formDescUz.trim(),
        category: formCategory ? Number(formCategory) : null,
        is_active: true,
      };

      if (editingProduct) {
        return (await api.patch(`/products/${editingProduct.id}/`, payload)).data;
      } else {
        return (await api.post("/products/", payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || "Xatolik yuz berdi";
      setFormError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormNameUz("");
    setFormNameRu("");
    setFormCategory(categories[0]?.id || "");
    setFormPrice("");
    setFormOldPrice("");
    setFormCostPrice("");
    setFormStock("10");
    setFormUnit("dona");
    setFormBarcode("");
    setFormIkpu("");
    setFormImage("");
    setFormDescUz("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormNameUz(p.name_uz || "");
    setFormNameRu(p.name_ru || "");
    setFormCategory(p.category || "");
    setFormPrice(String(p.price || ""));
    setFormOldPrice(p.old_price ? String(p.old_price) : "");
    setFormCostPrice((p as any).cost_price ? String((p as any).cost_price) : "");
    setFormStock(String(p.stock ?? 0));
    setFormUnit(p.unit || "dona");
    setFormBarcode(p.barcode || "");
    setFormIkpu(p.ikpu_code || "");
    setFormImage(p.primary_image_url || "");
    setFormDescUz(p.description_uz || "");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormError("");
  };

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t("products_list_title") || "Mahsulotlar ro`yxati"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("products_list_subtitle") || "Katalogdagi tovarlar, narxlar va qoldiqlar"}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi mahsulot</span>
        </button>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_product_ph") || "Mahsulot nomi bo`yicha qidirish..."}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-brand"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === null ? "bg-brand text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t("all_filter") || "Barchasi"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? "bg-brand text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat.name_uz || cat.name_ru}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">{t("th_photo") || "Tovar"}</th>
                <th className="py-3.5 px-4">{t("th_category") || "Kategoriya"}</th>
                <th className="py-3.5 px-4">{t("th_price") || "Sotuv narxi"}</th>
                <th className="py-3.5 px-4">{t("th_stock") || "Qoldiq"}</th>
                <th className="py-3.5 px-4">{t("th_unit") || "Birligi"}</th>
                <th className="py-3.5 px-4">{t("th_status_col") || "Holat"}</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {products.map((p) => (
                <tr key={p.id} className={`hover:bg-slate-50/60 transition-colors ${p.stock === 0 ? "opacity-60" : ""}`}>
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    {p.primary_image_url ? (
                      <img
                        src={p.primary_image_url}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{p.name_uz || p.name_ru}</div>
                      {p.name_ru && p.name_uz !== p.name_ru && (
                        <div className="text-[10px] text-slate-400">{p.name_ru}</div>
                      )}
                      {p.barcode && (
                        <div className="text-[10px] text-slate-400 font-mono">#{p.barcode}</div>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">{p.category_name || "—"}</td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono font-black text-slate-900">{Number(p.price).toLocaleString()} UZS</div>
                    {p.old_price && (
                      <div className="text-[10px] text-slate-400 line-through font-mono">
                        {Number(p.old_price).toLocaleString()} UZS
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`font-mono font-bold ${p.stock === 0 ? "text-rose-500" : "text-slate-900"}`}>
                      {p.stock}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500">{p.unit || "dona"}</td>

                  <td className="py-3.5 px-4">
                    {p.stock === 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                        {t("out_of_stock") || "Tugagan"}
                      </span>
                    ) : p.is_active ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t("in_stock") || "Sotuvda"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-500">
                        {t("out_of_stock") || "Nofaol"}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`'${p.name_uz}' mahsulotini o'chirishni tasdiqlaysizmi?`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {t("no_products_found") || "Mahsulotlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingProduct ? "Mahsulotni tahrirlash" : "Yangi mahsulot qo'shish"}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mahsulot nomi (O'zbekcha) *
                </label>
                <input
                  type="text"
                  value={formNameUz}
                  onChange={(e) => setFormNameUz(e.target.value)}
                  placeholder="Masalan: Lavash klassik, iPhone 15 Pro"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategoriya
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="">Tanlanmagan</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_uz || c.name_ru}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  O'lchov birligi
                </label>
                <select
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="dona">Dona (dona)</option>
                  <option value="kg">Kilogramm (kg)</option>
                  <option value="metr">Metr (m)</option>
                  <option value="litr">Litr (l)</option>
                  <option value="portsiya">Portsiya</option>
                  <option value="pachka">Pachka</option>
                  <option value="korobka">Korobka</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sotuv narxi (UZS) *
                </label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="35000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Eski narxi (Chegirma uchun)
                </label>
                <input
                  type="number"
                  value={formOldPrice}
                  onChange={(e) => setFormOldPrice(e.target.value)}
                  placeholder="40000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tan narxi (Ombor hisobi uchun)
                </label>
                <input
                  type="number"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                  placeholder="22000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mavjud qoldiq
                </label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shtrix-kod (Barcode)
                </label>
                <input
                  type="text"
                  value={formBarcode}
                  onChange={(e) => setFormBarcode(e.target.value)}
                  placeholder="478000..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  MXIK (IKPU) kodi
                </label>
                <input
                  type="text"
                  value={formIkpu}
                  onChange={(e) => setFormIkpu(e.target.value)}
                  placeholder="10101001001000000"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rasm havolasi (URL)
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mahsulot ta'rifi
                </label>
                <textarea
                  rows={2}
                  value={formDescUz}
                  onChange={(e) => setFormDescUz(e.target.value)}
                  placeholder="Tarkibi, xususiyatlari..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
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
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-black hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {saveMutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
