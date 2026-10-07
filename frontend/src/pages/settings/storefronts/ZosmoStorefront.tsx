import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  ChevronLeft,
  Search,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Video,
  Zap,
  Tv,
  Heart,
  User,
  X,
  Clock
} from 'lucide-react';

interface ZosmoStorefrontProps {
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

const ZOSMO_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'zs-1',
    title: 'ZOSMO Pocket Pro 3-Axis Gimbal',
    category: 'camera',
    price: 1850000,
    oldPrice: 2200000,
    image: '/images/flagships/zosmo_gimbal.jpg',
    gallery: ['/images/flagships/zosmo_gimbal.jpg'],
    rating: 5.0,
    reviewsCount: 390,
    badge: 'NEW 2026',
    desc: 'Capture Your World in Motion: Профессиональный 3-осевой электронный стабилизатор для смартфонов с AI-слежением и 4K оптикой.',
    options: ['Solo Kit (Базовый)', 'Creator Combo (+Штатив, Беспроводной микрофон, Кейс) +450 000 UZS']
  },
  {
    id: 'zs-2',
    title: 'Zackpot AI Smart Speaker',
    category: 'audio',
    price: 950000,
    oldPrice: 1200000,
    image: '/images/flagships/beo_sound2_new.jpg',
    gallery: ['/images/flagships/beo_sound2_new.jpg'],
    rating: 4.8,
    reviewsCount: 240,
    badge: 'SAVE 25%',
    desc: 'Умная колонка с пространственным звуком 360°, голосовым помощником и встроенным хабом умного дома Zigbee.',
    options: ['Space Grey', 'Arctic White']
  },
  {
    id: 'zs-3',
    title: 'Xonic CC Security Dome Camera',
    category: 'camera',
    price: 540000,
    oldPrice: 650000,
    image: '/images/flagships/stuffsus_camera.jpg',
    gallery: ['/images/flagships/stuffsus_camera.jpg'],
    rating: 4.9,
    reviewsCount: 180,
    badge: 'AI MOTION',
    desc: 'Поворотная камера 2K с цветным ночным видением и датчиком движения для дома и офиса.',
    options: ['Стандартная', 'С картой 128GB +95 000 UZS']
  },
  {
    id: 'zs-4',
    title: 'Smart & Handy Titanium Watch',
    category: 'wearables',
    price: 1420000,
    oldPrice: 1750000,
    image: '/images/flagships/elexy_watch_ultra_hd.jpg',
    gallery: ['/images/flagships/elexy_watch_ultra_hd.jpg'],
    rating: 4.9,
    reviewsCount: 310,
    badge: 'AMOLED',
    desc: 'Титановые смарт-часы с сапфировым стеклом, мониторингом здоровья и автономностью до 14 дней.',
    options: ['Orange Trail', 'Black Titanium']
  },
  {
    id: 'zs-5',
    title: 'Modern & Stylish Noise Cancelling',
    category: 'audio',
    price: 890000,
    oldPrice: 1100000,
    image: '/images/flagships/tech_headphones.jpg',
    gallery: ['/images/flagships/tech_headphones.jpg'],
    rating: 4.8,
    reviewsCount: 220,
    badge: 'ANC 45dB',
    desc: 'Стильные беспроводные наушники с активным гибридным шумоподавлением и поддержкой Hi-Res Audio.',
    options: ['Silver White', 'Matte Black']
  },
  {
    id: 'zs-6',
    title: 'Xenolex 65" 4K HDR Smart TV',
    category: 'tv',
    price: 6800000,
    oldPrice: 7900000,
    image: '/images/flagships/tech_banner.jpg',
    gallery: ['/images/flagships/tech_banner.jpg'],
    rating: 5.0,
    reviewsCount: 145,
    badge: '4K QLED',
    desc: 'Флагманский безрамочный телевизор 4K QLED 120Hz с Dolby Vision, Dolby Atmos и Google TV.',
    options: ['65 дюймов QLED', '75 дюймов PRO +2 400 000 UZS']
  }
];

export const ZosmoStorefront: React.FC<ZosmoStorefrontProps> = ({
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
    const extraPrice = selectedOptionIdx === 1 ? (selectedProduct.price * 0.25) : 0;
    onAddToCart(selectedProduct, pdpQuantity, opt, undefined, extraPrice);
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const filteredProducts = useMemo(() => {
    let list = ZOSMO_PRODUCTS;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchQuery]);

  return (
    <div className="bg-[#FFFFFF] text-[#1E1E1E] min-h-screen font-sans selection:bg-blue-600 selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-neutral-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-neutral-700">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NOTIFICATION BAR (Exact Match to электроника2.png) */}
      <div className="bg-[#F8F9FA] border-b border-neutral-200 py-1.5 px-6 text-[11px] text-neutral-500 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>Free Delivery on orders over $200</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-black cursor-pointer">Track your Order</span>
            <span>·</span>
            <span className="hover:text-black cursor-pointer">Find a Store</span>
            <span>·</span>
            <span className="hover:text-black cursor-pointer">BDT | Tk ▾</span>
          </div>
        </div>
      </div>

      {/* HEADER (Exact Match: Elexy/Zosmo logo, search bar, icons) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-6 sm:px-12 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div
              onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="cursor-pointer font-black text-2xl tracking-tighter text-neutral-900"
            >
              Zosmo
            </div>
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-600">
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-blue-600 cursor-pointer"
              >
                Home ▾
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('zosmo-recommended');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-blue-600 cursor-pointer"
              >
                Shop ▾
              </button>
              <button
                type="button"
                className="hover:text-blue-600 cursor-pointer"
              >
                Products ▾
              </button>
              <button
                type="button"
                className="hover:text-blue-600 cursor-pointer"
              >
                Contact
              </button>
            </nav>
          </div>

          <div className="flex-1 max-w-md relative hidden sm:block">
            <input
              type="text"
              placeholder="Search for tools and tech..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full bg-neutral-100 border border-neutral-200 text-xs focus:outline-hidden focus:bg-white"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          <div className="flex items-center gap-4 text-neutral-700">
            <User className="w-4 h-4 hover:text-black cursor-pointer" />
            <Heart className="w-4 h-4 hover:text-black cursor-pointer" />
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-1 hover:text-black cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION: "Capture Your World in Motion: ZOSMO" (Exact Match to электроника2.png) */}
      <section className="bg-gradient-to-r from-[#E9EDF2] to-[#DDE4ED] py-12 sm:py-16 px-6 sm:px-12 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              ZOSMO POCKET PRO V2SS
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-900 leading-[1.05] tracking-tight">
              Capture Your World <br />
              in Motion: <span className="text-blue-600">ZOSMO</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-md leading-relaxed">
              The Zosmo Pocket, developed by creators, is a marvel of modern technology, allowing users a compact yet powerful tool for capturing cinematic high-quality videos and photos.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => openPdpModal(ZOSMO_PRODUCTS[0])}
                className="px-6 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
              >
                Shop Now
              </button>
              <button
                type="button"
                onClick={() => openPdpModal(ZOSMO_PRODUCTS[0])}
                className="px-6 py-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 text-xs font-bold uppercase tracking-wider border border-neutral-300 transition-all cursor-pointer"
              >
                View Details
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg aspect-4/3 rounded-3xl overflow-hidden shadow-2xl bg-white/60 p-4 border border-white/80">
              <img
                src="/images/flagships/zosmo_gimbal.jpg"
                alt="Zosmo Gimbal"
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3 TOP FEATURE PROMO CARDS (Exact match to электроника2.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => openPdpModal(ZOSMO_PRODUCTS[3])}
            className="bg-[#EDE9FE] rounded-3xl p-6 flex items-center justify-between cursor-pointer group hover:shadow-lg transition-all"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-purple-700">SMART WATCH</span>
              <h3 className="text-base font-bold text-neutral-900 mt-1">Smart & Handy Watch</h3>
              <span className="text-xs font-bold text-neutral-800 underline mt-2 block">Shop Now</span>
            </div>
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/70 p-2 shrink-0">
              <img src="/images/flagships/elexy_watch_ultra_hd.jpg" alt="Watch" className="w-full h-full object-contain" />
            </div>
          </div>

          <div
            onClick={() => openPdpModal(ZOSMO_PRODUCTS[1])}
            className="bg-[#E0F2FE] rounded-3xl p-6 flex items-center justify-between cursor-pointer group hover:shadow-lg transition-all"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-blue-700">WIRELESS CHARGER</span>
              <h3 className="text-base font-bold text-neutral-900 mt-1">Latest Technology System</h3>
              <span className="text-xs font-bold text-neutral-800 underline mt-2 block">Shop Now</span>
            </div>
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/70 p-2 shrink-0">
              <img src="/images/flagships/beo_sound2_new.jpg" alt="Audio" className="w-full h-full object-contain" />
            </div>
          </div>

          <div
            onClick={() => openPdpModal(ZOSMO_PRODUCTS[4])}
            className="bg-[#FCE7F3] rounded-3xl p-6 flex items-center justify-between cursor-pointer group hover:shadow-lg transition-all"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-pink-700">HEADPHONE</span>
              <h3 className="text-base font-bold text-neutral-900 mt-1">Modern & Stylish Sound</h3>
              <span className="text-xs font-bold text-neutral-800 underline mt-2 block">Shop Now</span>
            </div>
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/70 p-2 shrink-0">
              <img src="/images/flagships/tech_headphones.jpg" alt="Headphone" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* "CHOOSE YOUR CATEGORY" CIRCULAR ICONS (Exact match to электроника2.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
          Choose your Category
        </h2>
        <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
          Smart gadgets provide quick access to notifications, calls, messages, and ease right on your wrist & home.
        </p>

        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8 overflow-x-auto no-scrollbar pb-2">
          {[
            { label: 'Home Appliances', cat: 'home', icon: '🏠' },
            { label: 'Kitchen Appliances', cat: 'home', icon: '🍳' },
            { label: 'Accessories', cat: 'wearables', icon: '⌚' },
            { label: 'PC & Laptop', cat: 'camera', icon: '💻' },
            { label: 'Phone & Tablet', cat: 'wearables', icon: '📱' }
          ].map(c => (
            <div
              key={c.label}
              onClick={() => setActiveCategory(c.cat)}
              className="bg-[#F0F4F8] hover:bg-[#E2E8F0] rounded-2xl p-4 w-32 shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-xs">
                {c.icon}
              </div>
              <span className="text-[11px] font-bold text-neutral-800 leading-tight">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* "HIGHLY RECOMMENDED" SECTION (Exact match to электроника2.png) */}
      <section id="zosmo-recommended" className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-neutral-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Highly Recommended
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Electronics products continue to drive innovation and shape the way we live and work.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className="px-4 py-1.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 hover:border-black cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => openPdpModal(p)}
              className="bg-[#F8F9FA] rounded-3xl p-5 border border-neutral-200 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {p.badge}
                  </span>
                  <Heart className="w-3.5 h-3.5 text-neutral-300 hover:text-red-500" />
                </div>

                <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-4">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.title}</h4>
                <div className="text-sm font-black text-neutral-900 mt-1">
                  {p.price.toLocaleString('ru-RU')} UZS
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={e => handleQuickAdd(e, p)}
                  className="w-full py-2 bg-neutral-900 hover:bg-blue-600 text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Купить в 1 клик
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* XENOLEX SMART TV FEATURE BANNER (Exact Match to электроника2.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-10">
        <div className="bg-gradient-to-r from-[#EDE9FE] via-[#E0E7FF] to-[#DBEAFE] rounded-3xl p-8 sm:p-14 border border-blue-200 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="w-full max-w-md aspect-16/10 rounded-2xl overflow-hidden shadow-xl bg-white p-2">
              <img
                src="/images/flagships/tech_banner.jpg"
                alt="Xenolex Smart TV"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <span className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
              10% OFF
            </span>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              HURRY UP! UP TO 10% OFF
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-900">
              Xenolex Smart TV
            </h3>
            <p className="text-xs text-neutral-600">
              4K Ultra HD Display with real suit to color. Google Assistant voice control & Dolby Audio cinema sound.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700 font-semibold pt-1">
              <div>✔ 4K Ultra HD Display</div>
              <div>✔ Android 11 Supported</div>
              <div>✔ Bezel-less Display</div>
              <div>✔ 120Hz Fast Refresh</div>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openPdpModal(ZOSMO_PRODUCTS[5])}
                className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM TICKER STRIP (Exact Match to электроника2.png) */}
      <div className="bg-neutral-950 text-white py-3 px-6 overflow-hidden select-none">
        <div className="flex items-center justify-around text-xs font-black uppercase tracking-widest text-neutral-300">
          <span>Unbelievable Deals Await! ✦</span>
          <span>Huge Discounts! ✦</span>
          <span>Shop More, Save More! ✦</span>
          <span className="hidden sm:inline">Welcome to our store!</span>
        </div>
      </div>

      {/* PDP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-neutral-200">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
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
                  <span className="text-[10px] font-bold uppercase text-blue-600">
                    Zosmo · {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-neutral-800">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">
                      ({selectedProduct.reviewsCount} reviews)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>

                {selectedProduct.options && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-700">
                      Комплектация:
                    </label>
                    <div className="space-y-1">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-neutral-200 hover:bg-neutral-50 text-neutral-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div className="flex items-center border border-neutral-300 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => Math.max(1, q - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold">{pdpQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => q + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePdpAddToCart}
                    className="flex-1 py-3 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {(
                        (selectedProduct.price +
                          (selectedOptionIdx === 1 ? selectedProduct.price * 0.25 : 0)) *
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
      <footer className="bg-neutral-900 text-white mt-12 py-10 px-6 sm:px-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="font-bold text-lg">Zosmo Electronics</div>
          <p className="text-neutral-400 text-[11px]">© 2026 Zosmo. StoreBox Flagship Showcase Demo.</p>
        </div>
      </footer>
    </div>
  );
};
