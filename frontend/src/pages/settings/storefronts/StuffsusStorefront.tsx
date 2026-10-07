import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Star,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Home,
  Music,
  Smartphone,
  HardDrive,
  User,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface StuffsusStorefrontProps {
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

const STUFFSUS_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'st-1',
    title: 'Phone Holder Sakti Pro',
    tag: 'Other',
    category: 'phone',
    price: 360000,
    oldPrice: 420000,
    image: '/images/flagships/stuffsus_camera.jpg',
    gallery: ['/images/flagships/stuffsus_camera.jpg'],
    rating: 5.0,
    reviewsCount: 1200,
    badge: 'TOP',
    desc: 'Регулируемый цельнометаллический держатель для телефона и планшета из авиационного алюминия с поворотным механизмом 360°.',
    options: ['Space Gray', 'Silver']
  },
  {
    id: 'st-2',
    title: 'Headsound Studio Wireless',
    tag: 'Music',
    category: 'music',
    price: 490000,
    oldPrice: 580000,
    image: '/images/flagships/tech_headphones.jpg',
    gallery: ['/images/flagships/tech_headphones.jpg'],
    rating: 5.0,
    reviewsCount: 1200,
    badge: 'POPULAR',
    desc: 'Полноразмерные беспроводные наушники с глубокими басами, мягкими амбушюрами из экокожи и автономностью до 40 часов.',
    options: ['Midnight Black', 'Pearl White']
  },
  {
    id: 'st-3',
    title: 'Adudu Smart Robot Cleaner',
    tag: 'Other',
    category: 'home',
    price: 1850000,
    oldPrice: 2200000,
    image: '/images/flagships/stuffsus_camera.jpg',
    gallery: ['/images/flagships/stuffsus_camera.jpg'],
    rating: 4.4,
    reviewsCount: 1000,
    badge: 'SMART',
    desc: 'Робот-пылесос с лазерной навигацией LiDAR, влажной уборкой и управлением со смартфона. Преодолевает пороги до 2 см.',
    options: ['Белый глянец', 'Черный матовый']
  },
  {
    id: 'st-4',
    title: 'CCTV Maling 360° AI Security',
    tag: 'Home',
    category: 'home',
    price: 620000,
    oldPrice: 750000,
    image: '/images/flagships/stuffsus_camera.jpg',
    gallery: ['/images/flagships/stuffsus_camera.jpg'],
    rating: 4.8,
    reviewsCount: 120,
    badge: 'AI CAM',
    desc: 'Умная домашняя камера видеонаблюдения 2K с функцией слежения за объектом, ночным видением и датчиком плача ребенка.',
    options: ['Стандартная', 'С картой 128GB +95 000 UZS']
  },
  {
    id: 'st-5',
    title: 'Stuffus Peker 32 Smart Plug',
    tag: 'Other',
    category: 'home',
    price: 120000,
    oldPrice: 150000,
    image: '/images/flagships/tech_watch.jpg',
    gallery: ['/images/flagships/tech_watch.jpg'],
    rating: 5.0,
    reviewsCount: 1200,
    badge: 'NEW',
    desc: 'Умная розетка Wi-Fi с мониторингом энергопотребления, таймером и голосовым управлением через Алису и Google Assistant.',
    options: ['16A 3500W']
  },
  {
    id: 'st-6',
    title: 'Stuffus R175 Hi-Fi Soundbox',
    tag: 'Music',
    category: 'music',
    price: 430000,
    oldPrice: 510000,
    image: '/images/flagships/tech_headphones.jpg',
    gallery: ['/images/flagships/tech_headphones.jpg'],
    rating: 4.8,
    reviewsCount: 2400,
    badge: 'BASS',
    desc: 'Портативная влагозащищенная колонка IPX7 с объемным стереозвуком 360 градусов и подсветкой в такт музыке.',
    options: ['Black Edition', 'Army Green']
  }
];

export const StuffsusStorefront: React.FC<StuffsusStorefrontProps> = ({
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
    const extraPrice = selectedOptionIdx === 1 && selectedProduct.id === 'st-4' ? 95000 : 0;
    onAddToCart(selectedProduct, pdpQuantity, opt, undefined, extraPrice);
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const handleBuyNow = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    onOpenCart();
  };

  const filteredProducts = useMemo(() => {
    let list = STUFFSUS_PRODUCTS;
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
    <div className="bg-[#FFFFFF] text-[#1E1E1E] min-h-screen font-sans selection:bg-neutral-900 selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-neutral-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-neutral-700">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Exact Match: Stuffsus logo, Beranda, Shop, Blog, Search, Cart, User) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-6 sm:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center text-white text-xs font-black">
                ▲
              </div>
              <span className="font-bold text-lg tracking-tight text-neutral-900">
                Stuffsus
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600">
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-black transition-colors cursor-pointer"
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('stuff-catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-black font-bold cursor-pointer"
              >
                Shop
              </button>
              <button
                type="button"
                className="hover:text-black transition-colors cursor-pointer"
              >
                Blog
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-neutral-700">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('stuff-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-1.5 hover:text-black transition-colors cursor-pointer"
              aria-label="Поиск"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-1.5 hover:text-black transition-colors cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <div className="w-7 h-7 rounded-full bg-neutral-200 overflow-hidden flex items-center justify-center text-xs font-bold text-neutral-700">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* HERO LIVING ROOM BANNER WITH OVERSIZED "Shop" WATERMARK (Exact Match to электроника1.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-8">
        <div className="relative rounded-3xl overflow-hidden bg-neutral-100 min-h-[340px] sm:min-h-[420px] flex flex-col justify-between p-6 sm:p-12 border border-neutral-200 shadow-xs">
          
          {/* Subtle interior photo background overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-200/90 to-neutral-300/80 mix-blend-multiply" />

          {/* Huge translucent "Shop" typography */}
          <div className="relative z-10 flex items-center justify-center my-auto">
            <span className="text-7xl sm:text-9xl md:text-[160px] font-black text-white/90 drop-shadow-sm tracking-tight select-none">
              Shop
            </span>
          </div>

          {/* Floating Search Pill Bar "Give All You Need" */}
          <div className="relative z-10 bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-neutral-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto w-full">
            <div className="font-bold text-sm sm:text-base text-neutral-900 px-2 whitespace-nowrap">
              Give All You Need
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search on Stuffsus..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-100 text-xs focus:outline-hidden focus:bg-white border border-transparent focus:border-neutral-300 transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('stuff-catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION WITH LEFT SIDEBAR FILTERS (Exact Match to электроника1.png) */}
      <section id="stuff-catalog" className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR FILTERS */}
          <aside className="lg:col-span-3 space-y-6">
            <div>
              <h3 className="font-bold text-sm text-neutral-900 mb-3">Category</h3>
              
              <div className="space-y-1 text-xs">
                {/* All products button */}
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl font-medium cursor-pointer transition-colors ${
                    activeCategory === 'all' ? 'bg-neutral-100 text-black font-bold' : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>All Product</span>
                  </div>
                  <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                    32 ▾
                  </span>
                </button>

                {/* Subcategories */}
                <div className="pl-6 space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('home')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                      activeCategory === 'home' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>For Home</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('music')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                      activeCategory === 'music' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>For Music</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('phone')}
                    className={`w-full text-left py-1.5 px-2 rounded-lg cursor-pointer flex items-center gap-2 ${
                      activeCategory === 'phone' ? 'text-black font-bold' : 'text-neutral-500 hover:text-black'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>For Phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className="w-full text-left py-1.5 px-2 rounded-lg cursor-pointer flex items-center gap-2 text-neutral-500 hover:text-black"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>For Storage</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter tags accordion */}
            <div className="pt-4 border-t border-neutral-200 space-y-3 text-xs text-neutral-700">
              <div className="flex items-center justify-between py-1 cursor-pointer hover:text-black">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                  <span>New Arrival</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </div>

              <div className="flex items-center justify-between py-1 cursor-pointer hover:text-black">
                <span className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Best Seller</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </div>

              <div className="flex items-center justify-between py-1 cursor-pointer hover:text-black">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                  <span>On Discount</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </div>
            </div>
          </aside>

          {/* RIGHT 3-COLUMN PRODUCT GRID (Exact match to электроника1.png) */}
          <main className="lg:col-span-9 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => openPdpModal(p)}
                  className="bg-[#F6F6F8] rounded-3xl p-5 border border-neutral-200/60 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    {/* Top Tag Badge */}
                    <div className="flex justify-end mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-semibold text-neutral-500 border border-neutral-200 shadow-xs">
                        {p.tag || 'Other'}
                      </span>
                    </div>

                    {/* Packshot Image */}
                    <div className="aspect-square bg-transparent rounded-2xl flex items-center justify-center p-3 mb-4">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">
                      {p.title}
                    </h4>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-500 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-neutral-800 font-bold">{p.rating.toFixed(1)}</span>
                      <span>({p.reviewsCount} Reviews)</span>
                    </div>

                    {/* Price */}
                    <div className="text-base font-black text-neutral-900 mt-2">
                      {p.price.toLocaleString('ru-RU')} UZS
                    </div>
                  </div>

                  {/* Dual Action Buttons (Add to Chart / Buy Now) */}
                  <div className="mt-5 pt-3 border-t border-neutral-200/60 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={e => handleQuickAdd(e, p)}
                      className="flex-1 py-2 px-3 rounded-full bg-white hover:bg-neutral-100 text-neutral-900 text-[11px] font-bold border border-neutral-300 transition-colors cursor-pointer text-center"
                    >
                      Add to Chart
                    </button>
                    <button
                      type="button"
                      onClick={e => handleBuyNow(e, p)}
                      className="flex-1 py-2 px-3 rounded-full bg-black hover:bg-neutral-800 text-white text-[11px] font-bold transition-colors cursor-pointer text-center shadow-xs"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls (Exact match to электроника1.png) */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200 text-xs text-neutral-600 font-semibold">
              <button
                type="button"
                className="hover:text-black cursor-pointer"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center">
                  1
                </span>
                <span className="cursor-pointer hover:text-black">2</span>
                <span className="cursor-pointer hover:text-black">3</span>
                <span>...</span>
                <span className="cursor-pointer hover:text-black">8</span>
                <span className="cursor-pointer hover:text-black">9</span>
                <span className="cursor-pointer hover:text-black">10</span>
              </div>

              <button
                type="button"
                className="hover:text-black cursor-pointer"
              >
                Next →
              </button>
            </div>
          </main>
        </div>
      </section>

      {/* "EXPLORE OUR RECOMENDATIONS" CAROUSEL (Exact Match to электроника1.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 border-t border-neutral-200">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Explore our recomendations
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Назад"
              className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Вперед"
              className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:bg-neutral-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[...filteredProducts].reverse().slice(0, 4).map(p => (
            <div
              key={`rec-${p.id}`}
              onClick={() => openPdpModal(p)}
              className="bg-[#F6F6F8] rounded-3xl p-5 border border-neutral-200/60 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex justify-end mb-2">
                  <span className="px-2 py-0.5 rounded-full bg-white text-[9px] font-semibold text-neutral-500 border border-neutral-200">
                    {p.tag || 'Music'}
                  </span>
                </div>
                <div className="aspect-square bg-transparent rounded-2xl flex items-center justify-center p-2 mb-3">
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

              <div className="mt-4 pt-2 border-t border-neutral-200/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={e => handleQuickAdd(e, p)}
                  className="flex-1 py-1.5 rounded-full bg-white text-neutral-900 text-[10px] font-bold border border-neutral-300 hover:bg-neutral-100"
                >
                  Add to Chart
                </button>
                <button
                  type="button"
                  onClick={e => handleBuyNow(e, p)}
                  className="flex-1 py-1.5 rounded-full bg-black text-white text-[10px] font-bold hover:bg-neutral-800"
                >
                  Buy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM BANNER: "READY TO GET OUR NEW STUFF?" (Exact Match to электроника1.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-[#1E1E24] text-white rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6 space-y-4">
            <h3 className="text-3xl sm:text-4xl font-bold leading-tight">
              Ready to Get <br />
              Our New Stuff?
            </h3>
            <form
              onSubmit={e => { e.preventDefault(); showToast('Спасибо за подписку на новинки Stuffsus!'); }}
              className="flex gap-2 max-w-sm pt-2"
            >
              <input
                type="email"
                placeholder="Your Email"
                required
                className="px-4 py-2.5 rounded-full bg-white text-neutral-900 text-xs w-full focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                Send
              </button>
            </form>
          </div>

          <div className="md:col-span-6 space-y-2 text-neutral-400 text-xs leading-relaxed md:pl-8">
            <div className="font-bold text-white text-sm">
              Stuffus for Homes and Needs
            </div>
            <p>
              We'll listen to your needs, identify the best approach, and then create a bespoke smart home solution that's right for you. Fast dispatch & global guarantee.
            </p>
          </div>
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
                  <span className="text-[10px] font-bold uppercase text-neutral-500">
                    Stuffsus · {selectedProduct.tag || selectedProduct.category}
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
                      Модификация / цвет:
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
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePdpAddToCart}
                    className="flex-1 py-3 px-5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
      <footer className="bg-white border-t border-neutral-200 mt-20 pt-12 pb-8 px-6 sm:px-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-100">
          <div className="flex items-center gap-2 font-bold text-base text-neutral-900">
            <span className="w-5 h-5 rounded bg-black text-white flex items-center justify-center text-[10px]">▲</span>
            <span>Stuffsus</span>
          </div>
          <div className="flex items-center gap-6 text-neutral-500 text-xs">
            <span>About</span>
            <span>Support</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-6 text-center text-[11px] text-neutral-400">
          Copyright © 2026 Stuffsus. StoreBox Showcase Demo.
        </div>
      </footer>
    </div>
  );
};
