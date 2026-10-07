import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Heart,
  Star,
  ChevronRight,
  Search,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  User,
  X,
  Instagram,
  Droplet,
  Feather,
  Leaf
} from 'lucide-react';

interface LumeStorefrontProps {
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

const LUME_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'lume-1',
    title: 'Hydra Gloss',
    subtitle: 'lip gloss',
    category: 'lips',
    price: 145000,
    oldPrice: 175000,
    image: '/images/flagships/lume_blush.jpg',
    gallery: [
      '/images/flagships/lume_blush.jpg'
    ],
    rating: 4.9,
    reviewsCount: 380,
    badge: 'BESTSELLER',
    desc: 'Увлажняющий глянцевый блеск для губ с гиалуроновой кислотой. Создает сочный зеркальный финиш без ощущения липкости.',
    options: ['Rose Petal (розовый лепесток)', 'Peach Shimmer (персиковый шиммер)', 'Clear Glass (прозрачный)'],
    colors: [
      { name: 'Rose Petal', hex: '#E297A6' },
      { name: 'Peach Shimmer', hex: '#F6B29C' },
      { name: 'Clear Glass', hex: '#F0F0F0' }
    ],
    specs: {
      'Объем': '7 мл / 0.24 fl oz',
      'Финиш': 'Влажный зеркальный глянец',
      'Эффект': 'Мгновенное визуальное увеличение объема'
    }
  },
  {
    id: 'lume-2',
    title: 'Silk Skin Foundation',
    subtitle: 'foundation',
    category: 'makeup',
    price: 260000,
    oldPrice: 310000,
    image: '/images/flagships/rhode_serum.jpg',
    gallery: [
      '/images/flagships/rhode_serum.jpg'
    ],
    rating: 5.0,
    reviewsCount: 420,
    badge: 'NEW',
    desc: 'Шелковая тональная основа с невесомым покрытием и эффектом холеной кожи. Стойкость до 16 часов и естественный сияющий сатиновый финиш.',
    options: ['01 Porcelain Light', '02 Warm Beige', '03 Golden Sand'],
    colors: [
      { name: '01 Porcelain Light', hex: '#F6E6DA' },
      { name: '02 Warm Beige', hex: '#E8CFBE' },
      { name: '03 Golden Sand', hex: '#D6B49A' }
    ],
    specs: {
      'Объем': '30 мл флакон с дозатором',
      'Покрытие': 'Среднее, с возможностью наслаивания'
    }
  },
  {
    id: 'lume-3',
    title: 'Sun Glow Bronzer',
    subtitle: 'bronzer',
    category: 'makeup',
    price: 225000,
    oldPrice: 265000,
    image: '/images/flagships/theact_scrub_jar_hd.jpg',
    gallery: [
      '/images/flagships/theact_scrub_jar_hd.jpg'
    ],
    rating: 4.8,
    reviewsCount: 290,
    badge: 'SUN KISSED',
    desc: 'Запеченный бронзер с мельчайшими светоотражающими частицами. Придает лицу теплый отдохнувший оттенок средиземноморского загара.',
    options: ['Warm Amber (теплый янтарь)', 'Terracotta Glow (терракота)'],
    colors: [
      { name: 'Warm Amber', hex: '#C28459' },
      { name: 'Terracotta Glow', hex: '#B26E4A' }
    ],
    specs: {
      'Вес': '9 г',
      'Футляр': 'С встроенным зеркалом'
    }
  },
  {
    id: 'lume-4',
    title: 'Bright Touch Concealer',
    subtitle: 'concealer',
    category: 'makeup',
    price: 160000,
    oldPrice: 190000,
    image: '/images/flagships/theact_fragrance_hd.jpg',
    gallery: [
      '/images/flagships/theact_fragrance_hd.jpg'
    ],
    rating: 4.9,
    reviewsCount: 310,
    badge: 'BRIGHTENING',
    desc: 'Кремовый консилер с кофеином и ниацинамидом. Мягко высветляет зону под глазами, стирая следы усталости и темные круги.',
    options: ['Fair 01', 'Light 02', 'Medium 03'],
    specs: {
      'Объем': '6 мл',
      'Формула': 'Не забивается в мелкие морщинки'
    }
  },
  {
    id: 'lume-5',
    title: 'Velvet Lip Cream',
    subtitle: 'lip cream',
    category: 'lips',
    price: 135000,
    oldPrice: 165000,
    image: '/images/flagships/lume_blush.jpg',
    gallery: [
      '/images/flagships/lume_blush.jpg'
    ],
    rating: 4.9,
    reviewsCount: 510,
    badge: 'TREND',
    desc: 'Невесомая муссовая помада-крем с пудровым бархатным финишем. Комфортно носится весь день, не стягивая и не пересушивая губы.',
    options: ['Nude Blush (нежный нюд)', 'Berry Mousse (ягодный мусс)', 'Caramel Kiss (карамель)'],
    colors: [
      { name: 'Nude Blush', hex: '#CD8B8C' },
      { name: 'Berry Mousse', hex: '#A3485E' },
      { name: 'Caramel Kiss', hex: '#B67563' }
    ],
    specs: {
      'Объем': '6.5 мл',
      'Текстура': 'Воздушный бархатный мусс'
    }
  }
];

export const LumeStorefront: React.FC<LumeStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [pdpQuantity, setPdpQuantity] = useState(1);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = !prev[id];
      showToast(next ? 'Добавлено в вишлист ❤️' : 'Удалено из вишлиста');
      return { ...prev, [id]: next };
    });
  };

  const openPdpModal = (product: ThemeProductItem) => {
    setSelectedProduct(product);
    setSelectedOptionIdx(0);
    setPdpQuantity(1);
  };

  const handlePdpAddToCart = () => {
    if (!selectedProduct) return;
    const opt = selectedProduct.options?.[selectedOptionIdx] || 'Стандарт';
    onAddToCart(selectedProduct, pdpQuantity, opt);
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const filteredProducts = useMemo(() => {
    let list = LUME_PRODUCTS;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchQuery]);

  const scrollToBestsellers = (cat?: string) => {
    if (cat) setActiveCategory(cat);
    const el = document.getElementById('lume-bestsellers');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAF7F5] text-[#222222] min-h-screen font-sans selection:bg-[#E297A6] selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-neutral-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-neutral-700">
          <Sparkles className="w-4 h-4 text-[#F6B29C] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BLUSH ANNOUNCEMENT BAR (Exact match to косметика3.png) */}
      <div className="bg-[#C58B8E] text-white py-2 px-4 text-center text-xs tracking-wider font-medium">
        Free shipping on orders over $60
      </div>

      {/* HEADER (Exact Match: LÚMÉ BEAUTY logo, Nav items, Icons) */}
      <header className="sticky top-0 z-40 bg-[#FAF7F5]/95 backdrop-blur-md border-b border-[#EAE3DE] px-6 sm:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="cursor-pointer"
          >
            <div className="text-2xl sm:text-3xl font-serif tracking-widest text-neutral-900 uppercase">
              LÚMÉ
            </div>
            <div className="text-[8px] tracking-[0.3em] font-sans uppercase text-neutral-500 -mt-1 text-center">
              BEAUTY
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7 text-[11px] uppercase tracking-widest text-neutral-700 font-bold">
            <button
              type="button"
              onClick={() => scrollToBestsellers('all')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              New
            </button>
            <button
              type="button"
              onClick={() => scrollToBestsellers('all')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Bestsellers
            </button>
            <button
              type="button"
              onClick={() => scrollToBestsellers('makeup')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Makeup
            </button>
            <button
              type="button"
              onClick={() => scrollToBestsellers('skincare')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Skincare
            </button>
            <button
              type="button"
              onClick={() => scrollToBestsellers('lips')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Lips
            </button>
            <button
              type="button"
              onClick={() => scrollToBestsellers('all')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Sets
            </button>
            <button
              type="button"
              className="hover:text-black transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          <div className="flex items-center gap-4 text-neutral-800">
            <button
              type="button"
              onClick={() => scrollToBestsellers('all')}
              className="p-1.5 hover:text-black transition-colors cursor-pointer"
              aria-label="Поиск"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 hover:text-black transition-colors cursor-pointer"
              aria-label="Аккаунт"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => showToast('Вишлист пуст')}
              className="p-1.5 hover:text-black transition-colors cursor-pointer"
              aria-label="Избранное"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="p-1.5 hover:text-black transition-colors cursor-pointer relative"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="ml-1 text-xs font-semibold">({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Exact Match: Dewy model on left, GLOW. DEFINE. YOU. on right) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-8 sm:pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Model Image */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md aspect-4/5 rounded-3xl overflow-hidden shadow-xl bg-neutral-200 border border-[#EAE3DE]">
              <img
                src="/images/flagships/theact_clean_model_hd.jpg"
                alt="LÚMÉ Radiant Model"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Right Typography & CTA */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 block">
              NEW COLLECTION
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif text-neutral-900 uppercase leading-[0.95] tracking-tight">
              GLOW. <br />
              DEFINE. <br />
              YOU.
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed font-normal">
              Effortless beauty with high-performance formulas made for every you. Чистые формулы, стойкие пигменты и сияние, идущее изнутри.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => scrollToBestsellers('all')}
                className="px-8 py-3.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md active:scale-95"
              >
                SHOP NOW
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 FEATURE BADGES BAR (Exact Match to косметика3.png) */}
      <section className="border-y border-[#EAE3DE] bg-white py-6 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
          
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-full bg-[#FAF7F5] border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Clean Ingredients
              </h4>
              <p className="text-[10px] text-neutral-500">Skin-loving & safe</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-full bg-[#FAF7F5] border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Cruelty Free
              </h4>
              <p className="text-[10px] text-neutral-500">We don't test on animals</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-full bg-[#FAF7F5] border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Vegan Formulas
              </h4>
              <p className="text-[10px] text-neutral-500">100% vegan certified</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-9 h-9 rounded-full bg-[#FAF7F5] border border-neutral-200 flex items-center justify-center text-neutral-800 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-neutral-900">
                Secure Payment
              </h4>
              <p className="text-[10px] text-neutral-500">Your data is protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS 5 ITEMS ROW (Exact Match to косметика3.png) */}
      <section id="lume-bestsellers" className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#EAE3DE]">
          <h3 className="text-base font-serif tracking-widest text-neutral-900 uppercase">
            BEST SELLERS
          </h3>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className="text-[11px] font-bold uppercase tracking-widest text-neutral-600 hover:text-black cursor-pointer"
          >
            VIEW ALL
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredProducts.slice(0, 5).map(p => {
            const isFav = !!favorites[p.id];
            return (
              <div
                key={p.id}
                onClick={() => openPdpModal(p)}
                className="bg-white rounded-2xl p-4 border border-[#EAE3DE] flex flex-col justify-between group cursor-pointer hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {p.badge ? (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded-sm">
                        {p.badge}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={e => toggleFavorite(e, p.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                      aria-label="В избранное"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  {/* Packshot */}
                  <div className="aspect-square bg-[#FAF7F5] rounded-xl overflow-hidden flex items-center justify-center p-3 mb-4">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900 tracking-wide line-clamp-1">
                    {p.title}
                  </h4>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider block mt-0.5">
                    {p.subtitle || p.category}
                  </span>
                  <div className="text-xs font-semibold text-neutral-900 mt-2">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={e => handleQuickAdd(e, p)}
                    className="w-full py-2 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer active:scale-95"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DUAL PROMO BANNERS (Exact Match to косметика3.png: LIPS THAT SPEAK & SKIN THAT GLOWS) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Banner: Lips */}
          <div
            onClick={() => scrollToBestsellers('lips')}
            className="bg-[#EED5D6] rounded-3xl p-8 sm:p-10 flex flex-col justify-between min-h-[260px] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="max-w-xs space-y-3 z-10">
              <h3 className="text-2xl sm:text-3xl font-serif text-neutral-900 uppercase tracking-tight">
                LIPS THAT <br />
                SPEAK
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Highly pigmented. All-day comfort. Non-sticky.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer group-hover:bg-neutral-800"
                >
                  SHOP LIPS
                </button>
              </div>
            </div>
          </div>

          {/* Right Banner: Skin */}
          <div
            onClick={() => scrollToBestsellers('makeup')}
            className="bg-[#EFE3DB] rounded-3xl p-8 sm:p-10 flex flex-col justify-between min-h-[260px] relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="max-w-xs space-y-3 z-10">
              <h3 className="text-2xl sm:text-3xl font-serif text-neutral-900 uppercase tracking-tight">
                SKIN THAT <br />
                GLOWS
              </h3>
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Radiant skin starts with the right care.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer group-hover:bg-neutral-800"
                >
                  SHOP SKINCARE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES (4 Tiles: MAKEUP, SKINCARE, LIPS, SETS & KITS) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <h3 className="text-base font-serif tracking-widest text-neutral-900 uppercase mb-6">
          POPULAR CATEGORIES
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'MAKEUP', cat: 'makeup', bg: 'bg-[#EBDDD5]' },
            { label: 'SKINCARE', cat: 'face', bg: 'bg-[#F2E5E2]' },
            { label: 'LIPS', cat: 'lips', bg: 'bg-[#E7C8CB]' },
            { label: 'SETS & KITS', cat: 'all', bg: 'bg-[#E4D8CE]' }
          ].map(tile => (
            <div
              key={tile.label}
              onClick={() => scrollToBestsellers(tile.cat)}
              className={`${tile.bg} rounded-2xl h-36 flex items-center justify-center p-4 cursor-pointer group shadow-xs hover:shadow-md transition-all`}
            >
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-neutral-900 group-hover:scale-105 transition-transform">
                {tile.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* INSTAGRAM UGC GRID (@LUMEBEAUTY.OFFICIAL) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-t border-[#EAE3DE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
              @LUMEBEAUTY.OFFICIAL
            </h4>
            <span className="text-xs text-neutral-500">Join our community</span>
          </div>
          <button
            type="button"
            className="px-5 py-2 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer self-start sm:self-auto"
          >
            FOLLOW US
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200">
            <img
              src="/images/flagships/theact_clean_model_hd.jpg"
              alt="Community 1"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200">
            <img
              src="/images/flagships/lume_blush.jpg"
              alt="Community 2"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200">
            <img
              src="/images/flagships/rhode_serum.jpg"
              alt="Community 3"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200">
            <img
              src="/images/flagships/theact_scrub_jar_hd.jpg"
              alt="Community 4"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* JOIN THE LÚMÉ GLOW CLUB NEWSLETTER */}
      <section className="bg-[#EED5D6] py-12 px-6 sm:px-12 mt-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-serif uppercase tracking-wider text-neutral-900">
              JOIN THE LÚMÉ GLOW CLUB
            </h3>
            <p className="text-xs text-neutral-700">
              Get 10% off your first order and be the first to know about new drops & offers.
            </p>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); showToast('Вы подписаны на LÚMÉ Glow Club!'); }}
            className="flex w-full md:w-auto gap-2"
          >
            <input
              type="email"
              placeholder="Your email address"
              required
              className="px-4 py-2.5 bg-white text-xs border border-neutral-300 focus:outline-hidden focus:border-black w-full md:w-64"
            />
            <button
              type="submit"
              className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            >
              SUBSCRIBE
            </button>
          </form>
        </div>
      </section>

      {/* PDP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-[#EAE3DE]">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF7F5] p-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    LÚMÉ · {selectedProduct.subtitle || selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 uppercase mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-neutral-800">
                    <Star className="w-3.5 h-3.5 fill-neutral-900" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">
                      ({selectedProduct.reviewsCount} reviews)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>

                {/* Option / Shade Selector */}
                {selectedProduct.options && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
                      Оттенок / формат:
                    </label>
                    <div className="space-y-1">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-black bg-black text-white'
                              : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price and Add button */}
                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => Math.max(1, q - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold">{pdpQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => q + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePdpAddToCart}
                    className="flex-1 py-3 px-5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {(selectedProduct.price * pdpQuantity).toLocaleString('ru-RU')} UZS
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-[#EAE3DE] mt-20 py-12 px-6 sm:px-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xl font-serif tracking-widest uppercase text-neutral-900">
              LÚMÉ BEAUTY
            </span>
            <p className="text-neutral-500 text-[11px] mt-1">
              Beauty that empowers. Clean. Effective. Effortless.
            </p>
          </div>
          <p className="text-neutral-500 text-[11px]">
            © 2026 LÚMÉ BEAUTY. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
