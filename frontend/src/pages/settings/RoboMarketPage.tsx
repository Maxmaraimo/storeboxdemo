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
  Sparkles,
  ShoppingBag,
  Flame,
  Heart,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  Sliders,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

// ============================================================================
// TYPES & DATA STRUCTURES
// ============================================================================

interface ColorSwatch {
  name: string;
  hex: string;
}

interface ProductPreviewItem {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  tag?: string;
  desc: string;
}

interface TemplateData {
  id: string;
  niche: string;
  name: string;
  tagline: string;
  aestheticLabel: string;
  badge: string;
  heroImage: string;
  accentColor: string;
  colorSwatches: ColorSwatch[];
  themeTemplate: "boutique" | "restaurant" | "universal";
  cardStyle: "minimal" | "compact" | "modern";
  aspectRatio: "portrait" | "square";
  description: string;
  highlights: string[];
  sampleCategories: string[];
  sampleProducts: ProductPreviewItem[];
  stats: { label: string; value: string }[];
}

const TEMPLATES_CATALOG: TemplateData[] = [
  {
    id: "vogue-runway",
    niche: "fashion",
    name: "Vogue Runway",
    tagline: "High Fashion & Editorial Lookbook",
    aestheticLabel: "Стиль Zara / Massimo Dutti / Jacquemus",
    badge: "AWWWARDS HONORS",
    heroImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=90",
    accentColor: "#18181B",
    colorSwatches: [
      { name: "Obsidian Noir", hex: "#18181B" },
      { name: "Desert Sand", hex: "#854D0E" },
      { name: "Sage Olive", hex: "#3F6212" },
      { name: "Midnight Indigo", hex: "#1E3A8A" }
    ],
    themeTemplate: "boutique",
    cardStyle: "minimal",
    aspectRatio: "portrait",
    description: "Бескомпромиссный европейский минимализм в духе миланских и парижских недель моды. Подиумные лукбуки 3:4, скрытые карточки при наведении, интерактивный Shop the Look и моментальный выбор размеров XS-XL.",
    highlights: ["Подиумная сетка 3:4", "Shop the Look хотспоты", "Всплывающий выбор XS-XL", "120 FPS анимации"],
    sampleCategories: ["Все", "Новая коллекция", "Пальто & Тренчи", "Шелк & Платья", "Деним"],
    sampleProducts: [
      {
        id: 101,
        name: "Oversized Tailored Trench",
        category: "Пальто & Тренчи",
        price: 1890000,
        oldPrice: 2200000,
        image: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=90",
        tag: "RUNWAY",
        desc: "Двубортный тренч из водоотталкивающего хлопка с контрастным поясом."
      },
      {
        id: 102,
        name: "Wide-Leg Indigo Denim",
        category: "Деним",
        price: 790000,
        image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=90",
        tag: "EDITORIAL",
        desc: "Прямой расслабленный крой с высокой посадкой и акцентной строчкой."
      },
      {
        id: 103,
        name: "Ribbed Cashmere Knit",
        category: "Новая коллекция",
        price: 650000,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=90",
        desc: "Ультрамягкий кашемировый лонгслив мелкой вязки с высоким воротом."
      },
      {
        id: 104,
        name: "Silk Satin Slip Dress",
        category: "Шелк & Платья",
        price: 920000,
        oldPrice: 1100000,
        image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=90",
        tag: "LIMITED",
        desc: "Элегантное вечернее платье-комбинация из натурального шелка."
      }
    ],
    stats: [
      { label: "Конверсия", value: "+34%" },
      { label: "Скорость", value: "0.28s" },
      { label: "Оптимизация", value: "100% TMA" }
    ]
  },
  {
    id: "gourmet-grill",
    niche: "restaurant",
    name: "Gourmet Grillhouse",
    tagline: "Craft Smash Burgers & Open Flame Kitchen",
    aestheticLabel: "Стиль Shake Shack / Five Guys / Dodo",
    badge: "INTERACTIVE GRILL",
    heroImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1600&q=90",
    accentColor: "#DC2626",
    colorSwatches: [
      { name: "Flame Red", hex: "#DC2626" },
      { name: "Mustard Gold", hex: "#D97706" },
      { name: "Smash Charcoal", hex: "#18181B" },
      { name: "Chili Crimson", hex: "#991B1B" }
    ],
    themeTemplate: "restaurant",
    cardStyle: "compact",
    aspectRatio: "square",
    description: "Сочный ресторанный фудтех-шаблон с открытым грилем. Интерактивная гриль-лаборатория бургеров, живой расчет КБЖУ порции, шкала сочности и трекер термодоставки за 25 минут.",
    highlights: ["Гриль-конструктор блюд", "Живой КБЖУ HUD", "Термодоставка 25 мин", "100% Халяль мясо"],
    sampleCategories: ["Все меню", "Крафт-Бургеры", "Снеки & Фри", "Соусы", "Напитки"],
    sampleProducts: [
      {
        id: 201,
        name: "Black Angus Double Smash",
        category: "Крафт-Бургеры",
        price: 68000,
        oldPrice: 75000,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=90",
        tag: "ХИТ ГРИЛЯ",
        desc: "Две сочные котлеты из мраморной говядины, выдержанный Чеддер, соус айоли."
      },
      {
        id: 202,
        name: "Crispy Country Chicken",
        category: "Крафт-Бургеры",
        price: 52000,
        image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=90",
        desc: "Филе в хрустящей кукурузной панировке, айсберг и медовая горчица."
      },
      {
        id: 203,
        name: "Truffle Parmesan Rustic Fries",
        category: "Снеки & Фри",
        price: 26000,
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=90",
        tag: "ШЕФ-ВЫБОР",
        desc: "Хрустящий картофель фри с трюфельным маслом и тертым пармезаном."
      },
      {
        id: 204,
        name: "Blood Orange Craft Soda",
        category: "Напитки",
        price: 22000,
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=90",
        desc: "Освежающий натуральный лимонад на основе красного сицилийского апельсина."
      }
    ],
    stats: [
      { label: "Доставка", value: "25 мин" },
      { label: "Температура", value: "320°C Гриль" },
      { label: "Сертификация", value: "100% Halal" }
    ]
  },
  {
    id: "titanium-studio",
    niche: "tech",
    name: "Titanium Studio",
    tagline: "Apple Store Aesthetics & Obsidian Dark",
    aestheticLabel: "Стиль Apple Store / Dyson / Nothing Tech",
    badge: "APPLE KEYNOTE",
    heroImage: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?auto=format&fit=crop&w=1600&q=90",
    accentColor: "#2563EB",
    colorSwatches: [
      { name: "Cobalt Blue", hex: "#2563EB" },
      { name: "Desert Titanium", hex: "#C5A880" },
      { name: "Natural Titanium", hex: "#9A968D" },
      { name: "Obsidian Black", hex: "#1E293B" }
    ],
    themeTemplate: "universal",
    cardStyle: "modern",
    aspectRatio: "square",
    description: "Глубокий обсидиановый минимализм для презентации флагманских девайсов. Переключение 4 оттенков титана Grade 5, Bento-сетка характеристик чипа A18 Pro и селектор памяти с расчетом рассрочки 0%.",
    highlights: ["4 цвета корпуса титана", "Bento-сетка характеристик", "Конфигуратор памяти", "Официальная гарантия 1 год"],
    sampleCategories: ["Все девайсы", "Смартфоны", "MacBook", "Аудио & AirPods", "Watch"],
    sampleProducts: [
      {
        id: 301,
        name: "iPhone 16 Pro Max 256GB",
        category: "Смартфоны",
        price: 14800000,
        oldPrice: 15500000,
        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=90",
        tag: "ФЛАГМАН 2026",
        desc: "Титановый корпус Grade 5, 3-нм процессор A18 Pro и перископическая камера."
      },
      {
        id: 302,
        name: "MacBook Air 15 M3 Space Gray",
        category: "MacBook",
        price: 16900000,
        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=90",
        desc: "Liquid Retina 15.3, 18 часов автономной работы и ультратонкий unibody корпус."
      },
      {
        id: 303,
        name: "AirPods Max Space Gray",
        category: "Аудио & AirPods",
        price: 6800000,
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=90",
        tag: "HI-RES AUDIO",
        desc: "Активное шумоподавление, пространственное аудио и амбушюры из пены с эффектом памяти."
      },
      {
        id: 304,
        name: "Apple Watch Ultra 2 Titanium",
        category: "Watch",
        price: 9200000,
        image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=90",
        desc: "Титановый корпус 49мм, яркость 3000 нит и точный двухчастотный GPS."
      }
    ],
    stats: [
      { label: "Дисплей", value: "120Hz ProMotion" },
      { label: "Чип", value: "A18 Pro 3nm" },
      { label: "Гарантия", value: "12 мес Apple" }
    ]
  },
  {
    id: "crystall-luxury",
    niche: "beauty",
    name: "Crystall Ami Royal",
    tagline: "Selective Perfumery & Haute Joaillerie",
    aestheticLabel: "Стиль Dior / Chanel / Нишевая парфюмерия",
    badge: "HAUTE LUXE",
    heroImage: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1600&q=90",
    accentColor: "#9333EA",
    colorSwatches: [
      { name: "Amethyst Violet", hex: "#9333EA" },
      { name: "Silk Rose Gold", hex: "#E11D48" },
      { name: "Champagne Amber", hex: "#D97706" },
      { name: "Deep Noir", hex: "#0F172A" }
    ],
    themeTemplate: "boutique",
    cardStyle: "minimal",
    aspectRatio: "portrait",
    description: "Королевская парфюмерия и ювелирная эстетика. Ольфакторная интерактивная пирамида нот (верхние, сердце, шлейф), сборка подарочных Luxe-боксов с атласной лентой и подиумный макрозум.",
    highlights: ["Ольфакторная пирамида нот", "Сборщик Luxe-боксов", "Студийная макросъемка", "Золотое тиснение"],
    sampleCategories: ["Все ароматы", "Селективная ниша", "Цветочные", "Древесные", "Подарочные боксы"],
    sampleProducts: [
      {
        id: 401,
        name: "Royal Amber Extract 100ml",
        category: "Селективная ниша",
        price: 2400000,
        oldPrice: 2800000,
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=90",
        tag: "EXCLUSIVE",
        desc: "Ноты серой амбры, мадагаскарской ванили, кедра и белого мускуса."
      },
      {
        id: 402,
        name: "Damascena Rose Elixir 50ml",
        category: "Цветочные",
        price: 1850000,
        image: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=90",
        desc: "Майская дамасская роза, бергамот, пион и легкий пудровый шлейф."
      },
      {
        id: 403,
        name: "Luxe Velvet Gift Box",
        category: "Подарочные боксы",
        price: 450000,
        image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=90",
        tag: "HANDCRAFTED",
        desc: "Премиальная бархатная коробка с золотым тиснением и шелковой лентой."
      }
    ],
    stats: [
      { label: "Стойкость", value: "до 48 часов" },
      { label: "Происхождение", value: "Grasse, France" },
      { label: "Сертификат", value: "100% Original" }
    ]
  },
  {
    id: "artisan-roastery",
    niche: "coffee",
    name: "Artisan Roastery",
    tagline: "Specialty Coffee Beans & Craft Bakery",
    aestheticLabel: "Стиль Blue Bottle / Nordic Craft",
    badge: "SPECIALTY GRADE",
    heroImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1600&q=90",
    accentColor: "#D97706",
    colorSwatches: [
      { name: "Roasted Caramel", hex: "#D97706" },
      { name: "Creamy Matcha", hex: "#059669" },
      { name: "Dark Roast", hex: "#78350F" },
      { name: "Warm Milk", hex: "#475569" }
    ],
    themeTemplate: "universal",
    cardStyle: "compact",
    aspectRatio: "square",
    description: "Теплый скандинавский крафт для спешелти-кофеен и авторских пекарен. Дескрипторы вкусовых профилей зерен, выбор альтернативного молока и заказ к точному времени.",
    highlights: ["Профиль обжарки 100% арабика", "Выбор вида молока", "Самовывоз по таймеру", "Свежая выпечка"],
    sampleCategories: ["Все", "Спешелти кофе", "Альтернатива", "Свежая выпечка", "Кофейные зерна"],
    sampleProducts: [
      {
        id: 501,
        name: "Ethiopia Yirgacheffe Pour-Over",
        category: "Альтернатива",
        price: 32000,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=90",
        tag: "Q-GRADE 88+",
        desc: "Ноты жасмина, бергамота и сочного персика. Мытая обработка."
      },
      {
        id: 502,
        name: "French Golden Butter Croissant",
        category: "Свежая выпечка",
        price: 24000,
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=90",
        desc: "Хрустящий круассан на натуральном сливочном масле 82.5%."
      }
    ],
    stats: [
      { label: "Обжарка", value: "Свежая 7 дней" },
      { label: "Арабика", value: "100% Single Origin" },
      { label: "Скорость", value: "Готов за 5 мин" }
    ]
  }
];

export const RoboMarketPage: React.FC = () => {
  const { store, refreshMe } = useAuth();

  // Active Category filter on marketplace
  const [activeNiche, setActiveNiche] = useState<string>("all");

  // Live Studio Preview State
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [previewActiveCategory, setPreviewActiveCategory] = useState<string>("Все");
  const [previewColorMap, setPreviewColorMap] = useState<Record<string, string>>({
    "vogue-runway": "#18181B",
    "gourmet-grill": "#DC2626",
    "titanium-studio": "#2563EB",
    "crystall-luxury": "#9333EA",
    "artisan-roastery": "#D97706"
  });

  // Interactive In-Preview State
  const [simulatedCart, setSimulatedCart] = useState<{ count: number; lastItem: string; total: number }>({
    count: 1,
    lastItem: "Oversized Tailored Trench",
    total: 1890000
  });
  const [simulatedSize, setSimulatedSize] = useState<string>("M");
  const [simulatedPatty, setSimulatedPatty] = useState<string>("Double Angus Beef");
  const [simulatedCheddar, setSimulatedCheddar] = useState<boolean>(true);
  const [simulatedBacon, setSimulatedBacon] = useState<boolean>(true);
  const [simulatedTechFinish, setSimulatedTechFinish] = useState<string>("Desert Titanium");
  const [simulatedTechMemory, setSimulatedTechMemory] = useState<string>("256GB");
  const [wishlistItems, setWishlistItems] = useState<number[]>([101]);

  // Apply Modal State
  const [applyModalTemplate, setApplyModalTemplate] = useState<TemplateData | null>(null);
  const [applyOption, setApplyOption] = useState<"design_only" | "full_catalog">("full_catalog");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredTemplates = activeNiche === "all"
    ? TEMPLATES_CATALOG
    : TEMPLATES_CATALOG.filter(t => t.niche === activeNiche);

  const isCurrentActive = (tpl: TemplateData) => {
    return store?.theme_template === tpl.themeTemplate && store?.theme_business_niche === tpl.niche;
  };

  const openPreviewModal = (tpl: TemplateData) => {
    setPreviewTemplate(tpl);
    setPreviewActiveCategory("Все");
    setSimulatedCart({
      count: 1,
      lastItem: tpl.sampleProducts[0]?.name || "Фирменный товар",
      total: tpl.sampleProducts[0]?.price || 50000
    });
  };

  const handleSimulatedAddToCart = (product: ProductPreviewItem) => {
    setSimulatedCart(prev => ({
      count: prev.count + 1,
      lastItem: product.name,
      total: prev.total + product.price
    }));
  };

  const toggleWishlist = (id: number) => {
    setWishlistItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (!applyModalTemplate) return;
    setIsApplying(true);
    try {
      const activeColor = previewColorMap[applyModalTemplate.id] || applyModalTemplate.accentColor;

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
        banner_subtitle: applyModalTemplate.tagline,
        banner_image_url: applyModalTemplate.heroImage
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
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-semibold tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Hero Header: Awwwards Minimalist Aesthetic */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tracking-wider uppercase border border-slate-200/80">
          <Sparkles className="w-3.5 h-3.5 text-slate-800" />
          <span>Curated Templates Marketplace • 2026</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-950 leading-[1.1]">
          Готовые сайты для брендов, которые ценят эстетику.
        </h1>

        <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
          Коллекция дизайнерских шаблонов с интерактивным откликом, плавной кинематикой и адаптацией под Telegram Mini App.
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

      {/* Showcase Grid: Premium Gallery Cards with Smooth CSS Hover Shimmers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
        {filteredTemplates.map(tpl => {
          const isInstalled = isCurrentActive(tpl);
          const activeColor = previewColorMap[tpl.id] || tpl.accentColor;

          return (
            <div
              key={tpl.id}
              className="group rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.09)] hover:border-slate-300 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Visual Viewport with Smooth Hover Zoom */}
                <div
                  className="relative aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer select-none"
                  onClick={() => openPreviewModal(tpl)}
                >
                  <img
                    src={tpl.heroImage}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-semibold tracking-wider uppercase shadow-xs group-hover:-translate-y-0.5 transition-transform duration-300">
                      {tpl.badge}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-white/90 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                      {tpl.stats[0]?.value}
                    </span>
                  </div>

                  {/* Bottom Text Over Visual */}
                  <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between">
                    <div>
                      <span className="text-[11px] text-white/70 uppercase tracking-[0.18em] font-medium block">
                        {tpl.aestheticLabel}
                      </span>
                      <h3 className="text-2xl font-semibold tracking-tight text-white mt-0.5">
                        {tpl.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreviewModal(tpl);
                      }}
                      className="w-10 h-10 rounded-full bg-white/95 hover:bg-white text-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      title="Интерактивный показ"
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

                  {/* Interactive Palette Dots */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                      Палитра акцентов
                    </span>
                    <div className="flex items-center gap-2">
                      {tpl.colorSwatches.map((colorItem, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewColorMap(prev => ({ ...prev, [tpl.id]: colorItem.hex }))}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            activeColor === colorItem.hex
                              ? "ring-2 ring-slate-900 ring-offset-2 scale-110"
                              : "hover:scale-105 opacity-80"
                          }`}
                          style={{ backgroundColor: colorItem.hex }}
                          title={colorItem.name}
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
                  onClick={() => openPreviewModal(tpl)}
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
      {/* KEYNOTE STUDIO PREVIEW MODAL (INTERACTIVE & RESPONSIVE)         */}
      {/* ============================================================== */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-2 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-[#0C0E14] text-white w-full max-w-6xl h-[92vh] rounded-[36px] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0 bg-[#0C0E14]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white leading-none">
                    {previewTemplate.name}
                  </h3>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    {previewTemplate.tagline}
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

              {/* Header Right Actions */}
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

            {/* Stage Canvas Area */}
            <div className="flex-1 bg-[#050608] p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
              
              {/* Apple Hardware Frame */}
              <div className={`transition-all duration-300 relative ${
                previewDevice === "mobile"
                  ? "w-[380px] h-[690px] max-h-full rounded-[48px] border-[5px] border-zinc-700 shadow-2xl p-3 bg-black flex flex-col"
                  : previewDevice === "tablet"
                  ? "w-[640px] h-[700px] max-h-full rounded-[38px] border-[5px] border-zinc-700 shadow-2xl p-3.5 bg-black flex flex-col"
                  : "w-full max-w-5xl h-[690px] max-h-full rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-950 flex flex-col overflow-hidden"
              }`}>
                
                {/* Dynamic Island on Mobile */}
                {previewDevice === "mobile" && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2.5 border border-zinc-800 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-700"></div>
                  </div>
                )}

                {/* MacBook Browser Chrome */}
                {previewDevice === "desktop" && (
                  <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="flex-1 bg-black/60 px-3 py-1 rounded-lg text-[11px] text-zinc-400 font-mono flex items-center gap-2">
                      <span className="text-emerald-400">https://</span>
                      <span>{store?.subdomain || "store"}.storebox.uz</span>
                      <span className="text-purple-400 ml-auto font-sans font-bold text-[10px]">LIVE DEMO</span>
                    </div>
                  </div>
                )}

                {/* Inner Interactive Storefront Canvas */}
                <div className={`w-full flex-1 overflow-y-auto no-scrollbar relative select-none ${
                  previewDevice === "mobile" ? "rounded-[36px] bg-white text-slate-900" :
                  previewDevice === "tablet" ? "rounded-[24px] bg-white text-slate-900" :
                  "bg-white text-slate-900"
                }`}>
                  
                  {/* Store Header */}
                  <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-xs tracking-wider uppercase text-slate-900 block leading-tight">
                        {previewTemplate.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {previewTemplate.aestheticLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="font-mono">{simulatedCart.count}</span>
                      </button>
                    </div>
                  </div>

                  {/* Hero Campaign Stage */}
                  <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-slate-950 overflow-hidden">
                    <img
                      src={previewTemplate.heroImage}
                      alt={previewTemplate.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end p-5 sm:p-8 text-white">
                      <div className="space-y-1.5 max-w-xl">
                        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/80 px-2 py-0.5 bg-white/10 rounded-md backdrop-blur-md">
                          {previewTemplate.badge}
                        </span>
                        <h4 className="text-xl sm:text-3xl font-semibold tracking-tight text-white leading-tight">
                          {previewTemplate.tagline}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Interactive Widgets depending on Niche */}
                  <div className="p-4 sm:p-6 space-y-6">

                    {/* VOGUE FASHION INTERACTIVE CONTROLS */}
                    {previewTemplate.niche === "fashion" && (
                      <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Быстрый выбор подиумного размера:</span>
                          <span className="font-mono text-neutral-500">Размер: {simulatedSize}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {["XS", "S", "M", "L", "XL"].map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => {
                                setSimulatedSize(sz);
                                handleSimulatedAddToCart(previewTemplate.sampleProducts[0]);
                              }}
                              className={`py-2 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
                                simulatedSize === sz
                                  ? "bg-black text-white border-black"
                                  : "bg-white text-neutral-800 border-neutral-200 hover:border-black"
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GOURMET BURGER INTERACTIVE CONTROLS */}
                    {previewTemplate.niche === "restaurant" && (
                      <div className="p-4 rounded-2xl bg-neutral-900 text-white border border-amber-500/30 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-4 h-4 fill-amber-400" />
                            <span>Гриль-лаборатория бургеров</span>
                          </span>
                          <span className="font-mono text-white">
                            {simulatedCheddar && simulatedBacon ? "820 ккал • 360г" : "640 ккал • 290г"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSimulatedCheddar(!simulatedCheddar)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                              simulatedCheddar ? "border-amber-500 bg-amber-500/20 text-amber-300 font-bold" : "border-white/10 bg-white/5 text-neutral-400"
                            }`}
                          >
                            <span>🧀 Чеддер x2</span>
                            <span>+8 000 UZS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSimulatedBacon(!simulatedBacon)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                              simulatedBacon ? "border-red-500 bg-red-500/20 text-red-300 font-bold" : "border-white/10 bg-white/5 text-neutral-400"
                            }`}
                          >
                            <span>🥓 Бекон на дубе</span>
                            <span>+12 000 UZS</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* TITANIUM TECH INTERACTIVE CONTROLS */}
                    {previewTemplate.niche === "tech" && (
                      <div className="p-4 rounded-2xl bg-[#090C12] text-white border border-blue-500/30 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span className="text-blue-400">Титановый корпус: {simulatedTechFinish}</span>
                          <span className="text-neutral-400">{simulatedTechMemory}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {[
                              { name: "Desert Titanium", hex: "#C5A880" },
                              { name: "Natural Titanium", hex: "#9A968D" },
                              { name: "White Ceramic", hex: "#E3E4E6" },
                              { name: "Obsidian Black", hex: "#1E293B" }
                            ].map(col => (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => setSimulatedTechFinish(col.name)}
                                className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                                  simulatedTechFinish === col.name ? "ring-2 ring-white scale-110" : "opacity-60"
                                }`}
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            {["256GB", "512GB", "1TB"].map(mem => (
                              <button
                                key={mem}
                                type="button"
                                onClick={() => setSimulatedTechMemory(mem)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                                  simulatedTechMemory === mem ? "border-blue-500 bg-blue-500/20 text-white font-bold" : "border-white/10 text-neutral-400"
                                }`}
                              >
                                {mem}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Category Filter Pills inside Preview */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                      {previewTemplate.sampleCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setPreviewActiveCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                            previewActiveCategory === cat
                              ? "bg-slate-900 text-white font-semibold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Sample Product Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {previewTemplate.sampleProducts
                        .filter(p => previewActiveCategory === "Все" || p.category === previewActiveCategory)
                        .map(item => (
                          <div
                            key={item.id}
                            className="group/item flex flex-col justify-between rounded-2xl bg-white border border-slate-200/80 p-3 space-y-2 hover:border-slate-400 hover:shadow-md transition-all duration-300 cursor-pointer"
                            onClick={() => handleSimulatedAddToCart(item)}
                          >
                            <div>
                              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 relative mb-2">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                                />
                                {item.tag && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider">
                                    {item.tag}
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(item.id);
                                  }}
                                  className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center transition-colors ${
                                    wishlistItems.includes(item.id) ? "text-rose-600" : "text-slate-400 hover:text-slate-600"
                                  }`}
                                >
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>

                              <h5 className="text-xs font-semibold text-slate-900 truncate">
                                {item.name}
                              </h5>
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {item.desc}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-xs font-bold font-mono text-slate-900">
                                {item.price.toLocaleString("ru-RU")} UZS
                              </span>
                              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700 transition-colors">
                                <Plus className="w-4 h-4" />
                              </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Установка стиля витрины
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
                    Загрузит профессиональные подиумные баннеры и товары для ниши «{applyModalTemplate.aestheticLabel}».
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
