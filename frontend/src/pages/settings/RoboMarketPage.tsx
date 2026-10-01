import React, { useState } from "react";
import {
  Store as StoreIcon,
  Download,
  Check,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  Zap,
  Palette,
  CheckCircle2,
  ArrowRight,
  Star,
  X,
  ShieldCheck,
  Layers,
  Flame,
  Shirt,
  Utensils,
  Laptop,
  Coffee,
  Heart,
  SlidersHorizontal,
  ChevronRight,
  Crown,
  Clock,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

interface TemplateColorPreset {
  name: string;
  primary: string;
  bg: string;
}

interface StoreTemplate {
  id: string;
  niche: string;
  name: string;
  tagline: string;
  brandAesthetic: string;
  badge: string;
  badgeGradient: string;
  rating: string;
  reviewsCount: string;
  description: string;
  heroImage: string;
  colorPresets: TemplateColorPreset[];
  defaultPrimary: string;
  defaultBg: string;
  cardStyle: "minimal" | "compact" | "modern";
  cardRadius: string;
  imageAspect: "portrait" | "square";
  buttonStyle: "solid" | "pill" | "soft";
  template: "boutique" | "restaurant" | "universal";
  categoryIcon: React.ReactNode;
  categoryTag: string;
  keyHighlights: { label: string; desc: string }[];
  features: string[];
  bannerTitle: string;
  bannerSubtitle: string;
  demoStats: {
    conversion: string;
    speed: string;
    mobileScore: string;
  };
}

const TEMPLATES: StoreTemplate[] = [
  {
    id: "fashion-vogue",
    niche: "fashion",
    name: "Vogue & Minimal Runway",
    tagline: "Европейский подиумный минимализм, лукбуки 3:4 и тихий люкс",
    brandAesthetic: "Стиль Zara / Massimo Dutti / Jacquemus",
    badge: "ХИТ ПРОДАЖ • VOGUE",
    badgeGradient: "from-zinc-900 to-black text-white",
    rating: "4.99",
    reviewsCount: "248 магазинов",
    description: "Ультрасовременный подиумный стиль для брендов одежды, обуви и аксессуаров. Большие вертикальные лукбуки 3:4, скрытые карточки при наведении, интерактивные хотспоты «Shop the Look» и мгновенный выбор размеров (XS, S, M, L, XL).",
    heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85",
    colorPresets: [
      { name: "Obsidian Noir", primary: "#18181B", bg: "#FFFFFF" },
      { name: "Sand & Linen", primary: "#78350F", bg: "#FDFBF7" },
      { name: "Sage Olive", primary: "#3F6212", bg: "#F7FEE7" },
      { name: "Midnight Navy", primary: "#1E3A8A", bg: "#F8FAFC" }
    ],
    defaultPrimary: "#18181B",
    defaultBg: "#FFFFFF",
    cardStyle: "minimal",
    cardRadius: "none",
    imageAspect: "portrait",
    buttonStyle: "solid",
    template: "boutique",
    categoryIcon: <Shirt className="w-4 h-4 text-emerald-500" />,
    categoryTag: "Одежда и Мода",
    keyHighlights: [
      { label: "Lookbook 3:4", desc: "Вертикальные фотокарточки как в Vogue и Zara" },
      { label: "Shop the Look", desc: "Интерактивные хотспоты для покупки полного образа" },
      { label: "Quick-Size Bar", desc: "Выбор XS, S, M, L, XL прямо с витрины в 1 клик" },
      { label: "120 FPS Motion", desc: "Суперплавный скролл под Telegram Mini App" }
    ],
    features: [
      "Формат карточек 3:4 Lookbook с подиумной подачей",
      "Быстрый выбор размеров (XS, S, M, L, XL) и цветов в 1 тап",
      "Плавный зум студийных фото при наведении курсора",
      "Интерактивные хотспоты для покупки целого образа",
      "Оптимизировано под Telegram Mini App (120 FPS)"
    ],
    bannerTitle: "Новая Коллекция Осень-Зима 2026",
    bannerSubtitle: "Премиальный хлопок, безупречный крой и культовые фасоны. Доставка за 24 часа по всему Узбекистану.",
    demoStats: {
      conversion: "+34% средний чек",
      speed: "0.38s загрузка",
      mobileScore: "100% Mobile"
    }
  },
  {
    id: "food-gourmet",
    niche: "restaurant",
    name: "Gourmet Smash & Craft Grill",
    tagline: "Аппетитный фудтех с открытым огнем, конструктором вкуса и трекером доставки",
    brandAesthetic: "Стиль Shake Shack / Five Guys / Dodo",
    badge: "ИНТЕРАКТИВНЫЙ ГРИЛЬ",
    badgeGradient: "from-red-600 via-amber-600 to-red-800 text-white",
    rating: "5.0",
    reviewsCount: "312 ресторанов",
    description: "Сочный ресторанный фудтех-шаблон с интерактивной гриль-лабораторией «Собери сам» (выбор котлет, сыров, соусов на огне), живым расчетом калорий и веса, а также шкалой бесплатной термодоставки за 25 минут.",
    heroImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=85",
    colorPresets: [
      { name: "Flame Crimson", primary: "#DC2626", bg: "#0C0D11" },
      { name: "Mustard Gold", primary: "#D97706", bg: "#18181B" },
      { name: "Smash Grill", primary: "#B91C1C", bg: "#F8FAFC" }
    ],
    defaultPrimary: "#DC2626",
    defaultBg: "#0C0D11",
    cardStyle: "compact",
    cardRadius: "3xl",
    imageAspect: "square",
    buttonStyle: "pill",
    template: "restaurant",
    categoryIcon: <Utensils className="w-4 h-4 text-amber-500" />,
    categoryTag: "Еда и Рестораны",
    keyHighlights: [
      { label: "Burger Studio", desc: "Интерактивный выбор котлет, сыров и топпингов" },
      { label: "Live КБЖУ HUD", desc: "Живой расчет калорий, веса блюда и шкала сочности" },
      { label: "Термодоставка", desc: "Таймер обратного отсчета готовности за 25 минут" },
      { label: "100% Халяль", desc: "Официальные бейджи качества и ресторанная темная тема" }
    ],
    features: [
      "Встроенный интерактивный гриль-конструктор блюд",
      "Счетчик доставки и статус открытости заведения",
      "Компактные карточки с калориями, граммовкой и топпингами",
      "Плавающий стеклянный док с расчетом суммы до бесплатной доставки",
      "Мгновенный выбор модификаторов блюда"
    ],
    bannerTitle: "Сочные комбо со скидкой до 25%",
    bannerSubtitle: "Готовим на открытом огне из свежего 100% халяльного мяса. Горячая доставка в термосумке за 30 минут!",
    demoStats: {
      conversion: "+41% заказов",
      speed: "0.29s загрузка",
      mobileScore: "100% Mobile"
    }
  },
  {
    id: "tech-titanium",
    niche: "tech",
    name: "Cyber Titanium Pro",
    tagline: "Apple Obsidian Dark Mode, 4 цвета титана и Bento-сетка характеристик",
    brandAesthetic: "Стиль Apple Store / Dyson / Nothing Tech",
    badge: "APPLE STYLE • TITANIUM",
    badgeGradient: "from-blue-600 to-indigo-600 text-white",
    rating: "4.98",
    reviewsCount: "186 магазинов",
    description: "Технологичный флагманский дизайн в стиле Apple Store. Глубокий космический черный Obsidian (#05070B), переключение 4 оттенков титана, таблицы технических характеристик и конфигуратор памяти с расчетом рассрочки 0%.",
    heroImage: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1200&q=85",
    colorPresets: [
      { name: "Cobalt Electric", primary: "#2563EB", bg: "#05070A" },
      { name: "Cyber Emerald", primary: "#10B981", bg: "#06090E" },
      { name: "Titanium Silver", primary: "#38BDF8", bg: "#0F172A" }
    ],
    defaultPrimary: "#2563EB",
    defaultBg: "#05070A",
    cardStyle: "modern",
    cardRadius: "2xl",
    imageAspect: "square",
    buttonStyle: "pill",
    template: "universal",
    categoryIcon: <Laptop className="w-4 h-4 text-blue-500" />,
    categoryTag: "Техника и Гаджеты",
    keyHighlights: [
      { label: "Titanium Swatches", desc: "Переключение 4 оттенков корпуса в реальном времени" },
      { label: "Apple Bento Grid", desc: "Карточки чипа A18 Pro, экрана 120Hz и батареи" },
      { label: "Memory Switcher", desc: "Выбор 256GB / 512GB / 1TB с расчетом рассрочки 0%" },
      { label: "Гарантия 1 год", desc: "Бейджи официальной сертификации и оригинальности" }
    ],
    features: [
      "Obsidian Dark Mode с глубоким черным и акцентами Cobalt",
      "Сравнение характеристик (ОЗУ, SSD, процессор, дисплей)",
      "Селектор модификаций памяти и цвета корпуса в 1 тап",
      "Бейджи официальной гарантии 1 год и оригинальности",
      "Поддержка оформления в рассрочку и онлайн-оплаты"
    ],
    bannerTitle: "Флагманы 2026. Инновации в твоих руках",
    bannerSubtitle: "Оригинальные девайсы с официальной гарантией 1 год. Бесплатная доставка и настройка в день заказа.",
    demoStats: {
      conversion: "+29% доверие",
      speed: "0.32s загрузка",
      mobileScore: "100% Mobile"
    }
  },
  {
    id: "beauty-crystall",
    niche: "beauty",
    name: "Crystall Ami Royal Luxury",
    tagline: "Королевская парфюмерия, ольфакторная пирамида нот и подарочные Luxe-боксы",
    brandAesthetic: "Стиль Dior / Chanel / Нишевая парфюмерия",
    badge: "VIP БУТИК • LUXE",
    badgeGradient: "from-purple-600 via-fuchsia-600 to-amber-500 text-white",
    rating: "5.0",
    reviewsCount: "220 бутиков",
    description: "Роскошный дизайн для премиальной парфюмерии, ювелирных украшений и авторских ароматов. Золотые акценты, ольфакторная пирамида нот, студийные подиумы и сборка персонализированных Luxe-боксов с атласной лентой.",
    heroImage: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1200&q=85",
    colorPresets: [
      { name: "Royal Amethyst", primary: "#9333EA", bg: "#FAF5FF" },
      { name: "Rose Silk Gold", primary: "#E11D48", bg: "#FFF1F2" },
      { name: "Champagne Amber", primary: "#D97706", bg: "#FFFBEB" }
    ],
    defaultPrimary: "#9333EA",
    defaultBg: "#FAF5FF",
    cardStyle: "minimal",
    cardRadius: "3xl",
    imageAspect: "portrait",
    buttonStyle: "soft",
    template: "boutique",
    categoryIcon: <Crown className="w-4 h-4 text-purple-500" />,
    categoryTag: "Парфюмерия и Косметика",
    keyHighlights: [
      { label: "Пирамида нот", desc: "Верхние ноты, сердце и шлейф каждого аромата" },
      { label: "Сборка Luxe-бокса", desc: "Конструктор подарка с открыткой и лентой" },
      { label: "Подиумный зум", desc: "Студийная макросъемка флаконов высокой четкости" },
      { label: "Атмосфера роскоши", desc: "Золотое тиснение и элегантные шрифты с засечками" }
    ],
    features: [
      "Ольфакторная интерактивная пирамида нот аромата",
      "Конструктор подарочных премиум-боксов",
      "Студийная вертикальная галерея парфюмерных флаконов",
      "Бейджи оригинальности и тестеров для каждого аромата",
      "Подарочная упаковка в 1 клик при оформлении"
    ],
    bannerTitle: "Селективные шедевры парфюмерии",
    bannerSubtitle: "Оригинальные нишевые ароматы мировых брендов. Подарочный комплимент к каждому заказу!",
    demoStats: {
      conversion: "+38% средний чек",
      speed: "0.35s загрузка",
      mobileScore: "100% Mobile"
    }
  },
  {
    id: "coffee-artisan",
    niche: "coffee",
    name: "Artisan Specialty Coffee",
    tagline: "Свежая обжарка 100% арабики, кастомизация молока и заказ к точному времени",
    brandAesthetic: "Стиль Blue Bottle / Starbucks Reserve",
    badge: "SPECIALTY COFFEE",
    badgeGradient: "from-amber-700 to-orange-900 text-white",
    rating: "4.97",
    reviewsCount: "140 кофеен",
    description: "Теплый крафтовый дизайн для спешелти-кофеен, пекарен и кондитерских. Дескрипторы вкуса зерен, выбор альтернативного молока (овсяное, миндальное, кокосовое) и быстрый заказ с самовывозом к указанной минуте.",
    heroImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85",
    colorPresets: [
      { name: "Roasted Espresso", primary: "#D97706", bg: "#FFFDF8" },
      { name: "Creamy Matcha", primary: "#059669", bg: "#F0FDF4" },
      { name: "Dark Cocoa", primary: "#78350F", bg: "#FAF5F0" }
    ],
    defaultPrimary: "#D97706",
    defaultBg: "#FFFDF8",
    cardStyle: "compact",
    cardRadius: "2xl",
    imageAspect: "square",
    buttonStyle: "pill",
    template: "universal",
    categoryIcon: <Coffee className="w-4 h-4 text-amber-600" />,
    categoryTag: "Кофейни и Пекарни",
    keyHighlights: [
      { label: "Профиль зерна", desc: "Уровень кислотности, плотности и регион происхождения" },
      { label: "Выбор молока", desc: "Овсяное, миндальное, кокосовое и безлактозное в 1 тап" },
      { label: "Самовывоз по таймеру", desc: "Приготовим любимый кофе ровно к вашему приходу" },
      { label: "Свежая выпечка", desc: "Утренние комбо с круассанами со скидкой" }
    ],
    features: [
      "Карточки напитков с выбором объема (250мл / 350мл / 450мл)",
      "Кастомизация вида молока и сладких сиропов",
      "Утренние спецпредложения «Кофе + Свежий круассан»",
      "Быстрый самовывоз к указанному времени или доставка курьером",
      "Уютная кофейная палитра Roasted Beans & Warm Milk"
    ],
    bannerTitle: "Свежеобжаренный спешелти кофе и выпечка",
    bannerSubtitle: "100% арабика свежей обжарки. Приготовим любимый напиток за 5 минут к вашему приходу.",
    demoStats: {
      conversion: "+30% повторных заказов",
      speed: "0.28s загрузка",
      mobileScore: "100% Mobile"
    }
  }
];

export const RoboMarketPage: React.FC = () => {
  const { t, store, refreshMe } = useAuth();

  const [activeTab, setActiveTab] = useState<"templates" | "integrations">("templates");
  const [selectedNicheFilter, setSelectedNicheFilter] = useState<string>("all");

  // Dynamic color selection per card
  const [selectedColorMap, setSelectedColorMap] = useState<Record<string, string>>({
    "fashion-vogue": "#18181B",
    "food-gourmet": "#DC2626",
    "tech-titanium": "#2563EB",
    "beauty-crystall": "#9333EA",
    "coffee-artisan": "#D97706"
  });

  // Spotlight Hero Template
  const [heroTemplateId, setHeroTemplateId] = useState<string>("fashion-vogue");
  const heroTemplate = TEMPLATES.find(t => t.id === heroTemplateId) || TEMPLATES[0];

  // Interactive Live Preview Modal State
  const [previewTemplate, setPreviewTemplate] = useState<StoreTemplate | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [simulatedCartCount, setSimulatedCartCount] = useState<number>(1);
  const [interactiveSelectedSize, setInteractiveSelectedSize] = useState<string>("M");
  const [interactivePatty, setInteractivePatty] = useState<string>("angus");
  const [interactiveCheese, setInteractiveCheese] = useState<boolean>(true);
  const [interactiveBacon, setInteractiveBacon] = useState<boolean>(true);
  const [interactiveTechColor, setInteractiveTechColor] = useState<string>("desert");
  const [interactiveTechStorage, setInteractiveTechStorage] = useState<string>("256GB");

  // Apply Template Modal State
  const [applyModalTemplate, setApplyModalTemplate] = useState<StoreTemplate | null>(null);
  const [applyOption, setApplyOption] = useState<"design_only" | "full_catalog">("full_catalog");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<{ show: boolean; templateName: string }>({
    show: false,
    templateName: ""
  });

  const apps = [
    {
      id: 1,
      name: t("market_yespos_title") || "YES POS Синхронизация",
      desc: t("market_yespos_desc") || "Обновление товаров и складских остатков в реальном времени",
      installed: true,
      category: "Касса и Склад"
    },
    {
      id: 2,
      name: t("market_ai_title") || "AI Генератор описаний",
      desc: t("market_ai_desc") || "Создание продающих описаний товаров с помощью искусственного интеллекта",
      installed: true,
      category: "Искусственный интеллект"
    },
    {
      id: 3,
      name: t("market_yandex_title") || "Yandex Go Доставка",
      desc: t("market_yandex_desc") || "Автоматический вызов курьеров и интеграция логистики",
      installed: true,
      category: "Логистика"
    },
    {
      id: 4,
      name: t("market_insta_title") || "Instagram Direct Sync",
      desc: t("market_insta_desc") || "Автоматические продажи и чекаут через Instagram Direct",
      installed: false,
      category: "Социальные сети"
    }
  ];

  const filteredTemplates = selectedNicheFilter === "all"
    ? TEMPLATES
    : TEMPLATES.filter(tpl => tpl.niche === selectedNicheFilter);

  const handleApplyTemplate = async () => {
    if (!applyModalTemplate) return;
    setIsApplying(true);
    try {
      const chosenColor = selectedColorMap[applyModalTemplate.id] || applyModalTemplate.defaultPrimary;

      if (applyOption === "full_catalog") {
        // Apply full turnkey catalog and design settings
        await api.post("/design/apply-niche/", {
          niche: applyModalTemplate.niche
        });
      }

      // Save design theme configuration cleanly
      await api.post("/design/theme/save/", {
        primary_color: chosenColor,
        theme_template: applyModalTemplate.template,
        theme_business_niche: applyModalTemplate.niche,
        theme_bg_color: applyModalTemplate.defaultBg,
        theme_card_style: applyModalTemplate.cardStyle,
        theme_card_radius: applyModalTemplate.cardRadius,
        theme_image_aspect: applyModalTemplate.imageAspect,
        theme_button_style: applyModalTemplate.buttonStyle,
        banner_title: applyModalTemplate.bannerTitle,
        banner_subtitle: applyModalTemplate.bannerSubtitle,
        banner_image_url: applyModalTemplate.heroImage
      });

      const appliedName = applyModalTemplate.name;
      setApplyModalTemplate(null);
      setPreviewTemplate(null);

      // Refresh store context so dashboard updates immediately
      if (refreshMe) {
        await refreshMe();
      }

      setSuccessToast({ show: true, templateName: appliedName });
      setTimeout(() => setSuccessToast({ show: false, templateName: "" }), 4000);
    } catch (err) {
      console.error("Failed to apply template:", err);
      alert("Ошибка при установке шаблона. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsApplying(false);
    }
  };

  const isCurrentTemplate = (tpl: StoreTemplate) => {
    return (
      store?.theme_template === tpl.template &&
      store?.theme_business_niche === tpl.niche
    );
  };

  const openPreview = (tpl: StoreTemplate) => {
    setPreviewTemplate(tpl);
    setSimulatedCartCount(1);
    setInteractiveSelectedSize("M");
    setInteractivePatty("angus");
    setInteractiveCheese(true);
    setInteractiveBacon(true);
    setInteractiveTechColor("desert");
    setInteractiveTechStorage("256GB");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-24">
      {/* Toast Notification */}
      {successToast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-6 py-4 rounded-3xl shadow-2xl border border-slate-700/80 flex items-center gap-3.5 animate-in fade-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-black flex items-center gap-2">
              <span>Шаблон «{successToast.templateName}» активирован!</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Стиль и параметры оформления успешно применены к вашей витрине.
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[11px] font-bold tracking-wider uppercase mb-2 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>StoreBox Marketplace Studio 2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Маркет готовых шаблонов сайтов
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-2xl leading-relaxed">
            Премиальные дизайнерские сайты уровня Awwwards и Apple. Анимированные компоненты, высокая скорость загрузки и 100% адаптация под Telegram Mini App.
          </p>
        </div>

        {/* Global Tabs Switcher */}
        <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Шаблоны сайтов</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
              {TEMPLATES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "integrations"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <StoreIcon className="w-4 h-4 text-blue-600" />
            <span>Интеграции & Модули</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {apps.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: WEBSITE TEMPLATES MARKETPLACE                             */}
      {/* ============================================================== */}
      {activeTab === "templates" && (
        <div className="space-y-8">
          
          {/* Spotlight Hero Banner */}
          <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-zinc-950 text-white p-6 sm:p-10 shadow-2xl border border-slate-800">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-25 pointer-events-none bg-radial from-purple-500/30 via-transparent to-transparent"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15 text-[11px] font-bold tracking-wider uppercase">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>ТРЕНД 2026 ГОДА • ПРЕМИАЛЬНЫЙ ДИЗАЙН</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                  {heroTemplate.name}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {heroTemplate.tagline}. Полноэкранный подиумный лукбук 3:4, скрытые карточки при наведении и моментальный выбор размеров прямо с витрины.
                </p>

                {/* Key Benefits */}
                <div className="grid grid-cols-3 gap-3 py-2">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Конверсия</span>
                    <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">{heroTemplate.demoStats.conversion}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Скорость</span>
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono">{heroTemplate.demoStats.speed}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Мобильность</span>
                    <span className="text-sm sm:text-base font-black text-purple-300 font-mono">100% TMA</span>
                  </div>
                </div>

                {/* Spotlight Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openPreview(heroTemplate)}
                    className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-xl flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span>Интерактивный просмотр (Live Demo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApplyModalTemplate(heroTemplate)}
                    className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-purple-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Установить в 1 клик</span>
                  </button>
                </div>
              </div>

              {/* Spotlight Visual Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm aspect-[4/3] rounded-3xl overflow-hidden border border-white/20 shadow-2xl group cursor-pointer"
                     onClick={() => openPreview(heroTemplate)}>
                  <img
                    src={heroTemplate.heroImage}
                    alt={heroTemplate.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-5">
                    <div>
                      <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                        {heroTemplate.brandAesthetic}
                      </span>
                      <div className="text-sm font-bold text-white mt-1">Нажмите для интерактивного теста</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: "all", label: "Все направления", icon: <Layers className="w-3.5 h-3.5" /> },
              { id: "fashion", label: "Одежда и Мода", icon: <Shirt className="w-3.5 h-3.5" /> },
              { id: "restaurant", label: "Рестораны и Еда", icon: <Utensils className="w-3.5 h-3.5" /> },
              { id: "tech", label: "Техника и Гаджеты", icon: <Laptop className="w-3.5 h-3.5" /> },
              { id: "beauty", label: "Парфюмерия и Люкс", icon: <Crown className="w-3.5 h-3.5" /> },
              { id: "coffee", label: "Кофейни и Пекарни", icon: <Coffee className="w-3.5 h-3.5" /> }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedNicheFilter(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedNicheFilter === cat.id
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80"
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredTemplates.map(tpl => {
              const activeColor = selectedColorMap[tpl.id] || tpl.defaultPrimary;
              const isCurrent = isCurrentTemplate(tpl);

              return (
                <div
                  key={tpl.id}
                  className="bg-white rounded-[32px] border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Hero Thumbnail Preview */}
                    <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden cursor-pointer"
                         onClick={() => openPreview(tpl)}>
                      <img
                        src={tpl.heroImage}
                        alt={tpl.name}
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20"></div>

                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${tpl.badgeGradient} shadow-md`}>
                          {tpl.badge}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/20">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span>{tpl.rating}</span>
                          <span className="opacity-50">•</span>
                          <span className="text-[10px] opacity-80">{tpl.reviewsCount}</span>
                        </span>
                      </div>

                      {/* Bottom Title inside Image */}
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block font-mono">
                          {tpl.brandAesthetic}
                        </span>
                        <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                          {tpl.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {tpl.description}
                      </p>

                      {/* Interactive Palette Dots */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                          Цветовые темы:
                        </span>
                        <div className="flex items-center gap-2">
                          {tpl.colorPresets.map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setSelectedColorMap(prev => ({ ...prev, [tpl.id]: preset.primary }))}
                              className={`w-6 h-6 rounded-full transition-all cursor-pointer relative ${
                                activeColor === preset.primary
                                  ? "ring-2 ring-slate-900 ring-offset-2 scale-110"
                                  : "hover:scale-105 opacity-85"
                              }`}
                              style={{ backgroundColor: preset.primary }}
                              title={preset.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Feature Chips */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        {tpl.keyHighlights.map((feat, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                            <span className="font-bold text-slate-800 text-[11px] leading-tight truncate">{feat.label}</span>
                            <span className="text-[10px] text-slate-500 mt-0.5 truncate">{feat.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-6 pt-0 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openPreview(tpl)}
                      className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>Live Demo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApplyModalTemplate(tpl)}
                      disabled={isCurrent}
                      className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                        isCurrent
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black cursor-default"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Активен в магазине</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Установить в 1 клик</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EXISTING INTEGRATIONS & APPS                            */}
      {/* ============================================================== */}
      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apps.map(a => (
            <div key={a.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shadow-xs">
                  <StoreIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block font-mono">
                    {a.category}
                  </span>
                  <h3 className="text-sm font-black text-slate-900">{a.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                </div>
              </div>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  a.installed
                    ? "bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {a.installed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Подключено</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Подключить</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* INTERACTIVE STUDIO PREVIEW MODAL                                */}
      {/* ============================================================== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white w-full max-w-6xl h-[92vh] rounded-[36px] border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold">
                  {previewTemplate.categoryIcon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white leading-tight">
                    {previewTemplate.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {previewTemplate.brandAesthetic}
                  </span>
                </div>
              </div>

              {/* Viewport Switcher */}
              <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone 16 (TMA)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "tablet"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">iPad Air</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewDevice === "desktop"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>MacBook Pro</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setApplyModalTemplate(previewTemplate)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Установить этот шаблон</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Studio Canvas Area with Interactive Simulation */}
            <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex items-center justify-center">
              
              {/* Device Frame */}
              <div className={`transition-all duration-300 ${
                previewDevice === "mobile"
                  ? "w-[380px] h-[700px] max-h-full rounded-[50px] border-[5px] border-slate-700 shadow-2xl p-3 bg-black flex flex-col relative"
                  : previewDevice === "tablet"
                  ? "w-[640px] h-[720px] max-h-full rounded-[40px] border-[5px] border-slate-700 shadow-2xl p-4 bg-black flex flex-col relative"
                  : "w-full max-w-5xl h-[720px] max-h-full rounded-3xl border border-slate-700 shadow-2xl bg-slate-900 flex flex-col overflow-hidden"
              }`}>
                
                {/* Mobile Dynamic Island */}
                {previewDevice === "mobile" && (
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3 border border-slate-800 pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700"></div>
                  </div>
                )}

                {/* Desktop URL Bar */}
                {previewDevice === "desktop" && (
                  <div className="px-5 py-3 bg-slate-800 border-b border-slate-700 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    </div>
                    <div className="flex-1 bg-slate-900/90 px-4 py-1.5 rounded-xl text-xs text-slate-300 font-mono flex items-center gap-2">
                      <span className="text-emerald-400">https://</span>
                      <span>{store?.subdomain || "store"}.storebox.uz</span>
                      <span className="text-purple-400 ml-auto font-sans font-bold">PREVIEW MODE</span>
                    </div>
                  </div>
                )}

                {/* Inner Interactive Store Screen */}
                <div className={`w-full flex-1 overflow-y-auto no-scrollbar relative select-none ${
                  previewDevice === "mobile" ? "rounded-[38px] bg-white text-slate-900" :
                  previewDevice === "tablet" ? "rounded-[28px] bg-white text-slate-900" :
                  "bg-white text-slate-900"
                }`}>

                  {/* -------------------------------------------------------- */}
                  {/* SIMULATED TEMPLATE: ZARA FASHION RUNWAY                  */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.niche === "fashion" && (
                    <div className="w-full bg-white text-black font-sans min-h-full">
                      {/* Top Marquee */}
                      <div className="bg-black text-white text-[10px] py-1.5 px-3 font-bold tracking-[0.22em] uppercase text-center flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>AUTUMN / WINTER 2026 RUNWAY CAPSULE</span>
                      </div>

                      {/* Header */}
                      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-black/10 px-4 py-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-neutral-600">NEW IN</span>
                        <span className="font-serif font-black text-xl tracking-[0.25em] uppercase">Z A R A</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider">
                          <span>BAG</span>
                          <span className="w-4 h-4 rounded-full bg-black text-white text-[9px] flex items-center justify-center font-mono" x-text="simulatedCartCount">
                            {simulatedCartCount}
                          </span>
                        </div>
                      </div>

                      {/* Runway Hero */}
                      <div className="relative min-h-[360px] bg-neutral-900 overflow-hidden flex items-end p-6 select-none">
                        <img
                          src={previewTemplate.heroImage}
                          alt="Zara Model"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                        {/* Interactive Hotspot */}
                        <div className="absolute top-[40%] left-[48%] z-10">
                          <button
                            type="button"
                            onClick={() => setSimulatedCartCount(c => c + 1)}
                            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                            title="Shop the Look"
                          >
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="font-black text-xs">+</span>
                          </button>
                        </div>

                        <div className="relative z-10 text-white space-y-2">
                          <span className="text-[9px] font-bold uppercase tracking-[0.25em] px-2 py-0.5 border border-white/40 bg-black/50">
                            RUNWAY CAPSULE
                          </span>
                          <h2 className="text-2xl font-black font-serif uppercase tracking-tight">
                            AUTUMN 2026
                          </h2>
                          <div className="flex items-center gap-2 pt-1">
                            {["XS", "S", "M", "L", "XL"].map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  setInteractiveSelectedSize(sz);
                                  setSimulatedCartCount(c => c + 1);
                                }}
                                className={`px-2 py-1 text-[10px] font-bold border transition-colors cursor-pointer ${
                                  interactiveSelectedSize === sz
                                    ? "bg-white text-black border-white"
                                    : "bg-black/60 text-white border-white/40 hover:border-white"
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Lookbook 3:4 Catalog Cards */}
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {[
                          { title: "OVERSIZED TRENCH", price: "1 890 000 UZS", img: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80" },
                          { title: "WIDE-LEG DENIM", price: "790 000 UZS", img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80" }
                        ].map((prod, i) => (
                          <div key={i} className="space-y-1.5 cursor-pointer" onClick={() => setSimulatedCartCount(c => c + 1)}>
                            <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative group">
                              <img src={prod.img} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-x-0 bottom-0 bg-white/95 p-2 text-center text-[9px] font-bold tracking-widest uppercase border-t border-black/10">
                                QUICK ADD • {interactiveSelectedSize}
                              </div>
                            </div>
                            <div className="text-[11px] font-bold uppercase truncate">{prod.title}</div>
                            <div className="text-[10px] font-mono font-bold text-neutral-600">{prod.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* SIMULATED TEMPLATE: GOURMET BURGER                       */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.niche === "restaurant" && (
                    <div className="w-full bg-[#0C0D11] text-white font-sans min-h-full p-4 space-y-4">
                      {/* Top Bar */}
                      <div className="bg-gradient-to-r from-red-800 to-amber-600 text-white text-[9.5px] py-1 px-3 font-black uppercase text-center rounded-lg">
                        🔥 ОТКРЫТЫЙ ГРИЛЬ: СВЕЖИЙ SMASH-БИФШТЕКС
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between py-1 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍔</span>
                          <span className="font-black text-sm">Gourmet Smash Co.</span>
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-red-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                          <span>Корзина:</span>
                          <span className="font-mono text-amber-300">{simulatedCartCount}</span>
                        </div>
                      </div>

                      {/* Interactive Burger Studio */}
                      <div className="rounded-3xl bg-[#14161F] p-4 border border-amber-500/30 space-y-3">
                        <div className="text-center">
                          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">ИНТЕРАКТИВНЫЙ ГРИЛЬ</span>
                          <h4 className="text-base font-black text-white mt-0.5">Фирменный Craft Burger</h4>
                        </div>

                        {/* Burger Hero Visual */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/60 flex items-center justify-center">
                          <img
                            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80"
                            alt="Burger"
                            className="max-h-full object-contain filter drop-shadow-2xl"
                          />
                        </div>

                        {/* Real-Time Live HUD */}
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-white/5 border border-white/10 text-center font-mono text-[11px]">
                          <div>
                            <span className="text-[9px] text-neutral-400 block font-sans">КБЖУ</span>
                            <span className="font-black text-amber-400">{interactiveCheese && interactiveBacon ? "820 ккал" : "640 ккал"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 block font-sans">Вес</span>
                            <span className="font-black text-white">{interactiveCheese && interactiveBacon ? "360 г" : "290 г"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-400 block font-sans">Сочность</span>
                            <span className="font-black text-red-400">99% 🔥</span>
                          </div>
                        </div>

                        {/* Interactive Toppings */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setInteractiveCheese(!interactiveCheese)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                              interactiveCheese ? "border-amber-500 bg-amber-500/20 text-amber-300" : "border-white/10 bg-white/5 text-neutral-400"
                            }`}
                          >
                            <span>🧀 Чеддер x2</span>
                            <span>+8 000</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setInteractiveBacon(!interactiveBacon)}
                            className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer ${
                              interactiveBacon ? "border-red-500 bg-red-500/20 text-red-300" : "border-white/10 bg-white/5 text-neutral-400"
                            }`}
                          >
                            <span>🥓 Бекон дуб</span>
                            <span>+12 000</span>
                          </button>
                        </div>

                        {/* Buy Button */}
                        <button
                          type="button"
                          onClick={() => setSimulatedCartCount(c => c + 1)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Flame className="w-4 h-4 fill-amber-200 text-amber-200" />
                          <span>ЗАКАЗАТЬ ШЕДЕВР ({interactiveCheese && interactiveBacon ? "78 000 UZS" : "58 000 UZS"})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* SIMULATED TEMPLATE: APPLE TECH PRO                       */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.niche === "tech" && (
                    <div className="w-full bg-[#05070A] text-white font-sans min-h-full p-4 space-y-4">
                      {/* Top Bar */}
                      <div className="bg-black text-neutral-400 text-[9.5px] py-1 px-3 font-mono uppercase text-center rounded-lg border border-white/10">
                        НОВИНКА 2026: ОФИЦИАЛЬНАЯ ГАРАНТИЯ 1 ГОД
                      </div>

                      {/* Header */}
                      <div className="flex items-center justify-between py-1 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-4 h-4 text-blue-500" />
                          <span className="font-black text-sm">Titanium Pro</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1.5">
                          <span>Корзина ({simulatedCartCount})</span>
                        </div>
                      </div>

                      {/* Flagship Color Stage */}
                      <div className="rounded-3xl bg-[#0D1017] p-5 border border-white/10 space-y-4">
                        <div className="text-center">
                          <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest font-bold">A18 PRO CHIP</span>
                          <h4 className="text-lg font-black text-white mt-0.5">iPhone 16 Pro Max</h4>
                        </div>

                        {/* Interactive Color Device Photo */}
                        <div className="aspect-square max-w-[200px] mx-auto flex items-center justify-center">
                          <img
                            src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80"
                            alt="Titanium Device"
                            className="max-h-full object-contain filter drop-shadow-2xl"
                          />
                        </div>

                        {/* Titanium Color Dots */}
                        <div className="flex items-center justify-center gap-3">
                          {[
                            { id: "desert", name: "Desert", hex: "#C5A880" },
                            { id: "natural", name: "Natural", hex: "#9A968D" },
                            { id: "white", name: "White", hex: "#E3E4E6" },
                            { id: "black", name: "Black", hex: "#2B2B2E" }
                          ].map(col => (
                            <button
                              key={col.id}
                              type="button"
                              onClick={() => setInteractiveTechColor(col.id)}
                              className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                                interactiveTechColor === col.id ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : "opacity-70"
                              }`}
                              style={{ backgroundColor: col.hex }}
                              title={col.name}
                            />
                          ))}
                        </div>

                        {/* Memory Selector */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold">
                          {["256GB", "512GB", "1TB"].map(mem => (
                            <button
                              key={mem}
                              type="button"
                              onClick={() => setInteractiveTechStorage(mem)}
                              className={`py-2 rounded-xl border transition-all cursor-pointer ${
                                interactiveTechStorage === mem
                                  ? "border-blue-500 bg-blue-500/20 text-white font-black"
                                  : "border-white/10 bg-white/5 text-neutral-400"
                              }`}
                            >
                              {mem}
                            </button>
                          ))}
                        </div>

                        {/* Buy Action */}
                        <button
                          type="button"
                          onClick={() => setSimulatedCartCount(c => c + 1)}
                          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
                        >
                          КУПИТЬ В 1 КЛИК ({interactiveTechStorage === "1TB" ? "19 400 000 UZS" : interactiveTechStorage === "512GB" ? "16 900 000 UZS" : "14 800 000 UZS"})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* SIMULATED TEMPLATE: BEAUTY / COFFEE FALLBACK             */}
                  {/* -------------------------------------------------------- */}
                  {(previewTemplate.niche === "beauty" || previewTemplate.niche === "coffee") && (
                    <div className="w-full bg-white text-slate-900 font-sans min-h-full p-4 space-y-4">
                      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
                        <img src={previewTemplate.heroImage} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 text-white">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-md">
                              {previewTemplate.categoryTag}
                            </span>
                            <h4 className="text-lg font-black mt-1">{previewTemplate.name}</h4>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{previewTemplate.bannerTitle}</span>
                          <span className="text-purple-600 font-mono">Luxe Edition</span>
                        </div>
                        <p className="text-xs text-slate-500">{previewTemplate.bannerSubtitle}</p>
                        <button
                          type="button"
                          onClick={() => setSimulatedCartCount(c => c + 1)}
                          className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          Добавить в корзину ({simulatedCartCount})
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* APPLY CONFIRMATION MODAL                                       */}
      {/* ============================================================== */}
      {applyModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl max-w-md w-full p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
                <Zap className="w-6 h-6 fill-purple-600" />
              </div>
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block font-mono">
                Установка темы оформления
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Установить «{applyModalTemplate.name}»?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Выберите, как именно вы хотите применить шаблон к вашему магазину <b>{store?.name}</b>:
              </p>
            </div>

            {/* Options Selector */}
            <div className="space-y-3">
              {/* Option A: Full Turnkey with Catalog */}
              <label
                onClick={() => setApplyOption("full_catalog")}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  applyOption === "full_catalog"
                    ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="apply_mode"
                  checked={applyOption === "full_catalog"}
                  onChange={() => setApplyOption("full_catalog")}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <span>Под ключ (с демо-каталогом и фото)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Рекомендуется</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Автоматически загрузит профессиональные фото, баннеры и товары для ниши «{applyModalTemplate.categoryTag}».
                  </p>
                </div>
              </label>

              {/* Option B: Design Style Only */}
              <label
                onClick={() => setApplyOption("design_only")}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                  applyOption === "design_only"
                    ? "border-purple-600 bg-purple-50/60 ring-1 ring-purple-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="apply_mode"
                  checked={applyOption === "design_only"}
                  onChange={() => setApplyOption("design_only")}
                  className="mt-1 text-purple-600 focus:ring-purple-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900">
                    Применить только стиль оформления
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Сохранит ваши существующие товары, обновив палитру, скругления, баннеры и стиль карточек.
                  </p>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleApplyTemplate}
                disabled={isApplying}
                className="flex-1 py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Применение...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
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
