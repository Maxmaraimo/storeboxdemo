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
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            {t("customers_list_title") || "Mijozlar ro'yxati"}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {customers.length} {t("customers_list_subtitle") || "ta faol mijozlar va sodiqlik dasturi"}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-2xl border border-black/[0.06] dark:border-white/10 p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_customer_ph") || "Mijoz ismi yoki telefon..."}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-100 dark:bg-white/5 border border-transparent dark:border-white/10 text-xs font-semibold text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-neutral-400"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
        </div>
        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
          {t("total_label") || "Jami:"} <span className="text-neutral-900 dark:text-white font-black">{customers.length} ta</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-3xl border border-black/[0.06] dark:border-white/10 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50/80 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 font-bold border-b border-black/[0.06] dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4">{t("th_name") || "Ism"}</th>
                <th className="py-3.5 px-4">{t("th_phone") || "Telefon"}</th>
                <th className="py-3.5 px-4">{t("th_orders_qty") || "Buyurtmalar"}</th>
                <th className="py-3.5 px-4">{t("th_bonus") || "Bonus ball"}</th>
                <th className="py-3.5 px-4">{t("th_joined_date") || "Qo'shilgan sana"}</th>
                <th className="py-3.5 px-4 text-right">{t("th_actions") || "Harakat"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/5 font-semibold text-neutral-700 dark:text-neutral-200">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50/60 dark:hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 text-neutral-800 dark:text-white font-black text-xs flex items-center justify-center shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-white">{c.name}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-600 dark:text-neutral-300">{c.phone}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-neutral-900 dark:text-white">{c.orders_count} ta</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-200 dark:border-amber-800/60 font-mono">
                      {c.bonus_balance} ball
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-neutral-400 font-mono text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setBonusModalCustomer(c)}
                      className="px-3 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      {t("give_bonus") || "Ball berish"}
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#18181b] border border-black/[0.06] dark:border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-neutral-900 dark:text-white">Bonus ball berish</h3>
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Mijoz: <b className="text-neutral-900 dark:text-white">{bonusModalCustomer.name}</b>
            </p>
            <input
              type="number"
              value={bonusPoints}
              onChange={(e) => setBonusPoints(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-black/[0.08] dark:border-white/10 text-sm font-black text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 font-bold text-xs text-neutral-700 dark:text-neutral-300 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => bonusMutation.mutate()}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs transition-colors"
              >
                Berish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
