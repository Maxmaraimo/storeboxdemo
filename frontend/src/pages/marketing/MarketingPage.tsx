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
  Zap,
  Clock,
  Eye,
  ArrowUpRight,
  Gift,
  Flame,
  BellRing,
  CheckCheck,
  Wifi,
  BatteryFull,
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

const BANNER_THEMES = [
  {
    id: "ocean",
    label: "Shopify Blue",
    gradient: "from-[#005bd3] via-[#0284c7] to-[#0ea5e9]",
    badgeBg: "bg-white text-[#005bd3]",
  },
  {
    id: "emerald",
    label: "Emerald Fresh",
    gradient: "from-[#065f46] via-[#059669] to-[#10b981]",
    badgeBg: "bg-[#ecfdf5] text-[#047857]",
  },
  {
    id: "sunset",
    label: "Fire Promo",
    gradient: "from-[#be123c] via-[#e11d48] to-[#f97316]",
    badgeBg: "bg-white text-[#be123c]",
  },
  {
    id: "obsidian",
    label: "Dark Luxury",
    gradient: "from-[#09090b] via-[#18181b] to-[#3f3f46]",
    badgeBg: "bg-[#00a86b] text-white",
  },
];

export const MarketingPage: React.FC = () => {
  const { store, lang } = useAuth();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<"broadcast" | "automations" | "campaigns">("broadcast");
  const [campaignTitle, setCampaignTitle] = useState("🔥 Закрытая распродажа -20% на всё меню и коллекцию!");
  const [segment, setSegment] = useState("Все подписчики Telegram-бота (1 240 чел.)");
  const [btnLabel, setBtnLabel] = useState("🛍️ Открыть каталог со скидкой");
  const [promoBadge, setPromoBadge] = useState("ПРОМОКОД: VESNA20");
  const [bannerTheme, setBannerTheme] = useState<string>("ocean");
  const [scheduleMode, setScheduleMode] = useState<"now" | "scheduled">("now");
  const [messageText, setMessageText] = useState(
    "Привет! В нашем магазине стартовала специальная акция для подписчиков Telegram.\n\nОформите заказ сегодня через наш Mini App и получите скидку 20% по промокоду VESNA20 + бесплатную доставку по Ташкенту!"
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
      revenue: "1 840 000 UZS",
      enabled: true,
    },
    {
      id: "auto-2",
      title: "Приветственный бонус за первый заказ (/start)",
      desc: "Отправляет купон на скидку 10% новым подписчикам Telegram-бота сразу после первого запуска.",
      conversion: "22.8% конверсия",
      revenue: "2 610 000 UZS",
      enabled: true,
    },
    {
      id: "auto-3",
      title: "Реактивация спящих клиентов (30 дней без покупок)",
      desc: "Персональное предложение клиентам, которые не делали заказы более месяца.",
      conversion: "8.5% конверсия",
      revenue: "690 000 UZS",
      enabled: false,
    },
  ]);

  const currentTheme = BANNER_THEMES.find((t) => t.id === bannerTheme) || BANNER_THEMES[0];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newCmp: CampaignItem = {
      id: "cmp-" + Date.now(),
      name: campaignTitle.trim() || "Telegram рассылка",
      channel: "Telegram Bot Push",
      segment: segment.split("(")[0].trim(),
      sentCount: 1240,
      openRate: "74.0%",
      sales: "0 UZS (только запущено)",
      status: "active",
      date: scheduleMode === "now" ? "Только что" : "Запланировано",
    };
    setCampaigns([newCmp, ...campaigns]);
    notify("Маркетинговая рассылка успешно отправлена подписчикам Telegram-бота!", "success");
  };

  return (
    <div className="space-y-5 pb-12 min-w-0">
      {/* 1. Shopify Marketing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#005bd3]/10 text-[#005bd3] flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#202223] dark:text-white tracking-tight">
              {lang === "uz" ? "Marketing va kampaniyalar" : "Маркетинг и рассылки"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e6f7f0] text-[#00a86b] border border-[#8ce0bf]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a86b] animate-pulse" />
              Активно
            </span>
          </div>
          <p className="text-xs text-[#6d7175] mt-1">
            Push-рассылки в Telegram Mini App, авто-возврат брошенных корзин и управление конверсией
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/discounts"
            className="px-3.5 py-2 rounded-xl border border-[#e1e3e5] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#202223] dark:text-zinc-200 hover:bg-[#f6f6f7] text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-2xs"
          >
            <Tag className="w-3.5 h-3.5 text-[#005bd3]" />
            <span>Промокоды и скидки</span>
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
            className="px-3.5 py-2 rounded-xl bg-[#202223] hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00a86b]" />
            <span>AI-генератор акций</span>
          </button>
        </div>
      </div>

      {/* 2. Shopify Marketing KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6d7175]">Выручка от маркетинга</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-[#005bd3] dark:bg-blue-950/50">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-2 tabular-nums">
            5 460 000 UZS
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#f1f2f4] dark:border-zinc-800 text-[11px]">
            <span className="font-semibold text-[#00a86b]">+18.4%</span>
            <span className="text-[#6d7175]">за последние 30 дней</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6d7175]">Аудитория Telegram-бота</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-[#00a86b] dark:bg-emerald-950/50">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-2 tabular-nums">
            1 240 подписчиков
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#f1f2f4] dark:border-zinc-800 text-[11px]">
            <span className="font-semibold text-[#005bd3]">98.2%</span>
            <span className="text-[#6d7175]">доставляемость Push</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6d7175]">Открываемость (Open Rate)</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50">
              <Eye className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-2 tabular-nums">
            71.8%
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#f1f2f4] dark:border-zinc-800 text-[11px]">
            <span className="font-semibold text-[#00a86b]">×3.2 выше</span>
            <span className="text-[#6d7175]">чем обычные SMS / Email</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181B] rounded-xl border border-[#e1e3e5] dark:border-zinc-800 p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6d7175]">Возвращено корзин</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#202223] dark:text-white mt-2 tabular-nums">
            14 заказов
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#f1f2f4] dark:border-zinc-800 text-[11px]">
            <span className="font-semibold text-[#00a86b]">Автопилот 24/7</span>
            <span className="text-[#6d7175]">через триггеры бота</span>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Content (Adapts cleanly when Sidekick is open) */}
      <div className="sidekick-adaptive-grid grid grid-cols-1 xl:grid-cols-12 gap-5 items-start min-w-0">
        {/* LEFT COLUMN (7 cols): Broadcast Builder, Automations, Campaigns Table */}
        <div className="xl:col-span-7 space-y-5 min-w-0">
          {/* Sub-tabs */}
          <div className="inline-flex flex-wrap rounded-xl border border-[#e1e3e5] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("broadcast")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "broadcast"
                  ? "bg-[#202223] text-white dark:bg-white dark:text-[#202223]"
                  : "text-[#5c5f62] hover:text-[#202223] dark:text-zinc-400"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Конструктор Push-рассылки</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("automations")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "automations"
                  ? "bg-[#202223] text-white dark:bg-white dark:text-[#202223]"
                  : "text-[#5c5f62] hover:text-[#202223] dark:text-zinc-400"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Автоматизации (3)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("campaigns")}
              className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "campaigns"
                  ? "bg-[#202223] text-white dark:bg-white dark:text-[#202223]"
                  : "text-[#5c5f62] hover:text-[#202223] dark:text-zinc-400"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Журнал кампаний ({campaigns.length})</span>
            </button>
          </div>

          {activeTab === "broadcast" && (
            <form
              onSubmit={handleSendBroadcast}
              className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 p-5 sm:p-6 shadow-2xs space-y-5 text-xs"
            >
              {/* Card Header + AI Copy Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#f1f2f4] dark:border-zinc-800">
                <div>
                  <h2 className="text-sm font-bold text-[#202223] dark:text-white">
                    Конструктор рассылки в Telegram Mini App
                  </h2>
                  <p className="text-[11px] text-[#6d7175] mt-0.5">
                    Настройте баннер, текст и кнопку — предпросмотр справа обновляется мгновенно
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignTitle("🎁 Только сегодня: Скидка 25% + Бесплатная доставка!");
                    setPromoBadge("ПРОМОКОД: VIP25");
                    setBannerTheme("emerald");
                    setMessageText(
                      `Специальное предложение для клиентов «${
                        store?.name || "StoreBox"
                      }»!\n\nОформите заказ сегодня через наш Telegram Mini App и активируйте промокод VIP25 на скидку 25%. Количество акционных наборов ограничено!`
                    );
                    notify("Продающий текст акции сгенерирован с помощью AI", "success");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#005bd3] border border-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer transition shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Заполнить с помощью AI</span>
                </button>
              </div>

              {/* 1-Click Quick Templates */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6d7175]">
                  Быстрые сценарии кампании
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCampaignTitle("🔥 Flash-распродажа: -20% на все хиты меню!");
                      setPromoBadge("ПРОМОКОД: FLASH20");
                      setBannerTheme("sunset");
                      setBtnLabel("🔥 Заказать со скидкой 20%");
                      setMessageText(
                        "Только до конца вечера дарим скидку 20% на самые популярные позиции!\n\nНажмите кнопку ниже, выберите любимые товары в Mini App и укажите промокод FLASH20 при оформлении."
                      );
                    }}
                    className="p-2.5 rounded-xl border border-[#e1e3e5] dark:border-zinc-800 hover:border-[#005bd3] bg-[#f9fafb] dark:bg-zinc-900 text-left transition cursor-pointer flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#202223] dark:text-white truncate">Flash-скидка 20%</div>
                      <div className="text-[10px] text-[#6d7175] truncate">Вечерняя акция</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCampaignTitle("🚀 Бесплатная доставка на все заказы сегодня!");
                      setPromoBadge("ДОСТАВКА 0 UZS");
                      setBannerTheme("ocean");
                      setBtnLabel("🛍️ Перейти в каталог");
                      setMessageText(
                        "Отличные новости! Сегодня мы доставляем любые заказы по городу абсолютно бесплатно.\n\nОткройте наш магазин в Telegram и закажите прямо сейчас без доплаты за курьера!"
                      );
                    }}
                    className="p-2.5 rounded-xl border border-[#e1e3e5] dark:border-zinc-800 hover:border-[#005bd3] bg-[#f9fafb] dark:bg-zinc-900 text-left transition cursor-pointer flex items-center gap-2"
                  >
                    <Gift className="w-4 h-4 text-[#005bd3] shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#202223] dark:text-white truncate">Бесплатная доставка</div>
                      <div className="text-[10px] text-[#6d7175] truncate">Рост среднего чека</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCampaignTitle("✨ Новинки недели уже доступны в каталоге!");
                      setPromoBadge("НОВАЯ КОЛЛЕКЦИЯ");
                      setBannerTheme("obsidian");
                      setBtnLabel("✨ Смотреть новинки");
                      setMessageText(
                        "Мы обновили ассортимент! В каталоге появились свежие позиции, доступные для быстрого заказа через Telegram.\n\nУспейте попробовать первыми!"
                      );
                    }}
                    className="p-2.5 rounded-xl border border-[#e1e3e5] dark:border-zinc-800 hover:border-[#005bd3] bg-[#f9fafb] dark:bg-zinc-900 text-left transition cursor-pointer flex items-center gap-2"
                  >
                    <BellRing className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#202223] dark:text-white truncate">Анонс новинок</div>
                      <div className="text-[10px] text-[#6d7175] truncate">Для всех клиентов</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Banner Style Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#202223] dark:text-zinc-200">
                  Цветовая тема промо-баннера
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BANNER_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setBannerTheme(theme.id)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                        bannerTheme === theme.id
                          ? "border-[#005bd3] bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-[#005bd3]"
                          : "border-[#e1e3e5] dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg bg-gradient-to-br ${theme.gradient} shrink-0 shadow-2xs`} />
                      <span className="text-[11px] font-semibold text-[#202223] dark:text-zinc-200 truncate">
                        {theme.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1.5">
                    Заголовок кампании
                  </label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-[#005bd3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1.5">
                    Сегмент получателей
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-[#005bd3]"
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#202223] dark:text-zinc-200">
                    Текст сообщения
                  </label>
                  <span className="text-[11px] text-[#6d7175]">
                    {messageText.length} симв.
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#d2d5d8] dark:border-zinc-700 bg-[#fbfbfc] dark:bg-zinc-900 text-xs leading-relaxed focus:outline-none focus:bg-white focus:border-[#005bd3]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1.5">
                    Промо-бейдж на баннере
                  </label>
                  <input
                    type="text"
                    value={promoBadge}
                    onChange={(e) => setPromoBadge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono font-semibold focus:outline-none focus:border-[#005bd3]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202223] dark:text-zinc-200 mb-1.5">
                    Кнопка перехода в Mini App
                  </label>
                  <input
                    type="text"
                    value={btnLabel}
                    onChange={(e) => setBtnLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d2d5d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-medium focus:outline-none focus:border-[#005bd3]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#f1f2f4] dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("now")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                      scheduleMode === "now"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    Мгновенная отправка
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("scheduled")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition ${
                      scheduleMode === "scheduled"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    По расписанию
                  </button>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#005bd3] hover:bg-[#004bb0] text-white font-semibold text-xs inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Запустить рассылку</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === "automations" && (
            <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 divide-y divide-[#f1f2f4] dark:divide-zinc-800 shadow-2xs">
              {automations.map((auto) => (
                <div key={auto.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-[#202223] dark:text-white">
                        {auto.title}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#e6f7f0] text-[#00a86b] border border-[#8ce0bf] text-[10px] font-bold">
                        {auto.conversion}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#005bd3]">
                        {auto.revenue}
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition ${
                      auto.enabled
                        ? "bg-[#00a86b] text-white"
                        : "bg-[#f6f6f7] text-[#5c5f62] border border-[#d2d5d8]"
                    }`}
                  >
                    {auto.enabled ? "✓ Активно" : "Включить"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recent Campaigns Table */}
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#e3e5e7] dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#202223] dark:text-white">
                История маркетинговых кампаний
              </h3>
              <span className="text-[11px] text-[#6d7175]">Канал: Telegram Mini App & Web</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f6f6f7] dark:bg-zinc-900 text-[#6d7175] text-[11px] font-semibold border-b border-[#e3e5e7] dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4">Кампания</th>
                    <th className="py-3 px-4">Сегмент</th>
                    <th className="py-3 px-4">Охват / Open Rate</th>
                    <th className="py-3 px-4">Выручка</th>
                    <th className="py-3 px-4 text-right">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f2f4] dark:divide-zinc-800 text-[#202223] dark:text-zinc-200">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-[#f6f6f7]/60">
                      <td className="py-3 px-4">
                        <div className="font-semibold">{c.name}</div>
                        <div className="text-[10px] text-[#6d7175]">{c.date}</div>
                      </td>
                      <td className="py-3 px-4 text-[#6d7175] whitespace-nowrap">{c.segment}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold">{c.sentCount}</span>{" "}
                        <span className="text-[#00a86b] font-bold">({c.openRate})</span>
                      </td>
                      <td className="py-3 px-4 font-bold tabular-nums whitespace-nowrap">{c.sales}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#e6f7f0] text-[#00a86b] border border-[#8ce0bf]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a86b]" />
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

        {/* RIGHT COLUMN (5 cols): Modern iOS 18 Telegram Mini App Push Preview */}
        <div className="xl:col-span-5 xl:sticky xl:top-20 min-w-0">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-[#e1e3e5] dark:border-zinc-800 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#f1f2f4] dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0088cc] dark:bg-sky-950/50 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#202223] dark:text-white">
                    Интерактивный предпросмотр в Telegram
                  </h3>
                  <p className="text-[11px] text-[#6d7175]">
                    Как сообщение увидят покупатели на смартфоне
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e6f7f0] text-[#00a86b] border border-[#8ce0bf] text-[10px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a86b] animate-ping" />
                Live
              </span>
            </div>

            {/* Sleek iPhone 16 Pro Frame */}
            <div className="mx-auto w-full max-w-[320px] rounded-[40px] p-2.5 bg-[#18181b] shadow-xl ring-1 ring-black/10">
              <div className="rounded-[31px] overflow-hidden bg-[#e4ecf2] flex flex-col">
                {/* iOS Status Bar + Dynamic Island */}
                <div className="bg-white/95 backdrop-blur-md px-5 pt-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-900">
                  <span>9:41</span>
                  <div className="w-20 h-4 rounded-full bg-[#18181b] flex items-center justify-end pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex items-center gap-1 text-slate-800">
                    <Wifi className="w-3 h-3" />
                    <BatteryFull className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Telegram iOS Chat Header */}
                <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#005bd3] to-[#00a86b] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                      {(store?.name || "SB").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {store?.name || "StoreBox"}
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0088cc] fill-[#0088cc]/15 shrink-0" />
                      </div>
                      <div className="text-[10px] text-[#0088cc] font-medium">
                        бот магазина • онлайн
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0088cc] text-[9px] font-bold">
                    Mini App
                  </span>
                </div>

                {/* Chat Wallpaper & Message Bubble */}
                <div
                  className="p-3.5 space-y-2.5 min-h-[340px] flex flex-col justify-end"
                  style={{
                    backgroundImage:
                      "radial-gradient(rgba(14, 116, 144, 0.08) 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                >
                  {/* Date Pill */}
                  <div className="mx-auto px-2.5 py-0.5 rounded-full bg-slate-900/20 backdrop-blur-xs text-white text-[10px] font-medium">
                    Сегодня
                  </div>

                  {/* Telegram Rich Media Message Card */}
                  <div className="bg-white rounded-2xl rounded-bl-sm overflow-hidden shadow-sm border border-slate-200/60">
                    {/* Dynamic Promo Banner Header */}
                    <div
                      className={`h-32 bg-gradient-to-br ${currentTheme.gradient} p-4 flex flex-col justify-between text-white relative overflow-hidden`}
                    >
                      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-2xs ${currentTheme.badgeBg}`}
                        >
                          {promoBadge || "СПЕЦПРЕДЛОЖЕНИЕ"}
                        </span>
                        <span className="text-[10px] font-semibold text-white/90 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                          {store?.name || "StoreBox"}
                        </span>
                      </div>

                      <div className="text-[13px] font-bold leading-snug line-clamp-2 relative z-10 drop-shadow-2xs">
                        {campaignTitle}
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="p-3.5 text-[11.5px] text-slate-800 whitespace-pre-line leading-relaxed">
                      {messageText}
                      <div className="flex items-center justify-end gap-1 text-[9.5px] text-slate-400 mt-2">
                        <span>15:00</span>
                        <CheckCheck className="w-3 h-3 text-[#0088cc]" />
                      </div>
                    </div>
                  </div>

                  {/* Telegram Inline WebApp CTA Button */}
                  <button
                    type="button"
                    className="w-full py-2.5 px-3 rounded-xl bg-white/95 hover:bg-white text-[#0088cc] font-semibold text-xs shadow-xs border border-slate-200/70 flex items-center justify-center gap-1.5 cursor-pointer relative"
                  >
                    <span className="truncate">{btnLabel || "🛍️ Открыть магазин"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#0088cc] absolute right-2.5 top-2.5" />
                  </button>
                </div>

                {/* iOS Home Indicator */}
                <div className="bg-white/90 py-2 flex justify-center border-t border-slate-200/60">
                  <div className="w-28 h-1 rounded-full bg-slate-900/80" />
                </div>
              </div>
            </div>

            {/* Delivery Audience Summary Footer */}
            <div className="p-3 rounded-xl bg-[#f6f6f7] dark:bg-zinc-900 border border-[#e1e3e5] dark:border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-[#6d7175]">Получатели:</span>
              <span className="font-semibold text-[#202223] dark:text-white truncate max-w-[200px]">
                {segment}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
