import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderTree, Store, Package, Check, Eye } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Category } from "../../types";

export const CategoriesPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get("/categories/");
      return res.data as { categories: Category[]; total: number };
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
