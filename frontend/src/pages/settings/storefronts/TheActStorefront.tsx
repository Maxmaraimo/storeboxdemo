import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Heart,
  Check,
  Star,
  ChevronRight,
  ChevronLeft,
  X,
  Search,
  SlidersHorizontal,
  Droplets,
  Feather,
  Smile,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  MessageSquare,
  ThumbsUp,
  Share2
} from 'lucide-react';

interface TheActStorefrontProps {
  products: ThemeProductItem[];
  cartCount: number;
  onOpenCart: () => void;
  onAddToCart: (
    product: ThemeProductItem,
    qty?: number,
    option?: string,
    customDetails?: string,
    extraPrice?: number
  ) => void;
  onNavigateToProduct?: (product: ThemeProductItem) => void;
}

// Curated authentic products matching 'косметика1.png'
const THEACT_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'act-1',
    title: 'Coconut Sugar Body Scrub',
    category: 'body',
    price: 98000,
    oldPrice: 120000,
    image: '/images/flagships/theact_scrub_jar_hd.jpg',
    gallery: [
      '/images/flagships/theact_scrub_jar_hd.jpg',
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_lotion_hd.jpg'
    ],
    rating: 4.9,
    reviewsCount: 384,
    badge: 'BESTSELLER',
    desc: 'Знаковый сахарный скраб с натуральным органическим кокосовым маслом и кристаллами морской соли. Деликатно полирует, превращая кожу в бархатный шелк.',
    options: ['200 мл (банка)', '400 мл (эко-формат) +45 000 UZS'],
    specs: {
      'Объем': '200 мл / 400 мл',
      'Тип кожи': 'Для всех типов кожи, включая чувствительную',
      'Текстура': 'Нежная сахарно-масляная паста с ароматом свежего кокоса',
      'Страна': 'Россия / Франция (сырье)'
    }
  },
  {
    id: 'act-2',
    title: 'Whipped Macadamia Body Butter',
    category: 'body',
    price: 115000,
    oldPrice: 135000,
    image: '/images/flagships/theact_lotion_hd.jpg',
    gallery: [
      '/images/flagships/theact_lotion_hd.jpg',
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_scrub_jar_hd.jpg'
    ],
    rating: 5.0,
    reviewsCount: 247,
    badge: 'SALE -15%',
    desc: 'Воздушный взбитый баттер для глубокого питания сухой кожи. Мгновенно впитывается без липкости, оставляя теплый орехово-ванильный шлейф.',
    options: ['150 мл', '300 мл +50 000 UZS'],
    specs: {
      'Объем': '150 мл / 300 мл',
      'Активные масла': 'Макадамия, карите (ши), сладкий миндаль',
      'Эффект': '24 часа глубокого увлажнения и сияния'
    }
  },
  {
    id: 'act-3',
    title: 'Sea Salt & Grapefruit Body Polish',
    category: 'body',
    price: 105000,
    oldPrice: 125000,
    image: '/images/flagships/theact_scrub_jar_hd.jpg',
    gallery: [
      '/images/flagships/theact_scrub_jar_hd.jpg',
      '/images/flagships/theact_clean_model_hd.jpg'
    ],
    rating: 4.8,
    reviewsCount: 173,
    badge: 'DETOX SPA',
    desc: 'Тонизирующий солевой скраб с эфирным маслом розового грейпфрута и витамином E. Стимулирует лимфодренаж и выравнивает рельеф кожи.',
    options: ['250 г', '500 г +48 000 UZS'],
    specs: {
      'Основа': 'Морская соль мертвого моря, масло грейпфрута',
      'Действие': 'Дренажный и антицеллюлитный эффект'
    }
  },
  {
    id: 'act-4',
    title: 'Gentle Cleansing Face Oil',
    category: 'face',
    price: 135000,
    oldPrice: 155000,
    image: '/images/flagships/theact_clean_model_hd.jpg',
    gallery: [
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_model_hd.jpg',
      '/images/flagships/theact_lotion_hd.jpg'
    ],
    rating: 4.8,
    reviewsCount: 192,
    badge: 'CLEAN FORMULA',
    desc: 'Гидрофильное масло для бережного демакияжа и глубокого очищения пор. При контакте с водой превращается в шелковое молочко.',
    options: ['100 мл флакон', '200 мл с дозатором +55 000 UZS'],
    specs: {
      'Объем': '100 мл / 200 мл',
      'Действие': 'Растворяет водостойкий макияж и SPF за 30 секунд'
    }
  },
  {
    id: 'act-5',
    title: 'Hyaluronic Dew Face Glow Serum',
    category: 'face',
    price: 145000,
    oldPrice: 168000,
    image: '/images/flagships/theact_fragrance_hd.jpg',
    gallery: [
      '/images/flagships/theact_fragrance_hd.jpg',
      '/images/flagships/theact_clean_model_hd.jpg'
    ],
    rating: 4.9,
    reviewsCount: 312,
    badge: 'HYDRATION 48H',
    desc: 'Концентрированная сыворотка с 5 видами разномолекулярной гиалуроновой кислоты и ниацинамидом 5%. Мгновенный эффект увлажненной стеклянной кожи.',
    options: ['30 мл флакон-пипетка', '50 мл PRO +50 000 UZS'],
    specs: {
      'Состав': 'Гиалуроновая кислота 5 видов, ниацинамид 5%, центелла',
      'Финиш': 'Естественное влажное сияние без липкости'
    }
  },
  {
    id: 'act-6',
    title: 'Barrier Restoring Face Cream',
    category: 'face',
    price: 125000,
    oldPrice: 145000,
    image: '/images/flagships/theact_clean_model_hd.jpg',
    gallery: [
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_lotion_hd.jpg'
    ],
    rating: 4.9,
    reviewsCount: 156,
    badge: 'CERAMIDES',
    desc: 'Ламеллярный восстанавливающий крем с комплексом 3 церамидов и скваланом. Укрепляет защитный барьер, снимает покраснения и раздражения.',
    options: ['50 мл туба', '100 мл +40 000 UZS'],
    specs: {
      'Ключевые активы': 'Церамиды NP/AP/EOP, сквалан, пантенол'
    }
  },
  {
    id: 'act-7',
    title: 'Silk Protein Hair Mist & Thermal Shield',
    category: 'hair',
    price: 95000,
    oldPrice: 110000,
    image: '/images/flagships/theact_lotion_hd.jpg',
    gallery: [
      '/images/flagships/theact_lotion_hd.jpg',
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_fragrance_hd.jpg'
    ],
    rating: 4.9,
    reviewsCount: 268,
    badge: 'MUST HAVE',
    desc: 'Несмываемый спрей-вуаль с гидролизованными протеинами шелка и термозащитой до 230°C. Разглаживает кутикулу волоса и дарит зеркальный блеск.',
    options: ['150 мл спрей', '250 мл PRO +40 000 UZS'],
    specs: {
      'Защита': 'Термозащита до 230°C, UV-фильтр',
      'Аромат': 'Белый чай, бергамот и хлопковый мускус'
    }
  },
  {
    id: 'act-8',
    title: 'Intensive Restoring Coconut Hair Mask',
    category: 'hair',
    price: 110000,
    oldPrice: 130000,
    image: '/images/flagships/theact_scrub_jar_hd.jpg',
    gallery: [
      '/images/flagships/theact_scrub_jar_hd.jpg',
      '/images/flagships/theact_lotion_hd.jpg'
    ],
    rating: 5.0,
    reviewsCount: 310,
    badge: 'DEEP NOURISH',
    desc: 'Интенсивная густая маска для сухих и поврежденных волос. Заполняет пустоты в структуре волоса, предотвращает ломкость и сечение кончиков.',
    options: ['250 мл (банка)', '500 мл SALON +60 000 UZS'],
    specs: {
      'Время выдержки': '5-10 минут',
      'Эффект': 'Шелковая гладкость и рассыпчатость волос'
    }
  },
  {
    id: 'act-9',
    title: 'Vanilla Shea Hand & Lip Therapy Balm',
    category: 'other',
    price: 52000,
    oldPrice: 65000,
    image: '/images/flagships/theact_clean_model_hd.jpg',
    gallery: [
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_fragrance_hd.jpg'
    ],
    rating: 4.9,
    reviewsCount: 420,
    badge: 'ICONIC TUBE',
    desc: 'Восстанавливающий бальзам в винтажной алюминиевой тубе. Защищает губы и кутикулу от сухости, ветра и холода.',
    options: ['30 мл туба', 'Дуо-пак (2 шт) +40 000 UZS'],
    specs: {
      'Формат': 'Винтажная перерабатываемая алюминиевая туба',
      'Состав': '100% органические масла ши, какао и пчелиный воск'
    }
  },
  {
    id: 'act-10',
    title: 'Warm Sandalwood Eau de Parfum',
    category: 'other',
    price: 240000,
    oldPrice: 280000,
    image: '/images/flagships/theact_fragrance_hd.jpg',
    gallery: [
      '/images/flagships/theact_fragrance_hd.jpg',
      '/images/flagships/theact_clean_model_hd.jpg',
      '/images/flagships/theact_model_hd.jpg'
    ],
    rating: 5.0,
    reviewsCount: 185,
    badge: 'LIMITED EDITION',
    desc: 'Селективный аромат чистого тела и теплого сандала. Мягкая интимная вуаль из кремового сандала, белого кедра и теплой амбры.',
    options: ['50 мл флакон', '100 мл флакон +120 000 UZS'],
    specs: {
      'Стойкость': 'До 12 часов на коже',
      'Ноты': 'Сандал, белый кедр, амбра, ирис, чистый мускус'
    }
  }
];

export const TheActStorefront: React.FC<TheActStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const heroFeatured = THEACT_PRODUCTS[0];
  // Navigation & View State
  const [activeView, setActiveView] = useState<'home' | 'catalog' | 'pdp'>('home');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem>(THEACT_PRODUCTS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PDP Specific State
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [pdpQuantity, setPdpQuantity] = useState(1);
  const [pdpTab, setPdpTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [userReviews, setUserReviews] = useState<Array<{ name: string; rating: number; text: string; date: string }>>([
    {
      name: 'Камилла С.',
      rating: 5,
      text: 'Это лучший скраб в моей жизни! Кожа после него словно после дорогого спа-отеля на Бали. Масло не оставляет жирной пленки, а кокос пахнет натурально, без химозности.',
      date: 'Вчера'
    },
    {
      name: 'Диана Р.',
      rating: 5,
      text: 'Упаковка — чистый эстетический восторг. Поставила в ванной на видное место. Заказываю уже третью банку подругам на подарки.',
      date: '3 дня назад'
    }
  ]);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewName, setNewReviewName] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openPdp = (product: ThemeProductItem) => {
    setSelectedProduct(product);
    setSelectedGalleryIdx(0);
    setSelectedOptionIdx(0);
    setPdpQuantity(1);
    setActiveView('pdp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePdpAddToCart = () => {
    const opt = selectedProduct.options?.[selectedOptionIdx] || 'Стандарт';
    const extraPrice = selectedOptionIdx > 0 ? (selectedProduct.price * 0.4) : 0;
    onAddToCart(selectedProduct, pdpQuantity, opt, undefined, extraPrice);
    showToast(`«${selectedProduct.title}» (${opt}) добавлен в корзину`);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;
    setUserReviews(prev => [
      {
        name: newReviewName.trim() || 'Покупатель StoreBox',
        rating: 5,
        text: newReviewText.trim(),
        date: 'Только что'
      },
      ...prev
    ]);
    setNewReviewText('');
    setNewReviewName('');
    showToast('Спасибо за ваш отзыв! Он опубликован в витрине.');
  };

  // Filtered & Sorted Catalog
  const filteredProducts = useMemo(() => {
    let list = THEACT_PRODUCTS;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [activeCategory, searchQuery, sortBy]);

  const handleCategoryNav = (catId: string) => {
    setActiveCategory(catId);
    setActiveView('home');
    setTimeout(() => {
      const el = document.getElementById('theact-collection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 60);
  };

  return (
    <div className="bg-[#FAF8F5] text-[#1E1C1A] min-h-screen font-serif selection:bg-[#1E1C1A] selection:text-white pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#1E1C1A] text-white shadow-2xl text-xs font-sans font-bold flex items-center gap-2.5 animate-in fade-in border border-neutral-700">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. EDITORIAL HEADER */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EBE5DC] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => { setActiveView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-2xl sm:text-3xl font-black tracking-tight font-serif lowercase text-[#1E1C1A] hover:opacity-80 transition-opacity cursor-pointer"
            >
              the act.
            </button>
            <nav className="hidden md:flex items-center gap-6 font-sans text-xs uppercase tracking-wider text-[#666059] font-medium">
              <button
                type="button"
                onClick={() => { setActiveView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`transition-colors cursor-pointer ${activeView === 'home' && activeCategory === 'all' ? 'text-black font-bold' : 'hover:text-black'}`}
              >
                Главная
              </button>
              <button
                type="button"
                onClick={() => handleCategoryNav('all')}
                className={`transition-colors cursor-pointer ${activeCategory === 'all' ? 'text-black font-bold' : 'hover:text-black'}`}
              >
                Каталог
              </button>
              <button
                type="button"
                onClick={() => handleCategoryNav('body')}
                className={`transition-colors cursor-pointer ${activeCategory === 'body' ? 'text-black font-bold' : 'hover:text-black'}`}
              >
                Для тела
              </button>
              <button
                type="button"
                onClick={() => handleCategoryNav('face')}
                className={`transition-colors cursor-pointer ${activeCategory === 'face' ? 'text-black font-bold' : 'hover:text-black'}`}
              >
                Для лица
              </button>
              <button
                type="button"
                onClick={() => handleCategoryNav('hair')}
                className={`transition-colors cursor-pointer ${activeCategory === 'hair' ? 'text-black font-bold' : 'hover:text-black'}`}
              >
                Для волос
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleCategoryNav('all')}
              className="p-2 rounded-full border border-[#DCD4C7] hover:border-black font-sans text-xs text-[#1E1C1A] transition-all cursor-pointer bg-white/60"
              title="Поиск по каталогу"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="relative px-4 py-2 rounded-full border border-[#DCD4C7] hover:border-black font-sans text-xs font-bold text-[#1E1C1A] flex items-center gap-2 transition-all cursor-pointer bg-white/60"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Корзина</span>
              {cartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1E1C1A] text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* VIEW: HOME VIEW                                                */}
      {/* ============================================================== */}
      {activeView === 'home' && (
        <main className="animate-in fade-in duration-300">
          {/* 2. HERO EDITORIAL SECTION (Matching косметика1.png) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Headline */}
              <div className="lg:col-span-5 space-y-6">
                <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#888075]">
                  Organic Body Care Ritual
                </span>
                <h1 className="text-4xl sm:text-6xl font-normal leading-[1.08] tracking-tight text-[#1E1C1A]">
                  Cosmetics for the whole body.<br />
                  <span className="italic">For every body.</span>
                </h1>
                <p className="font-sans text-sm text-[#666059] max-w-md leading-relaxed">
                  Мы создали ритуал бережного ухода за собой, где натуральные масла и чувственные текстуры превращают каждый день в спа-наслаждение.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openPdp(heroFeatured)}
                    className="px-6 py-3.5 rounded-full bg-[#1E1C1A] text-white font-sans text-xs font-bold tracking-wider uppercase hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <span>Купить бестселлер</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryNav('all')}
                    className="px-5 py-3.5 rounded-full border border-[#DCD4C7] bg-white text-[#1E1C1A] font-sans text-xs font-bold uppercase hover:border-black transition-all cursor-pointer"
                  >
                    Весь каталог
                  </button>
                </div>
              </div>

              {/* Right Hero Image with Floating Cards */}
              <div className="lg:col-span-7 relative">
                <div className="relative rounded-[36px] overflow-hidden bg-[#ECE6DC] aspect-[4/3] sm:aspect-[16/11] shadow-xl border border-[#E0D9CE]">
                  <img
                    src="/images/flagships/theact_clean_model_hd.jpg"
                    alt="the act ritual"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                  {/* Floating Top-Right Product Badge (Clickable to PDP) */}
                  <div
                    onClick={() => openPdp(heroFeatured)}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-white/60 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform"
                  >
                    <img
                      src="/images/flagships/theact_scrub_jar_hd.jpg"
                      alt="Coconut butter"
                      className="w-12 h-12 rounded-xl object-cover bg-[#FAF8F5]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                          sale -15%
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#1E1C1A]" />
                      </div>
                      <p className="font-serif text-xs font-bold mt-1 text-[#1E1C1A]">Coconut body butter</p>
                    </div>
                  </div>

                  {/* Floating Bottom-Left Quote Card */}
                  <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 max-w-xs bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/60 flex items-start gap-3">
                    <img
                      src="/images/flagships/theact_model_hd.jpg"
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <p className="font-sans text-[11px] text-[#554F48] leading-snug italic">
                      “Мы вдохновлялись вами и превратили ежедневный уход в особый спа-ритуал любви к себе.”
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. BRAND MISSION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10 border-t border-[#EBE5DC]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline">
              <div className="md:col-span-4">
                <span className="font-sans text-xs uppercase tracking-widest text-[#888075] font-bold">
                  Brand Mission
                </span>
              </div>
              <div className="md:col-span-8 space-y-4">
                <p className="text-xl sm:text-2xl text-[#2B2724] font-normal leading-relaxed">
                  Цель бренда — подарить ощущение роскошного спа-ухода без перегруженности. В центре нашего внимания — чистые растительные формулы и наслаждение каждым прикосновением.
                </p>
                <div className="flex items-center gap-6 font-sans text-xs text-[#666059]">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    100% Веганские формулы
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Без сульфатов и парабенов
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Cruelty-free сертификация
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 4. CAPSULE CATEGORIES (Matching ( body ) ↗, ( face ) ↗, ( hair ) ↗, ( other ) ↗) */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  id: 'body',
                  title: '( body )',
                  bg: '#DCD4E8',
                  image: '/images/flagships/theact_scrub_jar_hd.jpg',
                  label: 'Скрабы, баттеры, кремы'
                },
                {
                  id: 'face',
                  title: '( face )',
                  bg: '#E4DDD3',
                  image: '/images/flagships/theact_clean_model_hd.jpg',
                  label: 'Сыворотки, гидрофильные масла'
                },
                {
                  id: 'hair',
                  title: '( hair )',
                  bg: '#C5D6CC',
                  image: '/images/flagships/theact_lotion_hd.jpg',
                  label: 'Маски, термозащита, спреи'
                },
                {
                  id: 'other',
                  title: '( other )',
                  bg: '#E7DDD5',
                  image: '/images/flagships/theact_fragrance_hd.jpg',
                  label: 'Бальзамы для рук и губ'
                }
              ].map(cat => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryNav(cat.id)}
                  className="group rounded-3xl p-5 flex flex-col justify-between aspect-[3/4] cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden border border-black/5"
                  style={{ backgroundColor: cat.bg }}
                >
                  <div className="flex items-center justify-between z-10">
                    <span className="font-sans text-xs font-bold text-[#1E1C1A]">{cat.title}</span>
                    <span className="w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-xs font-bold group-hover:bg-black group-hover:text-white transition-all shadow-xs">
                      ↗
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center my-2 z-10">
                    <img
                      src={cat.image}
                      alt={cat.title}
                      className="max-h-36 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300 rounded-xl"
                    />
                  </div>
                  <span className="font-sans text-[11px] text-[#554F48] z-10 font-medium">{cat.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5. BIG BRAND TYPOGRAPHY BANNER WITH HERO PRODUCT */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 py-14 relative overflow-hidden">
            <div className="bg-white rounded-[40px] border border-[#EBE5DC] p-8 sm:p-14 relative overflow-hidden shadow-sm">
              {/* Giant background watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
                <span className="text-[140px] sm:text-[240px] font-black font-serif tracking-tighter">
                  the act.
                </span>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-md">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#888075]">
                    Products · Aesthetics · Comfort · Care
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-normal leading-tight text-[#1E1C1A]">
                    the act.
                  </h2>
                  <p className="font-sans text-xs text-[#666059] leading-relaxed">
                    Наш знаковый кокосовый скраб бережно отшелушивает ороговевшие частички, оставляя кожу бархатной, увлажненной и сияющей.
                  </p>

                  <div className="pt-4 bg-[#FAF8F5] rounded-2xl p-4 border border-[#EBE5DC] flex items-center justify-between gap-4">
                    <div>
                      <span className="font-sans text-[10px] text-[#888075] uppercase font-bold">( for body )</span>
                      <p className="font-serif text-sm font-bold text-[#1E1C1A]">Body scrub coconut</p>
                      <p className="font-sans text-xs font-black text-[#1E1C1A] mt-0.5">8$ · 98 000 UZS</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openPdp(heroFeatured)}
                      className="px-5 py-2.5 rounded-full bg-[#1E1C1A] text-white font-sans text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span>Подробнее</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div
                  onClick={() => openPdp(heroFeatured)}
                  className="relative max-w-sm cursor-pointer group"
                >
                  <img
                    src="/images/flagships/theact_scrub_jar_hd.jpg"
                    alt="Body scrub coconut"
                    className="w-72 sm:w-80 h-72 sm:h-80 object-cover rounded-3xl shadow-xl border border-[#EBE5DC] group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-sans font-bold shadow-md">
                    Открыть PDP ↗
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. BESTSELLERS PREVIEW */}
          <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
            <div className="flex items-center justify-between pb-6 border-b border-[#EBE5DC]">
              <div>
                <h3 className="text-2xl sm:text-3xl font-normal text-[#1E1C1A]">Бестселлеры бренда</h3>
                <p className="font-sans text-xs text-[#666059] mt-1">Средства, полюбившиеся тысячам девушек по всему миру</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('catalog')}
                className="font-sans text-xs font-bold text-[#1E1C1A] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Смотреть все</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-8">
              {THEACT_PRODUCTS.slice(0, 3).map(p => (
                <div
                  key={p.id}
                  onClick={() => openPdp(p)}
                  className="group bg-white rounded-3xl p-5 border border-[#EBE5DC] flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] mb-4">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {p.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-sans font-bold text-[#1E1C1A] border border-[#E0D9CE] shadow-xs">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="font-sans text-[10px] uppercase font-bold text-[#888075]">({p.category})</span>
                    <h4 className="font-serif text-base font-bold text-[#1E1C1A] line-clamp-1 group-hover:text-amber-900 transition-colors">
                      {p.title}
                    </h4>
                    <p className="font-sans text-xs text-[#666059] line-clamp-2 leading-relaxed">
                      {p.desc}
                    </p>
                    <div className="pt-3 flex items-center justify-between border-t border-[#F2ECE4]">
                      <div>
                        <span className="font-sans text-sm font-black text-[#1E1C1A]">
                          {p.price.toLocaleString('ru-RU')} UZS
                        </span>
                        {p.oldPrice && (
                          <span className="font-sans text-xs text-[#888075] line-through ml-2">
                            {p.oldPrice.toLocaleString('ru-RU')} UZS
                          </span>
                        )}
                      </div>
                      <span className="p-2 rounded-full bg-[#FAF8F5] group-hover:bg-[#1E1C1A] group-hover:text-white transition-all text-xs font-sans font-bold">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 7. COMPLETE EDITORIAL COLLECTION SECTION */}
          <section id="theact-collection" className="max-w-7xl mx-auto px-4 sm:px-8 py-14 border-t border-[#EBE5DC]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#EBE5DC]">
              <div>
                <span className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#888075]">
                  Органическая коллекция ухода
                </span>
                <h3 className="text-3xl sm:text-4xl font-normal text-[#1E1C1A] mt-1">Все продукты the act.</h3>
                <p className="font-sans text-xs text-[#666059] mt-1">
                  Найдено средств: <strong className="text-black font-bold">{filteredProducts.length}</strong>
                </p>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888075]" />
                  <input
                    type="text"
                    placeholder="Поиск по уходу..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-full border border-[#DCD4C7] bg-white font-sans text-xs focus:outline-hidden focus:border-black"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="px-4 py-2 rounded-full border border-[#DCD4C7] bg-white font-sans text-xs font-bold text-[#1E1C1A] focus:outline-hidden cursor-pointer"
                >
                  <option value="popular">По популярности</option>
                  <option value="price-asc">Сначала дешевле</option>
                  <option value="price-desc">Сначала дороже</option>
                  <option value="rating">По рейтингу</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-6 font-sans text-xs font-bold">
              {[
                { id: 'all', title: 'Все товары' },
                { id: 'body', title: '( body ) · Для тела' },
                { id: 'face', title: '( face ) · Для лица' },
                { id: 'hair', title: '( hair ) · Для волос' },
                { id: 'other', title: '( other ) · Уход & Парфюм' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-[#1E1C1A] text-white shadow-md'
                      : 'bg-white text-[#666059] hover:bg-[#EBE5DC] border border-[#E0D9CE]'
                  }`}
                >
                  {cat.title} ({cat.id === 'all' ? THEACT_PRODUCTS.length : THEACT_PRODUCTS.filter(p => p.category === cat.id).length})
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  className="group bg-white rounded-3xl p-5 border border-[#EBE5DC] flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div
                    onClick={() => openPdp(p)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] mb-4 cursor-pointer"
                  >
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {p.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-sans font-bold text-[#1E1C1A] border border-[#E0D9CE]">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[10px] uppercase font-bold text-[#888075]">({p.category})</span>
                      <span className="font-sans text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {p.rating} ({p.reviewsCount})
                      </span>
                    </div>

                    <h4
                      onClick={() => openPdp(p)}
                      className="font-serif text-base font-bold text-[#1E1C1A] line-clamp-1 hover:text-amber-900 cursor-pointer transition-colors"
                    >
                      {p.title}
                    </h4>

                    <p className="font-sans text-xs text-[#666059] line-clamp-2 leading-relaxed">
                      {p.desc}
                    </p>

                    <div className="pt-3 flex items-center justify-between border-t border-[#F2ECE4]">
                      <div>
                        <span className="font-sans text-sm font-black text-[#1E1C1A]">
                          {p.price.toLocaleString('ru-RU')} UZS
                        </span>
                        {p.oldPrice && (
                          <span className="font-sans text-xs text-[#888075] line-through ml-2">
                            {p.oldPrice.toLocaleString('ru-RU')} UZS
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPdp(p)}
                          className="px-3 py-1.5 rounded-full border border-[#DCD4C7] bg-white text-[#1E1C1A] font-sans text-xs font-bold hover:border-black cursor-pointer"
                        >
                          Инфо
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onAddToCart(p, 1, p.options?.[0] || 'Стандарт');
                            showToast(`«${p.title}» добавлен в корзину`);
                          }}
                          className="px-4 py-1.5 rounded-full bg-[#1E1C1A] text-white font-sans text-xs font-bold hover:bg-neutral-800 cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>В корзину</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* ============================================================== */}
      {/* VIEW: CATALOG (FULL FILTERING, SEARCH & SORT)                   */}
      {/* ============================================================== */}
      {activeView === 'catalog' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 animate-in fade-in duration-300">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 font-sans text-xs text-[#888075] mb-6">
            <button type="button" onClick={() => setActiveView('home')} className="hover:text-black cursor-pointer">
              Главная
            </button>
            <span>/</span>
            <span className="text-[#1E1C1A] font-bold">Каталог The Act</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EBE5DC]">
            <div>
              <h2 className="text-3xl sm:text-4xl font-normal text-[#1E1C1A]">Коллекция ухода</h2>
              <p className="font-sans text-xs text-[#666059] mt-1">
                Найдено товаров: <strong className="text-black">{filteredProducts.length}</strong>
              </p>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888075]" />
                <input
                  type="text"
                  placeholder="Поиск по уходу..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-full border border-[#DCD4C7] bg-white font-sans text-xs focus:outline-hidden focus:border-black"
                />
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-full border border-[#DCD4C7] bg-white font-sans text-xs font-bold text-[#1E1C1A] focus:outline-hidden cursor-pointer"
              >
                <option value="popular">По популярности</option>
                <option value="price-asc">Сначала дешевле</option>
                <option value="price-desc">Сначала дороже</option>
                <option value="rating">По рейтингу</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto py-6 font-sans text-xs font-bold">
            {[
              { id: 'all', title: 'Все продукты' },
              { id: 'body', title: 'Для тела (body)' },
              { id: 'face', title: 'Для лица (face)' },
              { id: 'hair', title: 'Для волос (hair)' },
              { id: 'other', title: 'Бальзамы и парфюм' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-[#1E1C1A] text-white shadow-md'
                    : 'bg-white text-[#666059] hover:bg-[#EBE5DC] border border-[#E0D9CE]'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <Sparkles className="w-12 h-12 mx-auto text-[#DCD4C7]" />
              <p className="font-serif text-lg text-[#1E1C1A]">Товары не найдены</p>
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="px-5 py-2 rounded-full bg-[#1E1C1A] text-white font-sans text-xs font-bold"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => openPdp(p)}
                  className="group bg-white rounded-3xl p-5 border border-[#EBE5DC] flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] mb-4">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {p.badge && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-sans font-bold text-[#1E1C1A] border border-[#E0D9CE]">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[10px] uppercase font-bold text-[#888075]">({p.category})</span>
                      <div className="flex items-center gap-1 font-sans text-xs font-bold text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{p.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <h4 className="font-serif text-base font-bold text-[#1E1C1A] line-clamp-1">
                      {p.title}
                    </h4>
                    <p className="font-sans text-xs text-[#666059] line-clamp-2">
                      {p.desc}
                    </p>
                    <div className="pt-3 flex items-center justify-between border-t border-[#F2ECE4]">
                      <span className="font-sans text-sm font-black text-[#1E1C1A]">
                        {p.price.toLocaleString('ru-RU')} UZS
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          openPdp(p);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#1E1C1A] text-white font-sans text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Купить</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* ============================================================== */}
      {/* VIEW: PRODUCT DETAIL PAGE (PDP)                                */}
      {/* ============================================================== */}
      {activeView === 'pdp' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 animate-in fade-in duration-300">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 font-sans text-xs text-[#888075] mb-8">
            <button type="button" onClick={() => setActiveView('home')} className="hover:text-black cursor-pointer">
              Главная
            </button>
            <span>/</span>
            <button type="button" onClick={() => setActiveView('catalog')} className="hover:text-black cursor-pointer">
              Каталог
            </button>
            <span>/</span>
            <span className="text-[#1E1C1A] font-bold">{selectedProduct.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Gallery & Zoom Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-square rounded-[36px] overflow-hidden bg-white border border-[#EBE5DC] shadow-lg">
                <img
                  src={selectedProduct.gallery?.[selectedGalleryIdx] || selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                {selectedProduct.badge && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-sans font-bold text-[#1E1C1A] border border-[#E0D9CE] shadow-xs">
                    {selectedProduct.badge}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {selectedProduct.gallery && selectedProduct.gallery.length > 1 && (
                <div className="flex items-center gap-3">
                  {selectedProduct.gallery.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedGalleryIdx(i)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedGalleryIdx === i
                          ? 'border-[#1E1C1A] scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Buy Box & Options */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="font-sans text-xs font-bold uppercase tracking-wider text-[#888075]">
                  Ритуал для {selectedProduct.category === 'body' ? 'тела' : selectedProduct.category === 'face' ? 'лица' : 'волос'}
                </span>
                <h1 className="text-3xl sm:text-4xl font-normal text-[#1E1C1A] mt-1 leading-tight">
                  {selectedProduct.title}
                </h1>

                {/* Rating & Reviews Bar */}
                <div className="flex items-center gap-3 mt-3 font-sans text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-[#DCD4C7]">|</span>
                  <span className="text-[#666059] font-medium">{selectedProduct.reviewsCount} проверенных отзывов</span>
                  <span className="text-[#DCD4C7]">|</span>
                  <span className="text-emerald-700 font-bold">В наличии</span>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="p-5 rounded-2xl bg-white border border-[#EBE5DC] flex items-baseline justify-between">
                <div>
                  <span className="font-sans text-2xl font-black text-[#1E1C1A]">
                    {(
                      (selectedProduct.price + (selectedOptionIdx > 0 ? selectedProduct.price * 0.4 : 0)) *
                      pdpQuantity
                    ).toLocaleString('ru-RU')}{' '}
                    UZS
                  </span>
                  {selectedProduct.oldPrice && (
                    <span className="font-sans text-xs text-[#888075] line-through ml-2">
                      {(selectedProduct.oldPrice * pdpQuantity).toLocaleString('ru-RU')} UZS
                    </span>
                  )}
                </div>
                <span className="font-sans text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Бесплатная доставка от 500 000 UZS
                </span>
              </div>

              {/* Options Selector */}
              {selectedProduct.options && (
                <div className="space-y-2">
                  <label className="font-sans text-xs font-bold uppercase tracking-wider text-[#1E1C1A]">
                    Выберите объем / формат:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs">
                    {selectedProduct.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedOptionIdx(i)}
                        className={`p-3 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                          selectedOptionIdx === i
                            ? 'border-[#1E1C1A] bg-[#1E1C1A] text-white shadow-xs'
                            : 'border-[#E0D9CE] bg-white text-[#1E1C1A] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper & Add to Cart */}
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center border border-[#DCD4C7] bg-white rounded-full p-1 font-sans">
                  <button
                    type="button"
                    onClick={() => setPdpQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF8F5] rounded-full cursor-pointer text-[#1E1C1A]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{pdpQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setPdpQuantity(q => q + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#FAF8F5] rounded-full cursor-pointer text-[#1E1C1A]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handlePdpAddToCart}
                  className="flex-1 py-4 px-6 rounded-full bg-[#1E1C1A] text-white font-sans text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Добавить в корзину</span>
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 pt-4 font-sans text-[11px] text-[#666059]">
                <div className="p-3 bg-white rounded-xl border border-[#EBE5DC] flex flex-col items-center text-center gap-1">
                  <Truck className="w-4 h-4 text-[#1E1C1A]" />
                  <span>Доставка за 45 минут</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#EBE5DC] flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#1E1C1A]" />
                  <span>100% Оригинал</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#EBE5DC] flex flex-col items-center text-center gap-1">
                  <RotateCcw className="w-4 h-4 text-[#1E1C1A]" />
                  <span>Гарантия возврата</span>
                </div>
              </div>

              {/* Tabs Section: Description / Specs / Reviews */}
              <div className="pt-6 border-t border-[#EBE5DC]">
                <div className="flex items-center gap-4 border-b border-[#EBE5DC] pb-2 font-sans text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPdpTab('desc')}
                    className={`pb-2 transition-colors cursor-pointer ${pdpTab === 'desc' ? 'border-b-2 border-black text-black' : 'text-[#888075] hover:text-black'}`}
                  >
                    Описание
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdpTab('specs')}
                    className={`pb-2 transition-colors cursor-pointer ${pdpTab === 'specs' ? 'border-b-2 border-black text-black' : 'text-[#888075] hover:text-black'}`}
                  >
                    Состав и характеристики
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdpTab('reviews')}
                    className={`pb-2 transition-colors cursor-pointer ${pdpTab === 'reviews' ? 'border-b-2 border-black text-black' : 'text-[#888075] hover:text-black'}`}
                  >
                    Отзывы ({userReviews.length})
                  </button>
                </div>

                <div className="pt-4 font-sans text-xs text-[#554F48] leading-relaxed">
                  {pdpTab === 'desc' && (
                    <div className="space-y-3">
                      <p>{selectedProduct.desc}</p>
                      <p>
                        Бренд The Act создает уход, превращающий рутину в чувственный спа-ритуал. Натуральные масла глубоко питают, не закупоривая поры, и дарят чувство заботы о себе.
                      </p>
                    </div>
                  )}

                  {pdpTab === 'specs' && (
                    <div className="space-y-2">
                      {selectedProduct.specs ? (
                        Object.entries(selectedProduct.specs).map(([k, v]) => (
                          <div key={k} className="flex justify-between py-1.5 border-b border-[#EBE5DC]">
                            <span className="font-bold text-[#1E1C1A]">{k}</span>
                            <span>{v}</span>
                          </div>
                        ))
                      ) : (
                        <p>100% органические компоненты, сертифицированное сырье.</p>
                      )}
                    </div>
                  )}

                  {pdpTab === 'reviews' && (
                    <div className="space-y-4">
                      {/* Reviews List */}
                      <div className="space-y-3">
                        {userReviews.map((rev, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-[#EBE5DC] space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#1E1C1A]">{rev.name}</span>
                              <span className="text-[10px] text-[#888075]">{rev.date}</span>
                            </div>
                            <div className="flex items-center text-amber-400">
                              {[...Array(rev.rating)].map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                            <p className="text-[11px] text-[#554F48]">{rev.text}</p>
                          </div>
                        ))}
                      </div>

                      {/* Add Review Form */}
                      <form onSubmit={handleAddReview} className="space-y-2 pt-2 border-t border-[#EBE5DC]">
                        <span className="font-bold text-[#1E1C1A] block">Оставить отзыв:</span>
                        <input
                          type="text"
                          placeholder="Ваше имя"
                          value={newReviewName}
                          onChange={e => setNewReviewName(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-lg border border-[#DCD4C7] text-xs focus:outline-hidden focus:border-black"
                        />
                        <textarea
                          placeholder="Поделитесь вашими впечатлениями о продукте..."
                          value={newReviewText}
                          onChange={e => setNewReviewText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white rounded-lg border border-[#DCD4C7] text-xs focus:outline-hidden focus:border-black"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-full bg-[#1E1C1A] text-white font-bold text-xs hover:bg-neutral-800 cursor-pointer"
                        >
                          Опубликовать отзыв
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 7. FOOTER */}
      <footer className="bg-white border-t border-[#EBE5DC] mt-20 py-12 px-4 sm:px-8 font-sans text-xs text-[#666059]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-2xl font-serif font-black lowercase text-[#1E1C1A]">the act.</span>
            <p className="text-[11px]">Clean body ritual. Created with care for every body.</p>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <button type="button" onClick={() => { setActiveView('catalog'); }} className="hover:text-black">
              Каталог ухода
            </button>
            <button type="button" onClick={() => showToast('Доставка: Ташкент — 45 минут, регионы — 24 часа')} className="hover:text-black">
              Доставка
            </button>
            <button type="button" onClick={() => showToast('Служба заботы The Act: @theact_care')} className="hover:text-black">
              Контакты
            </button>
          </div>
          <p className="text-[11px]">© 2026 the act. StoreBox Verified Showcase Template.</p>
        </div>
      </footer>
    </div>
  );
};
