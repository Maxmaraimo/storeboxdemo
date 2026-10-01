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
  ChevronRight,
  Package,
  Layers,
  Award,
  TrendingUp,
  Info,
  CheckCheck,
  Trash2,
  Tag,
  Home,
  Grid,
  User,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";

// ============================================================================
// TYPES & DATA STRUCTURES: WORLD-CLASS BRAND ECOSYSTEMS
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
  spec?: string;
  calories?: number;
  grams?: number;
}

interface CartItemSimulation {
  id: string;
  product: ProductPreviewItem;
  quantity: number;
  selectedOption: string;
  itemTotal: number;
}

interface TemplateData {
  id: string;
  brandArchetype: string;
  category: "fashion" | "restaurant" | "tech" | "streetwear" | "luxury";
  name: string;
  tagline: string;
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

// 100% Guaranteed Local, Ultra-Crisp Flagship Assets
const BRAND_TEMPLATES: TemplateData[] = [
  // 1. ZARA & HIGH FASHION
  {
    id: "zara-atelier",
    brandArchetype: "ZARA / MASSIMO DUTTI",
    category: "fashion",
    name: "Zara Atelier / High Fashion",
    tagline: "Swiss Minimalism & Editorial Runway Lookbook",
    badge: "HAUTE COUTURE",
    heroImage: "/static/images/templates/zara_hero.jpg",
    accentColor: "#09090b",
    colorSwatches: [
      { name: "Obsidian Noir", hex: "#09090b" },
      { name: "Desert Ecru", hex: "#C2B4A3" },
      { name: "Olive Cashmere", hex: "#4B5320" },
      { name: "Sienna Raw", hex: "#8C6239" }
    ],
    themeTemplate: "boutique",
    cardStyle: "minimal",
    aspectRatio: "portrait",
    description: "Бескомпромиссный европейский минимализм в духе парижских и миланских недель моды. Чистейшая вертикальная сетка 3:4 во весь рост, строгая монохромная типографика, интерактивный выбор размеров XS-XL и моментальный Shop the Look.",
    highlights: ["Подиумная сетка 3:4", "Швейцарская монохром-типографика", "Всплывающий селектор XS-XL", "Shop the Look хотспоты"],
    sampleCategories: ["Все", "Новая коллекция", "Пальто & Тренчи", "Шелк & Платья", "Деним"],
    sampleProducts: [
      {
        id: 101,
        name: "Oversized Tailored Wool Coat",
        category: "Пальто & Тренчи",
        price: 1890000,
        oldPrice: 2250000,
        image: "/static/images/templates/zara_coat.jpg",
        tag: "RUNWAY 2026",
        desc: "Двубортный силуэт из премиальной итальянской шерсти с акцентным поясом.",
        spec: "100% Virgin Wool • Made in Italy"
      },
      {
        id: 102,
        name: "Wide-Leg Raw Indigo Denim",
        category: "Деним",
        price: 840000,
        image: "/static/images/templates/zara_denim.jpg",
        tag: "EDITORIAL",
        desc: "Прямой расслабленный крой с высокой талией и японской кромкой селвидж.",
        spec: "13.5 oz Japanese Denim"
      },
      {
        id: 103,
        name: "Silk Satin Slip Evening Dress",
        category: "Шелк & Платья",
        price: 1150000,
        oldPrice: 1390000,
        image: "/static/images/templates/zara_dress.jpg",
        tag: "LIMITED",
        desc: "Элегантное вечернее платье-комбинация из плотного натурального шелка.",
        spec: "100% Mulberry Silk"
      },
      {
        id: 104,
        name: "Ribbed Cashmere Mock-Neck",
        category: "Новая коллекция",
        price: 720000,
        image: "/static/images/templates/zara_knit.jpg",
        desc: "Ультрамягкий свитер тонкой вязки из монгольского кашемира первого сбора.",
        spec: "Grade-A Mongolian Cashmere"
      }
    ],
    stats: [
      { label: "Конверсия", value: "+38%" },
      { label: "Скорость", value: "0.24s" },
      { label: "Адаптация", value: "100% TMA" }
    ]
  },

  // 2. BURGER KING & APP-LEVEL FASTFOOD
  {
    id: "burger-king-flame",
    brandArchetype: "BURGER KING / SHAKE SHACK",
    category: "restaurant",
    name: "Burger King Flamehouse",
    tagline: "Flame-Grilled Smash Burgers & Sizzling Kitchen",
    badge: "100% OPEN FLAME",
    heroImage: "/static/images/templates/burger_hero.jpg",
    accentColor: "#EA580C",
    colorSwatches: [
      { name: "Flame Orange", hex: "#EA580C" },
      { name: "Mustard Gold", hex: "#D97706" },
      { name: "Charcoal Noir", hex: "#18181B" },
      { name: "Crimson Fire", hex: "#DC2626" }
    ],
    themeTemplate: "restaurant",
    cardStyle: "compact",
    aspectRatio: "square",
    description: "Аппетитный фудтех-шаблон мирового уровня для ресторанов и бургерных. Глубокий темный фон, сочнейшие макро-фотографии на открытом огне, интерактивная гриль-лаборатория бургеров с живым расчетом калорий и термодоставка за 25 минут.",
    highlights: ["Интерактивный конструктор бургеров", "Живой КБЖУ HUD", "Термодоставка 25 мин", "100% Мраморная говядина Халяль"],
    sampleCategories: ["Все меню", "Крафт-Бургеры", "Снеки & Фри", "Напитки"],
    sampleProducts: [
      {
        id: 201,
        name: "Black Angus Double Smash Whopper",
        category: "Крафт-Бургеры",
        price: 68000,
        oldPrice: 75000,
        image: "/static/images/templates/burger_whopper.jpg",
        tag: "ХИТ ГРИЛЯ",
        desc: "Две сочные котлеты из мраморного Black Angus, расплавленный чеддер и фирменный соус.",
        spec: "340г • 820 ккал • 44г белка",
        calories: 820,
        grams: 340
      },
      {
        id: 202,
        name: "Crispy Country Bacon & Cheese",
        category: "Крафт-Бургеры",
        price: 54000,
        image: "/static/images/templates/burger_chicken.jpg",
        desc: "Золотистое куриное филе в кукурузной панировке с копченым беконом и соусом айоли.",
        spec: "310г • 680 ккал • 38г белка",
        calories: 680,
        grams: 310
      },
      {
        id: 203,
        name: "Truffle Parmesan Rustic Fries",
        category: "Снеки & Фри",
        price: 28000,
        image: "/static/images/templates/burger_fries.jpg",
        tag: "ШЕФ-ВЫБОР",
        desc: "Хрустящий картофель фри с трюфельным маслом первого отжима и тертым Грана Падано.",
        spec: "180г • 380 ккал",
        calories: 380,
        grams: 180
      },
      {
        id: 204,
        name: "Salted Caramel Craft Milkshake",
        category: "Напитки",
        price: 24000,
        image: "/static/images/templates/burger_shake.jpg",
        desc: "Густой крафтовый милкшейк из натурального пломбира со соленой карамелью.",
        spec: "400мл • Натуральное молоко",
        calories: 420,
        grams: 400
      }
    ],
    stats: [
      { label: "Термодоставка", value: "25 мин" },
      { label: "Температура", value: "320°C Гриль" },
      { label: "Сертификация", value: "100% Halal" }
    ]
  },

  // 3. APPLE & KEYNOTE TECH
  {
    id: "apple-titanium",
    brandArchetype: "APPLE STORE / DYSON",
    category: "tech",
    name: "Apple Keynote Titanium",
    tagline: "Cupertino Aesthetics & Grade 5 Titanium Studio",
    badge: "KEYNOTE SPEC",
    heroImage: "/static/images/templates/apple_hero.jpg",
    accentColor: "#2563EB",
    colorSwatches: [
      { name: "Desert Titanium", hex: "#C5A880" },
      { name: "Natural Titanium", hex: "#9A968D" },
      { name: "White Ceramic", hex: "#E3E4E6" },
      { name: "Black Titanium", hex: "#1E293B" }
    ],
    themeTemplate: "universal",
    cardStyle: "modern",
    aspectRatio: "square",
    description: "Глубокий обсидиановый минимализм в стиле официального сайта Apple. Интерактивный конфигуратор 4 оттенков титана Grade 5, Bento-сетка характеристик чипа A18 Pro, селектор памяти и расчет рассрочки 0-0-12.",
    highlights: ["4 оттенка корпуса титана", "Bento-сетка характеристик", "Конфигуратор 128GB - 1TB", "Рассрочка 0-0-12 Payme/Uzum"],
    sampleCategories: ["Все девайсы", "Смартфоны", "MacBook", "Аудио & AirPods", "Watch"],
    sampleProducts: [
      {
        id: 301,
        name: "iPhone 16 Pro Max Titanium",
        category: "Смартфоны",
        price: 15400000,
        oldPrice: 16200000,
        image: "/static/images/templates/apple_iphone.jpg",
        tag: "ФЛАГМАН 2026",
        desc: "Корпус из титана Grade 5, 3-нм процессор A18 Pro и камера 48MP Fusion 5x Telephoto.",
        spec: "A18 Pro • 6.9\" Super Retina XDR • USB-C 3.0"
      },
      {
        id: 302,
        name: "MacBook Pro 16 M3 Max Space Black",
        category: "MacBook",
        price: 28900000,
        image: "/static/images/templates/apple_macbook.jpg",
        desc: "Liquid Retina XDR 16.2\", 36GB объединенной памяти, до 22 часов автономной работы.",
        spec: "M3 Max (16-core CPU) • 1TB SSD • 120Hz ProMotion"
      },
      {
        id: 303,
        name: "AirPods Max Space Gray",
        category: "Аудио & AirPods",
        price: 6800000,
        image: "/static/images/templates/apple_airpods.jpg",
        tag: "HI-RES AUDIO",
        desc: "Активное шумоподавление студийного уровня, пространственное аудио с динамическим трекингом.",
        spec: "Apple H1 Chip • Lossless Audio • 20h Battery"
      },
      {
        id: 304,
        name: "Apple Watch Ultra 2 Titanium",
        category: "Watch",
        price: 9400000,
        image: "/static/images/templates/apple_watch.jpg",
        desc: "Титановый корпус 49мм, яркость дисплея 3000 нит, двухчастотный GPS L1/L5.",
        spec: "WR100 Водонепроницаемость • 72h Low Power"
      }
    ],
    stats: [
      { label: "Процессор", value: "3nm A18 Pro" },
      { label: "Гарантия", value: "1 Год Apple" },
      { label: "Рассрочка", value: "0% Без переплат" }
    ]
  },

  // 4. NIKE & HIGH-PERFORMANCE STREETWEAR
  {
    id: "nike-velocity",
    brandArchetype: "NIKE / OFF-WHITE",
    category: "streetwear",
    name: "Nike Velocity Lab",
    tagline: "High-Energy Streetwear & Air Sole Visualizer",
    badge: "LIMITED DROP",
    heroImage: "/static/images/templates/nike_hero.jpg",
    accentColor: "#84CC16",
    colorSwatches: [
      { name: "Volt Neon", hex: "#84CC16" },
      { name: "Hyper Crimson", hex: "#FF3B30" },
      { name: "Triple Black", hex: "#0A0A0A" },
      { name: "Pure Cyber", hex: "#06B6D4" }
    ],
    themeTemplate: "universal",
    cardStyle: "modern",
    aspectRatio: "square",
    description: "Дерзкий, высокоэнергетический streetwear-дизайн в духе лимитированных дропов Nike SNKRS. Агрессивная кинематика, счетчик остатка пар в реальном времени, селектор размеров US 8-12 и подошва с амортизацией Air Zoom.",
    highlights: ["Счетчик остатка пар Limited Drop", "Сетка размеров US 8-12", "Амортизация ZoomX Foam", "Анимации 120 FPS"],
    sampleCategories: ["Все дропы", "Кроссовки", "Худи & Костюмы"],
    sampleProducts: [
      {
        id: 401,
        name: "Nike Air Zoom Alphafly 3 Neon",
        category: "Кроссовки",
        price: 2850000,
        oldPrice: 3200000,
        image: "/static/images/templates/nike_alphafly.jpg",
        tag: "ОСТАЛОСЬ 9 ПАР",
        desc: "Марафонская пластина из углеродного волокна Flyplate и двойные баллоны Air Zoom.",
        spec: "ZoomX Foam • 198g • Carbon Plate"
      },
      {
        id: 402,
        name: "Air Jordan 1 Retro High OG Chicago",
        category: "Кроссовки",
        price: 2600000,
        image: "/static/images/templates/nike_jordan.jpg",
        tag: "GRAIL",
        desc: "Легендарная оригинальная расцветка 1985 года из премиальной зернистой кожи.",
        spec: "Full Grain Leather • Air Sole Unit"
      },
      {
        id: 403,
        name: "Nike Tech Fleece Windrunner Nocturne",
        category: "Худи & Костюмы",
        price: 1420000,
        image: "/static/images/templates/nike_fleece.jpg",
        desc: "Легкий теплоизолирующий трехслойный трикотаж с водоотталкивающими карманами.",
        spec: "Thermal Tech Fleece • Double Zipper"
      }
    ],
    stats: [
      { label: "Технология", value: "ZoomX Carbon" },
      { label: "Дроп", value: "Ограничен" },
      { label: "Отправка", value: "Express 2h" }
    ]
  },

  // 5. CHANEL & HAUTE PARFUMERIE
  {
    id: "chanel-royal",
    brandArchetype: "CHANEL / BYREDO",
    category: "luxury",
    name: "Chanel Cristall Royale",
    tagline: "French Haute Parfumerie & Olfactory Pyramid",
    badge: "PARFUM D'EXCEPTION",
    heroImage: "/static/images/templates/chanel_hero.jpg",
    accentColor: "#D4AF37",
    colorSwatches: [
      { name: "Imperial Gold", hex: "#D4AF37" },
      { name: "Velvet Onyx", hex: "#121212" },
      { name: "Rose Poudré", hex: "#E0B0B0" },
      { name: "Pearl White", hex: "#F5F5F0" }
    ],
    themeTemplate: "boutique",
    cardStyle: "minimal",
    aspectRatio: "portrait",
    description: "Королевская селективная парфюмерия и ювелирная эстетика. Французская акцидентная типографика Didot, интерактивная пирамида нот (верхние, сердце, шлейф), селектор объема флакона 50-250мл и фирменная шелковая подарочная упаковка.",
    highlights: ["Интерактивная пирамида нот", "Выбор объема 50 - 250 мл", "Шелковая упаковка с восковой печатью", "100% Оригинал Грасс (Франция)"],
    sampleCategories: ["Все ароматы", "Extrait de Parfum", "Millésime"],
    sampleProducts: [
      {
        id: 501,
        name: "Grand Cristal No. 5 Extrait 100ml",
        category: "Extrait de Parfum",
        price: 3200000,
        oldPrice: 3800000,
        image: "/static/images/templates/chanel_coco.jpg",
        tag: "EXCLUSIF",
        desc: "Абсолют грасской майской розы, ирис и мадагаскарская ваниль в граненом хрустале.",
        spec: "30% Концентрация масел • Стойкость 48 часов"
      },
      {
        id: 502,
        name: "Bois Impérial Millésime 100ml",
        category: "Millésime",
        price: 2450000,
        image: "/static/images/templates/chanel_bois.jpg",
        desc: "Базилик тайский, древесный акигалавуд и ветивер с акцентом амброксана.",
        spec: "Древесный пряный шлейф • Унисекс"
      },
      {
        id: 503,
        name: "Dior Sauvage Elixir 100ml",
        category: "Extrait de Parfum",
        price: 2890000,
        image: "/static/images/templates/chanel_sauvage.jpg",
        tag: "LIMITED",
        desc: "Пряный ликерный кардамон, лаванда первого сбора и густой шлейф древесной смолы.",
        spec: "Ручной розлив • Лимитированный тираж"
      }
    ],
    stats: [
      { label: "Происхождение", value: "Grasse, France" },
      { label: "Концентрация", value: "Extrait 30%" },
      { label: "Стойкость", value: "До 48 часов" }
    ]
  }
];

// ============================================================================
// MAIN COMPONENT: STOREBOX BRAND ECOSYSTEMS MARKETPLACE
// ============================================================================

export const RoboMarketPage: React.FC = () => {
  const { store, refreshMe } = useAuth();

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Device Studio Modal
  const [previewTemplate, setPreviewTemplate] = useState<TemplateData | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [previewActiveCategory, setPreviewActiveCategory] = useState<string>("Все");
  const [previewMobileNav, setPreviewMobileNav] = useState<"home" | "catalog" | "cart" | "profile">("home");

  // Live Brand Customization States
  const [previewColorMap, setPreviewColorMap] = useState<Record<string, string>>({});
  
  // Interactive Fashion (Zara) States
  const [simulatedSize, setSimulatedSize] = useState<string>("M");
  
  // Interactive Burger King Fastfood States
  const [simulatedPatties, setSimulatedPatties] = useState<number>(2); // 1 = Single, 2 = Double Angus, 3 = Triple Beast
  const [simulatedCheddar, setSimulatedCheddar] = useState<boolean>(true);
  const [simulatedBacon, setSimulatedBacon] = useState<boolean>(true);
  const [simulatedTruffleSauce, setSimulatedTruffleSauce] = useState<boolean>(false);

  // Interactive Apple Tech States
  const [simulatedTechFinish, setSimulatedTechFinish] = useState<string>("Desert Titanium");
  const [simulatedTechMemory, setSimulatedTechMemory] = useState<string>("256GB");

  // Interactive Nike Streetwear States
  const [simulatedSneakerSize, setSimulatedSneakerSize] = useState<string>("US 10");

  // Interactive Chanel Perfumery States
  const [simulatedVolume, setSimulatedVolume] = useState<string>("100 ml");

  // Detailed Product Modal inside preview
  const [activeProductDetail, setActiveProductDetail] = useState<ProductPreviewItem | null>(null);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);

  // Real Simulation Cart Drawer inside preview
  const [cartDrawerOpen, setCartDrawerOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItemSimulation[]>([]);
  const [cartToastMessage, setCartToastMessage] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<number[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState<string>("");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [orderCelebration, setOrderCelebration] = useState<boolean>(false);

  // 1-Click Install Confirmation Modal
  const [applyModalTemplate, setApplyModalTemplate] = useState<TemplateData | null>(null);
  const [applyOption, setApplyOption] = useState<"turnkey" | "design_only">("turnkey");
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applySuccessToast, setApplySuccessToast] = useState<string | null>(null);

  // Filter templates
  const filteredTemplates = activeCategory === "all"
    ? BRAND_TEMPLATES
    : BRAND_TEMPLATES.filter(t => t.category === activeCategory);

  // Check if template is currently installed in merchant store
  const isCurrentActive = (tpl: TemplateData) => {
    if (!store) return false;
    const currentTheme = (store as any).theme_template || "universal";
    const currentCard = (store as any).card_style || "modern";
    return currentTheme === tpl.themeTemplate && currentCard === tpl.cardStyle;
  };

  // Open Preview Modal with defaults
  const openPreviewModal = (tpl: TemplateData) => {
    setPreviewTemplate(tpl);
    setPreviewActiveCategory("Все");
    setCartItems([]);
    setCartToastMessage(null);
    setActiveProductDetail(null);
    setCartDrawerOpen(false);
    setOrderCelebration(false);
    setPreviewMobileNav("home");
  };

  // Add Item to Cart with full feedback and real cart object
  const addToCartSimulation = (
    product: ProductPreviewItem,
    optionLabel: string,
    quantity: number = 1,
    unitPrice?: number
  ) => {
    const finalPrice = unitPrice || product.price;
    const itemKey = `${product.id}-${optionLabel}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.id === itemKey);
      if (existing) {
        return prev.map(item =>
          item.id === itemKey
            ? {
                ...item,
                quantity: item.quantity + quantity,
                itemTotal: (item.quantity + quantity) * finalPrice
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: itemKey,
            product,
            quantity,
            selectedOption: optionLabel,
            itemTotal: quantity * finalPrice
          }
        ];
      }
    });

    setCartToastMessage(`В корзине: ${product.name} (${optionLabel})`);
    setTimeout(() => {
      setCartToastMessage(null);
    }, 2800);

    setActiveProductDetail(null);
  };

  // Remove from simulation cart
  const removeCartItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Wishlist Toggle
  const toggleWishlist = (productId: number) => {
    setWishlistItems(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // 1-Click Installation Handler
  const handleApply = async () => {
    if (!applyModalTemplate || !store) return;
    setIsApplying(true);
    try {
      const chosenColor = previewColorMap[applyModalTemplate.id] || applyModalTemplate.accentColor;

      await api.patch(`/stores/${store.id}/`, {
        theme_template: applyModalTemplate.themeTemplate,
        card_style: applyModalTemplate.cardStyle,
        aspect_ratio: applyModalTemplate.aspectRatio,
        accent_color: chosenColor,
        business_niche: applyModalTemplate.category
      });

      if (refreshMe) {
        await refreshMe();
      }

      setApplySuccessToast(`Экосистема «${applyModalTemplate.name}» успешно активирована для ${store.name || store.subdomain}!`);
      setTimeout(() => setApplySuccessToast(null), 4000);
      setApplyModalTemplate(null);
      setPreviewTemplate(null);
    } catch (err: any) {
      console.error("Failed to apply template:", err);
      alert("Ошибка при установке шаблона. Пожалуйста, попробуйте еще раз.");
    } finally {
      setIsApplying(false);
    }
  };

  // Burger King live calculations
  const calculateBurgerPrice = () => {
    let base = 48000;
    if (simulatedPatties === 2) base += 20000;
    if (simulatedPatties === 3) base += 38000;
    if (simulatedCheddar) base += 8000;
    if (simulatedBacon) base += 12000;
    if (simulatedTruffleSauce) base += 6000;
    return base;
  };

  const calculateBurgerCalories = () => {
    let cals = 520;
    let grams = 260;
    if (simulatedPatties === 2) { cals += 240; grams += 110; }
    if (simulatedPatties === 3) { cals += 480; grams += 220; }
    if (simulatedCheddar) { cals += 95; grams += 30; }
    if (simulatedBacon) { cals += 110; grams += 25; }
    if (simulatedTruffleSauce) { cals += 45; grams += 20; }
    return { cals, grams };
  };

  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.itemTotal, 0);
  const cartTotalWithDiscount = Math.max(0, cartSubtotal - (cartSubtotal * promoDiscount));
  const cartItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* ============================================================== */}
      {/* FLOATING SUCCESS TOAST                                         */}
      {/* ============================================================== */}
      {applySuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-neutral-950 text-white px-5 py-3.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium tracking-wide">{applySuccessToast}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* ULTRA-LUXURY BRAND HEADER                                      */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-[32px] bg-neutral-950 text-white p-8 sm:p-12 border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        {/* Subtle Luxury Gradient Mesh */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-neutral-800/60 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-neutral-900/80 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-semibold text-neutral-200">
              STOREBOX BRAND ECOSYSTEMS • WORLD-CLASS TIERS
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            Цифровые витрины уровня <span className="font-serif italic font-normal text-neutral-300">Zara, Burger King, Apple, Nike</span> и <span className="font-serif italic font-normal text-neutral-300">Chanel</span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-400 font-normal leading-relaxed">
            Готовые цифровые экосистемы мирового класса с интерактивными конструкторами, плавной кинематикой 120 FPS и безупречной адаптацией под Telegram Mini App. Установка в 1 клик без изменения товаров и настроек магазина.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>120 FPS Кинематика</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>Telegram Mini App Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>1-Click Установка без регрессий</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BRAND CATEGORY FILTER (SWISS SEGMENTED CONTROL)                */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-neutral-100/90 rounded-2xl border border-neutral-200/90 w-fit overflow-x-auto no-scrollbar">
        {[
          { id: "all", label: "Все экосистемы", icon: Sparkles },
          { id: "fashion", label: "Zara • High Fashion", icon: Layers },
          { id: "restaurant", label: "Burger King • Fast Food", icon: Flame },
          { id: "tech", label: "Apple • Keynote Tech", icon: Monitor },
          { id: "streetwear", label: "Nike • Streetwear", icon: TrendingUp },
          { id: "luxury", label: "Chanel • Haute Parfumerie", icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                activeCategory === tab.id
                  ? "bg-white text-neutral-950 shadow-sm font-semibold"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* SHOWCASE GRID: LUXURY BRAND ECOSYSTEM CARDS                    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
        {filteredTemplates.map(tpl => {
          const isInstalled = isCurrentActive(tpl);
          const activeColor = previewColorMap[tpl.id] || tpl.accentColor;

          return (
            <div
              key={tpl.id}
              className="group rounded-3xl bg-white border border-neutral-200/80 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_24px_50px_rgba(0,0,0,0.1)] hover:border-neutral-300 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Visual Viewport with Smooth Hover Zoom */}
                <div
                  className="relative aspect-[16/10] overflow-hidden bg-neutral-950 cursor-pointer select-none"
                  onClick={() => openPreviewModal(tpl)}
                >
                  <img
                    src={tpl.heroImage}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-neutral-950 text-[10px] font-bold tracking-widest uppercase shadow-sm group-hover:-translate-y-0.5 transition-transform duration-300">
                      {tpl.badge}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                      {tpl.brandArchetype}
                    </span>
                  </div>

                  {/* Bottom Text Over Visual */}
                  <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between">
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-300 uppercase tracking-[0.2em] font-medium block">
                        {tpl.tagline}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
                        {tpl.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPreviewModal(tpl);
                      }}
                      className="w-11 h-11 rounded-full bg-white text-neutral-950 flex items-center justify-center shadow-xl transition-transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 ml-3"
                      title="Интерактивный показ"
                    >
                      <ArrowUpRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-7 space-y-5">
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    {tpl.description}
                  </p>

                  {/* Highlights Pills */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tpl.highlights.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200/70 text-[11px] font-medium text-neutral-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Interactive Palette Dots */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">
                      Фирменная палитра
                    </span>
                    <div className="flex items-center gap-2">
                      {tpl.colorSwatches.map((colorItem, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPreviewColorMap(prev => ({ ...prev, [tpl.id]: colorItem.hex }))}
                          className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                            activeColor === colorItem.hex
                              ? "ring-2 ring-neutral-900 ring-offset-2 scale-110"
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
                  className="flex-1 py-3.5 px-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 text-neutral-800 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4 text-neutral-500" />
                  <span>Интерактивный показ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyModalTemplate(tpl)}
                  disabled={isInstalled}
                  className={`flex-1 py-3.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                    isInstalled
                      ? "bg-neutral-100 text-neutral-400 cursor-default"
                      : "bg-neutral-950 hover:bg-neutral-800 text-white shadow-sm"
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
                      <span>Установить в 1 клик</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-2 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-[#0A0B0E] text-white w-full max-w-6xl h-[94vh] rounded-[36px] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Top Control Bar */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0 bg-[#0A0B0E]">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-white leading-none">
                    {previewTemplate.name}
                  </h3>
                  <span className="text-[11px] text-neutral-400 font-normal">
                    {previewTemplate.tagline}
                  </span>
                </div>
              </div>

              {/* Viewport Device Controls */}
              <div className="flex items-center bg-white/[0.06] p-1 rounded-xl border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    previewDevice === "mobile"
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-white"
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
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-white"
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
                      ? "bg-white text-neutral-950 shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>MacBook Pro</span>
                </button>
              </div>

              {/* Modal Right Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setApplyModalTemplate(previewTemplate)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-neutral-950 text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-neutral-950" />
                  <span>Установить</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stage Canvas Area */}
            <div className="flex-1 bg-[#040507] p-3 sm:p-6 overflow-y-auto flex items-center justify-center relative">
              
              {/* Floating Add to Cart Toast inside Device Stage */}
              {cartToastMessage && (
                <div className="absolute top-6 z-50 bg-neutral-950 text-white px-4 py-2.5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">{cartToastMessage}</span>
                </div>
              )}

              {/* Hardware Frame */}
              <div className={`transition-all duration-300 relative ${
                previewDevice === "mobile"
                  ? "w-[390px] h-[730px] max-h-full rounded-[50px] border-[6px] border-neutral-700 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-3 bg-black flex flex-col"
                  : previewDevice === "tablet"
                  ? "w-[680px] h-[730px] max-h-full rounded-[40px] border-[6px] border-neutral-700 shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-3.5 bg-black flex flex-col"
                  : "w-full max-w-5xl h-[730px] max-h-full rounded-2xl border border-neutral-800 shadow-[0_25px_60px_rgba(0,0,0,0.9)] bg-neutral-950 flex flex-col overflow-hidden"
              }`}>
                
                {/* Dynamic Island on Mobile */}
                {previewDevice === "mobile" && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-30 flex items-center justify-end px-3 border border-neutral-800 pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700"></div>
                  </div>
                )}

                {/* Telegram Mini App Top Bar on Mobile */}
                {previewDevice === "mobile" && (
                  <div className="pt-5 pb-2 px-4 bg-neutral-900 text-white flex items-center justify-between text-[11px] font-medium border-b border-neutral-800 shrink-0">
                    <span className="text-neutral-400 hover:text-white cursor-pointer" onClick={() => setPreviewTemplate(null)}>
                      Закрыть
                    </span>
                    <span className="font-semibold truncate max-w-[150px]">{previewTemplate.name}</span>
                    <span className="text-neutral-400 cursor-pointer">•••</span>
                  </div>
                )}

                {/* MacBook Browser Chrome */}
                {previewDevice === "desktop" && (
                  <div className="px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <div className="flex-1 bg-black/60 px-3 py-1 rounded-lg text-[11px] text-neutral-400 font-mono flex items-center gap-2">
                      <span className="text-emerald-400">https://</span>
                      <span>{store?.subdomain || "store"}.storebox.uz</span>
                      <span className="text-emerald-400 ml-auto font-sans font-bold text-[10px] tracking-widest uppercase">
                        {previewTemplate.brandArchetype}
                      </span>
                    </div>
                  </div>
                )}

                {/* ========================================================== */}
                {/* DYNAMIC TEMPLATE INTERIOR: SPECIFIC BRAND ARCHITECTURES     */}
                {/* ========================================================== */}
                <div className={`w-full flex-1 overflow-y-auto no-scrollbar relative ${
                  previewTemplate.category === "restaurant"
                    ? "bg-[#09090b] text-white"
                    : previewTemplate.category === "tech"
                    ? "bg-[#000000] text-white"
                    : previewTemplate.category === "streetwear"
                    ? "bg-[#0A0A0A] text-white"
                    : "bg-white text-neutral-900"
                }`}>

                  {/* -------------------------------------------------------- */}
                  {/* ARCHETYPE 1: ZARA & HIGH FASHION LOOKBOOK                */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.category === "fashion" && (
                    <div className="space-y-6 pb-20">
                      {/* Zara Monochrome Header */}
                      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
                        <span className="font-serif text-lg tracking-[0.25em] font-light uppercase text-neutral-950">
                          ZARA / ATELIER
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCartDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[11px] font-mono tracking-wider cursor-pointer hover:bg-neutral-800 transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{cartItemCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Editorial Hero Banner */}
                      <div className="relative aspect-[3/4] sm:aspect-[16/10] bg-neutral-900 overflow-hidden">
                        <img
                          src={previewTemplate.heroImage}
                          alt="Zara Lookbook"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-6 text-white space-y-2">
                          <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-300 font-mono">
                            COLLECTION 04 / AUTUMN WINTER 2026
                          </span>
                          <h2 className="font-serif text-2xl sm:text-4xl font-light tracking-tight text-white uppercase">
                            TAILORED EDITORIAL
                          </h2>
                          <p className="text-xs text-neutral-300 max-w-md font-light">
                            Безупречные подиумные силуэты из плотной итальянской шерсти и японского денима.
                          </p>
                        </div>
                      </div>

                      {/* Interactive Size Drawer / Quick Bar */}
                      <div className="px-5">
                        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="tracking-wider uppercase font-semibold">Быстрый выбор подиумного размера:</span>
                            <span className="font-mono text-neutral-500">Выбран: {simulatedSize}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-2">
                            {["XS", "S", "M", "L", "XL"].map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  setSimulatedSize(sz);
                                  addToCartSimulation(previewTemplate.sampleProducts[0], `Размер ${sz}`);
                                }}
                                className={`py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                  simulatedSize === sz
                                    ? "bg-black text-white shadow-sm"
                                    : "bg-white text-neutral-800 border border-neutral-200 hover:border-black"
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Zara Categories */}
                      <div className="px-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {previewTemplate.sampleCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setPreviewActiveCategory(cat)}
                            className={`px-3.5 py-1.5 text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                              previewActiveCategory === cat
                                ? "border-b-2 border-black font-bold text-black"
                                : "text-neutral-400 hover:text-black"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Zara 3:4 Vertical Lookbook Grid (All Cards Clickable!) */}
                      <div className="px-5 grid grid-cols-2 gap-4">
                        {previewTemplate.sampleProducts
                          .filter(p => previewActiveCategory === "Все" || p.category === previewActiveCategory)
                          .map(product => (
                            <div
                              key={product.id}
                              className="group/product flex flex-col justify-between cursor-pointer space-y-2 border border-transparent hover:border-neutral-200 p-1.5 rounded-xl transition-all"
                              onClick={() => {
                                setActiveProductDetail(product);
                                setDetailQuantity(1);
                              }}
                            >
                              <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative rounded-lg">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover group-hover/product:scale-105 transition-transform duration-700"
                                />
                                {product.tag && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/90 text-white text-[9px] font-mono tracking-widest uppercase">
                                    {product.tag}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(product.id);
                                  }}
                                  className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center transition-colors ${
                                    wishlistItems.includes(product.id) ? "text-rose-600" : "text-neutral-400 hover:text-black"
                                  }`}
                                >
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>

                              <div className="space-y-1">
                                <h4 className="text-xs font-medium tracking-tight text-neutral-900 truncate">
                                  {product.name}
                                </h4>
                                <div className="text-[11px] font-mono text-neutral-500 truncate">
                                  {product.spec}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-xs font-semibold text-neutral-950 font-mono">
                                    {product.price.toLocaleString("ru-RU")} UZS
                                  </span>
                                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest group-hover/product:text-black">
                                    Выбрать размер
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* ARCHETYPE 2: BURGER KING & APP-LEVEL FASTFOOD            */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.category === "restaurant" && (
                    <div className="space-y-6 pb-20">
                      {/* FastFood Header */}
                      <div className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-bounce" />
                          <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                            FLAMEHOUSE
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCartDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 cursor-pointer transition-transform active:scale-95"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span className="font-mono">{cartItemCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Sizzling Dark Kitchen Hero */}
                      <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-black overflow-hidden">
                        <img
                          src={previewTemplate.heroImage}
                          alt="Burger King Flame Grill"
                          className="w-full h-full object-cover opacity-85"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-5 text-white space-y-1">
                          <span className="text-[10px] font-extrabold tracking-widest uppercase text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded w-fit border border-orange-500/40">
                            100% НАСТОЯЩИЙ ОГОНЬ
                          </span>
                          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                            BLACK ANGUS SMASH WHOPPER
                          </h2>
                          <p className="text-xs text-neutral-300">
                            Две сочные котлеты 100% говядины, расплавленный чеддер и открытый гриль 320°C.
                          </p>
                        </div>
                      </div>

                      {/* Interactive Burger Customizer Widget (App-Level) */}
                      <div className="px-5">
                        <div className="p-4 rounded-2xl bg-neutral-900 border border-orange-500/30 space-y-4 shadow-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                              <span className="text-xs font-bold text-white uppercase tracking-wider">
                                Гриль-лаборатория бургеров
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-orange-400 font-bold bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/30">
                              {calculateBurgerCalories().cals} ккал • {calculateBurgerCalories().grams}г
                            </span>
                          </div>

                          {/* Patty Multiplier */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-neutral-400 font-medium block">
                              Количество котлет Black Angus:
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { count: 1, label: "Single" },
                                { count: 2, label: "Double Angus" },
                                { count: 3, label: "Triple Beast" }
                              ].map(p => (
                                <button
                                  key={p.count}
                                  type="button"
                                  onClick={() => setSimulatedPatties(p.count)}
                                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                    simulatedPatties === p.count
                                      ? "bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/40"
                                      : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                                  }`}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Cheese & Bacon Toggles */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setSimulatedCheddar(!simulatedCheddar)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                simulatedCheddar
                                  ? "border-amber-500 bg-amber-500/20 text-amber-300 font-bold"
                                  : "border-neutral-800 bg-neutral-900 text-neutral-400"
                              }`}
                            >
                              <span>🧀 Чеддер x2</span>
                              <span className="font-mono text-[10px]">+8 000 UZS</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSimulatedBacon(!simulatedBacon)}
                              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                                simulatedBacon
                                  ? "border-red-500 bg-red-500/20 text-red-300 font-bold"
                                  : "border-neutral-800 bg-neutral-900 text-neutral-400"
                              }`}
                            >
                              <span>🥓 Бекон на дубе</span>
                              <span className="font-mono text-[10px]">+12 000 UZS</span>
                            </button>
                          </div>

                          {/* Instant Order CTA with Live Price */}
                          <button
                            type="button"
                            onClick={() => addToCartSimulation(
                              previewTemplate.sampleProducts[0],
                              `${simulatedPatties} котлеты ${simulatedCheddar ? "+ Чеддер" : ""} ${simulatedBacon ? "+ Бекон" : ""}`,
                              1,
                              calculateBurgerPrice()
                            )}
                            className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-orange-600/40 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                          >
                            <Flame className="w-4 h-4 fill-white" />
                            <span>Добавить в заказ • {calculateBurgerPrice().toLocaleString("ru-RU")} UZS</span>
                          </button>
                        </div>
                      </div>

                      {/* FastFood Categories */}
                      <div className="px-5 flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {previewTemplate.sampleCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setPreviewActiveCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                              previewActiveCategory === cat
                                ? "bg-orange-600 text-white shadow-sm"
                                : "bg-neutral-800 text-neutral-400 hover:text-white"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Food Cards Grid (Clickable into Details!) */}
                      <div className="px-5 grid grid-cols-2 gap-3.5">
                        {previewTemplate.sampleProducts
                          .filter(p => previewActiveCategory === "Все меню" || p.category === previewActiveCategory)
                          .map(item => (
                            <div
                              key={item.id}
                              className="group/food p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between hover:border-orange-500/60 transition-all cursor-pointer"
                              onClick={() => {
                                setActiveProductDetail(item);
                                setDetailQuantity(1);
                              }}
                            >
                              <div>
                                <div className="aspect-square rounded-xl overflow-hidden bg-black mb-2 relative">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover/food:scale-105 transition-transform duration-500"
                                  />
                                  {item.tag && (
                                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-orange-600 text-white text-[9px] font-extrabold uppercase">
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                                <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{item.desc}</p>
                              </div>

                              <div className="pt-2.5 border-t border-neutral-800 mt-2 flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-orange-400">
                                  {item.price.toLocaleString("ru-RU")} UZS
                                </span>
                                <span className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-500 text-white flex items-center justify-center transition-colors">
                                  <Plus className="w-4 h-4" />
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* ARCHETYPE 3: APPLE & KEYNOTE TECH                        */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.category === "tech" && (
                    <div className="space-y-6 pb-20">
                      {/* Apple Header */}
                      <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-md px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
                        <span className="font-semibold text-xs tracking-wider uppercase text-white">
                          APPLE STORE ONLINE
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCartDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-mono cursor-pointer hover:bg-blue-500 transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{cartItemCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Apple Keynote Stage Hero */}
                      <div className="p-6 text-center space-y-3 bg-gradient-to-b from-neutral-900 to-black">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-blue-400 font-semibold">
                          NEW TITANIUM EDITION
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white">
                          iPhone 16 Pro. Titanium.
                        </h2>
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                          Прочность аэрокосмического класса. Чип A18 Pro. Кнопка «Управление камерой».
                        </p>

                        {/* Interactive Titanium Finish Selector */}
                        <div className="pt-2 flex flex-col items-center gap-2">
                          <span className="text-[11px] font-mono text-neutral-300">
                            Отделка: <strong className="text-white">{simulatedTechFinish}</strong>
                          </span>
                          <div className="flex items-center gap-3">
                            {[
                              { name: "Desert Titanium", hex: "#C5A880" },
                              { name: "Natural Titanium", hex: "#9A968D" },
                              { name: "White Ceramic", hex: "#E3E4E6" },
                              { name: "Black Titanium", hex: "#1E293B" }
                            ].map(col => (
                              <button
                                key={col.name}
                                type="button"
                                onClick={() => setSimulatedTechFinish(col.name)}
                                className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                                  simulatedTechFinish === col.name ? "ring-2 ring-blue-500 scale-125" : "opacity-60 hover:opacity-100"
                                }`}
                                style={{ backgroundColor: col.hex }}
                                title={col.name}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Storage Configuration */}
                        <div className="pt-3 flex justify-center gap-2">
                          {["128GB", "256GB", "512GB", "1TB"].map(mem => (
                            <button
                              key={mem}
                              type="button"
                              onClick={() => setSimulatedTechMemory(mem)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                                simulatedTechMemory === mem
                                  ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30"
                                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
                              }`}
                            >
                              {mem}
                            </button>
                          ))}
                        </div>

                        {/* Bento Specs Grid */}
                        <div className="pt-4 grid grid-cols-2 gap-2 text-left">
                          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                            <span className="text-[10px] text-neutral-400 block font-mono">ПРОЦЕССОР</span>
                            <span className="text-xs font-bold text-white">A18 Pro 3-нм</span>
                          </div>
                          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                            <span className="text-[10px] text-neutral-400 block font-mono">КАМЕРА</span>
                            <span className="text-xs font-bold text-white">48MP Fusion 5x</span>
                          </div>
                        </div>
                      </div>

                      {/* Tech Product Grid */}
                      <div className="px-5 space-y-3">
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                          Флагманские устройства
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {previewTemplate.sampleProducts.map(prod => (
                            <div
                              key={prod.id}
                              className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between hover:border-neutral-600 transition-all cursor-pointer"
                              onClick={() => {
                                setActiveProductDetail(prod);
                                setDetailQuantity(1);
                              }}
                            >
                              <div className="aspect-square bg-black rounded-xl overflow-hidden mb-2 relative">
                                <img
                                  src={prod.image}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                                {prod.tag && (
                                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold">
                                    {prod.tag}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h5 className="text-xs font-semibold text-white truncate">{prod.name}</h5>
                                <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">{prod.spec}</p>
                              </div>
                              <div className="pt-2 border-t border-neutral-800 mt-2 flex items-center justify-between">
                                <span className="text-xs font-mono text-white font-bold">
                                  {prod.price.toLocaleString("ru-RU")} UZS
                                </span>
                                <span className="text-[10px] text-blue-400 font-bold uppercase">
                                  Купить
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* ARCHETYPE 4: NIKE VELOCITY LAB (STREETWEAR)              */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.category === "streetwear" && (
                    <div className="space-y-6 pb-20">
                      {/* Nike Streetwear Header */}
                      <div className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-md px-5 py-3 border-b border-neutral-800 flex items-center justify-between">
                        <span className="font-extrabold text-sm tracking-tighter uppercase italic text-lime-400">
                          NIKE // VELOCITY
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCartDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lime-400 text-black text-xs font-extrabold cursor-pointer hover:bg-lime-300 transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{cartItemCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Drop Countdown & Hero */}
                      <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                        <img
                          src={previewTemplate.heroImage}
                          alt="Nike Streetwear"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-5 text-white space-y-1">
                          <span className="text-[10px] font-black tracking-widest uppercase bg-lime-400 text-black px-2 py-0.5 rounded w-fit">
                            🔥 LIMITED DROP • 9 ПАР ОСТАЛОСЬ
                          </span>
                          <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white">
                            AIR ZOOM ALPHAFLY 3
                          </h2>
                          <p className="text-xs text-neutral-300">
                            Амортизация ZoomX Foam и карбоновая пластина Flyplate.
                          </p>
                        </div>
                      </div>

                      {/* Interactive Sneaker Size Run */}
                      <div className="px-5">
                        <div className="p-4 rounded-2xl bg-neutral-900 border border-lime-400/30 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-lime-400 uppercase">
                            <span>Размерная сетка US:</span>
                            <span className="font-mono text-white">{simulatedSneakerSize}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {["US 8", "US 9", "US 10", "US 11", "US 12"].map(sz => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  setSimulatedSneakerSize(sz);
                                  addToCartSimulation(previewTemplate.sampleProducts[0], `Размер ${sz}`);
                                }}
                                className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                                  simulatedSneakerSize === sz
                                    ? "bg-lime-400 text-black shadow-lg shadow-lime-400/30"
                                    : "bg-neutral-800 text-neutral-300 border border-neutral-700 hover:border-lime-400"
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Streetwear Products */}
                      <div className="px-5 grid grid-cols-2 gap-3">
                        {previewTemplate.sampleProducts.map(p => (
                          <div
                            key={p.id}
                            className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between hover:border-lime-400 transition-all cursor-pointer"
                            onClick={() => {
                              setActiveProductDetail(p);
                              setDetailQuantity(1);
                            }}
                          >
                            <div className="aspect-square bg-black rounded-xl overflow-hidden mb-2 relative">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                              {p.tag && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-lime-400 text-black text-[9px] font-black uppercase">
                                  {p.tag}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                            <div className="pt-2 border-t border-neutral-800 mt-2 flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-lime-400">
                                {p.price.toLocaleString("ru-RU")} UZS
                              </span>
                              <Plus className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* -------------------------------------------------------- */}
                  {/* ARCHETYPE 5: CHANEL & HAUTE PARFUMERIE                   */}
                  {/* -------------------------------------------------------- */}
                  {previewTemplate.category === "luxury" && (
                    <div className="space-y-6 pb-20">
                      {/* Chanel Header */}
                      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
                        <span className="font-serif text-sm tracking-[0.3em] uppercase text-neutral-950 font-light">
                          CHANEL • PARIS
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setCartDrawerOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 text-amber-200 text-xs font-serif cursor-pointer hover:bg-neutral-800 transition-colors"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{cartItemCount}</span>
                          </button>
                        </div>
                      </div>

                      {/* Perfumery Hero */}
                      <div className="relative aspect-[3/4] sm:aspect-[16/10] bg-neutral-950 overflow-hidden">
                        <img
                          src={previewTemplate.heroImage}
                          alt="Chanel Parfumerie"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-6 text-white space-y-2">
                          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-300 font-serif">
                            PARFUM D'EXCEPTION • GRASSE
                          </span>
                          <h2 className="font-serif text-2xl sm:text-4xl font-light tracking-wide text-white uppercase">
                            GRAND CRISTAL NO. 5
                          </h2>
                          <p className="text-xs text-neutral-300 max-w-sm font-light">
                            Концентрация Extrait 30%. Абсолют майской розы и королевский мускус.
                          </p>
                        </div>
                      </div>

                      {/* Interactive Olfactory Pyramid & Flacon Selector */}
                      <div className="px-5 space-y-3">
                        <div className="p-4 rounded-2xl bg-neutral-50 border border-amber-500/20 space-y-3">
                          <span className="text-xs font-serif tracking-wider uppercase font-semibold text-neutral-900 block">
                            Пирамида аромата & Объем флакона:
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {["50 ml", "100 ml", "250 ml"].map(vol => (
                              <button
                                key={vol}
                                type="button"
                                onClick={() => setSimulatedVolume(vol)}
                                className={`py-2 text-xs font-serif rounded-xl border transition-all cursor-pointer ${
                                  simulatedVolume === vol
                                    ? "bg-neutral-950 text-amber-300 border-neutral-950 shadow-sm"
                                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                                }`}
                              >
                                {vol}
                              </button>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-neutral-200/70 text-[11px] text-neutral-600 space-y-1">
                            <div><strong>Верхние ноты:</strong> Калабрийский бергамот, Розовый перец</div>
                            <div><strong>Ноты сердца:</strong> Дамасская роза, Абсолют ириса</div>
                            <div><strong>Базовый шлейф:</strong> Серая амбра, Белый мускус</div>
                          </div>
                        </div>
                      </div>

                      {/* Perfumery Products */}
                      <div className="px-5 grid grid-cols-2 gap-4">
                        {previewTemplate.sampleProducts.map(p => (
                          <div
                            key={p.id}
                            className="group/luxury flex flex-col justify-between cursor-pointer space-y-2"
                            onClick={() => {
                              setActiveProductDetail(p);
                              setDetailQuantity(1);
                            }}
                          >
                            <div className="aspect-[3/4] bg-neutral-100 overflow-hidden relative rounded-xl">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover/luxury:scale-105 transition-transform duration-700" />
                              {p.tag && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/90 text-amber-200 text-[9px] font-serif tracking-widest uppercase">
                                  {p.tag}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-serif text-xs font-medium text-neutral-900 truncate">{p.name}</h4>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{p.spec}</p>
                              <div className="pt-1 flex items-center justify-between">
                                <span className="text-xs font-serif font-bold text-neutral-950">
                                  {p.price.toLocaleString("ru-RU")} UZS
                                </span>
                                <span className="text-[10px] font-serif text-amber-600 uppercase tracking-widest">
                                  + В корзину
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODAL: INTERACTIVE PRODUCT DETAIL SHEET (CLICK ON ITEM)  */}
                  {/* ======================================================== */}
                  {activeProductDetail && (
                    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md p-4 flex flex-col justify-end animate-in fade-in duration-200">
                      <div className="bg-white text-neutral-950 rounded-3xl p-5 space-y-4 max-h-[85%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-mono font-semibold uppercase">
                              {activeProductDetail.category}
                            </span>
                            {activeProductDetail.tag && (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-950 text-white text-[10px] font-mono font-bold uppercase">
                                {activeProductDetail.tag}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveProductDetail(null)}
                            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex gap-4 items-center">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                            <img src={activeProductDetail.image} alt={activeProductDetail.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold tracking-tight text-neutral-900 leading-snug">
                              {activeProductDetail.name}
                            </h3>
                            <p className="text-[11px] text-neutral-500 leading-relaxed">
                              {activeProductDetail.desc}
                            </p>
                            <div className="text-sm font-extrabold font-mono text-neutral-950 pt-1">
                              {activeProductDetail.price.toLocaleString("ru-RU")} UZS
                            </div>
                          </div>
                        </div>

                        {/* Interactive Option Selector based on Category */}
                        {previewTemplate.category === "fashion" && (
                          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                            <span className="text-[11px] font-semibold text-neutral-700 block">Размер:</span>
                            <div className="grid grid-cols-5 gap-1.5">
                              {["XS", "S", "M", "L", "XL"].map(sz => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setSimulatedSize(sz)}
                                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    simulatedSize === sz ? "bg-black text-white border-black" : "bg-white text-neutral-800 border-neutral-200"
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {previewTemplate.category === "restaurant" && (
                          <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                            <span className="font-bold text-neutral-800 block">Дополнительные опции:</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSimulatedCheddar(!simulatedCheddar)}
                                className={`flex-1 p-2 rounded-xl border text-center transition-all ${
                                  simulatedCheddar ? "border-orange-500 bg-orange-50 text-orange-700 font-bold" : "border-neutral-200 text-neutral-600"
                                }`}
                              >
                                🧀 Сыр (+8 000 UZS)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSimulatedBacon(!simulatedBacon)}
                                className={`flex-1 p-2 rounded-xl border text-center transition-all ${
                                  simulatedBacon ? "border-orange-500 bg-orange-50 text-orange-700 font-bold" : "border-neutral-200 text-neutral-600"
                                }`}
                              >
                                🥓 Бекон (+12 000 UZS)
                              </button>
                            </div>
                          </div>
                        )}

                        {previewTemplate.category === "tech" && (
                          <div className="space-y-2 pt-2 border-t border-neutral-100 text-xs">
                            <span className="font-semibold text-neutral-700 block">Объем накопителя:</span>
                            <div className="grid grid-cols-3 gap-2">
                              {["256GB", "512GB", "1TB"].map(mem => (
                                <button
                                  key={mem}
                                  type="button"
                                  onClick={() => setSimulatedTechMemory(mem)}
                                  className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                                    simulatedTechMemory === mem ? "bg-blue-600 text-white border-blue-600 font-bold" : "border-neutral-200 text-neutral-700"
                                  }`}
                                >
                                  {mem}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quantity Stepper & Submit Button */}
                        <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                          <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                              className="w-8 h-9 flex items-center justify-center hover:bg-neutral-100 text-neutral-600"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold font-mono text-neutral-900">
                              {detailQuantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDetailQuantity(detailQuantity + 1)}
                              className="w-8 h-9 flex items-center justify-center hover:bg-neutral-100 text-neutral-600"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const opt = previewTemplate.category === "fashion" ? `Размер ${simulatedSize}` :
                                          previewTemplate.category === "restaurant" ? (simulatedCheddar ? "+ Чеддер" : "Классика") :
                                          previewTemplate.category === "tech" ? `${simulatedTechMemory} ${simulatedTechFinish}` :
                                          previewTemplate.category === "streetwear" ? `Размер ${simulatedSneakerSize}` :
                                          `Объем ${simulatedVolume}`;
                              addToCartSimulation(activeProductDetail, opt, detailQuantity);
                            }}
                            className="flex-1 py-3 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                          >
                            <ShoppingBag className="w-4 h-4" />
                            <span>Добавить • {(activeProductDetail.price * detailQuantity).toLocaleString("ru-RU")} UZS</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MODAL: INTERACTIVE CART DRAWER (CLICK ON SHOPPING BAG)   */}
                  {/* ======================================================== */}
                  {cartDrawerOpen && (
                    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md p-4 flex flex-col justify-end animate-in fade-in duration-200">
                      <div className="bg-white text-neutral-950 rounded-3xl p-5 space-y-4 max-h-[90%] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                          <div className="flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-neutral-950" />
                            <h3 className="text-sm font-bold tracking-tight text-neutral-900">
                              Ваша корзина ({cartItemCount})
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCartDrawerOpen(false)}
                            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {orderCelebration ? (
                          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-300">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                              <CheckCheck className="w-8 h-8" />
                            </div>
                            <h4 className="text-base font-bold text-neutral-900">Заказ успешно оформлен!</h4>
                            <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                              Клиент получил подтверждение, а бот отправил моментальное уведомление владельцу магазина.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setOrderCelebration(false);
                                setCartItems([]);
                                setCartDrawerOpen(false);
                              }}
                              className="px-6 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                            >
                              Отлично
                            </button>
                          </div>
                        ) : cartItems.length === 0 ? (
                          <div className="py-10 text-center space-y-2">
                            <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                            <p className="text-xs font-medium text-neutral-500">Корзина пока пуста</p>
                            <p className="text-[11px] text-neutral-400">Нажмите на любой товар, чтобы добавить его в заказ</p>
                          </div>
                        ) : (
                          <>
                            {/* Items List */}
                            <div className="space-y-2.5 divide-y divide-neutral-100 max-h-56 overflow-y-auto pr-1">
                              {cartItems.map(item => (
                                <div key={item.id} className="pt-2.5 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                                      <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="text-left">
                                      <div className="text-xs font-semibold text-neutral-900 truncate max-w-[140px]">
                                        {item.product.name}
                                      </div>
                                      <div className="text-[10px] text-neutral-400 font-mono">
                                        {item.selectedOption} • {item.quantity} шт.
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-neutral-950">
                                      {item.itemTotal.toLocaleString("ru-RU")} UZS
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => removeCartItem(item.id)}
                                      className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Promo Code Input */}
                            <div className="pt-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={promoCodeInput}
                                onChange={(e) => setPromoCodeInput(e.target.value)}
                                placeholder="Промокод (напр. VIP2026)"
                                className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-xs uppercase font-mono tracking-wider focus:outline-neutral-900"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (promoCodeInput.trim().toUpperCase() === "VIP2026") {
                                    setPromoDiscount(0.15);
                                    alert("Промокод применен: скидка 15%!");
                                  } else {
                                    alert("Промокод VIP2026 дает скидку 15%!");
                                  }
                                }}
                                className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-colors"
                              >
                                Применить
                              </button>
                            </div>

                            {/* Total Calculation */}
                            <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
                              <div className="flex justify-between text-neutral-500">
                                <span>Сумма товаров:</span>
                                <span className="font-mono">{cartSubtotal.toLocaleString("ru-RU")} UZS</span>
                              </div>
                              {promoDiscount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-semibold">
                                  <span>Скидка по промокоду (15%):</span>
                                  <span className="font-mono">-{(cartSubtotal * promoDiscount).toLocaleString("ru-RU")} UZS</span>
                                </div>
                              )}
                              <div className="flex justify-between text-neutral-500">
                                <span>Доставка:</span>
                                <span className="text-emerald-600 font-bold">Бесплатно</span>
                              </div>
                              <div className="flex justify-between text-neutral-950 font-bold text-sm pt-1 border-t border-neutral-100">
                                <span>Итого к оплате:</span>
                                <span className="font-mono">{cartTotalWithDiscount.toLocaleString("ru-RU")} UZS</span>
                              </div>
                            </div>

                            {/* Checkout CTA */}
                            <button
                              type="button"
                              onClick={() => setOrderCelebration(true)}
                              className="w-full py-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Zap className="w-4 h-4 fill-white" />
                              <span>Оформить заказ в 1 клик</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* MOBILE (IPHONE 16 TMA) BOTTOM NAVIGATION BAR             */}
                  {/* ======================================================== */}
                  {previewDevice === "mobile" && (
                    <div className="absolute bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 py-2 flex items-center justify-around text-neutral-500 text-[10px] font-medium shadow-lg">
                      <button
                        type="button"
                        onClick={() => { setPreviewMobileNav("home"); setCartDrawerOpen(false); }}
                        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          previewMobileNav === "home" ? "text-neutral-950 font-bold" : "hover:text-neutral-900"
                        }`}
                      >
                        <Home className="w-4 h-4" />
                        <span>Главная</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPreviewMobileNav("catalog"); setCartDrawerOpen(false); }}
                        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          previewMobileNav === "catalog" ? "text-neutral-950 font-bold" : "hover:text-neutral-900"
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                        <span>Каталог</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCartDrawerOpen(true)}
                        className="flex flex-col items-center gap-1 cursor-pointer relative hover:text-neutral-900 transition-colors"
                      >
                        <div className="relative">
                          <ShoppingBag className="w-4 h-4" />
                          {cartItemCount > 0 && (
                            <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-orange-600 text-white rounded-full text-[9px] font-mono flex items-center justify-center font-bold">
                              {cartItemCount}
                            </span>
                          )}
                        </div>
                        <span>Корзина</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPreviewMobileNav("profile"); setCartDrawerOpen(false); }}
                        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                          previewMobileNav === "profile" ? "text-neutral-950 font-bold" : "hover:text-neutral-900"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span>Профиль</span>
                      </button>
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1-CLICK TURNKEY CONFIRMATION MODAL                             */}
      {/* ============================================================== */}
      {applyModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-md w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-semibold">
                  1-CLICK INSTALLATION
                </span>
                <h3 className="text-xl font-semibold text-neutral-950 tracking-tight mt-0.5">
                  Установка: {applyModalTemplate.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Вы собираетесь активировать цифровую экосистему <strong className="text-neutral-900 font-semibold">{applyModalTemplate.name}</strong> для вашего магазина <span className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-800">{store?.subdomain}</span>.
            </p>

            {/* Installation Modes */}
            <div className="space-y-3">
              <label
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  applyOption === "turnkey"
                    ? "border-neutral-950 bg-neutral-50/80 shadow-xs ring-1 ring-neutral-950"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="apply_mode"
                  checked={applyOption === "turnkey"}
                  onChange={() => setApplyOption("turnkey")}
                  className="mt-1 text-neutral-900 focus:ring-neutral-900"
                />
                <div>
                  <div className="text-xs font-semibold text-neutral-950 flex items-center gap-1.5">
                    <span>Полный запуск (Рекомендуется)</span>
                    <span className="px-1.5 py-0.5 rounded bg-neutral-900 text-white text-[9px] font-mono">PRO</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Устанавливает дизайн, адаптирует витрину под стандарты бренда ({applyModalTemplate.brandArchetype}) и загружает демонстрационный каталог со студийными фото.
                  </p>
                </div>
              </label>

              <label
                className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                  applyOption === "design_only"
                    ? "border-neutral-950 bg-neutral-50/80 shadow-xs ring-1 ring-neutral-950"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="apply_mode"
                  checked={applyOption === "design_only"}
                  onChange={() => setApplyOption("design_only")}
                  className="mt-1 text-neutral-900 focus:ring-neutral-900"
                />
                <div>
                  <div className="text-xs font-semibold text-neutral-950">
                    Применить только стиль оформления
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                    Сохранит все существующие товары магазина, обновив палитру, форму карточек, сетку и типографику.
                  </p>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setApplyModalTemplate(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
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
