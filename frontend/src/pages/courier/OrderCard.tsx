import React from 'react';
import {
  MapPin,
  Phone,
  Navigation,
  CheckCircle,
  PackageCheck,
  CreditCard,
  Banknote,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { CourierOrder, Language } from './types';
import { formatMoney } from './geoUtils';

interface OrderCardProps {
  order: CourierOrder;
  lang: Language;
  onTakeOrder?: (orderId: number) => void;
  onOpenNavigator?: (order: CourierOrder) => void;
  isTaking?: boolean;
}

const TEXTS: Record<Language, Record<string, string>> = {
  uz: {
    take_order: "Buyurtmani olish",
    start_route: "В путь (Xarita)",
    delivered: "Yetkazib berilgan",
    cash: "Naqd",
    paid: "To'langan",
    call: "Qo'ng'iroq",
    items_count: "ta tovar",
  },
  ru: {
    take_order: "Взять заказ",
    start_route: "В путь (Навигатор)",
    delivered: "Доставлен",
    cash: "Наличные",
    paid: "Оплачено",
    call: "Позвонить",
    items_count: "товаров",
  },
  en: {
    take_order: "Accept Order",
    start_route: "Navigate (Map)",
    delivered: "Delivered",
    cash: "Cash",
    paid: "Paid",
    call: "Call",
    items_count: "items",
  },
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  lang,
  onTakeOrder,
  onOpenNavigator,
  isTaking,
}) => {
  const t = TEXTS[lang] || TEXTS.ru;
  const isReady = order.status === 'READY' || order.status === 'PENDING';
  const isInDelivery = order.status === 'IN_DELIVERY';
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="bg-white dark:bg-[#141417] border border-slate-200/80 dark:border-neutral-800 rounded-2xl p-3.5 shadow-xs hover:shadow-sm transition-all duration-150 space-y-3">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            #{order.order_number}
          </span>
          {order.time_ago && (
            <span className="text-[11px] text-slate-400 dark:text-neutral-500">
              {order.time_ago}
            </span>
          )}
        </div>

        {/* Status Badge */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle className="w-3 h-3" />
            <span>{t.delivered}</span>
          </span>
        ) : isInDelivery ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 animate-pulse">
            <Navigation className="w-3 h-3 transform rotate-45" />
            <span>Yetkazilmoqda</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60">
            <PackageCheck className="w-3 h-3" />
            <span>Tayyor</span>
          </span>
        )}
      </div>

      {/* Customer & Address Details */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 line-clamp-2 leading-snug">
            {order.delivery_address || 'Manzil ko\'rsatilmagan'}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pl-6">
          <span className="font-medium text-slate-700 dark:text-neutral-300">
            {order.customer_name}
          </span>
          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
              <span>{order.customer_phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Payment & Items Meta Row */}
      <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-neutral-400">
          {order.payment_method === 'CASH' ? (
            <Banknote className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
          )}
          <span className="text-[11px]">
            {order.payment_method === 'CASH' ? t.cash : t.paid}
          </span>
          <span>•</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {formatMoney(order.total_amount)}
          </span>
        </div>

        {order.items && order.items.length > 0 && (
          <span className="text-[11px] text-slate-400 dark:text-neutral-500">
            {order.items.length} {t.items_count}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {!isCompleted && (
        <div className="pt-1">
          {isReady && onTakeOrder && (
            <button
              onClick={() => onTakeOrder(order.id)}
              disabled={isTaking}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors active:scale-[0.98] disabled:opacity-60"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>{t.take_order}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}

          {isInDelivery && onOpenNavigator && (
            <button
              onClick={() => onOpenNavigator(order)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-all active:scale-[0.98]"
            >
              <Navigation className="w-3.5 h-3.5 transform rotate-45" />
              <span>{t.start_route}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
