import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Edit, Package, AlertCircle } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Product, Category } from "../../types";

export const ProductsPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");

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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

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
                <th className="py-3.5 px-4 text-right">{t("th_act") || "Harakat"}</th>
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
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Mahsulotni o`chirishni tasdiqlaysizmi?")) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
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
    </div>
  );
};
