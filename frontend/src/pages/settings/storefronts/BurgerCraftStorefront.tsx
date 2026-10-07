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
  Truck,
  Plus,
  Minus,
  Check,
  Heart,
  Clock,
  ShieldCheck,
  User,
  X
} from 'lucide-react';

interface BurgerCraftStorefrontProps {
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

const BURGER_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'bg-1',
    title: 'Roiterr Berineads (Angus Smash)',
    category: 'burgers',
    price: 48000,
    oldPrice: 56000,
    image: '/images/flagships/taste_angus_burger_hd.jpg',
    gallery: [
      '/images/flagships/taste_angus_burger_hd.jpg',
      '/images/flagships/burger_double_angus.jpg'
    ],
    rating: 4.9,
    reviewsCount: 420,
    badge: 'HOT',
    desc: 'The ultimate smash 100% black angus beef burger with crisp pickled gherkins, creamy secret sauce & toasted sesame brioche.',
    options: ['Одиночный бургер', 'Комбо сет (+ Фри + Крафтовый напиток) +22 000 UZS'],
    specs: {
      'Котлета': '100% Black Angus 160 г',
      'Булка': 'Французская сливочная бриошь',
      'Сыр': 'Ирландский чеддер'
    }
  },
  {
    id: 'bg-2',
    title: 'Pest Kinger (Double Cheddar)',
    category: 'burgers',
    price: 58000,
    oldPrice: 68000,
    image: '/images/flagships/burger_double_angus.jpg',
    gallery: [
      '/images/flagships/burger_double_angus.jpg',
      '/images/flagships/taste_angus_burger_hd.jpg'
    ],
    rating: 5.0,
    reviewsCount: 560,
    badge: 'BESTSELLER',
    desc: 'Две сочные котлеты из мраморной говядины, двойной расплавленный чеддер, карамелизированный лук и фирменный соус MOKR.',
    options: ['Одиночный бургер', 'Комбо сет (+ Фри + Крафтовый напиток) +22 000 UZS'],
    specs: {
      'Котлета': 'Двойная говядина 240 г',
      'Сыр': 'Двойной чеддер',
      'Соус': 'MOKR Special Recipe'
    }
  },
  {
    id: 'bg-3',
    title: 'Fast Bedivery (Crispy BBQ Bacon)',
    category: 'burgers',
    price: 52000,
    oldPrice: 60000,
    image: '/images/flagships/burger_whopper.jpg',
    gallery: [
      '/images/flagships/burger_whopper.jpg'
    ],
    rating: 4.8,
    reviewsCount: 310,
    badge: 'HOT',
    desc: 'Хрустящий обжаренный бекон, спелые томаты, свежий салат айсберг, кольца сладкого лука и дымный соус BBQ.',
    options: ['Одиночный бургер', 'Комбо сет (+ Фри + Крафтовый напиток) +22 000 UZS'],
    specs: {
      'Бекон': 'Хрустящий сырокопченый',
      'Соус': 'Smoked Texas BBQ'
    }
  },
  {
    id: 'bg-4',
    title: 'Gold Tender Chicken Burger',
    category: 'burgers',
    price: 46000,
    oldPrice: 54000,
    image: '/images/flagships/taste_crispy_chicken_hd.jpg',
    gallery: [
      '/images/flagships/taste_crispy_chicken_hd.jpg'
    ],
    rating: 4.8,
    reviewsCount: 270,
    badge: 'CRISPY',
    desc: 'Сочное филе фермерской курочки в хрустящей золотой панировке с легким чесночным майо и маринованными огурчиками.',
    options: ['Одиночный бургер', 'Комбо сет (+ Фри + Крафтовый напиток) +22 000 UZS'],
    specs: {
      'Мясо': '100% куриное филе 180 г',
      'Панировка': 'Хрустящие хлопья со специями'
    }
  },
  {
    id: 'bg-5',
    title: 'Monster Double Angus Combo Box',
    category: 'combos',
    price: 76000,
    oldPrice: 88000,
    image: '/images/flagships/food_steak_burger.jpg',
    gallery: [
      '/images/flagships/food_steak_burger.jpg'
    ],
    rating: 4.9,
    reviewsCount: 195,
    badge: 'COMBO SAVE',
    desc: 'Большой сытный комбо: Monster Double Angus бургер, большая порция хрустящего картофеля фри и крафтовый лимонад на выбор.',
    options: ['Комбо с картофелем фри и колой', 'Комбо с сырными палочками и лимонадом +6 000 UZS'],
    specs: {
      'Комплектация': 'Бургер + Фри + Напиток 0.5л',
      'Выгода': 'Экономия 15%'
    }
  },
  {
    id: 'bg-6',
    title: 'Crispy Rosemary Parmesan Fries',
    category: 'sides',
    price: 24000,
    oldPrice: 30000,
    image: '/images/flagships/burger_fries.jpg',
    gallery: [
      '/images/flagships/burger_fries.jpg'
    ],
    rating: 4.9,
    reviewsCount: 380,
    badge: 'TOP SIDE',
    desc: 'Золотистый хрустящий картофель фри с душистым свежим розмарином, морской солью и тертым выдержанным пармезаном.',
    options: ['Стандартная порция 160 г', 'Большая порция 240 г +8 000 UZS'],
    specs: {
      'Картофель': 'Отборный бельгийский сорт',
      'Сыр': 'Пармезан 12 мес выдержки'
    }
  },
  {
    id: 'bg-7',
    title: 'Sarcy Blarth Lemonade (Craft Lemon)',
    category: 'drinks',
    categorySecondary: 'sides',
    price: 22000,
    oldPrice: 28000,
    image: '/images/flagships/burger_shake.jpg',
    gallery: [
      '/images/flagships/burger_shake.jpg'
    ],
    rating: 5.0,
    reviewsCount: 140,
    badge: 'COLD',
    desc: 'Освежающий натуральный крафтовый лимонад с соком сицилийского лимона, листьями мяты и дробленым льдом.',
    options: ['Стакан 400 мл', 'Большой 600 мл +6 000 UZS'],
    specs: {
      'Основа': 'Свежевыжатый сок цитрусовых',
      'Сахар': 'Тростниковый органический'
    }
  }
];

export const BurgerCraftStorefront: React.FC<BurgerCraftStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PDP Modal state
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [extraBacon, setExtraBacon] = useState(false);
  const [extraCheddar, setExtraCheddar] = useState(false);
  const [pdpQuantity, setPdpQuantity] = useState(1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openPdpModal = (product: ThemeProductItem) => {
    setSelectedProduct(product);
    setSelectedOptionIdx(0);
    setExtraBacon(false);
    setExtraCheddar(false);
    setPdpQuantity(1);
  };

  const handlePdpAddToCart = () => {
    if (!selectedProduct) return;
    const opt = selectedProduct.options?.[selectedOptionIdx] || 'Стандарт';
    let extra = selectedOptionIdx === 1 ? 22000 : 0;
    const addons: string[] = [];
    if (extraBacon) { extra += 12000; addons.push('+Бекон'); }
    if (extraCheddar) { extra += 6000; addons.push('+Чеддер'); }
    const details = addons.length > 0 ? addons.join(', ') : undefined;
    onAddToCart(selectedProduct, pdpQuantity, opt, details, extra);
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, product.options?.[0] || 'Стандарт');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const filteredProducts = useMemo(() => {
    let list = BURGER_PRODUCTS;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory || p.categorySecondary === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchQuery]);

  const scrollToMenu = (cat?: string) => {
    if (cat) setActiveCategory(cat);
    const el = document.getElementById('burger-menu-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#FAF5ED] text-[#222222] min-h-screen font-sans selection:bg-[#BE1818] selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#BE1818] text-white shadow-2xl text-xs font-black flex items-center gap-2.5 animate-in fade-in border border-amber-300">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP YELLOW HEADER (Exact match to еда3.png) */}
      <header className="sticky top-0 z-40 bg-[#F5B82A] px-4 sm:px-8 py-3.5 border-b border-[#E5A81E] shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 sm:gap-10">
            {/* Logo round badge */}
            <div
              onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#BE1818] text-white flex flex-col items-center justify-center shadow-md leading-none border-2 border-white/30 group-hover:scale-105 transition-transform">
                <span className="text-[11px] font-black tracking-tight">Mokr</span>
                <span className="text-[7px] tracking-widest uppercase text-amber-200">Burger</span>
              </div>
              <span className="font-black text-xl tracking-tight text-neutral-900 hidden sm:inline">
                Mokr Burger
              </span>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider font-extrabold text-neutral-900">
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="hover:text-[#BE1818] transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => scrollToMenu('all')}
                className="hover:text-[#BE1818] transition-colors cursor-pointer"
              >
                Category
              </button>
              <button
                type="button"
                onClick={() => scrollToMenu('combos')}
                className="hover:text-[#BE1818] transition-colors cursor-pointer"
              >
                Delivery
              </button>
              <button
                type="button"
                onClick={() => scrollToMenu('sides')}
                className="hover:text-[#BE1818] transition-colors cursor-pointer"
              >
                Need
              </button>
            </nav>
          </div>

          {/* Right Header items */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => scrollToMenu('all')}
              className="hidden sm:flex px-5 py-2 rounded-full bg-[#BE1818] hover:bg-[#A31414] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Order Online</span>
            </button>

            <button
              type="button"
              onClick={() => scrollToMenu('all')}
              aria-label="Поиск по меню"
              className="p-2 text-neutral-900 hover:text-[#BE1818] transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              type="button"
              aria-label="Личный кабинет"
              className="p-2 text-neutral-900 hover:text-[#BE1818] transition-colors cursor-pointer"
            >
              <User className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 text-neutral-900 hover:text-[#BE1818] transition-colors cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#BE1818] text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION (Exact Match: Vibrant Red, Bold White Headline, Big Angus Burger on Right) */}
      <section className="bg-[#BD1B1B] text-white px-4 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-24 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 z-10">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
              Order Your <br />
              Favorites in <br />
              Minutes.
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-lg leading-relaxed font-medium">
              Горячие сочные крафтовые бургеры из 100% говядины Black Angus. Хрустящая булочка бриошь, расплавленный чеддер и фирменный соус с доставкой за 30 минут!
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => scrollToMenu('all')}
                className="px-8 py-4 rounded-full bg-[#F5B82A] hover:bg-amber-300 text-neutral-950 text-sm font-black uppercase tracking-wider transition-all shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 inline-flex items-center gap-3 cursor-pointer"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4 text-neutral-950" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center z-10">
            <div
              onClick={() => openPdpModal(BURGER_PRODUCTS[1])}
              className="relative w-full max-w-md group cursor-pointer"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                <img
                  src="/images/flagships/burger_double_angus.jpg"
                  alt="Delicious Double Angus Burger"
                  className="w-full h-80 sm:h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#F5B82A] text-neutral-950 px-5 py-2 rounded-full text-xs font-black shadow-lg flex items-center gap-2 whitespace-nowrap">
                <Flame className="w-3.5 h-3.5 text-[#BD1B1B] fill-[#BD1B1B]" />
                <span>Pest Kinger Double Cheddar</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 DOWNWARD-POINTING CATEGORY CARDS (Exact Match to еда3.png) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 -mt-10 sm:-mt-14 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Red - Burgers (Seary Dries) */}
          <div
            onClick={() => scrollToMenu('burgers')}
            className={`group cursor-pointer rounded-2xl p-5 relative transition-all duration-300 transform hover:-translate-y-1 shadow-xl flex flex-col items-center justify-between text-center ${
              activeCategory === 'burgers' ? 'bg-[#9E1414] ring-4 ring-[#F5B82A]' : 'bg-[#BD1B1B] hover:bg-[#A81717]'
            }`}
          >
            <div className="w-28 h-28 rounded-full overflow-hidden mb-3 bg-white/10 p-1">
              <img
                src="/images/flagships/taste_angus_burger_hd.jpg"
                alt="Burgers"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h3 className="text-white font-black text-lg tracking-wide uppercase">
              Burgers
            </h3>
            <span className="text-white/70 text-xs mt-0.5">Classic Angus Patties</span>
            {/* Downward triangle pointer tip */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#BD1B1B]" />
          </div>

          {/* Card 2: Amber/Yellow - Combos (Jectivave) */}
          <div
            onClick={() => scrollToMenu('combos')}
            className={`group cursor-pointer rounded-2xl p-5 relative transition-all duration-300 transform hover:-translate-y-1 shadow-xl flex flex-col items-center justify-between text-center ${
              activeCategory === 'combos' ? 'bg-[#E5A81E] ring-4 ring-[#BD1B1B]' : 'bg-[#F5B82A] hover:bg-[#EEB020]'
            }`}
          >
            <div className="w-28 h-28 rounded-full overflow-hidden mb-3 bg-neutral-900/10 p-1">
              <img
                src="/images/flagships/food_steak_burger.jpg"
                alt="Combos"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h3 className="text-neutral-950 font-black text-lg tracking-wide uppercase">
              Combos & Sets
            </h3>
            <span className="text-neutral-800 text-xs mt-0.5">Burger + Fries + Drink</span>
            {/* Downward triangle pointer tip */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#F5B82A]" />
          </div>

          {/* Card 3: Red - Sides & Drinks (Dallery Noto) */}
          <div
            onClick={() => scrollToMenu('sides')}
            className={`group cursor-pointer rounded-2xl p-5 relative transition-all duration-300 transform hover:-translate-y-1 shadow-xl flex flex-col items-center justify-between text-center ${
              activeCategory === 'sides' ? 'bg-[#9E1414] ring-4 ring-[#F5B82A]' : 'bg-[#BD1B1B] hover:bg-[#A81717]'
            }`}
          >
            <div className="w-28 h-28 rounded-full overflow-hidden mb-3 bg-white/10 p-1">
              <img
                src="/images/flagships/burger_fries.jpg"
                alt="Sides"
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <h3 className="text-white font-black text-lg tracking-wide uppercase">
              Sides & Drinks
            </h3>
            <span className="text-white/70 text-xs mt-0.5">Crispy Fries & Lemonades</span>
            {/* Downward triangle pointer tip */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#BD1B1B]" />
          </div>
        </div>
      </section>

      {/* MAIN MENU SECTION (Matches 3 product cards in еда3.png) */}
      <section id="burger-menu-section" className="max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-300">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Fresh Crafted Menu
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              Отборная мраморная говядина, фирменные соусы и горячая подача
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Поиск по меню..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-amber-300 bg-white text-xs font-semibold focus:outline-hidden focus:border-[#BD1B1B]"
              />
            </div>

            {/* Category reset pill */}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="px-3 py-2 rounded-full bg-neutral-200 hover:bg-neutral-300 text-[11px] font-black uppercase tracking-wider text-neutral-700 cursor-pointer"
              >
                Все категории
              </button>
            )}
          </div>
        </div>

        {/* 3 CARDS ROW (Exact match to Roiterr Berineads, Pest Kinger, Fast Bedivery) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          {filteredProducts.slice(0, 3).map(p => (
            <div
              key={p.id}
              onClick={() => openPdpModal(p)}
              className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Top Badge & Heart */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-[#BD1B1B] text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                    {p.badge || 'HOT'}
                  </span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); showToast('Добавлено в избранное'); }}
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="В избранное"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </div>

                {/* Product Image */}
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-50 mb-5 flex items-center justify-center">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-black text-neutral-900 group-hover:text-[#BD1B1B] transition-colors leading-tight">
                  {p.title}
                </h3>
                <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              {/* Price & Action */}
              <div className="pt-6 mt-4 border-t border-amber-100 flex items-center justify-between">
                <div>
                  <span className="block text-lg font-black text-neutral-900">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    ≈ ${(p.price / 12500).toFixed(2)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={e => handleQuickAdd(e, p)}
                  className="px-5 py-2.5 rounded-full bg-[#F5B82A] hover:bg-amber-300 text-neutral-950 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Купить</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Remaining products if more than 3 */}
        {filteredProducts.length > 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {filteredProducts.slice(3).map(p => (
              <div
                key={p.id}
                onClick={() => openPdpModal(p)}
                className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-50 mb-3">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {p.badge && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#BD1B1B] text-white text-[9px] font-black uppercase">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-neutral-900 line-clamp-1">{p.title}</h4>
                  <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{p.desc}</p>
                </div>
                <div className="pt-3 mt-2 border-t border-amber-100 flex items-center justify-between">
                  <span className="text-xs font-black text-neutral-900">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </span>
                  <button
                    type="button"
                    onClick={e => handleQuickAdd(e, p)}
                    className="p-1.5 rounded-full bg-[#F5B82A] text-neutral-900 hover:bg-[#BD1B1B] hover:text-white transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* BOTTOM SPLIT FEATURE BANNERS (Exact Match to еда3.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Card: Beige/Peach "Orde Fod The Buirgers" */}
          <div className="lg:col-span-7 bg-[#FDECD5] rounded-3xl p-8 sm:p-10 border border-amber-300/80 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-6 z-10 max-w-sm">
              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 leading-tight">
                Order For The Burgers.
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#BD1B1B] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900">30 Min Delivery</h4>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Доставляем в термосумках горячими прямо к вашему столу.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F5B82A] text-neutral-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-neutral-900">Always Fresh & Crispy</h4>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      Никаких заготовок: жарим бургеры и фри только после подтверждения заказа.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => scrollToMenu('burgers')}
                  className="px-6 py-3 rounded-full bg-[#BD1B1B] hover:bg-[#A31414] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Заказать</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Courier illustration / visual graphic */}
            <div className="w-48 sm:w-56 shrink-0 relative flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-amber-400/30 flex items-center justify-center border-4 border-amber-400/50 shadow-inner">
                <div className="text-center p-4">
                  <span className="text-5xl">🛵</span>
                  <div className="mt-2 text-xs font-black text-neutral-900 uppercase tracking-wider">
                    Express Rider
                  </div>
                  <span className="text-[10px] font-bold text-neutral-600">Free delivery 50k+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Rich Red "Sarcy Blarth" Cold Beverage Card */}
          <div className="lg:col-span-5 bg-[#BD1B1B] text-white rounded-3xl p-8 sm:p-10 shadow-md relative overflow-hidden flex flex-col justify-between text-center items-center">
            {/* Drink visual */}
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 border border-white/20">
              <span className="text-5xl">🍹</span>
            </div>

            <div className="space-y-2 mb-6">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Sarcy Blarth
              </h3>
              <p className="text-xs text-white/80 max-w-xs mx-auto leading-relaxed">
                Холодные крафтовые лимонады со льдом и натуральным соком цитрусовых. Идеально к бургеру!
              </p>
            </div>

            <button
              type="button"
              onClick={() => scrollToMenu('sides')}
              className="px-8 py-3 rounded-full bg-[#F5B82A] hover:bg-amber-300 text-neutral-950 text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Выбрать напиток
            </button>
          </div>
        </div>
      </section>

      {/* PDP MODAL (Full interactive customization) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-amber-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#BD1B1B]">
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-xl font-black text-neutral-900 mt-1 leading-snug">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">({selectedProduct.reviewsCount} отзывов)</span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>

                {/* Option selector */}
                {selectedProduct.options && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                      Формат:
                    </label>
                    <div className="space-y-1.5">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-black transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-[#BD1B1B] bg-red-50 text-[#BD1B1B]'
                              : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Burger add-ons */}
                {selectedProduct.category === 'burgers' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                      Добавки:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setExtraBacon(!extraBacon)}
                        className={`p-2 rounded-xl border font-bold cursor-pointer transition-all ${
                          extraBacon ? 'border-[#BD1B1B] bg-red-50 text-[#BD1B1B]' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {extraBacon ? '✓ Бекон (+12k)' : '+ Бекон (+12k)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExtraCheddar(!extraCheddar)}
                        className={`p-2 rounded-xl border font-bold cursor-pointer transition-all ${
                          extraCheddar ? 'border-[#BD1B1B] bg-red-50 text-[#BD1B1B]' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {extraCheddar ? '✓ Чеддер (+6k)' : '+ Чеддер (+6k)'}
                      </button>
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
                    <span className="w-7 text-center text-xs font-black">{pdpQuantity}</span>
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
                    className="flex-1 py-3 px-5 rounded-full bg-[#BD1B1B] hover:bg-[#A31414] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {(
                        (selectedProduct.price +
                          (selectedOptionIdx === 1 ? 22000 : 0) +
                          (extraBacon ? 12000 : 0) +
                          (extraCheddar ? 6000 : 0)) *
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
      <footer className="bg-neutral-950 text-white border-t border-neutral-800 mt-20 py-12 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#BD1B1B] text-white flex items-center justify-center font-black text-xs">
              M
            </span>
            <span className="text-lg font-black uppercase text-[#F5B82A]">Mokr Burger Craft</span>
          </div>
          <p className="text-neutral-500 text-[11px]">
            © 2026 Mokr Burger Craft. StoreBox Showcase Demo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
