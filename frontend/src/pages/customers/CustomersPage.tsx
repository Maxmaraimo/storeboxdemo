import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Gift,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
  Plus,
  X,
  CreditCard,
  UserCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Customer } from "../../types";

export const CustomersPage: React.FC = () => {
  const { t, lang } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
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
      if (selectedCustomer && bonusModalCustomer?.id === selectedCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          bonus_balance: (selectedCustomer.bonus_balance || 0) + bonusPoints,
        });
      }
      setBonusModalCustomer(null);
    },
  });

  const customers = data?.customers || [];

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            {t("customers_list_title") || "Mijozlar"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {(t("customers_list_subtitle_format") || "{count} ta faol mijozlar va sodiqlik dasturi").replace(
              "{count}",
              String(customers.length)
            )}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search_customer_ph") || "Mijoz ismi yoki telefon raqami..."}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
          />
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="text-xs font-medium text-zinc-500">
          {(t("total_customers_format") || "Jami: {count} ta").replace("{count}", String(customers.length))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/75 text-zinc-500 font-medium border-b border-zinc-200/80">
              <tr>
                <th className="py-2.5 px-4">{t("th_name") || "Mijoz"}</th>
                <th className="py-2.5 px-4">{t("th_phone") || "Telefon"}</th>
                <th className="py-2.5 px-4">{t("th_orders_qty") || "Buyurtmalar"}</th>
                <th className="py-2.5 px-4">{t("th_bonus") || "Bonus ball"}</th>
                <th className="py-2.5 px-4">{t("th_joined_date") || "Qo'shilgan sana"}</th>
                <th className="py-2.5 px-4 text-right">{t("th_actions") || "Harakat"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal text-zinc-700">
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 font-bold text-xs flex items-center justify-center shrink-0 border border-zinc-200">
                      {c.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 group-hover:text-black">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-zinc-400">ID #{c.id}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-zinc-600 font-mono text-xs">{c.phone}</td>
                  <td className="py-3 px-4 font-semibold text-zinc-900">
                    <span className="inline-flex items-center gap-1">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                      {c.orders_count}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                      <Gift className="w-3 h-3 text-[#16A34A]" />
                      <span>{c.bonus_balance} {t("points_unit") || "ball"}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-zinc-500 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBonusModalCustomer(c);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-[11px] font-medium text-zinc-700 transition-colors cursor-pointer shadow-2xs"
                    >
                      {t("give_bonus_btn_short") || "Ball berish"}
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    {t("no_customers_found") || "Mijozlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER DETAIL DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-zinc-200 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {selectedCustomer.name?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-900 leading-tight">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Mijoz #{selectedCustomer.id} • {new Date(selectedCustomer.created_at).toLocaleDateString()} da qo'shilgan
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Buyurtmalar</span>
                    </div>
                    <div className="text-lg font-bold text-zinc-900 mt-1">
                      {selectedCustomer.orders_count} ta
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7]/30">
                    <div className="flex items-center gap-1.5 text-[#15803D] text-[11px] font-medium">
                      <Gift className="w-3.5 h-3.5 text-[#16A34A]" />
                      <span>Bonus ballar</span>
                    </div>
                    <div className="text-lg font-bold text-[#15803D] mt-1">
                      {selectedCustomer.bonus_balance} ball
                    </div>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="p-4 rounded-xl border border-zinc-200/80 bg-white space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                    Aloqa ma'lumotlari
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        Telefon:
                      </span>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="font-mono font-medium text-zinc-900 hover:text-blue-600"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                        Status:
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#15803D] font-medium text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                        Faol xaridor
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        Ro'yxatdan o'tgan:
                      </span>
                      <span className="text-zinc-700">
                        {new Date(selectedCustomer.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick actions card */}
                <div className="p-4 rounded-xl border border-zinc-200/80 bg-white space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider">
                    Tezkor amallar
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setBonusModalCustomer(selectedCustomer)}
                      className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-emerald-600" />
                        Bonus ball berish
                      </span>
                      <span className="text-zinc-400 text-xs">→</span>
                    </button>
                    <Link
                      to={`/orders`}
                      className="w-full py-2.5 px-3 rounded-lg border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 text-xs font-semibold text-zinc-800 transition-all flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-zinc-600" />
                        Buyurtmalar tarixiga o'tish
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BONUS MODAL */}
      {bonusModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-zinc-200 rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900">
                {t("bonus_modal_title") || "Bonus ball berish"}
              </h3>
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              {t("customer_label") || "Mijoz:"}{" "}
              <b className="text-zinc-900 font-semibold">{bonusModalCustomer.name}</b>
            </p>
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                Ball miqdori
              </label>
              <input
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 font-medium text-xs text-zinc-700 transition-colors cursor-pointer"
              >
                {t("btn_cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => bonusMutation.mutate()}
                disabled={bonusMutation.isPending}
                className="flex-1 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-medium text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {bonusMutation.isPending ? "Saqlanmoqda..." : t("give_bonus_btn") || "Berish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
