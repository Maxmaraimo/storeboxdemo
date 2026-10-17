import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { BranchItem, StaffItem } from "../../types";

export interface OrderFilterValues {
  branch: string;
  courier: string;
  source: string;
  paymentStatus: string;
  paymentMethods: string[];
  deliveryMethods: string[];
}

export const DEFAULT_ORDER_FILTERS: OrderFilterValues = {
  branch: "all", courier: "ALL", source: "ALL", paymentStatus: "ALL", paymentMethods: [], deliveryMethods: [],
};

interface Props {
  value: OrderFilterValues;
  restrictedBranch?: BranchItem | null;
  onApply: (filters: OrderFilterValues) => void;
  onClose: () => void;
}

const selectClass = "min-h-9 w-full rounded-[9px] border border-[#e6e3eb] bg-[#f8f7fa] px-2.5 text-xs text-[#211b2e] focus:border-[#8b8497] focus:outline-2 focus:outline-offset-1 focus:outline-[#d8d1e2] disabled:opacity-60 dark:border-zinc-700 dark:bg-[#211b2e] dark:text-white";

export const OrderFilters: React.FC<Props> = ({ value, restrictedBranch, onApply, onClose }) => {
  const { store, lang } = useAuth();
  const [draft, setDraft] = useState(value);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const label = (ru: string, uz: string, en: string) => lang === "ru" ? ru : lang === "en" ? en : uz;
  const branches = useQuery({
    queryKey: ["order-filter-branches", store?.id],
    enabled: Boolean(store?.id) && !restrictedBranch,
    queryFn: async () => (await api.get("/branches/", { params: { store_id: store?.id } })).data as { branches: BranchItem[] },
    staleTime: 60_000,
  });
  const couriers = useQuery({
    queryKey: ["order-filter-couriers", store?.id],
    enabled: Boolean(store?.id),
    queryFn: async () => (await api.get("/couriers/", { params: { store_id: store?.id } })).data as { couriers: StaffItem[] },
    staleTime: 60_000,
  });

  useEffect(() => { headingRef.current?.focus(); }, []);

  const toggle = (key: "paymentMethods" | "deliveryMethods", code: string) => {
    setDraft(current => ({ ...current, [key]: current[key].includes(code)
      ? current[key].filter(value => value !== code) : [...current[key], code].sort() }));
  };
  const methodGroups = [
    {
      key: "paymentMethods" as const,
      title: label("Способ оплаты", "To'lov usuli", "Payment method"),
      options: [
        { code: "CASH", name: label("Наличные", "Naqd", "Cash") },
        { code: "TERMINAL", name: label("Картой через терминал", "Terminal orqali karta", "Card terminal") },
        { code: "CLICK", name: "Click" }, { code: "PAYME", name: "Payme" },
        { code: "UZUM", name: "Uzum Pay" }, { code: "MULTICARD", name: "Multicard" },
      ],
    },
    {
      key: "deliveryMethods" as const,
      title: label("Тип доставки", "Yetkazib berish turi", "Delivery type"),
      options: [
        { code: "COURIER", name: label("Доставка курьером", "Yetkazib berish", "Courier delivery") },
        { code: "PICKUP", name: label("Самовывоз", "Olib ketish", "Pickup") },
      ],
    },
  ];

  return (
    <form id="order-additional-filters" aria-label={label("Фильтры заказов", "Buyurtma filtrlari", "Order filters")}
      onSubmit={event => { event.preventDefault(); onApply(draft); }}
      className="absolute right-0 top-full z-50 mt-2 flex max-h-[min(680px,calc(100dvh-16rem))] w-[340px] max-w-[calc(100vw-4rem)] flex-col overflow-hidden rounded-[12px] border border-[#e6e3eb] bg-white text-[#494456] shadow-[0_14px_32px_rgba(33,27,46,0.18)] dark:border-zinc-700 dark:bg-[#30263f] dark:text-zinc-200">
      <div className="flex shrink-0 items-center justify-between border-b border-[#e6e3eb] px-4 py-3 dark:border-zinc-700">
        <h2 ref={headingRef} tabIndex={-1} className="text-sm font-semibold outline-none">{label("Фильтры", "Filtrlar", "Filters")}</h2>
        <button type="button" onClick={onClose} aria-label={label("Закрыть фильтры", "Filtrlarni yopish", "Close filters")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8b8497] hover:bg-[#f0edf4] dark:hover:bg-[#211b2e] cursor-pointer">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        <label className="grid gap-2 text-xs font-medium">
          <span>{label("Филиал", "Filial", "Branch")}</span>
          <select value={restrictedBranch ? String(restrictedBranch.id) : draft.branch}
            disabled={Boolean(restrictedBranch) || branches.isLoading || branches.isError}
            onChange={event => setDraft(current => ({ ...current, branch: event.target.value }))} className={selectClass}>
            {restrictedBranch ? <option value={restrictedBranch.id}>{restrictedBranch.name}</option> : <>
              <option value="all">{label("Все филиалы", "Barcha filiallar", "All branches")}</option>
              {branches.data?.branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </>}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-medium">
          <span>{label("Сотрудник (курьер)", "Xodim (kuryer)", "Employee (courier)")}</span>
          <select value={draft.courier} onChange={event => setDraft(current => ({ ...current, courier: event.target.value }))} className={selectClass}>
            <option value="ALL">{label("Все курьеры", "Barcha kuryerlar", "All couriers")}</option>
            <option value="unassigned">{label("Не назначен", "Biriktirilmagan", "Unassigned")}</option>
            {couriers.data?.couriers.map(courier => <option key={courier.id} value={courier.id}>{courier.name}{!courier.is_active ? label(" (неактивен)", " (faol emas)", " (inactive)") : ""}</option>)}
          </select>
        </label>
        {(branches.isLoading || couriers.isLoading) && <p role="status" className="text-xs text-[#8b8497]">{label("Загрузка списка…", "Ro'yxat yuklanmoqda…", "Loading options…")}</p>}
        {(branches.isError || couriers.isError) && <div role="alert" className="space-y-2 text-xs text-[#aa3e51] dark:text-[#f1a9b7]">
          <p>{label("Не удалось загрузить список", "Ro'yxatni yuklab bo'lmadi", "Unable to load options")}</p>
          <button type="button" className="underline underline-offset-2 cursor-pointer" onClick={() => { if (!restrictedBranch) void branches.refetch(); void couriers.refetch(); }}>{label("Повторить", "Qayta urinish", "Retry")}</button>
        </div>}
        {methodGroups.map(group => <fieldset key={group.key} className="space-y-2.5">
          <legend className="mb-3 text-xs font-medium">{group.title}</legend>
          {group.options.map(option => <label key={option.code} className="flex min-h-7 cursor-pointer items-center gap-2.5 text-xs">
            <input type="checkbox" checked={draft[group.key].includes(option.code)} onChange={() => toggle(group.key, option.code)}
              className="h-4 w-4 shrink-0 accent-[#211b2e] dark:accent-[#d8d1e2]" />
            <span>{option.name}</span>
          </label>)}
        </fieldset>)}
        <label className="grid gap-2 text-xs font-medium">
          <span>{label("Канал заказа", "Buyurtma kanali", "Order channel")}</span>
          <select value={draft.source} onChange={event => setDraft(current => ({ ...current, source: event.target.value }))} className={selectClass}>
            <option value="ALL">{label("Все каналы", "Barcha kanallar", "All channels")}</option>
            <option value="WEB">{label("Веб-сайт", "Veb-sayt", "Website")}</option>
            <option value="TMA">Telegram Mini App</option><option value="INSTAGRAM">Instagram</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs font-medium">
          <span>{label("Статус оплаты", "To'lov holati", "Payment status")}</span>
          <select value={draft.paymentStatus} onChange={event => setDraft(current => ({ ...current, paymentStatus: event.target.value }))} className={selectClass}>
            <option value="ALL">{label("Любой статус", "Barcha holatlar", "Any status")}</option>
            <option value="PENDING">{label("Ожидает оплаты", "To'lov kutilmoqda", "Pending")}</option>
            <option value="PAID">{label("Оплачено", "To'langan", "Paid")}</option>
            <option value="FAILED">{label("Ошибка оплаты", "To'lov xatosi", "Failed")}</option>
            <option value="REFUNDED">{label("Возврат", "Qaytarilgan", "Refunded")}</option>
          </select>
        </label>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-[#e6e3eb] p-3 dark:border-zinc-700">
        <button type="button" onClick={() => setDraft({ ...DEFAULT_ORDER_FILTERS, branch: restrictedBranch ? value.branch : "all" })}
          className="min-h-9 flex-1 rounded-[9px] border border-[#d8d1e2] text-xs font-medium hover:bg-[#f8f7fa] dark:border-zinc-600 dark:hover:bg-[#211b2e] cursor-pointer">
          {label("Сбросить", "Tozalash", "Reset")}
        </button>
        <button type="submit" className="min-h-9 flex-1 rounded-[9px] bg-[#211b2e] text-xs font-medium text-white hover:bg-[#151020] dark:bg-[#f0edf4] dark:text-[#211b2e] dark:hover:bg-white cursor-pointer">
          {label("Применить", "Qo'llash", "Apply")}
        </button>
      </div>
    </form>
  );
};
