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
  Search,
  Plus,
  Minus,
  X,
  ExternalLink,
  ShieldCheck,
  Leaf,
  Droplet
} from 'lucide-react';

interface RhodeStorefrontProps {
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

const RHODE_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'rhode-1',
    title: 'LIP CASE',
    subtitle: 'Your Essentials in One Place',
    category: 'lip',
    price: 350000,
    oldPrice: 390000,
    image: '/images/flagships/rhode_lip_case.jpg',
    gallery: [
      '/images/flagships/rhode_lip_case.jpg',
      '/images/flagships/rhode_lip_treatment.jpg'
    ],
    rating: 5.0,
    reviewsCount: 520,
    badge: 'VIRAL ICON',
    desc: 'Культовый силиконовый чехол для iPhone со специальным слотом для пептидного блеска Rhode Peptide Lip Treatment. Шелковистое покрытие soft-touch.',
    options: ['iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Pro Max'],
    specs: {
      'Материал': 'Премиальный гипоаллергенный силикон Soft-Touch',
      'Совместимость': 'Встроенный слот для тубы Peptide Lip Treatment / Tint',
      'Защита': 'Усиленные бортики экрана и камеры'
    }
  },
  {
    id: 'rhode-2',
    title: 'PINEAPPLE REFRESH',
    subtitle: 'The Daily Refresh',
    category: 'face',
    price: 260000,
    oldPrice: 295000,
    image: '/images/flagships/rhode_serum.jpg',
    gallery: [
      '/images/flagships/rhode_serum.jpg'
    ],
    rating: 4.9,
    reviewsCount: 195,
    badge: 'CLEANSER',
    desc: 'Мягкий очищающий гель для умывания с энзимами ананаса и полиглутаминовой кислотой. Деликатно очищает кожу до скрипа, не повреждая защитный барьер.',
    options: ['150 мл флакон'],
    specs: {
      'Объем': '150 мл',
      'Формула': 'Без сульфатов и отдушек, pH 5.5'
    }
  },
  {
    id: 'rhode-3',
    title: 'GLAZING MILK',
    subtitle: 'The Essential Prep Layer',
    category: 'face',
    price: 320000,
    oldPrice: 360000,
    image: '/images/flagships/rhode_serum.jpg',
    gallery: [
      '/images/flagships/rhode_serum.jpg'
    ],
    rating: 5.0,
    reviewsCount: 380,
    badge: 'ESSENCE',
    desc: 'Питательная молочная эссенция с комплексом керамидов. Снимает покраснения, мгновенно успокаивает кожу и подготавливает к нанесению сыворотки.',
    options: ['140 мл бутылочка'],
    specs: {
      'Объем': '140 мл',
      'Комплекс': 'Трио керамидов, магний, цинк, медь'
    }
  },
  {
    id: 'rhode-4',
    title: 'PEPTIDE LIP TREATMENT',
    subtitle: 'The Nourishing Lip Layer',
    category: 'lip',
    price: 180000,
    oldPrice: 210000,
    image: '/images/flagships/rhode_lip_treatment.jpg',
    gallery: [
      '/images/flagships/rhode_lip_treatment.jpg',
      '/images/flagships/rhode_lip_case.jpg'
    ],
    rating: 4.9,
    reviewsCount: 840,
    badge: 'BESTSELLER',
    desc: 'Восстанавливающий пептидный уход для сочных и пухлых губ. Тающая глянцевая текстура питает и защищает нежную кожу день и ночь.',
    options: [
      'Salted Caramel (карамель)',
      'Watermelon Slice (арбуз)',
      'Vanilla (ваниль)',
      'Ribbon (розовый тинт)',
      'Toast (розово-коричневый)'
    ],
    colors: [
      { name: 'Salted Caramel', hex: '#D2996E' },
      { name: 'Watermelon Slice', hex: '#FF7D8A' },
      { name: 'Vanilla', hex: '#F3E8D6' },
      { name: 'Ribbon', hex: '#F4A5B5' },
      { name: 'Toast', hex: '#B87B6A' }
    ],
    specs: {
      'Объем': '10 мл / 0.3 fl oz',
      'Активные вещества': 'Пептиды, масло ши, купуасу, бабассу',
      'Финиш': 'Естественный влажный блеск без липкости'
    }
  },
  {
    id: 'rhode-5',
    title: 'PEPTIDE GLAZING FLUID',
    subtitle: 'The Dewy Hydration Layer',
    category: 'face',
    price: 290000,
    oldPrice: 330000,
    image: '/images/flagships/rhode_serum.jpg',
    gallery: [
      '/images/flagships/rhode_serum.jpg'
    ],
    rating: 5.0,
    reviewsCount: 920,
    badge: 'GLAZED SKIN',
    desc: 'Культовая гелевая сыворотка Хейли Бибер для мгновенного сияния «glazed donut». Укрепляет барьер и придает влажный глянцевый финиш.',
    options: ['50 мл флакон с помпой', '100 мл флакон PRO +85 000 UZS'],
    specs: {
      'Объем': '50 мл / 100 мл',
      'Активные вещества': 'Ниацинамид, пептиды, гиалуроновая кислота, масло марулы'
    }
  }
];

export const RhodeStorefront: React.FC<RhodeStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [pdpQuantity, setPdpQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openPdpModal = (product: ThemeProductItem) => {
    setSelectedProduct(product);
    setSelectedOptionIdx(0);
    setPdpQuantity(1);
  };

  const handlePdpAddToCart = () => {
    if (!selectedProduct) return;
    const opt = selectedProduct.options?.[selectedOptionIdx] || 'Стандарт';
    const extraPrice = selectedOptionIdx === 1 && selectedProduct.id === 'rhode-5' ? 85000 : 0;
    onAddToCart(selectedProduct, pdpQuantity, opt, undefined, extraPrice);
    showToast(`«${selectedProduct.title}» (${opt}) добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const filteredProducts = useMemo(() => {
    let list = RHODE_PRODUCTS;
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
    const el = document.getElementById('rhode-bestsellers');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAFAFA] text-[#111111] min-h-screen font-sans selection:bg-[#111111] selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#111111] text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-neutral-700">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Exact Match: rhode logo, SHOP, ABOUT, FUTURES, SEARCH, ACCOUNT, CART) */}
      <header className="sticky top-0 z-40 bg-[#FAFAFA]/95 backdrop-blur-md border-b border-[#EAEAEA] px-6 sm:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="cursor-pointer"
          >
            <span className="text-2xl sm:text-3xl font-light tracking-tight text-[#111111] lowercase font-serif">
              rhode
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-widest text-neutral-600 font-bold">
            <button
              type="button"
              onClick={() => scrollToBestsellers('all')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Shop
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('rhode-founder');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-black transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('rhode-values');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Futures
            </button>
            <button
              type="button"
              onClick={() => scrollToBestsellers('all')}
              className="hover:text-black transition-colors cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              className="hover:text-black transition-colors cursor-pointer"
            >
              Account
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenCart}
              className="px-4 py-2 rounded-full border border-neutral-300 hover:border-black text-[11px] uppercase tracking-widest font-bold text-neutral-900 flex items-center gap-2 bg-white transition-all cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart ({cartCount})</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Exact Match to косметика2.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-8 sm:pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Side: Hailey Bieber Editorial Image */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[36px] overflow-hidden bg-[#EAEAEA] shadow-xl border border-neutral-200">
              <img
                src="/images/flagships/rhode_serum.jpg"
                alt="Hailey Bieber Rhode Skincare"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              </div>
            </div>
          </div>

          {/* Right Side: Philosophy Headline & Floating Product Card */}
          <div className="lg:col-span-6 space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-900 tracking-tight leading-[1.15]">
                A new <strong className="font-semibold">PHILOSOPHY</strong> on <strong className="font-semibold">SKINCARE.</strong>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-600 mt-4 leading-relaxed max-w-lg font-normal">
                Rhode is dedicated to making products based in science and great formulation, simplifying many of the mysteries and complex narratives behind efficacious skincare.
              </p>
            </div>

            {/* Floating Product Card (Peptize Glazing Fluid) */}
            <div
              onClick={() => openPdpModal(RHODE_PRODUCTS[4])}
              className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group relative max-w-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                    PEPTIDE GLAZING FLUID
                  </h3>
                  <span className="text-[11px] text-neutral-500 font-medium">The Dewy Hydration Layer</span>
                </div>
                <span className="w-7 h-7 rounded-full bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center text-neutral-600 transition-colors text-xs">
                  ↗
                </span>
              </div>

              {/* Product Packshot */}
              <div className="my-5 aspect-4/3 rounded-2xl bg-neutral-50 overflow-hidden flex items-center justify-center">
                <img
                  src="/images/flagships/rhode_serum.jpg"
                  alt="Peptide Glazing Fluid"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* 4 Ingredient Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-100 text-center">
                <span className="text-[9px] font-bold uppercase text-neutral-600 bg-neutral-100 py-1.5 px-2 rounded-lg">
                  Niacinamide
                </span>
                <span className="text-[9px] font-bold uppercase text-neutral-600 bg-neutral-100 py-1.5 px-2 rounded-lg">
                  Peptides
                </span>
                <span className="text-[9px] font-bold uppercase text-neutral-600 bg-neutral-100 py-1.5 px-2 rounded-lg">
                  Hyaluronic
                </span>
                <span className="text-[9px] font-bold uppercase text-neutral-600 bg-neutral-100 py-1.5 px-2 rounded-lg">
                  Marula Oil
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER STATEMENT (Exact Match to косметика2.png) */}
      <section id="rhode-founder" className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-t border-neutral-200">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
              ABOUT BRAND FROM FOUNDER
            </span>
          </div>
          <div className="md:col-span-8">
            <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
              My journey towards healthier skin inspired me to develop products that really work, in a way that's accessible to everyone. Rhode is dedicated to making products based in science and great formulation, simplifying many of the mysteries and complex narratives behind efficacious skincare. I hope these will become your go-to essentials that can live in your bathroom, be your favorite travel companion, improve your skin over time, and keep your skin happy and hydrated.
            </p>
          </div>
        </div>
      </section>

      {/* BESTSELLERS (Exact 4 items from косметика2.png: LIP CASE, PINEAPPLE REFRESH, GLAZING MILK, PEPTIDE LIP TREATMENT) */}
      <section id="rhode-bestsellers" className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-t border-neutral-200">
        <div className="flex items-center justify-between mb-8">
          <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500">
            BESTSELLERS
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('lip')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === 'lip' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Lip
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('face')}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === 'face' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Face
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.slice(0, 4).map(p => (
            <div
              key={p.id}
              onClick={() => openPdpModal(p)}
              className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                      {p.title}
                    </h4>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">
                      {p.subtitle || 'Essential Daily Layer'}
                    </span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white flex items-center justify-center text-neutral-600 transition-colors text-xs">
                    ↗
                  </span>
                </div>

                {/* Packshot */}
                <div className="my-6 aspect-square rounded-2xl bg-[#F7F7F7] overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-900">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </span>
                </div>

                <button
                  type="button"
                  onClick={e => handleQuickAdd(e, p)}
                  className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-900 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Купить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OUR VALUES SECTION (Exact Match to косметика2.png) */}
      <section id="rhode-values" className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <div className="rounded-[36px] bg-[#EBF1F5] p-8 sm:p-12 border border-[#D5E1E9] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Values Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-xs space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-900 block">
                OUR VALUES
              </span>
              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                It was important to us to build a value driven business. At rhode, we believe in: Simplicity. Affordability. Authenticity. Quality. Transparency.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-white/60 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-700" />
                <span>SCIENTIFICALLY PROVEN FORMULAS</span>
              </div>
              <div className="p-3 bg-white/60 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-neutral-700" />
                <span>OUR MINIMAL FOOTPRINT</span>
              </div>
            </div>
          </div>

          {/* Right Glowing Skin Image with tags */}
          <div className="lg:col-span-7 relative flex justify-center">
            <div className="w-full max-w-lg aspect-16/10 rounded-3xl overflow-hidden bg-white shadow-lg relative">
              <img
                src="/images/flagships/rhode_serum.jpg"
                alt="Dewy Glowing Skin"
                className="w-full h-full object-cover"
              />
              {/* Floating pill tags */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center">
                {['DEWY', 'EFFICACIOUS', 'NATURAL', 'HYDRATION', 'EASY', 'INTENTIONAL'].map(tag => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-black tracking-widest uppercase text-neutral-800 shadow-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES 2-COLUMN GRID (Exact Match to косметика2.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-10">
        <span className="text-[11px] font-black uppercase tracking-widest text-neutral-500 block mb-6">
          CATEGORIES
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Lip Case phone closeup */}
          <div
            onClick={() => openPdpModal(RHODE_PRODUCTS[0])}
            className="group cursor-pointer rounded-[36px] overflow-hidden bg-white border border-neutral-200 shadow-sm hover:shadow-xl transition-all aspect-4/3 relative"
          >
            <img
              src="/images/flagships/rhode_lip_case.jpg"
              alt="Lip Case Category"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-neutral-900 shadow-md">
              Lip Case & Accessories
            </div>
          </div>

          {/* Card 2: Skincare essence texture */}
          <div
            onClick={() => openPdpModal(RHODE_PRODUCTS[4])}
            className="group cursor-pointer rounded-[36px] overflow-hidden bg-white border border-neutral-200 shadow-sm hover:shadow-xl transition-all aspect-4/3 relative"
          >
            <img
              src="/images/flagships/rhode_serum.jpg"
              alt="Dewy Skincare Category"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-neutral-900 shadow-md">
              Dewy Skincare Essentials
            </div>
          </div>
        </div>
      </section>

      {/* PDP MODAL (Full interactive options, color swatches, add to cart) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-neutral-200">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 p-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    rhode · {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-light text-neutral-900 uppercase tracking-tight mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-neutral-900">
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

                {/* Option selector */}
                {selectedProduct.options && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
                      Выбор опции / оттенка:
                    </label>
                    <div className="space-y-1">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
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
                    className="flex-1 py-3 px-5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {(
                        (selectedProduct.price +
                          (selectedOptionIdx === 1 && selectedProduct.id === 'rhode-5' ? 85000 : 0)) *
                        pdpQuantity
                      ).toLocaleString('ru-RU')}{' '}
                      UZS
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-neutral-200 mt-20 py-12 px-6 sm:px-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="text-xl font-light lowercase text-neutral-900 font-serif">
            rhode
          </span>
          <p className="text-neutral-500 text-[11px]">
            © 2026 rhode skin. Verified StoreBox Showcase Experience.
          </p>
        </div>
      </footer>
    </div>
  );
};
