import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderTree, Store, Package, Plus, Edit2, Trash2, X, Check } from "lucide-react";
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
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormNameUz(cat.name_uz || "");
    setFormNameRu(cat.name_ru || "");
    setFormImage(cat.primary_image_url || "");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    setFormError("");
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
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rasm havolasi (URL)
                </label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
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
