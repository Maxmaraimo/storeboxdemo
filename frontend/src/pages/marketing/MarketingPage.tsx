import React, { useState } from "react";
import {
  Megaphone,
  Send,
  Tag,
  Sparkles,
  Users,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  Plus,
  Zap,
  BarChart3,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotification } from "../../context/NotificationContext";
import { Link } from "react-router-dom";

interface CampaignItem {
  id: string;
  name: string;
  channel: string;
  segment: string;
  sentCount: number;
  openRate: string;
  sales: string;
  status: "active" | "completed";
  date: string;
}

export const MarketingPage: React.FC = () => {
  const { store, lang } = useAuth();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<"broadcast" | "automations" | "campaigns">("broadcast");
  const [campaignTitle, setCampaignTitle] = useState("🔥 Весенняя распродажа -20% на всё меню и коллекцию!");
  const [segment, setSegment] = useState("Все подписчики Telegram-бота (1 240 чел.)");
  const [btnLabel, setBtnLabel] = useState("🛍️ Открыть каталог со скидкой");
  const [promoBadge, setPromoBadge] = useState("ПРОМОКОД: VESNA20");
  const [messageText, setMessageText] = useState(
    "Привет! В нашем магазине стартовала закрытая акция для подписчиков Telegram.\n\nЗакажите любые позиции сегодня и получите скидку 20% по промокоду VESNA20 + бесплатную доставку по Ташкенту!"
  );

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([
    {
      id: "cmp-1",
      name: "Акция выходного дня в Telegram Mini App",
      channel: "Telegram Bot Push",
      segment: "Все клиенты",
      sentCount: 1180,
      openRate: "68.4%",
      sales: "2 450 000 UZS",
      status: "completed",
      date: "Вчера, 18:00",
    },
    {
      id: "cmp-2",
      name: "Возврат брошенных корзин (Автоматизация)",
      channel: "Telegram + SMS",
      segment: "Незавершенные заказы",
      sentCount: 84,
      openRate: "81.0%",
      sales: "1 120 000 UZS",
      status: "active",
      date: "Активно 24/7",
    },
    {
      id: "cmp-3",
      name: "Анонс новой коллекции • Скидка 15%",
      channel: "Telegram Bot Push",
      segment: "VIP покупатели",
      sentCount: 310,
      openRate: "74.2%",
      sales: "1 890 000 UZS",
      status: "completed",
      date: "3 дня назад",
    },
  ]);

  const [automations, setAutomations] = useState([
    {
      id: "auto-1",
      title: "Возврат незавершенных оформлений (Abandoned Checkout)",
      desc: "Автоматически отправляет напоминание в Telegram через 30 минут, если клиент оставил товары в корзине.",
      conversion: "14.2% конверсия",
      enabled: true,
    },
    {
      id: "auto-2",
      title: "Приветственный бонус за первый заказ",
      desc: "Отправляет купон на скидку 10% новым подписчикам Telegram-бота сразу после нажатия /start.",
      conversion: "22.8% конверсия",
      enabled: true,
    },
    {
      id: "auto-3",
      title: "Реактивация спящих клиентов (30 дней без покупок)",
      desc: "Персональное предложение клиентам, которые не делали заказы более месяца.",
      conversion: "8.5% конверсия",
      enabled: false,
    },
  ]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newCmp: CampaignItem = {
      id: "cmp-" + Date.now(),
      name: campaignTitle.trim() || "Telegram рассылка",
      channel: "Telegram Bot Push",
      segment: segment.split("(")[0].trim(),
      sentCount: 1240,
      openRate: "72.0%",
      sales: "0 UZS (только запущено)",
      status: "active",
      date: "Только что",
    };
    setCampaigns([newCmp, ...campaigns]);
    notify("Маркетинговая рассылка успешно отправлена подписчикам Telegram-бота!", "success");
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Shopify Marketing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#202223] dark:text-white" />
            <h1 className="text-xl font-bold text-[#202223] dark:text-white tracking-tight">
              {lang === "uz" ? "Marketing va kampaniyalar" : "Маркетинг и рассылки"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#bbf7d0] text-[#14532d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
              Активно
            </span>
          </div>
          <p className="text-xs text-[#6d7175] mt-0.5">
            Push-рассылки в Telegram-боте, автоматический возврат брошенных корзин и рекламные кампании
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/discounts"
            className="px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#202223] dark:text-zinc-200 hover:bg-[#f6f6f7] text-xs font-medium inline-flex items-center gap-1.5 transition"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Управление скидками</span>
          </Link>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("storebox:open-sidekick", {
                  detail: { prompt: "/banner Скидка 20% на новую коллекцию" },
                })
              )
            }
            className="px-3.5 py-2 rounded-[8px] bg-[#202223] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#c8ff6a]" />
            <span>Создать AI-баннер</span>
          </button>
        </div>
      </div>

      {/* 2. Shopify Marketing KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs">
          <div className="text-xs text-[#6d7175]">Продажи от маркетинга</div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-1 tabular-nums">
            5 460 000 UZS
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-1">+18.4% за 30 дней</div>
        </div>
        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs">
          <div className="text-xs text-[#6d7175]">Охват подписчиков Telegram</div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-1 tabular-nums">
            1 240 чел.
          </div>
          <div className="text-[11px] text-[#6d7175] mt-1">98.2% доставляемость Push</div>
        </div>
        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs">
          <div className="text-xs text-[#6d7175]">Открываемость (Open Rate)</div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-1 tabular-nums">
            71.8%
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">В 3 раза выше Email</div>
        </div>
        <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs">
          <div className="text-xs text-[#6d7175]">Возвращено корзин</div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-1 tabular-nums">
            14 заказов
          </div>
          <div className="text-[11px] text-[#6d7175] mt-1">Через авто-напоминания</div>
        </div>
      </div>

      {/* 3. Main 2-Column Content (Zero empty space!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 cols): Broadcast Builder, Automations, Campaigns Table */}
        <div className="lg:col-span-7 space-y-5">
          {/* Sub-tabs */}
          <div className="inline-flex rounded-[10px] border border-[#e1e3e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("broadcast")}
              className={`px-3.5 py-1.5 rounded-[7px] transition cursor-pointer ${
                activeTab === "broadcast"
                  ? "bg-[#202223] text-white"
                  : "text-[#5c5f62] hover:text-[#202223]"
              }`}
            >
              Telegram Push-рассылка
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("automations")}
              className={`px-3.5 py-1.5 rounded-[7px] transition cursor-pointer ${
                activeTab === "automations"
                  ? "bg-[#202223] text-white"
                  : "text-[#5c5f62] hover:text-[#202223]"
              }`}
            >
              Автоматизации (3)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("campaigns")}
              className={`px-3.5 py-1.5 rounded-[7px] transition cursor-pointer ${
                activeTab === "campaigns"
                  ? "bg-[#202223] text-white"
                  : "text-[#5c5f62] hover:text-[#202223]"
              }`}
            >
              История кампаний ({campaigns.length})
            </button>
          </div>

          {activeTab === "broadcast" && (
            <form
              onSubmit={handleSendBroadcast}
              className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 p-5 sm:p-6 shadow-2xs space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#202223] dark:text-white">
                    Конструктор рассылки в Telegram Mini App
                  </h2>
                  <p className="text-[11px] text-[#6d7175] mt-0.5">
                    Сообщение мгновенно придет клиентам в бот с кнопкой перехода в каталог
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignTitle("🎁 Только сегодня: Скидка 25% + Бесплатная доставка!");
                    setPromoBadge("ПРОМОКОД: VIP25");
                    setMessageText(
                      `Специальное предложение для клиентов «${
                        store?.name || "StoreBox"
                      }»!\n\nОформите заказ сегодня через наш Telegram Mini App и активируйте промокод VIP25 на скидку 25%. Количество товаров по акции ограничено!`
                    );
                    notify("Текст акции сгенерирован ИИ-помощником", "success");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#f6f6f7] hover:bg-[#ebebed] text-[#202223] font-semibold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Сгенерировать текст с ИИ</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Заголовок кампании
                  </label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:border-[#202223]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Сегмент получателей
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="Все подписчики Telegram-бота (1 240 чел.)">
                      Все подписчики Telegram-бота (1 240 чел.)
                    </option>
                    <option value="VIP покупатели • > 3 заказов (185 чел.)">
                      VIP покупатели • &gt; 3 заказов (185 чел.)
                    </option>
                    <option value="Брошенные корзины за 7 дней (42 чел.)">
                      Брошенные корзины за 7 дней (42 чел.)
                    </option>
                    <option value="Ташкент и Ташкентская область (890 чел.)">
                      Ташкент и Ташкентская область (890 чел.)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                  Текст сообщения (поддерживаются эмодзи и форматирование)
                </label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-[#fbfbfc] dark:bg-zinc-900 text-xs leading-relaxed focus:outline-none focus:bg-white focus:border-[#202223]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Промо-бейдж на баннере
                  </label>
                  <input
                    type="text"
                    value={promoBadge}
                    onChange={(e) => setPromoBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:border-[#202223]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1">
                    Текст инлайн-кнопки под постом
                  </label>
                  <input
                    type="text"
                    value={btnLabel}
                    onChange={(e) => setBtnLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:border-[#202223]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#6d7175]">
                  Будет отправлено мгновенно без спам-блокировок
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-[8px] bg-[#202223] hover:bg-black text-white font-semibold text-xs inline-flex items-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить рассылку сейчас</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === "automations" && (
            <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 divide-y divide-[#f1f2f4] dark:divide-zinc-800 shadow-2xs">
              {automations.map((auto) => (
                <div key={auto.id} className="p-5 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#202223] dark:text-white">
                        {auto.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#bbf7d0] text-[#14532d] text-[10px] font-bold">
                        {auto.conversion}
                      </span>
                    </div>
                    <p className="text-xs text-[#6d7175] leading-relaxed">{auto.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutomations((prev) =>
                        prev.map((a) => (a.id === auto.id ? { ...a, enabled: !a.enabled } : a))
                      );
                      notify("Статус маркетинговой автоматизации обновлен", "success");
                    }}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold shrink-0 cursor-pointer transition ${
                      auto.enabled
                        ? "bg-[#202223] text-white"
                        : "bg-[#f6f6f7] text-[#5c5f62] border border-[#d2d5d8]"
                    }`}
                  >
                    {auto.enabled ? "Включено" : "Включить"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Campaigns Table (always visible below or in tab) */}
          <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#e1e3e5] dark:border-zinc-800 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#202223] dark:text-white">
                Последние маркетинговые кампании
              </h3>
              <span className="text-[11px] text-[#6d7175]">Канал: Telegram & Web</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f6f6f7] dark:bg-zinc-900 text-[#6d7175] text-[11px] font-semibold border-b border-[#e3e5e7] dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Кампания</th>
                    <th className="py-2.5 px-4">Сегмент</th>
                    <th className="py-2.5 px-4">Охват / Open Rate</th>
                    <th className="py-2.5 px-4">Выручка</th>
                    <th className="py-2.5 px-4 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f2f4] dark:divide-zinc-800 text-[#202223] dark:text-zinc-200">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f6f6f7]/60">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-[10px] text-[#6d7175]">{c.date}</div>
                      </td>
                      <td className="py-3 px-4 text-[#6d7175]">{c.segment}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{c.sentCount}</span>{" "}
                        <span className="text-emerald-600 font-bold">({c.openRate})</span>
                      </td>
                      <td className="py-3 px-4 font-bold tabular-nums">{c.sales}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#bbf7d0] text-[#14532d]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
                          {c.status === "active" ? "Активно" : "Завершено"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Live iPhone Telegram Push Broadcast Preview */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-white dark:bg-[#18181B] rounded-[14px] border border-[#e1e3e5] dark:border-zinc-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#202223] dark:text-white flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#0088cc]" />
                  <span>Предпросмотр рассылки на смартфоне клиента</span>
                </h3>
                <p className="text-[11px] text-[#6d7175] mt-0.5">
                  Обновляется в реальном времени при вводе текста
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#bbf7d0] text-[#14532d] text-[10px] font-bold">
                Live
              </span>
            </div>

            <div className="mx-auto w-full max-w-[310px] rounded-[32px] border-[7px] border-[#141416] bg-[#dbe7f0] shadow-xl overflow-hidden">
              {/* Telegram Top Bar */}
              <div className="bg-[#517da2] text-white px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#141416] text-[#c8ff6a] flex items-center justify-center font-bold text-[11px]">
                    {(store?.name || "SB").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{store?.name || "StoreBox"}</div>
                    <div className="text-[9px] text-sky-100">официальный бот магазина</div>
                  </div>
                </div>
              </div>

              {/* Message Post Preview */}
              <div className="p-3.5 space-y-2.5">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-white">
                  {/* Promo Banner Header */}
                  <div className="h-28 bg-gradient-to-br from-[#141416] via-[#202223] to-[#065f46] p-3.5 flex flex-col justify-between text-white">
                    <span className="self-start px-2 py-0.5 rounded-md bg-[#c8ff6a] text-[#141416] text-[9px] font-extrabold uppercase tracking-wider">
                      {promoBadge || "СПЕЦПРЕДЛОЖЕНИЕ"}
                    </span>
                    <div className="text-xs font-bold leading-snug line-clamp-2">
                      {campaignTitle}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-3 text-[11.5px] text-[#202223] whitespace-pre-line leading-relaxed">
                    {messageText}
                    <div className="text-[9px] text-slate-400 text-right mt-1.5">
                      15:00 • Просмотрено
                    </div>
                  </div>
                </div>

                {/* Telegram Inline WebApp CTA Button */}
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl bg-[#517da2]/90 hover:bg-[#517da2] text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{btnLabel || "🛍️ Открыть магазин"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
