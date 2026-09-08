import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Gift, Globe, Plus } from "lucide-react";
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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t("customers_list_title") || "Mijozlar ro`yxati"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {customers.length} {t("customers_list_subtitle") || "ta faol mijozlar va sodiqlik dasturi"}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_customer_ph") || "Mijoz ismi yoki telefon..."}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold placeholder-slate-400 focus:outline-none focus:border-brand"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
        </div>
        <div className="text-xs font-bold text-slate-500">
          {t("total_label") || "Jami:"} <span className="text-slate-900 font-black">{customers.length} ta</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">{t("th_name") || "Ism"}</th>
                <th className="py-3.5 px-4">{t("th_phone") || "Telefon"}</th>
                <th className="py-3.5 px-4">{t("th_orders_qty") || "Buyurtmalar"}</th>
                <th className="py-3.5 px-4">{t("th_bonus") || "Bonus ball"}</th>
                <th className="py-3.5 px-4">{t("th_joined_date") || "Qo`shilgan sana"}</th>
                <th className="py-3.5 px-4 text-right">{t("th_actions") || "Harakat"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center">
                      {c.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div className="font-bold text-slate-900">{c.name}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{c.phone}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{c.orders_count} ta</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-black border border-amber-200 font-mono">
                      🎁 {c.bonus_balance} ball
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setBonusModalCustomer(c)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700"
                    >
                      {t("give_bonus") || "Ball berish"}
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
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-black text-base text-slate-900">🎁 Bonus ball berish</h3>
            <p className="text-xs text-slate-500">
              Mijoz: <b className="text-slate-800">{bonusModalCustomer.name}</b>
            </p>
            <input
              type="number"
              value={bonusPoints}
              onChange={(e) => setBonusPoints(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black focus:outline-none focus:border-brand"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-700"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => bonusMutation.mutate()}
                className="flex-1 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-xs"
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
