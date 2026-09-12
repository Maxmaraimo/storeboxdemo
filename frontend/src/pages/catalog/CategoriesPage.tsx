import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderTree, Store, Package, Plus, Edit2, Trash2, X, Check, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Category } from "../../types";

export const CategoriesPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formNameUz, setFormNameUz] = useState("");
  const [formNameRu, setFormNameRu] = useState("");
  const [formImage, setFormImage] = useState("");
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
      if (editingCategory) {
        formData.append("category_id", String(editingCategory.id));
      }
      const res = await api.post("/categories/upload-image/", formData, {
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

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return res.data as { categories: Category[]; total: number };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formNameUz.trim()) {
        throw new Error("Kategoriya nomini kiriting");
      }
      const payload: any = {
        name_uz: formNameUz.trim(),
        name_ru: formNameRu.trim() || formNameUz.trim(),
      };
      if (formImage.trim()) {
        payload.primary_image_url = formImage.trim();
      }

      if (editingCategory) {
        return (await api.patch(`/categories/${editingCategory.id}/`, payload)).data;
      } else {
        return (await api.post("/categories/", payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setFormError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/categories/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/categories/${id}/toggle-active/`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormNameUz("");
    setFormNameRu("");
    setFormImage("");
    setFormError("");
    setUploadingImage(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormNameUz(cat.name_uz || "");
    setFormNameRu(cat.name_ru || "");
    setFormImage(cat.primary_image_url || "");
    setFormError("");
    setUploadingImage(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormError("");
    setUploadingImage(false);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const categories = data?.categories || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t("categories_list_title") || "Kategoriyalar ro`yxati"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("categories_list_subtitle") || "Katalog mahsulotlarini bo`limlar bo`yicha ajratish"}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi kategoriya</span>
        </button>
      </div>

      {/* BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-950">
              {t("category_visibility_banner") || "Saytda qaysi kategoriyalar ko`rinishini boshqaring"}
            </h4>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              {t("category_visibility_desc") || "«Saytda ko`rsatish» tugmasi orqali kategoriyani bir zumda saytga qo`shishingiz mumkin"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
            {t("total_categories") || "Jami:"} <b className="font-mono text-emerald-600">{categories.length}</b> {t("categories_unit") || "ta kategoriya"}
          </span>
        </div>
      </div>

      {/* CATEGORIES TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-16">{t("th_cat_image") || "Rasm"}</th>
                <th className="py-3.5 px-4">{t("th_cat_name") || "Kategoriya nomi"}</th>
                <th className="py-3.5 px-4">{t("th_cat_products") || "Tovarlar"}</th>
                <th className="py-3.5 px-4 text-center">{t("th_show_on_site") || "Saytda ko`rsatish"}</th>
                <th className="py-3.5 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    {cat.primary_image_url ? (
                      <img src={cat.primary_image_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <FolderTree className="w-5 h-5" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-sm">{cat.name_uz || cat.name_ru}</div>
                    <div className="text-[10px] text-slate-400 font-mono">/{cat.slug}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-mono font-bold">
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      {cat.active_products_count} {t("products_count_unit") || "ta tovar"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => toggleActiveMutation.mutate(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                        cat.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {cat.is_active ? t("cat_active") || "Saytda faol" : t("cat_inactive") || "Yashiringan"}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`'${cat.name_uz}' kategoriyasini o'chirishni tasdiqlaysizmi?`)) {
                            deleteMutation.mutate(cat.id);
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
              {categories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Kategoriyalar mavjud emas. Yuqoridagi "Yangi kategoriya" tugmasi orqali qo'shing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya qo'shish"}
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
                  Kategoriya nomi (O'zbekcha) *
                </label>
                <input
                  type="text"
                  value={formNameUz}
                  onChange={(e) => setFormNameUz(e.target.value)}
                  placeholder="Masalan: Pitsalar, Ichimliklar, Kiyimlar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kategoriya nomi (Ruscha)
                </label>
                <input
                  type="text"
                  value={formNameRu}
                  onChange={(e) => setFormNameRu(e.target.value)}
                  placeholder="Например: Пиццы, Напитки"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand" />
                    <span>Kategoriya rasmi</span>
                    <span className="text-[10px] text-slate-400 font-normal">(1:1 yoki 4:3 proporsiya tavsiya etiladi)</span>
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
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 group">
                      <img
                        src={formImage}
                        alt="Kategoriya rasmi"
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
                      <p className="text-[11px] text-slate-400 mb-2">
                        Boshqa rasm yuklash uchun tugmani bosing
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
