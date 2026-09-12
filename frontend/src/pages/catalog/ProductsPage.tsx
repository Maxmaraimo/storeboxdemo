import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit2, Package, X, Check, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Faqat rasm formatidagi fayllarni yuklash mumkin (JPG, PNG, WEBP)");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setFormImage(previewUrl);
    setUploadingImage(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("photo", file);
      if (editingProduct) {
        formData.append("product_id", String(editingProduct.id));
      }
      const res = await api.post("/products/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success && res.data.image_url) {
        setFormImage(res.data.image_url);
      }
    } catch (err: any) {
      setFormError("Rasm yuklashda xatolik yuz berdi: " + (err.response?.data?.error || err.message));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadImageFile(file);
    }
  };

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
        image_url: formImage.trim() || "",
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
    setUploadingImage(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    setUploadingImage(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormError("");
    setUploadingImage(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          data-testid="create-product-btn"
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
                  data-testid="product-name-uz-input"
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
                  data-testid="product-price-input"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand" />
                    <span>Mahsulot rasmi</span>
                    <span className="text-[10px] text-slate-400 font-normal">(3:4 yoki 1:1 proporsiya tavsiya etiladi)</span>
                  </label>
                  {formImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage("")}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Rasmni o'chirish</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {formImage ? (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="relative w-20 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 group">
                      <img
                        src={formImage}
                        alt="Mahsulot rasmi"
                        className="w-full h-full object-cover"
                      />
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate mb-1">
                        {uploadingImage ? "Rasm yuklanmoqda..." : "Rasm tanlandi"}
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2.5">
                        Boshqa rasm yuklash uchun tugmani bosing yoki yangisini tanlang
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Rasmni almashtirish</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-brand bg-brand/5 scale-[0.99]"
                        : "border-slate-200 hover:border-brand/60 hover:bg-slate-50/80 bg-white"
                    }`}
                  >
                    {uploadingImage ? (
                      <div className="py-2 flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-brand animate-spin" />
                        <span className="text-xs font-bold text-slate-600">Rasm yuklanmoqda...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-1">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          Rasm yuklash uchun bosing yoki faylni bu yerga tashlang
                        </div>
                        <p className="text-[11px] text-slate-400">
                          PNG, JPG, WEBP formatlar (maks. 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
                data-testid="save-product-btn"
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
