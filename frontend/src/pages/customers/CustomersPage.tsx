import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Gift, Globe, Plus, X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Customer } from "../../types";

export const CustomersPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [bonusModalCustomer, setBonusModalCustomer] = useState<Customer | null>(null);
  const [bonusPoints, setBonusPoints] = useState(1000);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: async () => {
      const res = await api.get(`/customers/?q=${encodeURIComponent(search)}`);
      return res.data as { customers: Customer[]; total: number };
    },
  });

  const bonusMutation = useMutation({
    mutationFn: async () => {
      if (!bonusModalCustomer) return;
      await api.post("/customers/adjust-bonus/", {
        customer_id: bonusModalCustomer.id,
        points: bonusPoints,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setBonusModalCustomer(null);
    },
  });

  const customers = data?.customers || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {t("customers_list_title") || "Mijozlar ro'yxati"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {(t("customers_list_subtitle_format") || "{count} ta faol mijozlar va sodiqlik dasturi").replace("{count}", String(customers.length))}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-slate-200/80 dark:border-white/10 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_customer_ph") || "Mijoz ismi yoki telefon..."}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-normal text-slate-900 dark:text-neutral-100 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
        <div className="text-xs font-medium text-slate-500 dark:text-neutral-400">
          {(t("total_customers_format") || "Jami: {count} ta").replace("{count}", String(customers.length))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-[#18181b] rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-neutral-400 font-medium border-b border-slate-200/80 dark:border-white/10 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{t("th_name") || "Ism"}</th>
                <th className="py-3 px-4">{t("th_phone") || "Telefon"}</th>
                <th className="py-3 px-4">{t("th_orders_qty") || "Buyurtmalar"}</th>
                <th className="py-3 px-4">{t("th_bonus") || "Bonus ball"}</th>
                <th className="py-3 px-4">{t("th_joined_date") || "Qo'shilgan sana"}</th>
                <th className="py-3 px-4 text-right">{t("th_actions") || "Harakat"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-normal text-slate-700 dark:text-neutral-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white font-medium text-xs flex items-center justify-center shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-neutral-300">{c.phone}</td>
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{c.orders_count}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                      {c.bonus_balance} {t("points_unit") || "ball"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setBonusModalCustomer(c)}
                      className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-[11px] font-medium text-slate-700 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      {t("give_bonus_btn_short") || "Ball berish"}
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    {t("no_customers_found") || "Mijozlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BONUS MODAL */}
      {bonusModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/10 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                {t("bonus_modal_title") || "Bonus ball berish"}
              </h3>
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              {t("customer_label") || "Mijoz:"} <b className="text-slate-900 dark:text-white font-medium">{bonusModalCustomer.name}</b>
            </p>
            <input
              type="number"
              value={bonusPoints}
              onChange={(e) => setBonusPoints(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 font-medium text-xs text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer"
              >
                {t("btn_cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => bonusMutation.mutate()}
                className="flex-1 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-medium text-xs transition-colors cursor-pointer shadow-2xs"
              >
                {t("give_bonus_btn") || "Berish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
