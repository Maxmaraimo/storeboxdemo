import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Package,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  Loader2,
  Sliders,
  ArrowLeft,
  DollarSign,
  Layers,
  Globe,
  Send,
  AlertCircle
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Product, Category } from "../../types";

export const ProductsPage: React.FC = () => {
  const { t, lang, hasPermission, store } = useAuth();
  const canEditProduct = hasPermission("products", "edit");
  const canDeleteProduct = hasPermission("products", "delete");
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");

  const getCategoryName = (c?: Category | null) => {
    if (!c) return "";
    if (lang === "ru") return c.name_ru || c.name_uz || c.name_en || "";
    if (lang === "en") return c.name_en || c.name_uz || c.name_ru || "";
    return c.name_uz || c.name_ru || c.name_en || "";
  };

  const getProductName = (p?: Product | null) => {
    if (!p) return "";
    if (lang === "ru") return p.name_ru || p.name_uz || p.name_en || "";
    if (lang === "en") return p.name_en || p.name_uz || p.name_ru || "";
    return p.name_uz || p.name_ru || p.name_en || "";
  };

  // Modal / Editor state
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
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const uploadImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Файл должен быть изображением (JPG, PNG, WEBP)");
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
      setFormError("Ошибка загрузки изображения: " + (err.response?.data?.error || err.message));
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
    queryKey: ["products", store?.id, selectedCategory, search],
    queryFn: async () => {
      let url = `/products/?q=${encodeURIComponent(search)}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      const res = await api.get(url);
      return res.data as { products: Product[]; total: number };
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", store?.id],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return res.data as { categories: Category[]; total: number };
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const res = await api.patch(`/products/${id}/`, { is_active });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formNameUz.trim()) throw new Error("Укажите название товара");
      if (!formPrice || Number(formPrice) <= 0) throw new Error("Укажите цену товара");

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
        is_active: formIsActive,
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
      const msg = err.response?.data?.error || err.response?.data?.detail || err.message || "Ошибка сохранения";
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
    onError: (err: any) => {
      alert(err.response?.data?.error || "Не удалось удалить товар");
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
    setFormIsActive(true);
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
    setFormIsActive(p.is_active ?? true);
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

  const rawProducts = productsData?.products || [];
  const categories = categoriesData?.categories || [];

  const products = rawProducts.filter((p) => {
    if (statusFilter === "active") return p.is_active;
    if (statusFilter === "draft") return !p.is_active;
    return true;
  });

  const numPrice = Number(formPrice) || 0;
  const numCost = Number(formCostPrice) || 0;
  const profit = numPrice > numCost && numCost > 0 ? numPrice - numCost : 0;
  const margin = numPrice > 0 && numCost > 0 ? Math.round(((numPrice - numCost) / numPrice) * 100) : 0;

  // --------------------------------------------------------------------------
  // SHOPIFY 2-COLUMN FULL-PAGE PRODUCT EDITOR
  // --------------------------------------------------------------------------
  if (modalOpen) {
    return (
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">
        {/* Sticky Action Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeModal}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                {editingProduct
                  ? (lang === "ru" ? "Редактирование товара" : "Mahsulotni tahrirlash")
                  : (lang === "ru" ? "Новый товар" : "Yangi mahsulot")}
              </h1>
              <div className="text-xs text-slate-500 font-normal">
                {lang === "ru" ? "Заполните данные о товаре для витрины" : "Mahsulot ma'lumotlarini kiriting"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 transition-colors"
            >
              {lang === "ru" ? "Отмена" : "Bekor qilish"}
            </button>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors shadow-2xs flex items-center gap-1.5"
            >
              {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{lang === "ru" ? "Сохранить" : "Saqlash"}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT COLUMN: Main Information (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Title & Description Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "ru" ? "Название и описание" : "Nomi va tavsifi"}
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Название товара (Узбекский) *" : "Mahsulot nomi (O'zbekcha) *"}
                  </label>
                  <input
                    type="text"
                    value={formNameUz}
                    onChange={(e) => setFormNameUz(e.target.value)}
                    placeholder="Masalan: Klassik Lavash, iPhone 15 Pro..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Название товара (Русский)" : "Mahsulot nomi (Ruscha)"}
                  </label>
                  <input
                    type="text"
                    value={formNameRu}
                    onChange={(e) => setFormNameRu(e.target.value)}
                    placeholder="Например: Классический Лаваш, iPhone 15 Pro..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Описание товара" : "Mahsulot ta'rifi"}
                  </label>
                  <textarea
                    rows={4}
                    value={formDescUz}
                    onChange={(e) => setFormDescUz(e.target.value)}
                    placeholder={lang === "ru" ? "Подробное описание характеристик, состава..." : "Mahsulot haqida ma'lumot..."}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                  {lang === "ru" ? "Медиафайлы" : "Mahsulot rasmlari"}
                </h2>
                {formImage && (
                  <button
                    type="button"
                    onClick={() => setFormImage("")}
                    className="text-xs text-rose-500 hover:text-rose-600 font-normal flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Удалить фото" : "O'chirish"}</span>
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
                <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                    <img src={formImage} alt="Product" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-800">
                      {lang === "ru" ? "Основное изображение товара" : "Asosiy rasm"}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs text-slate-700 transition-colors"
                    >
                      {lang === "ru" ? "Заменить" : "Almashtirish"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-300 dark:border-zinc-700 hover:border-slate-400 bg-slate-50/30"
                  }`}
                >
                  {uploadingImage ? (
                    <div className="py-2 flex flex-col items-center gap-1.5">
                      <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                      <span className="text-xs text-slate-600">{lang === "ru" ? "Загрузка..." : "Yuklanmoqda..."}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <Upload className="w-5 h-5 text-slate-400" />
                      <div className="text-xs font-medium text-slate-800 dark:text-zinc-200">
                        {lang === "ru" ? "Нажмите для загрузки или перетащите фото" : "Rasm yuklash uchun bosing"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        PNG, JPG, WEBP (рекомендуется 1:1)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pricing Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "ru" ? "Ценообразование" : "Narxlar"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Цена продажи (UZS) *" : "Sotuv narxi (UZS) *"}
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Старая цена (Скидка)" : "Eski narxi (Chegirma)"}
                  </label>
                  <input
                    type="number"
                    value={formOldPrice}
                    onChange={(e) => setFormOldPrice(e.target.value)}
                    placeholder="40000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Себестоимость" : "Tan narxi"}
                  </label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    placeholder="22000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {numPrice > 0 && numCost > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500">
                  <span>{lang === "ru" ? "Маржинальность:" : "Marja:"} <strong className="text-emerald-600">{margin}%</strong></span>
                  <span>{lang === "ru" ? "Прибыль с единицы:" : "Birlikdan foyda:"} <strong className="text-emerald-600">{profit.toLocaleString()} UZS</strong></span>
                </div>
              )}
            </div>

            {/* Inventory Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "ru" ? "Склад и инвентарь" : "Ombor va hisob"}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Остаток на складе" : "Mavjud qoldiq"}
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Единица измерения" : "O'lchov birligi"}
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                  >
                    <option value="dona">Штука (dona)</option>
                    <option value="kg">Килограмм (kg)</option>
                    <option value="litr">Литр (litr)</option>
                    <option value="metr">Метр (metr)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Штрихкод (Barcode / SKU)" : "Shtrix-kod"}
                  </label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="478000..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    {lang === "ru" ? "Код ИКПУ (MXIK)" : "MXIK (IKPU) kodi"}
                  </label>
                  <input
                    type="text"
                    value={formIkpu}
                    onChange={(e) => setFormIkpu(e.target.value)}
                    placeholder="10101001001000000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Status, Category & Publishing (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Status Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "ru" ? "Статус товара" : "Holati"}
              </h2>

              <select
                value={formIsActive ? "active" : "draft"}
                onChange={(e) => setFormIsActive(e.target.value === "active")}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
              >
                <option value="active">🟢 {lang === "ru" ? "Активен (В продаже)" : "Faol (Sotuvda)"}</option>
                <option value="draft">⚪ {lang === "ru" ? "Черновик / Скрыт" : "Qoralama (To'xtatilgan)"}</option>
              </select>
              <p className="text-[11px] text-slate-400">
                {lang === "ru"
                  ? "Активные товары отображаются во всех подключенных каналах продаж."
                  : "Faol mahsulotlar xaridorlarga ko'rinadi."}
              </p>
            </div>

            {/* Category Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "ru" ? "Категория" : "Kategoriya"}
              </h2>

              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value ? Number(e.target.value) : "")}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
              >
                <option value="">{lang === "ru" ? "Без категории" : "Tanlanmagan"}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getCategoryName(c)}
                  </option>
                ))}
              </select>
              <Link
                to="/categories"
                className="text-xs text-blue-600 hover:underline inline-block"
              >
                {lang === "ru" ? "Управление категориями →" : "Kategoriyalarni sozlash →"}
              </Link>
            </div>

            {/* Sales Channels Card */}
            <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                {lang === "ru" ? "Каналы продаж" : "Sotuv kanallari"}
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === "ru" ? "Интернет-магазин" : "Online-do'kon"}</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">✓ {lang === "ru" ? "Активен" : "Faol"}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-sky-500" />
                    <span>Telegram Bot</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">✓ {lang === "ru" ? "Активen" : "Faol"}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    <span>YES POS</span>
                  </div>
                  <span className="text-[11px] text-slate-600 font-medium">{lang === "ru" ? "Синхронизировано" : "Ulangan"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // PRODUCTS LIST VIEW: CLEAN SHOPIFY TABLE
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
              {lang === "ru" ? "Товары" : "Mahsulotlar"}
            </h1>
            <span className="text-xs text-slate-500 font-normal">
              ({productsData?.total ?? rawProducts.length})
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            {lang === "ru"
              ? "Управление каталогом товаров, ценами и складскими остатками"
              : "Katalogdagi tovarlar, narxlar va qoldiqlar"}
          </p>
        </div>

        {canEditProduct && (
          <button
            type="button"
            data-testid="create-product-btn"
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === "ru" ? "Добавить товар" : "Yangi mahsulot"}</span>
          </button>
        )}
      </div>

      {/* Filter Card: Status Tabs, Search & Category */}
      <div className="bg-white dark:bg-[#18181B] rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-xs divide-y divide-slate-100 dark:divide-zinc-800">
        {/* Status Tabs */}
        <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-md transition-colors font-normal cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            {lang === "ru" ? "Все товары" : "Barchasi"} ({rawProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 rounded-md transition-colors font-normal cursor-pointer ${
              statusFilter === "active"
                ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            {lang === "ru" ? "В наличии" : "Sotuvda"}
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`px-3 py-1 rounded-md transition-colors font-normal cursor-pointer ${
              statusFilter === "draft"
                ? "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-medium"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
            }`}
          >
            {lang === "ru" ? "Стоп-лист" : "Stop-list"}
          </button>
        </div>

        {/* Search & Category Filter Row */}
        <div className="p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:max-w-md relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ru" ? "Поиск по названию или штрихкоду..." : "Mahsulot qidirish..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="w-full sm:w-48 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-slate-900"
            >
              <option value="">{lang === "ru" ? "Все категории" : "Barcha kategoriyalar"}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {getCategoryName(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clean Polaris Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 dark:bg-zinc-900 text-slate-500 font-medium border-b border-slate-200/80 dark:border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">{lang === "ru" ? "Товар" : "Tovar"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Категория" : "Kategoriya"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Цена" : "Narx"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Остаток" : "Qoldiq"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Статус" : "Holat"}</th>
                <th className="py-2.5 px-4 text-right">{lang === "ru" ? "Действия" : "Amallar"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 font-normal text-slate-700 dark:text-zinc-300">
              {products.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/75 dark:hover:bg-zinc-800/50 transition-colors ${
                    !p.is_active || p.stock === 0 ? "opacity-75" : ""
                  }`}
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    {p.primary_image_url ? (
                      <img
                        src={p.primary_image_url}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/static/images/placeholder.svg";
                        }}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 shrink-0 bg-white"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-zinc-700">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-900 dark:text-white truncate">
                          {getProductName(p)}
                        </span>
                        {p.is_yespos && (
                          <span className="text-[10px] font-normal px-1 py-0.2 rounded border border-slate-200 bg-slate-50 text-slate-600">
                            YES POS
                          </span>
                        )}
                        {(p as any).has_constructor && (
                          <Link
                            to="/constructor"
                            className="text-[10px] text-blue-600 hover:underline"
                            title={lang === "ru" ? "Конструктор" : "Konstruktor"}
                          >
                            [Конструктор]
                          </Link>
                        )}
                      </div>
                      {p.barcode && (
                        <div className="text-[11px] text-slate-400 font-mono">
                          #{p.barcode}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {p.category_name || "—"}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {Number(p.price).toLocaleString()} UZS
                    </div>
                    {p.old_price && (
                      <div className="text-[10px] text-slate-400 line-through">
                        {Number(p.old_price).toLocaleString()} UZS
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <span className={p.stock === 0 ? "text-rose-500 font-medium" : "text-slate-800 dark:text-zinc-200"}>
                      {p.stock} {p.unit || "dona"}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    {canEditProduct ? (
                      <button
                        type="button"
                        onClick={() => toggleStatusMutation.mutate({ id: p.id, is_active: !p.is_active })}
                        disabled={toggleStatusMutation.isPending}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                        <span>
                          {p.is_active
                            ? (lang === "ru" ? "В наличии" : "Sotuvda")
                            : (lang === "ru" ? "Стоп-лист" : "Stop-list")}
                        </span>
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border ${
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                        <span>
                          {p.is_active
                            ? (lang === "ru" ? "В наличии" : "Sotuvda")
                            : (lang === "ru" ? "Стоп-лист" : "Stop-list")}
                        </span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canEditProduct && (
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 transition-colors"
                          title={lang === "ru" ? "Редактировать" : "Tahrirlash"}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDeleteProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(lang === "ru" ? `Удалить товар "${p.name_ru || p.name_uz}"?` : `'${p.name_uz}' mahsulotini o'chirishni tasdiqlaysizmi?`)) {
                              deleteMutation.mutate(p.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          title={lang === "ru" ? "Удалить" : "O'chirish"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {products.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    {lang === "ru" ? "Товары не найдены" : "Mahsulotlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
