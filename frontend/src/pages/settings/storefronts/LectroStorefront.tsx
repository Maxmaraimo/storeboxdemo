import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  Search,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Headphones,
  User,
  X
} from 'lucide-react';

interface LectroStorefrontProps {
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

const LECTRO_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'lec-1',
    title: 'XP-21 Wireless Studio Headphones',
    category: 'music',
    price: 1650000,
    oldPrice: 1950000,
    image: '/images/flagships/lectro_headphones.jpg',
    gallery: ['/images/flagships/lectro_headphones.jpg'],
    rating: 5.0,
    reviewsCount: 340,
    badge: 'XP-21 FLAGSHIP',
    desc: 'Премиальная аудиосистема с активным шумоподавлением ANC, 45-мм драйверами и кристально чистым студийным звучанием 24-бит.',
    options: ['Midnight Black with Red Accent', 'Stealth Matte Black', 'Silver White']
  },
  {
    id: 'lec-2',
    title: 'Beanie with Logo Sport',
    category: 'accessories',
    price: 180000,
    oldPrice: 220000,
    image: '/images/flagships/tech_watch.jpg',
    gallery: ['/images/flagships/tech_watch.jpg'],
    rating: 4.8,
    reviewsCount: 110,
    badge: 'SALE',
    desc: 'Теплая спортивная шапка из премиального мериносового трикотажа с фирменным силиконовым логотипом Lectro.',
    options: ['One Size (Универсальный)']
  },
  {
    id: 'lec-3',
    title: 'Lectro Smart Watch Activity',
    category: 'accessories',
    price: 450000,
    oldPrice: 520000,
    image: '/images/flagships/tech_watch.jpg',
    gallery: ['/images/flagships/tech_watch.jpg'],
    rating: 4.9,
    reviewsCount: 280,
    badge: 'HOT',
    desc: 'Умные фитнес-часы с OLED дисплеем, пульсометром, шагомером и защитой от воды IP68.',
    options: ['Black Band', 'Silver Band']
  },
  {
    id: 'lec-4',
    title: 'Hi-Fi Portable Studio Speaker',
    category: 'music',
    price: 680000,
    oldPrice: 790000,
    image: '/images/flagships/beo_sound2_new.jpg',
    gallery: ['/images/flagships/beo_sound2_new.jpg'],
    rating: 4.9,
    reviewsCount: 195,
    badge: 'BASS BOOST',
    desc: 'Портативная Bluetooth колонка с кожаным ремешком для переноски и глубоким стереозвуком.',
    options: ['Silver Edition', 'Graphite Edition']
  },
  {
    id: 'lec-5',
    title: 'Smart Desktop Ice & Air Cooler',
    category: 'decor',
    price: 850000,
    oldPrice: 980000,
    image: '/images/flagships/stuffsus_camera.jpg',
    gallery: ['/images/flagships/stuffsus_camera.jpg'],
    rating: 4.7,
    reviewsCount: 88,
    badge: 'HOME',
    desc: 'Компактный настольный климатический генератор для комфортной работы в офисе и дома.',
    options: ['Silver Metallic']
  },
  {
    id: 'lec-6',
    title: '360° AI Smart Tracking Cam',
    category: 'decor',
    price: 490000,
    oldPrice: 590000,
    image: '/images/flagships/stuffsus_camera.jpg',
    gallery: ['/images/flagships/stuffsus_camera.jpg'],
    rating: 4.8,
    reviewsCount: 140,
    badge: 'AI CAM',
    desc: 'Умная веб-камера на триподе с автоматическим распознаванием лица и слежением за спикером в кадре.',
    options: ['White Studio']
  },
  {
    id: 'lec-7',
    title: 'Lectro Stealth Desk Fan',
    category: 'decor',
    price: 240000,
    oldPrice: 290000,
    image: '/images/flagships/beo_explore_new.jpg',
    gallery: ['/images/flagships/beo_explore_new.jpg'],
    rating: 4.9,
    reviewsCount: 75,
    badge: 'QUIET',
    desc: 'Бесшумный настольный вентилятор с 3 скоростями обдува и питанием от USB Type-C.',
    options: ['Matte Black']
  },
  {
    id: 'lec-8',
    title: 'Tactical Travel Camera Bag',
    category: 'accessories',
    price: 520000,
    oldPrice: 620000,
    image: '/images/flagships/tech_banner.jpg',
    gallery: ['/images/flagships/tech_banner.jpg'],
    rating: 5.0,
    reviewsCount: 92,
    badge: 'DURABLE',
    desc: 'Влагозащищенная сумка для фотоаппарата и объективов с мягкими регулируемыми отсеками.',
    options: ['Black Cordura']
  }
];

export const LectroStorefront: React.FC<LectroStorefrontProps> = ({
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
    let list = LECTRO_PRODUCTS;
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
    <div className="bg-[#FAF9F8] text-[#1E1E1E] min-h-screen font-sans selection:bg-[#E53935] selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#E53935] text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-red-300">
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Exact Match to электроника3.png: Lectro logo, Home, About, Shop, Blog, Pages, Connect, Search, Cart) */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-6 sm:px-12 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg border-2 border-[#E53935] text-[#E53935] flex items-center justify-center font-black text-xl italic leading-none">
                L
              </div>
              <span className="font-black text-2xl tracking-tight text-neutral-900">
                ectro
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-neutral-600">
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-[#E53935] cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                className="hover:text-[#E53935] cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('lectro-all-package');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[#E53935] cursor-pointer"
              >
                Shop
              </button>
              <button
                type="button"
                className="hover:text-[#E53935] cursor-pointer"
              >
                Blog
              </button>
              <button
                type="button"
                className="hover:text-[#E53935] cursor-pointer"
              >
                Pages
              </button>
              <button
                type="button"
                className="hover:text-[#E53935] cursor-pointer"
              >
                Connect
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-neutral-700">
            <button
              type="button"
              className="p-1 hover:text-black cursor-pointer"
              aria-label="Поиск"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-1 hover:text-black cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E53935] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION: XP-21 Electronic System with Iconic Headphones (Exact Match to электроника3.png) */}
      <section className="bg-white py-12 sm:py-20 px-6 sm:px-12 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-sm font-bold uppercase tracking-widest text-neutral-500">
              XP – 21
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-neutral-900 tracking-tight leading-tight">
              Electronic System
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md leading-relaxed font-normal">
              Contrary to popular belief, premium acoustic audio is not simply random sound. It is engineering perfection.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openPdpModal(LECTRO_PRODUCTS[0])}
                className="px-8 py-3.5 bg-[#E53935] hover:bg-red-700 text-white rounded-full text-xs font-bold uppercase tracking-widest shadow-md transition-all cursor-pointer active:scale-95"
              >
                SHOP NOW
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md aspect-square flex items-center justify-center p-4">
              <img
                src="/images/flagships/lectro_headphones.jpg"
                alt="XP-21 Headphones"
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-500 drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3 PROMO CATEGORY CARDS (Exact match to электроника3.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Tablets Smartphones */}
          <div className="bg-[#FDF2E9] rounded-2xl p-6 flex items-center justify-between border border-[#FADBD8] shadow-xs cursor-pointer group hover:shadow-md transition-all">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-neutral-900">
                Tablets <br /> Smartphones
              </h3>
              <p className="text-xs text-[#E53935] font-semibold">Starting at $99.00</p>
              <span className="inline-block pt-1 text-xs text-neutral-500 group-hover:text-black">
                →
              </span>
            </div>
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/70 p-2 shrink-0">
              <img src="/images/flagships/tech_macbook.jpg" alt="Tablet" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Card 2: Shop The Hottest Products */}
          <div className="bg-[#EBF5FB] rounded-2xl p-6 flex items-center justify-between border border-[#D4E6F1] shadow-xs cursor-pointer group hover:shadow-md transition-all">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-neutral-900">
                Shop The <br /> Hottest Products
              </h3>
              <p className="text-xs text-[#E53935] font-semibold">Starting at $195.00</p>
              <span className="inline-block pt-1 text-xs text-neutral-500 group-hover:text-black">
                →
              </span>
            </div>
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/70 p-2 shrink-0">
              <img src="/images/flagships/tech_banner.jpg" alt="Monitor" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Card 3: Cameras All Package */}
          <div className="bg-[#FDEDEC] rounded-2xl p-6 flex items-center justify-between border border-[#F5B7B1] shadow-xs cursor-pointer group hover:shadow-md transition-all">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-neutral-900">
                Cameras <br /> All Package
              </h3>
              <p className="text-xs text-[#E53935] font-semibold">Starting at $395.00</p>
              <span className="inline-block pt-1 text-xs text-neutral-500 group-hover:text-black">
                →
              </span>
            </div>
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/70 p-2 shrink-0">
              <img src="/images/flagships/stuffsus_camera.jpg" alt="Camera" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* "ALL PACKAGE" SECTION (Exact match to электроника3.png) */}
      <section id="lectro-all-package" className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <div className="text-center space-y-4 mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            All Package
          </h2>

          {/* Category Tabs: ACCESSORIES · CLOTHING · DECOR · HOODIES · MUSIC · TSHIRTS */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs uppercase font-bold tracking-wider text-neutral-500">
            {['all', 'accessories', 'music', 'decor'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`transition-colors cursor-pointer ${
                  activeCategory === cat ? 'text-[#E53935] font-black underline' : 'hover:text-black'
                }`}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 4/5 Columns Square Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => openPdpModal(p)}
              className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group cursor-pointer text-center"
            >
              <div>
                <div className="aspect-square bg-neutral-50 rounded-xl p-4 flex items-center justify-center mb-4">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.title}</h4>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs font-black text-[#E53935]">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </span>
                  {p.oldPrice && (
                    <span className="text-[10px] text-neutral-400 line-through">
                      {p.oldPrice.toLocaleString('ru-RU')} UZS
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={e => handleQuickAdd(e, p)}
                  className="w-full py-1.5 rounded-full bg-neutral-100 hover:bg-[#E53935] hover:text-white text-neutral-900 text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  Купить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

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
                  <span className="text-[10px] font-bold uppercase text-[#E53935]">
                    Lectro Audio · {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-neutral-800">
                    <Star className="w-3.5 h-3.5 fill-[#E53935] text-[#E53935]" />
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
                      Цвет / Опция:
                    </label>
                    <div className="space-y-1">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-[#E53935] bg-red-50 text-[#E53935]'
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
                    className="flex-1 py-3 px-5 rounded-full bg-[#E53935] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
      <footer className="bg-white border-t border-neutral-200 mt-20 py-10 px-6 sm:px-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="font-bold text-lg text-neutral-900">Lectro Electronic Store</div>
          <p className="text-neutral-400 text-[11px]">© 2026 Lectro. Verified StoreBox Showcase Demo.</p>
        </div>
      </footer>
    </div>
  );
};
