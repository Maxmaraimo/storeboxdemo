import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Globe,
  Search,
  Plus,
  Sparkles,
  Check,
  X,
  BarChart2,
  Settings,
  ArrowUpRight,
  Truck,
  Languages,
  DollarSign,
  MapPin,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface MarketItem {
  id: string;
  nameRu: string;
  nameUz: string;
  flag: string;
  isPrimary?: boolean;
  active: boolean;
  countriesRu: string;
  countriesUz: string;
  currency: string;
  exchangeRate: string;
  languages: string;
  domainPath: string;
  sharePct: number;
  ordersCount: number;
}

const INITIAL_MARKETS: MarketItem[] = [
  {
    id: "uz",
    nameRu: "Узбекистан",
    nameUz: "O'zbekiston",
    flag: "🇺🇿",
    isPrimary: true,
    active: true,
    countriesRu: "Узбекистан (Ташкент, Самарканд, Бухара, Фергана, Андижан и все 12 областей)",
    countriesUz: "O'zbekiston (Toshkent, Samarqand, Buxoro, Farg'ona, Andijon va barcha 12 viloyat)",
    currency: "UZS (Узбекский сум)",
    exchangeRate: "Базовая валюта (1 UZS)",
    languages: "Русский, O'zbekcha",
    domainPath: "Основной домен (.storebox.uz)",
    sharePct: 92,
    ordersCount: 41,
  },
  {
    id: "cis",
    nameRu: "Казахстан и Центральная Азия",
    nameUz: "Qozog'iston va Markaziy Osiyo",
    flag: "🇰🇿",
    active: true,
    countriesRu: "Казахстан, Кыргызстан, Таджикистан (3 страны)",
    countriesUz: "Qozog'iston, Qirg'iziston, Tojikiston (3 davlat)",
    currency: "USD ($) / KZT (₸)",
    exchangeRate: "1 USD = 12 850 UZS",
    languages: "Русский, O'zbekcha",
    domainPath: "/cis",
    sharePct: 6,
    ordersCount: 4,
  },
  {
    id: "ru",
    nameRu: "Россия и ЕАЭС",
    nameUz: "Rossiya va YEOII",
    flag: "🇷🇺",
    active: false,
    countriesRu: "Россия, Беларусь (2 страны)",
    countriesUz: "Rossiya, Belarus (2 davlat)",
    currency: "RUB (₽) / USD ($)",
    exchangeRate: "1 RUB = 135 UZS",
    languages: "Русский",
    domainPath: "/ru",
    sharePct: 2,
    ordersCount: 1,
  },
  {
    id: "intl",
    nameRu: "США, Европа и ОАЭ",
    nameUz: "AQSH, Yevropa va BAA",
    flag: "🌍",
    active: false,
    countriesRu: "США, Европейский союз (27 стран), ОАЭ",
    countriesUz: "AQSH, Yevropa Ittifoqi (27 davlat), BAA",
    currency: "USD ($) / EUR (€)",
    exchangeRate: "1 USD = 12 850 UZS",
    languages: "English, Русский",
    domainPath: "/en",
    sharePct: 0,
    ordersCount: 0,
  },
];

const UZ_REGIONS = [
  { name: "г. Ташкент и Ташкентская область", delivery: "25 000 UZS • 45 мин", active: true },
  { name: "Самаркандская область", delivery: "30 000 UZS • 1 день", active: true },
  { name: "Бухарская область", delivery: "35 000 UZS • 1–2 дня", active: true },
  { name: "Ферганская область", delivery: "30 000 UZS • 1 день", active: true },
  { name: "Андижанская область", delivery: "30 000 UZS • 1 день", active: true },
  { name: "Наманганская область", delivery: "30 000 UZS • 1 день", active: true },
  { name: "Хорезмская область (Ургенч / Хива)", delivery: "40 000 UZS • 2 дня", active: true },
  { name: "Кашкадарьинская область (Карши)", delivery: "35 000 UZS • 1–2 дня", active: true },
  { name: "Сурхандарьинская область (Термез)", delivery: "40 000 UZS • 2 дня", active: true },
  { name: "Навоийская область", delivery: "35 000 UZS • 1–2 дня", active: true },
  { name: "Джизакская и Сырдарьинская области", delivery: "28 000 UZS • 1 день", active: true },
  { name: "Республика Каракалпакстан (Нукус)", delivery: "45 000 UZS • 2–3 дня", active: true },
];

export const MarketsPage: React.FC = () => {
  const { lang, store } = useAuth();
  const [markets, setMarkets] = useState<MarketItem[]>(INITIAL_MARKETS);
  const [search, setSearch] = useState("");
  const [editingMarket, setEditingMarket] = useState<MarketItem | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCountries, setNewCountries] = useState("");
  const [newCurrency, setNewCurrency] = useState("USD ($)");
  const [dismissedSuggestions, setDismissedSuggestions] = useState<string[]>([]);

  const filteredMarkets = markets.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.nameRu.toLowerCase().includes(q) ||
      m.nameUz.toLowerCase().includes(q) ||
      m.countriesRu.toLowerCase().includes(q)
    );
  });

  const toggleMarketActive = (id: string) => {
    setMarkets((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );
  };

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created: MarketItem = {
      id: `m-${Date.now()}`,
      nameRu: newName.trim(),
      nameUz: newName.trim(),
      flag: "🌐",
      active: true,
      countriesRu: newCountries.trim() || newName.trim(),
      countriesUz: newCountries.trim() || newName.trim(),
      currency: newCurrency,
      exchangeRate: "1 USD = 12 850 UZS",
      languages: "Русский, O'zbekcha, English",
      domainPath: `/${newName.trim().toLowerCase().slice(0, 3)}`,
      sharePct: 0,
      ordersCount: 0,
    };
    setMarkets((prev) => [...prev, created]);
    setNewName("");
    setNewCountries("");
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Shopify Header (fix20.mov 04:50) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-[#202223]" strokeWidth={2} />
          <h1 className="text-xl font-bold text-[#202223] tracking-tight">
            {lang === "ru" ? "Рынки" : lang === "en" ? "Markets" : "Bozorlar va hududlar"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#e1e3e5] hover:bg-[#f6f6f7] text-xs font-semibold text-[#202223] shadow-2xs transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-[#5c5f62]" />
            <span>{lang === "ru" ? "Графики" : "Grafiklar"}</span>
          </Link>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-[#202223] hover:bg-black text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <span>{lang === "ru" ? "Создать рынок" : "Bozor yaratish"}</span>
          </button>
        </div>
      </div>

      {/* Main Markets Table Card (Matches Shopify Markets 04:50) */}
      <div className="bg-white rounded-[12px] border border-[#e1e3e5] shadow-[0_1px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-3 border-b border-[#e1e3e5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[7px] bg-[#f6f6f7] border border-[#e1e3e5] text-xs font-medium text-[#202223]">
              <StoreBadgeIcon />
              <span>{lang === "ru" ? "По умолчанию для магазина" : "Do'kon standarti"}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingMarket(markets[0])}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[7px] border border-dashed border-zinc-300 hover:border-zinc-500 text-xs font-medium text-[#5c5f62] hover:text-[#202223] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === "ru" ? "Регионы (14)" : "Hududlar (14)"}</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "ru" ? "Поиск по всем рынкам" : "Bozorlarni qidirish"}
              className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[#f6f6f7] border border-[#e1e3e5] text-xs text-[#202223] placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#202223]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f6f6f7] text-[#6d7175] font-semibold border-b border-[#e1e3e5]">
              <tr>
                <th className="py-2.5 px-4">{lang === "ru" ? "Регион / Рынок" : "Hudud / Bozor"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Статус" : "Holati"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Состав" : "Tarkibi"}</th>
                <th className="py-2.5 px-4">{lang === "ru" ? "Валюта и языки" : "Valyuta va tillar"}</th>
                <th className="py-2.5 px-4 text-right">{lang === "ru" ? "Настройки" : "Sozlamalar"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e3e5] text-[#202223]">
              {filteredMarkets.map((market) => (
                <tr
                  key={market.id}
                  onClick={() => setEditingMarket(market)}
                  className="hover:bg-[#f6f6f7]/80 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{market.flag}</span>
                      <div>
                        <div className="font-semibold text-[#202223] flex items-center gap-2">
                          <span>{lang === "ru" ? market.nameRu : market.nameUz}</span>
                          {market.isPrimary && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              {lang === "ru" ? "Основной" : "Asosiy"}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6d7175]">{market.domainPath}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {market.active ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#bbf7d0] text-[#14532d]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                        {lang === "ru" ? "Активно" : "Faol"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600">
                        {lang === "ru" ? "Неактивно" : "Nofaol"}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-[#202223]">
                    <div className="flex items-center gap-1.5">
                      <span>{market.flag}</span>
                      <span className="truncate max-w-xs">
                        {lang === "ru" ? market.countriesRu : market.countriesUz}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#202223]">{market.currency}</div>
                    <div className="text-[11px] text-[#6d7175]">{market.languages}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMarketActive(market.id)}
                        className={`px-2.5 py-1 rounded-[7px] text-[11px] font-semibold border transition-colors cursor-pointer ${
                          market.active
                            ? "border-[#e1e3e5] bg-white hover:bg-[#f6f6f7] text-[#202223]"
                            : "border-[#16a34a] bg-[#16a34a] text-white hover:bg-[#15803d]"
                        }`}
                      >
                        {market.active
                          ? lang === "ru"
                            ? "Настроить"
                            : "Sozlash"
                          : lang === "ru"
                          ? "Включить"
                          : "Yoqish"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Shopify Purple AI Market Suggestions (exact match to fix20.mov 04:50) */}
        <div className="p-3 bg-white space-y-2 border-t border-[#e1e3e5]">
          {!dismissedSuggestions.includes("usa") && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-[#f5f3ff] border border-[#ddd6fe] text-xs">
              <button
                type="button"
                onClick={() => toggleMarketActive("intl")}
                className="flex items-center gap-2.5 text-left font-medium text-[#4c1d95] hover:underline cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#7c3aed] shrink-0" />
                <span>
                  {lang === "ru"
                    ? "Создать рынок «США и Канада» — принимайте международные заказы в USD"
                    : "«AQSH va Kanada» bozorini yaratish"}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#ede9fe] text-[#6d28d9] font-bold text-[10px]">
                  🇺🇸
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedSuggestions((p) => [...p, "usa"])}
                className="text-[#7c3aed]/70 hover:text-[#4c1d95] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!dismissedSuggestions.includes("eu") && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-[10px] bg-[#f5f3ff] border border-[#ddd6fe] text-xs">
              <button
                type="button"
                onClick={() => toggleMarketActive("ru")}
                className="flex items-center gap-2.5 text-left font-medium text-[#4c1d95] hover:underline cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#7c3aed] shrink-0" />
                <span>
                  {lang === "ru"
                    ? "Создать рынок «Европейский союз и СНГ» (29 стран)"
                    : "«Yevropa Ittifoqi va MDH» bozorini yaratish"}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#ede9fe] text-[#6d28d9] font-bold text-[10px]">
                  🇪🇺
                </span>
              </button>
              <button
                type="button"
                onClick={() => setDismissedSuggestions((p) => [...p, "eu"])}
                className="text-[#7c3aed]/70 hover:text-[#4c1d95] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uzbekistan 14 Regions Breakdown Card */}
      <div className="bg-white rounded-[12px] border border-[#e1e3e5] p-5 shadow-[0_1px_0_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#202223] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#16a34a]" />
              <span>
                {lang === "ru"
                  ? "Региональные зоны внутри рынка «Узбекистан» (14 регионов)"
                  : "«O'zbekiston» bozori ichidagi hududiy zonalar (14 viloyat)"}
              </span>
            </h2>
            <p className="text-xs text-[#6d7175] mt-0.5">
              {lang === "ru"
                ? `Настроены локальные тарифы курьерской доставки и пункты выдачи для магазина ${store?.name || "StoreBox"}`
                : "Barcha viloyatlar uchun yetkazib berish tariflari va muddatlari"}
            </p>
          </div>
          <Link
            to="/settings/delivery"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#16a34a] hover:underline"
          >
            <span>{lang === "ru" ? "Настроить тарифы доставки" : "Yetkazib berish tariflari"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {UZ_REGIONS.map((reg, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[10px] border border-[#e1e3e5] bg-[#f6f6f7]/60 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#202223] truncate">{reg.name}</div>
                <div className="text-[11px] text-[#6d7175] mt-0.5">{reg.delivery}</div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#bbf7d0] text-[#14532d] shrink-0">
                {lang === "ru" ? "Активно" : "Faol"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Market Detail Modal */}
      {editingMarket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[14px] border border-[#e1e3e5] max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e1e3e5] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{editingMarket.flag}</span>
                <div>
                  <h3 className="text-sm font-bold text-[#202223]">
                    {lang === "ru" ? editingMarket.nameRu : editingMarket.nameUz}
                  </h3>
                  <p className="text-[11px] text-[#6d7175]">{editingMarket.countriesRu}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMarket(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-[10px] bg-[#f6f6f7] border border-[#e1e3e5] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#202223]">
                    {lang === "ru" ? "Статус рынка" : "Bozor holati"}
                  </div>
                  <div className="text-[11px] text-[#6d7175]">
                    {lang === "ru"
                      ? "Покупатели из этого региона могут оформлять заказы"
                      : "Ushbu hudud mijozlari buyurtma bera oladi"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleMarketActive(editingMarket.id);
                    setEditingMarket({ ...editingMarket, active: !editingMarket.active });
                  }}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-bold cursor-pointer ${
                    editingMarket.active
                      ? "bg-[#bbf7d0] text-[#14532d]"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {editingMarket.active
                    ? lang === "ru"
                      ? "Активно ✓"
                      : "Faol ✓"
                    : lang === "ru"
                    ? "Включить"
                    : "Yoqish"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-[10px] border border-[#e1e3e5] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#6d7175] font-medium">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Валюта и курс" : "Valyuta"}</span>
                  </div>
                  <div className="font-semibold text-[#202223]">{editingMarket.currency}</div>
                  <div className="text-[11px] text-[#6d7175]">{editingMarket.exchangeRate}</div>
                </div>

                <div className="p-3 rounded-[10px] border border-[#e1e3e5] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#6d7175] font-medium">
                    <Languages className="w-3.5 h-3.5" />
                    <span>{lang === "ru" ? "Языки витрины" : "Tillar"}</span>
                  </div>
                  <div className="font-semibold text-[#202223]">{editingMarket.languages}</div>
                  <div className="text-[11px] text-[#6d7175]">{editingMarket.domainPath}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e1e3e5]">
              <Link
                to="/settings/domains"
                className="px-3 py-1.5 rounded-[8px] border border-[#e1e3e5] text-xs font-medium text-[#202223] hover:bg-[#f6f6f7]"
              >
                {lang === "ru" ? "Домены и языки" : "Domenlar"}
              </Link>
              <button
                type="button"
                onClick={() => setEditingMarket(null)}
                className="px-4 py-1.5 rounded-[8px] bg-[#202223] text-white text-xs font-semibold hover:bg-black cursor-pointer"
              >
                {lang === "ru" ? "Готово" : "Tayyor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Market Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateMarket}
            className="bg-white rounded-[14px] border border-[#e1e3e5] max-w-md w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#e1e3e5] pb-3">
              <h3 className="text-sm font-bold text-[#202223]">
                {lang === "ru" ? "Создать новый рынок" : "Yangi bozor yaratish"}
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#202223] mb-1">
                  {lang === "ru" ? "Название рынка *" : "Bozor nomi *"}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={lang === "ru" ? "Например: ОАЭ и Ближний Восток" : "Masalan: BAA"}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#f6f6f7] border border-[#e1e3e5] text-xs focus:outline-none focus:border-[#202223]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202223] mb-1">
                  {lang === "ru" ? "Страны или регионы" : "Davlatlar yoki hududlar"}
                </label>
                <input
                  type="text"
                  value={newCountries}
                  onChange={(e) => setNewCountries(e.target.value)}
                  placeholder={lang === "ru" ? "Дубай, Абу-Даби, Саудовская Аравия" : "Dubay, Abu-Dabi"}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#f6f6f7] border border-[#e1e3e5] text-xs focus:outline-none focus:border-[#202223]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#202223] mb-1">
                  {lang === "ru" ? "Валюта рынка" : "Bozor valyutasi"}
                </label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[#f6f6f7] border border-[#e1e3e5] text-xs focus:outline-none focus:border-[#202223]"
                >
                  <option value="UZS (Узбекский сум)">UZS (Узбекский сум)</option>
                  <option value="USD ($)">USD ($ — Доллар США)</option>
                  <option value="KZT (₸)">KZT (₸ — Казахстанский тенге)</option>
                  <option value="RUB (₽)">RUB (₽ — Российский рубль)</option>
                  <option value="EUR (€)">EUR (€ — Евро)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e1e3e5]">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 rounded-[8px] text-xs font-medium text-[#5c5f62] hover:bg-[#f6f6f7] cursor-pointer"
              >
                {lang === "ru" ? "Отмена" : "Bekor qilish"}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-[8px] bg-[#202223] text-white text-xs font-semibold hover:bg-black cursor-pointer"
              >
                {lang === "ru" ? "Добавить рынок" : "Qo'shish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const StoreBadgeIcon = () => (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current text-[#5c5f62]">
    <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h7A1.5 1.5 0 0 1 13 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 13.5v-11Zm2 2v1h6v-1H5Zm0 3v1h6v-1H5Zm0 3v1h4v-1H5Z" />
  </svg>
);
