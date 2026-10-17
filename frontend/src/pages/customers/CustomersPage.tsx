import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Gift,
  Phone,
  Calendar,
  ShoppingBag,
  ExternalLink,
  X,
  CreditCard,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { Customer } from "../../types";
import { PaginationMetadata } from "../../types/pagination";
import { TablePagination } from "../../components/ui/TablePagination";
import { useTablePagination } from "../../hooks/useTablePagination";

export const CustomersPage: React.FC = () => {
  const { t, lang, store } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const paginationScope = JSON.stringify([store?.id, search]);
  const { page, pageSize, setPage, setPageSize } = useTablePagination(paginationScope);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [bonusModalCustomer, setBonusModalCustomer] = useState<Customer | null>(null);
  const [bonusPoints, setBonusPoints] = useState(1000);
  const [customerNotes, setCustomerNotes] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("sb_customer_notes") || "{}");
    } catch {
      return {};
    }
  });
  const [noteSavedId, setNoteSavedId] = useState<number | null>(null);

  const saveCustomerNote = (customerId: number, text: string) => {
    const next = { ...customerNotes, [customerId]: text };
    setCustomerNotes(next);
    try {
      localStorage.setItem("sb_customer_notes", JSON.stringify(next));
    } catch {}
    setNoteSavedId(customerId);
    setTimeout(() => setNoteSavedId(null), 2000);
  };

  const { data, isLoading, isFetching, isPlaceholderData, isError } = useQuery({
    queryKey: ["customers", store?.id, paginationScope, page, pageSize],
    enabled: Boolean(store?.id),
    placeholderData: (previous, previousQuery) => previousQuery?.queryKey[2] === paginationScope ? previous : undefined,
    queryFn: async () => {
      const res = await api.get("/customers/", { params: { q: search, store_id: store?.id, page, page_size: pageSize } });
      return res.data as PaginationMetadata & { customers: Customer[] };
    },
  });

  useEffect(() => {
    if (data && !isPlaceholderData && data.page !== page) setPage(data.page);
  }, [data, isPlaceholderData, page, setPage]);

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
  const openBonusModal = (customer: Customer) => {
    bonusMutation.reset();
    setBonusModalCustomer(customer);
  };
  const secondaryButtonClass = "inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#d8d1e2] bg-white px-3 text-xs font-medium text-[#494456] transition-colors hover:bg-[#f7f4fa] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] disabled:opacity-40 dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-200 dark:hover:bg-[#30263f] cursor-pointer";
  const primaryButtonClass = "inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#211b2e] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#151020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] disabled:opacity-40 dark:bg-[#f0edf4] dark:text-[#211b2e] dark:hover:bg-white cursor-pointer";

  return (
    <div className="pb-12">
      <h1 className="sr-only">{t("customers_list_title") || "Mijozlar"}</h1>

      <div className="overflow-hidden rounded-[18px] border border-[#dfe5ef] bg-white shadow-[0_12px_34px_-18px_rgba(33,27,46,0.28)] dark:border-zinc-800 dark:bg-[#211b2e]">
        <div className="flex items-center border-b border-[#e6e3eb] px-4 py-3 dark:border-zinc-700">
          <div className="relative w-full sm:max-w-[380px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t("search_customer_ph") || "Mijoz ismi yoki telefon raqami"}
              placeholder={t("search_customer_ph") || "Mijoz ismi yoki telefon raqami..."}
              className="min-h-9 w-full rounded-[10px] border border-[#d8d1e2] bg-[#f8f7fa] pl-9 pr-3 text-xs text-[#211b2e] placeholder:text-[#9690a2] outline-none focus:border-[#8b8497] focus:ring-2 focus:ring-[#211b2e]/10 dark:border-zinc-700 dark:bg-[#191520] dark:text-zinc-100"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9690a2]" aria-hidden="true" />
          </div>
        </div>
        <div className="overflow-x-auto" aria-busy={isFetching}>
          <table className="w-full min-w-[1000px] border-collapse text-left text-[13px]">
            <thead className="border-b border-[#e6e3eb] bg-[#f8f7fa] text-xs text-[#81798f] dark:border-zinc-700 dark:bg-[#191520] dark:text-zinc-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">{t("th_name") || "Mijoz"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t("th_phone") || "Telefon"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{t("th_orders_qty") || "Buyurtmalar"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{lang === "ru" ? "Сумма покупок (LTV)" : lang === "en" ? "Total spent (LTV)" : "Xarid summasi (LTV)"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-medium">{t("th_bonus") || "Bonus ball"}</th>
                <th scope="col" className="whitespace-nowrap px-4 py-3 font-medium">{t("th_joined_date") || "Qo'shilgan sana"}</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">{t("th_actions") || "Harakat"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#efecf3] text-[#494456] dark:divide-zinc-800 dark:text-zinc-200">
              {customers.map((c) => {
                const ltv = Number(c.total_spent || 0);
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="cursor-pointer transition-colors hover:bg-[#faf9fc] dark:hover:bg-[#30263f]/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e6e3eb] bg-[#f8f7fa] text-xs font-medium text-[#81798f] dark:border-zinc-700 dark:bg-[#191520] dark:text-zinc-400">
                          {c.name?.charAt(0)?.toUpperCase() || "M"}
                        </div>
                        <div>
                          <button type="button" onClick={event => { event.stopPropagation(); setSelectedCustomer(c); }} className="block max-w-[220px] truncate rounded-sm text-left font-medium text-[#211b2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#211b2e] dark:text-zinc-100 cursor-pointer" title={c.name}>
                            {c.name}
                          </button>
                          <div className="mt-1 text-[11px] text-[#8b8497]">ID #{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#81798f] dark:text-zinc-400">{c.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{c.orders_count}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-[#211b2e] dark:text-zinc-100">
                      {ltv.toLocaleString("ru-RU")} {store?.currency || "UZS"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{c.bonus_balance.toLocaleString("ru-RU")}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#81798f] dark:text-zinc-400">
                      {new Date(c.created_at).toLocaleDateString(lang === "ru" ? "ru-RU" : lang === "en" ? "en-GB" : "uz-UZ")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBonusModal(c);
                        }}
                        className={secondaryButtonClass}
                      >
                        {t("give_bonus_btn_short") || "Ball berish"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {(isLoading || isError || customers.length === 0) && (
                <tr>
                  <td colSpan={7} role="status" className="px-4 py-12 text-center text-[#8b8497]">
                    {isLoading ? (lang === "ru" ? "Загрузка…" : lang === "en" ? "Loading…" : "Yuklanmoqda…")
                      : isError ? (lang === "ru" ? "Не удалось загрузить клиентов" : lang === "en" ? "Unable to load customers" : "Mijozlarni yuklab bo'lmadi")
                      : t("no_customers_found") || "Mijozlar topilmadi"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination total={data?.total ?? 0} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} busy={isFetching} />
      </div>

      {/* CUSTOMER DETAIL DRAWER */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#e1e3e5] animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-[#e1e3e5] flex items-center justify-between bg-[#f6f6f7]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#202223] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {selectedCustomer.name?.charAt(0)?.toUpperCase() || "M"}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#202223] leading-tight">
                      {selectedCustomer.name}
                    </h2>
                    <p className="text-[11px] text-[#6d7175] mt-0.5">
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
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-[10px] border border-[#e1e3e5] bg-[#f6f6f7]">
                    <div className="flex items-center gap-1.5 text-[#6d7175] text-[10px] font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#5c5f62]" />
                      <span>{lang === "ru" ? "Заказы" : "Buyurtma"}</span>
                    </div>
                    <div className="text-base font-bold text-[#202223] mt-1">
                      {selectedCustomer.orders_count}
                    </div>
                  </div>

                  <div className="p-3 rounded-[10px] border border-[#e1e3e5] bg-[#f6f6f7]">
                    <div className="flex items-center gap-1.5 text-[#6d7175] text-[10px] font-medium">
                      <CreditCard className="w-3.5 h-3.5 text-[#5c5f62]" />
                      <span>LTV</span>
                    </div>
                    <div className="text-xs font-bold text-[#202223] mt-1.5 font-mono truncate">
                      {Number((selectedCustomer as any).total_spent || 0).toLocaleString()} {store?.currency || "UZS"}
                    </div>
                  </div>

                  <div className="p-3 rounded-[10px] border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center gap-1.5 text-[#008060] text-[10px] font-medium">
                      <Gift className="w-3.5 h-3.5 text-[#008060]" />
                      <span>{lang === "ru" ? "Бонусы" : "Bonus"}</span>
                    </div>
                    <div className="text-base font-bold text-[#008060] mt-1">
                      {selectedCustomer.bonus_balance}
                    </div>
                  </div>
                </div>

                {/* Contact Card */}
                <div className="p-4 rounded-[10px] border border-[#e1e3e5] bg-white space-y-3">
                  <h3 className="text-xs font-semibold text-[#202223] uppercase tracking-wider">
                    {lang === "ru" ? "Контактная информация" : "Aloqa ma'lumotlari"}
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" />
                        Telefon:
                      </span>
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="font-mono font-medium text-zinc-900 hover:text-[#008060]"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                        Status:
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#008060] font-medium text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-[#008060]" />
                        {lang === "ru" ? "Активный покупатель" : "Faol xaridor"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        {lang === "ru" ? "Дата регистрации:" : "Ro'yxatdan o'tgan:"}
                      </span>
                      <span className="text-zinc-700">
                        {new Date(selectedCustomer.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manager Notes Card */}
                <div className="p-4 rounded-[10px] border border-[#e1e3e5] bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#202223] uppercase tracking-wider">
                      {lang === "ru" ? "Заметки менеджера" : "Menejer eslatmalari"}
                    </h3>
                    {noteSavedId === selectedCustomer.id && (
                      <span className="text-[11px] font-medium text-[#008060]">
                        ✓ {lang === "ru" ? "Сохранено" : "Saqlandi"}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={customerNotes[selectedCustomer.id] || ""}
                    onChange={(e) =>
                      setCustomerNotes({
                        ...customerNotes,
                        [selectedCustomer.id]: e.target.value,
                      })
                    }
                    placeholder={
                      lang === "ru"
                        ? "VIP клиент, предпочитает доставку после 18:00..."
                        : "VIP mijoz, yetkazib berish vaqti va maxsus istaklar..."
                    }
                    className="w-full p-2.5 rounded-[8px] bg-[#f6f6f7] border border-[#e1e3e5] text-xs text-[#202223] focus:outline-none focus:border-[#008060]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      saveCustomerNote(
                        selectedCustomer.id,
                        customerNotes[selectedCustomer.id] || ""
                      )
                    }
                    className="px-3 py-1.5 rounded-[8px] bg-[#008060] hover:bg-[#006e52] text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    {lang === "ru" ? "Сохранить заметку" : "Eslatmani saqlash"}
                  </button>
                </div>

                {/* Quick actions card */}
                <div className="p-4 rounded-[10px] border border-[#e1e3e5] bg-white space-y-3">
                  <h3 className="text-xs font-semibold text-[#202223] uppercase tracking-wider">
                    {lang === "ru" ? "Быстрые действия" : "Tezkor amallar"}
                  </h3>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openBonusModal(selectedCustomer)}
                      className="w-full py-2.5 px-3 rounded-[8px] border border-[#e1e3e5] hover:border-[#202223] hover:bg-[#f6f6f7] text-xs font-semibold text-[#202223] transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#008060]" />
                        {lang === "ru" ? "Начислить бонусные баллы" : "Bonus ball berish"}
                      </span>
                      <span className="text-zinc-400 text-xs">→</span>
                    </button>
                    <Link
                      to={`/orders`}
                      className="w-full py-2.5 px-3 rounded-[8px] border border-[#e1e3e5] hover:border-[#202223] hover:bg-[#f6f6f7] text-xs font-semibold text-[#202223] transition-all flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-zinc-600" />
                        {lang === "ru" ? "Перейти к истории заказов" : "Buyurtmalar tarixiga o'tish"}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#e1e3e5] bg-[#f6f6f7] flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-2 rounded-[8px] bg-[#202223] hover:bg-[#111213] text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {lang === "ru" ? "Закрыть" : "Yopish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BONUS MODAL */}
      {bonusModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="customer-bonus-title" className="max-h-[calc(100dvh-2rem)] w-full max-w-sm space-y-4 overflow-y-auto rounded-[18px] border border-[#dfe5ef] bg-white p-5 text-[#211b2e] shadow-xl dark:border-zinc-700 dark:bg-[#211b2e] dark:text-zinc-100">
            <div className="flex items-center justify-between">
              <h3 id="customer-bonus-title" className="text-sm font-semibold">
                {t("bonus_modal_title") || "Bonus ball berish"}
              </h3>
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                aria-label={lang === "ru" ? "Закрыть" : lang === "en" ? "Close" : "Yopish"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#8b8497] hover:bg-[#f0edf4] dark:hover:bg-[#30263f] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#81798f] dark:text-zinc-400">
              {t("customer_label") || "Mijoz:"}{" "}
              <span className="font-medium text-[#211b2e] dark:text-zinc-100">{bonusModalCustomer.name}</span>
            </p>
            <div>
              <label htmlFor="customer-bonus-amount" className="mb-1.5 block text-xs font-medium">
                {lang === "ru" ? "Количество баллов" : lang === "en" ? "Points" : "Ball miqdori"}
              </label>
              <input
                id="customer-bonus-amount"
                type="number"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(Number(e.target.value))}
                className="min-h-9 w-full rounded-[10px] border border-[#d8d1e2] bg-[#f8f7fa] px-3 text-[13px] tabular-nums outline-none focus:border-[#8b8497] focus:ring-2 focus:ring-[#211b2e]/10 dark:border-zinc-700 dark:bg-[#191520]"
              />
            </div>
            {bonusMutation.isError && <p role="alert" className="text-xs text-[#aa3e51] dark:text-[#f1a9b7]">{lang === "ru" ? "Не удалось сохранить. Попробуйте ещё раз." : lang === "en" ? "Unable to save. Please try again." : "Saqlab bo'lmadi. Qayta urinib ko'ring."}</p>}
            <div className="flex gap-2 border-t border-[#e6e3eb] pt-4 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setBonusModalCustomer(null)}
                className={`${secondaryButtonClass} flex-1`}
              >
                {t("btn_cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => bonusMutation.mutate()}
                disabled={bonusMutation.isPending}
                className={`${primaryButtonClass} flex-1`}
              >
                {bonusMutation.isPending ? (lang === "ru" ? "Сохранение…" : lang === "en" ? "Saving…" : "Saqlanmoqda…") : t("give_bonus_btn") || "Berish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
