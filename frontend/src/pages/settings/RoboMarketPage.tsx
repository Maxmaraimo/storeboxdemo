import React, { useState } from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Zap,
  Check,
  X,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

interface TemplateItem {
  id: string;
  niche: string;
  name: string;
  subtitle: string;
  categoryLabel: string;
  editorialTag: string;
  coverImage: string;
  previewUrl: string;
  accentColor: string;
  paletteColors: string[];
  themeTemplate: "boutique" | "restaurant" | "universal";
  cardStyle: "minimal" | "compact" | "modern";
  aspectRatio: "portrait" | "square";
  statsLabel: string;
  description: string;
  highlights: string[];
}

const LUXURY_TEMPLATES: TemplateItem[] = [
  {
    id: "vogue-runway",
    niche: "fashion",
    name: "Vogue Runway",
    subtitle: "High Fashion & Editorial Lookbook",
    categoryLabel: "Одежда и Мода",
    editorialTag: "AWWWARDS HONORS",
    coverImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=90",
    previewUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=90",
    accentColor: "#18181B",
    paletteColors: ["#18181B", "#78350F", "#3F6212", "#1E3A8A"],
    themeTemplate: "boutique",
    cardStyle: "minimal",
    aspectRatio: "portrait",
    statsLabel: "99.8% Perf Score",
    description: "Бескомпромиссный европейский минимализм в духе парижских и миланских недель моды. Вертикальная подиумная сетка 3:4, скрытые карточки и интерактивная покупка полного образа.",
    highlights: ["Подиумная сетка 3:4", "Shop the Look", "Быстрый выбор размеров", "120 FPS анимации"]
  },
  {
    id: "gourmet-grill",
    niche: "restaurant",
    name: "Gourmet Grill",
    subtitle: "Craft Burger & Restaurant Studio",
    categoryLabel: "Рестораны и Еда",
    editorialTag: "STUDIO CRAFT",
    coverImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=90",
    previewUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=90",
    accentColor: "#DC2626",
    paletteColors: ["#DC2626", "#D97706", "#B91C1C", "#18181B"],
    themeTemplate: "restaurant",
    cardStyle: "compact",
    aspectRatio: "square",
    statsLabel: "25 min Delivery HUD",
    description: "Атмосферный темный гриль-хаус с фокусом на сочные блюда ресторанного уровня. Живой трекер термодоставки, расчет энергетической ценности и компактная верстка меню.",
    highlights: ["Студийная фуд-подача", "Шкала термодоставки", "Расчет КБЖУ", "100% Халяль"]
  },
  {
    id: "titanium-pro",
    niche: "tech",
    name: "Titanium Studio",
    subtitle: "Apple Store Aesthetics & Obsidian Dark",
    categoryLabel: "Техника и Гаджеты",
    editorialTag: "APPLE KEYNOTE",
    coverImage: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1600&q=90",
    previewUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=90",
    accentColor: "#2563EB",
    paletteColors: ["#2563EB", "#C5A880", "#9A968D", "#38BDF8"],
    themeTemplate: "universal",
    cardStyle: "modern",
    aspectRatio: "square",
    statsLabel: "Obsidian 120Hz",
    description: "Глубокий обсидиановый ультра-минимализм для презентации флагманских девайсов. Bento-сетка характеристик, 4 оттенка титана Grade 5 и расчет рассрочки 0%.",
    highlights: ["4 цвета титана", "Bento-сетка характеристик", "Селектор памяти", "Официальная гарантия"]
  },
  {
    id: "crystall-luxury",
    niche: "beauty",
    name: "Crystall Ami Royal",
    subtitle: "Selective Perfumery & Haute Joaillerie",
    categoryLabel: "Парфюмерия и Люкс",
    editorialTag: "HAUTE LUXE",
    coverImage: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1600&q=90",
    previewUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=1200&q=90",
    accentColor: "#9333EA",
    paletteColors: ["#9333EA", "#E11D48", "#D97706", "#4F46E5"],
    themeTemplate: "boutique",
    cardStyle: "minimal",
    aspectRatio: "portrait",
    statsLabel: "Olfactive Pyramid",
    description: "Французская эстетика высокой парфюмерии и нишевых ювелирных брендов. Ольфакторная пирамида нот аромата, сборка персонализированных подарочных боксов и подиумный зум.",
    highlights: ["Пирамида нот аромата", "Подарочные Luxe-боксы", "Макросъемка флаконов", "Золотые акценты"]
  },
  {
    id: "artisan-roastery",
    niche: "coffee",
    name: "Artisan Roastery",
    subtitle: "Specialty Coffee & Craft Bakery",
    categoryLabel: "Кофейни и Пекарни",
    editorialTag: "SPECIALTY GRADE",
    coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=90",
    previewUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=90",
    accentColor: "#D97706",
    paletteColors: ["#D97706", "#059669", "#78350F", "#1C1917"],
    themeTemplate: "universal",
    cardStyle: "compact",
    aspectRatio: "square",
    statsLabel: "100% Arabica",
    description: "Теплый скандинавский крафт для спешелти-кофеен и авторских пекарен. Дескрипторы вкусовых профилей зерен, выбор альтернативного молока и заказ к точному времени.",
    highlights: ["Профиль обжарки", "Выбор вида молока", "Самовывоз по таймеру", "Свежая выпечка"]
  }
];

export const RoboMarketPage: React.FC = () => {
  const { store, refreshMe } = useAuth();

  const [activeNiche, setActiveNiche] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [selectedColors, setSelectedColors] = useState<Record<string, string>>({
    "vogue-runway": "#18181B",
    "gourmet-grill": "#DC2626",
    "titanium-pro": "#2563EB",
    "crystall-luxury": "#9333EA",
    "artisan-roastery": "#D97706"
  });

  const [applyModalTemplate, setApplyModalTemplate] = useState<TemplateItem | null>(null);
  const [applyOption, setApplyOption] = useState<"design_only" | "full_catalog">("full_catalog");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredTemplates = activeNiche === "all"
    ? LUXURY_TEMPLATES
    : LUXURY_TEMPLATES.filter(t => t.niche === activeNiche);

  const isCurrentActive = (tpl: TemplateItem) => {
    return store?.theme_template === tpl.themeTemplate && store?.theme_business_niche === tpl.niche;
  };

  const handleApply = async () => {
    if (!applyModalTemplate) return;
    setIsApplying(true);
    try {
      const activeColor = selectedColors[applyModalTemplate.id] || applyModalTemplate.accentColor;

      if (applyOption === "full_catalog") {
        await api.post("/design/apply-niche/", {
          niche: applyModalTemplate.niche
        });
      }

      await api.post("/design/theme/save/", {
        primary_color: activeColor,
        theme_template: applyModalTemplate.themeTemplate,
        theme_business_niche: applyModalTemplate.niche,
        theme_card_style: applyModalTemplate.cardStyle,
        theme_image_aspect: applyModalTemplate.aspectRatio,
        banner_title: applyModalTemplate.name,
        banner_subtitle: applyModalTemplate.subtitle,
        banner_image_url: applyModalTemplate.coverImage
      });

      const appliedName = applyModalTemplate.name;
      setApplyModalTemplate(null);
      setPreviewTemplate(null);

      if (refreshMe) {
        await refreshMe();
      }

      setToastMessage(`Шаблон «${appliedName}» успешно установлен`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error("Apply error:", err);
      alert("Не удалось установить шаблон. Попробуйте еще раз.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-32 pt-2 px-1 text-slate-900 selection:bg-black selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-neutral-950 text-white px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header: Awwwards Minimalist Aesthetic */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tracking-wider uppercase border border-slate-200/80">
          <Sparkles className="w-3 h-3 text-slate-800" />
          <span>Curated Templates Collection • 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-950 leading-[1.1]">
          Готовые сайты для брендов, которые ценят эстетику.
        </h1>

        <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
          Коллекция высокотехнологичных шаблонов витрин с безупречной типографикой, плавным 120 FPS откликом и встроенной поддержкой Telegram Mini App.
        </p>
      </div>

      {/* Filter Tabs: Apple-Grade Glass Segmented Control */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "Все стили" },
          { id: "fashion", label: "Одежда и Мода" },
          { id: "restaurant", label: "Рестораны и Еда" },
          { id: "tech", label: "Техника и Гаджеты" },
          { id: "beauty", label: "Парфюмерия и Люкс" },
          { id: "coffee", label: "Кофейни и Пекарни" }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveNiche(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeNiche === tab.id
                ? "bg-white text-slate-950 shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Showcase Grid: Premium Gallery Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
        {filteredTemplates.map(tpl => {
          const isInstalled = isCurrentActive(tpl);
          const activeColor = selectedColors[tpl.id] || tpl.accentColor;

          return (
            <div
              key={tpl.id}
              className="group rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Visual Viewport */}
                <div
                  className="relative aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer select-none"
                  onClick={() => setPreviewTemplate(tpl)}
                >
                  <img
                    src={tpl.coverImage}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-semibold tracking-wider uppercase shadow-xs">
                      {tpl.editorialTag}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                      {tpl.statsLabel}
                    </span>
                  </div>

                  {/* Bottom Text Over Visual */}
                  <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between">
                    <div>
                      <span className="text-[11px] text-white/70 uppercase tracking-[0.18em] font-medium block">
                        {tpl.categoryLabel}
                      </span>
                      <h3 className="text-2xl font-semibold tracking-tight text-white mt-0.5">
                        {tpl.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(tpl);
                      }}
                      className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      title="Открыть превью"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-7 space-y-5">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {tpl.description}
                  </p>

                  {/* Highlights Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tpl.highlights.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-medium text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Palette Selector */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                      Палитра акцентов
                    </span>
                    <div className="flex items-center gap-2">
                      {tpl.paletteColors.map((color, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedColors(prev => ({ ...prev, [tpl.id]: color }))}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            activeColor === color
                              ? "ring-2 ring-slate-900 ring-offset-2 scale-110"
                              : "hover:scale-105 opacity-80"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-7 pt-0 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(tpl)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>Интерактивный показ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyModalTemplate(tpl)}
                  disabled={isInstalled}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                    isInstalled
                      ? "bg-slate-100 text-slate-500 cursor-default"
                      : "bg-slate-950 hover:bg-slate-800 text-white shadow-sm"
                  }`}
                >
                  {isInstalled ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Уже активен</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Установить шаблон</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* KEYNOTE STUDIO PREVIEW MODAL                                   */}
      {/* ============================================================== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-8 animate-in fade-in duration-300">
          <div className="bg-[#0C0E14] text-white w-full max-w-6xl h-[92vh] rounded-[32px] border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0 bg-[#0C0E14]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white leading-none">
                    {previewTemplate.name}
                  </h3>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    {previewTemplate.subtitle}
                  </span>
                </div>
              </div>

              {/* Viewport Control */}
              <div className="flex items-center bg-white/[0.06] p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone 16 TMA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    previewDevice === "tablet"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">iPad Air</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    previewDevice === "desktop"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>MacBook Pro</span>
                </button>
              </div>

              {/* Header Right */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalTemplate(previewTemplate)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-slate-950 text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Установить</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stage Canvas */}
            <div className="flex-1 bg-[#050608] p-4 sm:p-8 overflow-y-auto flex items-center justify-center">
              
              {/* Device Frame */}
              <div className={`transition-all duration-300 relative ${
                previewDevice === "mobile"
                  ? "w-[375px] h-[680px] max-h-full rounded-[48px] border-[4px] border-zinc-700 shadow-2xl p-3 bg-black flex flex-col"
                  : previewDevice === "tablet"
                  ? "w-[620px] h-[700px] max-h-full rounded-[36px] border-[4px] border-zinc-700 shadow-2xl p-3.5 bg-black flex flex-col"
                  : "w-full max-w-5xl h-[680px] max-h-full rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-950 flex flex-col overflow-hidden"
              }`}>
                
                {/* Dynamic Island */}
                {previewDevice === "mobile" && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2.5 border border-zinc-800 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700"></div>
                  </div>
                )}

                {/* Desktop Chrome */}
                {previewDevice === "desktop" && (
                  <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="flex-1 bg-black/50 px-3 py-1 rounded-lg text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                      <span className="text-emerald-400">https://</span>
                      <span>{store?.subdomain || "store"}.storebox.uz</span>
                    </div>
                  </div>
                )}

                {/* Inner Stage Showcase */}
                <div className={`w-full flex-1 overflow-y-auto no-scrollbar relative select-none ${
                  previewDevice === "mobile" ? "rounded-[36px] bg-white text-slate-900" :
                  previewDevice === "tablet" ? "rounded-[24px] bg-white text-slate-900" :
                  "bg-white text-slate-900"
                }`}>
                  
                  {/* Visual Header */}
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-xs tracking-wider uppercase text-slate-900">
                      {previewTemplate.name}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Корзина</span>
                    </div>
                  </div>

                  {/* Hero Showcase Visual */}
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={previewTemplate.coverImage}
                      alt={previewTemplate.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-6 text-white">
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/70">
                          {previewTemplate.editorialTag}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-semibold tracking-tight">
                          {previewTemplate.subtitle}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Highlights & Sample Catalog Items */}
                  <div className="p-6 space-y-5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-900 pb-2 border-b border-slate-100">
                      <span>Коллекция и особенности</span>
                      <span className="text-slate-400 font-normal">Студийный предпросмотр</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { title: "Флагманский образ 01", desc: "Премиальное исполнение", img: previewTemplate.coverImage },
                        { title: "Флагманский образ 02", desc: "Студийный свет и крой", img: previewTemplate.previewUrl }
                      ].map((card, i) => (
                        <div key={i} className="space-y-2 group cursor-pointer">
                          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80">
                            <img src={card.img} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900 truncate">{card.title}</div>
                            <div className="text-[11px] text-slate-500 truncate">{card.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MINIMALIST CONFIRMATION MODAL                                  */}
      {/* ============================================================== */}
      {applyModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Установка стиля
                </span>
                <h3 className="text-xl font-semibold tracking-tight text-slate-950 mt-1">
                  Установить «{applyModalTemplate.name}»?
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label
                onClick={() => setApplyOption("full_catalog")}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  applyOption === "full_catalog"
                    ? "border-slate-950 bg-slate-50 ring-1 ring-slate-950"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="apply_mode"
                  checked={applyOption === "full_catalog"}
                  onChange={() => setApplyOption("full_catalog")}
                  className="mt-1 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-950">
                    С демо-каталогом и фотографиями
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Загрузит профессиональные подиумные баннеры и товары для ниши «{applyModalTemplate.categoryLabel}».
                  </p>
                </div>
              </label>

              <label
                onClick={() => setApplyOption("design_only")}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  applyOption === "design_only"
                    ? "border-slate-950 bg-slate-50 ring-1 ring-slate-950"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="apply_mode"
                  checked={applyOption === "design_only"}
                  onChange={() => setApplyOption("design_only")}
                  className="mt-1 text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-950">
                    Применить только стиль оформления
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Сохранит существующие товары магазина, обновив палитру, форму карточек и типографику.
                  </p>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isApplying ? (
                  <span>Применение...</span>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Применить</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
