import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Flame,
  Star,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Check,
  Heart,
  SlidersHorizontal,
  Bell,
  Menu,
  Home,
  Grid,
  Tag,
  User,
  X,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';

interface CrispyChickenStorefrontProps {
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

const CRISPY_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'cr-1',
    title: '8 Pcs Chicken Bucket Combo',
    category: 'buckets',
    price: 185000,
    oldPrice: 220000,
    image: '/images/flagships/crispy_bucket.jpg',
    gallery: [
      '/images/flagships/crispy_bucket.jpg',
      '/images/flagships/taste_crispy_chicken_hd.jpg'
    ],
    rating: 4.8,
    reviewsCount: 12500,
    badge: 'BESTSELLER',
    desc: '2 Large Fries + 2 Dips + 2 Drinks. Сочные хрустящие кусочки цыпленка в секретной панировке из 11 специй.',
    options: ['Острый Spicy 🌶️🌶️', 'Классический Original'],
    specs: {
      'Состав': '8 кусочков курицы, 2 картофеля фри, 2 напитка 0.5л, 2 соуса',
      'Порция': 'Для 2-3 человек'
    }
  },
  {
    id: 'cr-2',
    title: 'Zinger Burger Combo',
    category: 'burgers',
    price: 65000,
    oldPrice: 78000,
    image: '/images/flagships/taste_crispy_chicken_hd.jpg',
    gallery: [
      '/images/flagships/taste_crispy_chicken_hd.jpg',
      '/images/flagships/crispy_bucket.jpg'
    ],
    rating: 4.7,
    reviewsCount: 8700,
    badge: 'POPULAR',
    desc: 'Zinger Burger + Fries + Drink. Фирменный бургер с хрустящим куриным филе, салатом айсберг и авторским соусом.',
    options: ['Комбо (Бургер + Фри + Напиток)', 'Только бургер -18 000 UZS'],
    specs: {
      'Булка': 'Булочка с кунжутом',
      'Филе': '100% нежное белое мясо'
    }
  },
  {
    id: 'cr-3',
    title: '5 Pcs Hot & Crispy Strips',
    category: 'snacks',
    price: 55000,
    oldPrice: 65000,
    image: '/images/flagships/taste_crispy_chicken_hd.jpg',
    gallery: [
      '/images/flagships/taste_crispy_chicken_hd.jpg'
    ],
    rating: 4.6,
    reviewsCount: 6300,
    badge: 'SAVE 15%',
    desc: '5 Pcs Chicken + Fries + Drink. Отборные нежные стрипсы в сверххрустящей золотой корочке с соусом BBQ.',
    options: ['5 стрипсов соус BBQ', '8 стрипсов соус сырный +18 000 UZS'],
    specs: {
      'Острота': 'Острые с паприкой и кайенским перцем'
    }
  },
  {
    id: 'cr-4',
    title: '16 Pcs Mega Feast Bucket',
    category: 'buckets',
    price: 240000,
    oldPrice: 280000,
    image: '/images/flagships/crispy_bucket.jpg',
    gallery: [
      '/images/flagships/crispy_bucket.jpg'
    ],
    rating: 4.9,
    reviewsCount: 4200,
    badge: 'PARTY PACK',
    desc: '16 Pcs Hot Wings & Strips + 3 Large Fries + 4 Dips + 3 Drinks. Максимальный набор для большой компании!',
    options: ['Микс (8 крыльев + 8 стрипсов)', 'Только стрипсы (16 шт)'],
    specs: {
      'Вес': '1 650 г'
    }
  },
  {
    id: 'cr-5',
    title: 'Golden Loaded Cheese Bacon Fries',
    category: 'sides',
    price: 32000,
    oldPrice: 38000,
    image: '/images/flagships/burger_fries.jpg',
    gallery: [
      '/images/flagships/burger_fries.jpg'
    ],
    rating: 4.8,
    reviewsCount: 2900,
    badge: 'LOADED',
    desc: 'Хрустящий картофель фри с теплым сырным соусом чеддер и кусочками хрустящего жареного бекона.',
    options: ['Стандартная порция', 'Большая порция +10 000 UZS'],
    specs: {
      'Сыр': 'Расплавленный чеддер'
    }
  },
  {
    id: 'cr-6',
    title: 'Craft Milkshake & Ice Cream Dip',
    category: 'desserts',
    price: 28000,
    oldPrice: 34000,
    image: '/images/flagships/burger_shake.jpg',
    gallery: [
      '/images/flagships/burger_shake.jpg'
    ],
    rating: 4.9,
    reviewsCount: 1900,
    badge: 'SWEET',
    desc: 'Сливочное мороженое и густой милкшейк со вкусом соленой карамели или шоколадной крошки.',
    options: ['Карамельный пломбир', 'Шоколадный милкшейк'],
    specs: {
      'Объем': '400 мл'
    }
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🍗' },
  { id: 'buckets', label: 'Buckets', icon: '🪣' },
  { id: 'burgers', label: 'Burgers', icon: '🍔' },
  { id: 'snacks', label: 'Snacks', icon: '🍟' },
  { id: 'sides', label: 'Sides', icon: '🍿' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'desserts', label: 'Desserts', icon: '🍦' }
];

export const CrispyChickenStorefront: React.FC<CrispyChickenStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PDP Modal state
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedSauce, setSelectedSauce] = useState('Сырный соус Чеддер');
  const [selectedDrink, setSelectedDrink] = useState('Coca-Cola 0.5л');
  const [pdpQuantity, setPdpQuantity] = useState(1);

  // Active bottom tab
  const [activeTab, setActiveTab] = useState<'home' | 'menu' | 'orders' | 'offers' | 'profile'>('home');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = !prev[id];
      showToast(next ? 'Добавлено в избранное ❤️' : 'Удалено из избранного');
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
    const customDetails = `Соус: ${selectedSauce}, Напиток: ${selectedDrink}`;
    const extraPrice = selectedOptionIdx === 1 && selectedProduct.id === 'cr-2' ? -18000 : 0;
    onAddToCart(selectedProduct, pdpQuantity, opt, customDetails, extraPrice);
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    showToast(`«${product.title}» добавлен в заказ!`);
  };

  const filteredProducts = useMemo(() => {
    let list = CRISPY_PRODUCTS;
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
    <div className="bg-[#F8F3EC] min-h-screen text-[#1A1A1A] font-sans selection:bg-[#E4002B] selection:text-white py-4 sm:py-8 px-2 sm:px-4 flex justify-center items-start">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 px-5 py-3 rounded-2xl bg-[#E4002B] text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-red-300">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MOBILE APP PHONE CONTAINER (Exact mockup replica of еда2.png) */}
      <div className="w-full max-w-[440px] bg-[#FAF5EE] rounded-[44px] shadow-2xl border-[8px] border-[#E8DFD3] overflow-hidden flex flex-col relative pb-20">
        
        {/* STATUS BAR (9:41, wifi, battery) */}
        <div className="pt-3 px-7 pb-2 flex items-center justify-between text-neutral-800 text-xs font-bold select-none">
          <span>9:41</span>
          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* TOP APP HEADER */}
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            type="button"
            className="w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
            aria-label="Меню"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="text-center">
            <div className="text-[11px] font-semibold text-neutral-600 flex items-center justify-center gap-1">
              <span>Hello, Chicken Lover!</span>
              <span>👋</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#E4002B] italic tracking-tighter uppercase">
                CRISPY
              </span>
              <span className="text-xs font-black uppercase text-neutral-900 tracking-wider">
                CHICKEN
              </span>
            </div>
            <p className="text-[9px] text-neutral-400 font-medium">It's finger lickin' good.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
              aria-label="Уведомления"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute 1 top-2 right-2 w-2 h-2 rounded-full bg-[#E4002B]" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative w-10 h-10 rounded-2xl bg-white border border-neutral-200/80 shadow-xs flex items-center justify-center text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E4002B] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* SEARCH INPUT */}
        <div className="px-5 pt-2 pb-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search for your favorite chicken..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-11 py-3 rounded-2xl bg-white border border-neutral-200 text-xs font-medium placeholder-neutral-400 focus:outline-hidden focus:border-[#E4002B] shadow-xs"
            />
            <button
              type="button"
              className="absolute right-3 p-1.5 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              aria-label="Фильтры"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HERO PROMO CAROUSEL BANNER (Exact Match: Deep Red Gradient, Crispy Bucket, Order Now Button) */}
        <div className="px-5 py-2">
          <div
            onClick={() => openPdpModal(CRISPY_PRODUCTS[0])}
            className="rounded-3xl bg-linear-to-r from-[#800A0A] via-[#A81010] to-[#800A0A] p-5 text-white shadow-xl relative overflow-hidden cursor-pointer group"
          >
            {/* Background radial glow */}
            <div className="absolute right-0 top-0 w-44 h-44 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7 space-y-2">
                <span className="text-[9px] font-black tracking-widest uppercase text-amber-300">
                  LIMITED TIME
                </span>
                <h2 className="text-xl font-black uppercase leading-tight tracking-tight">
                  CRISPY. <br />
                  JUICY. <br />
                  IRRESISTIBLE.
                </h2>
                <p className="text-[10px] text-white/80 font-medium leading-snug">
                  100% Real Chicken. <br />
                  Made Fresh. Always.
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E4002B] text-white text-[10px] font-black uppercase tracking-wider shadow-md group-hover:bg-red-600 transition-colors">
                    <span>Order Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Bucket photo on right */}
              <div className="col-span-5 flex justify-end">
                <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src="/images/flagships/crispy_bucket.jpg"
                    alt="Crispy Bucket"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Dots pagination */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* CIRCULAR CATEGORIES (Exact Match: Horizontal scroll, active red circle ring) */}
        <div className="pt-4 pb-2 px-5">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all shadow-xs ${
                      isActive
                        ? 'bg-white border-2 border-[#E4002B] shadow-md scale-105'
                        : 'bg-white border border-neutral-200/80 group-hover:border-neutral-400'
                    }`}
                  >
                    <span>{cat.icon}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      isActive ? 'text-[#E4002B] font-black' : 'text-neutral-600'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* POPULAR COMBOS SECTION */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-black text-neutral-900 tracking-tight">
              Popular Combos
            </h3>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="text-xs font-bold text-[#E4002B] flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Product Cards Carousel / Grid */}
          <div className="space-y-3.5">
            {filteredProducts.map(p => {
              const isFav = !!favorites[p.id];
              return (
                <div
                  key={p.id}
                  onClick={() => openPdpModal(p)}
                  className="bg-white rounded-3xl p-4 border border-neutral-200/70 shadow-sm hover:shadow-md transition-all flex gap-3.5 items-center justify-between group cursor-pointer"
                >
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.badge && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[#E4002B] text-white text-[8px] font-black uppercase tracking-wider">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-black text-neutral-900 truncate">
                        {p.title}
                      </h4>
                      <button
                        type="button"
                        onClick={e => toggleFavorite(e, p.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                        aria-label="В избранное"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isFav ? 'fill-red-500 text-red-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5">
                      {p.desc}
                    </p>

                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{p.rating.toFixed(1)}</span>
                      <span className="text-neutral-400 font-normal">
                        ({(p.reviewsCount / 1000).toFixed(1)}k+)
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
                      <div>
                        <span className="text-xs font-black text-[#E4002B]">
                          {p.price.toLocaleString('ru-RU')} UZS
                        </span>
                        <span className="block text-[9px] text-neutral-400 font-semibold">
                          ≈ ${(p.price / 12500).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={e => handleQuickAdd(e, p)}
                        className="w-7 h-7 rounded-full bg-[#E4002B] hover:bg-red-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer"
                        aria-label="Добавить в заказ"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM 30% OFF BANNER (Exact Match to еда2.png) */}
        <div className="px-5 py-4">
          <div
            onClick={() => setActiveCategory('combos')}
            className="rounded-3xl bg-[#F6ECE0] p-4 border border-amber-200/80 shadow-sm flex items-center justify-between gap-3 cursor-pointer group"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-[#E4002B] tracking-wider">
                EXCLUSIVE OFFER
              </span>
              <h4 className="text-sm font-black text-neutral-900 leading-tight">
                Up to 30% OFF
              </h4>
              <p className="text-[10px] text-neutral-500">On selected combos</p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E4002B] text-white text-[9px] font-black uppercase tracking-wider group-hover:bg-red-700 transition-colors">
                  <span>Order Now</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            {/* Circular badge 30% OFF */}
            <div className="relative shrink-0 flex items-center">
              <div className="w-14 h-14 rounded-full bg-[#E4002B] text-white flex flex-col items-center justify-center font-black shadow-md">
                <span className="text-xs leading-none">30%</span>
                <span className="text-[8px] leading-none uppercase">OFF</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM NAVIGATION TAB BAR (Exact Match: Home, Menu, Orders, Offers, Profile) */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200/80 px-4 py-2 flex items-center justify-around z-30 shadow-lg">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'home' ? 'text-[#E4002B]' : 'text-neutral-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[9px] font-bold">Home</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('menu'); setActiveCategory('all'); }}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'menu' ? 'text-[#E4002B]' : 'text-neutral-400'
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[9px] font-bold">Menu</span>
          </button>

          {/* Elevated Orders button */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex flex-col items-center -mt-5 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-[#E4002B] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black text-neutral-800 mt-0.5">Orders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offers')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'offers' ? 'text-[#E4002B]' : 'text-neutral-400'
            }`}
          >
            <Tag className="w-5 h-5" />
            <span className="text-[9px] font-bold">Offers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-0.5 cursor-pointer ${
              activeTab === 'profile' ? 'text-[#E4002B]' : 'text-neutral-400'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-bold">Profile</span>
          </button>
        </div>

        {/* PDP CUSTOMIZATION MODAL */}
        {selectedProduct && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in">
            <div className="bg-white rounded-t-[36px] w-full max-h-[85%] overflow-y-auto p-5 shadow-2xl relative">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto mb-3" />

              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-100 mb-3">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#E4002B]">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-base font-black text-neutral-900 mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">
                      ({selectedProduct.reviewsCount} отзывов)
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>

                {/* Options */}
                {selectedProduct.options && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase text-neutral-800">
                      Размер и состав:
                    </label>
                    <div className="space-y-1">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-[#E4002B] bg-red-50 text-[#E4002B]'
                              : 'border-neutral-200 text-neutral-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sauce selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black uppercase text-neutral-800">
                    Выберите бесплатный соус:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    {['Сырный соус Чеддер', 'Барбекю Смоки', 'Сладкий Чили', 'Чесночный Ранч'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSauce(s)}
                        className={`p-2 rounded-lg border text-center font-bold cursor-pointer ${
                          selectedSauce === s
                            ? 'border-[#E4002B] bg-red-50 text-[#E4002B]'
                            : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & Add to Cart */}
                <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-100">
                  <div className="flex items-center border border-neutral-200 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => Math.max(1, q - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-black">{pdpQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => q + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePdpAddToCart}
                    className="flex-1 py-3 px-4 rounded-full bg-[#E4002B] hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {(
                        (selectedProduct.price +
                          (selectedOptionIdx === 1 && selectedProduct.id === 'cr-2' ? -18000 : 0)) *
                        pdpQuantity
                      ).toLocaleString('ru-RU')}{' '}
                      UZS
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
