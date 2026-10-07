import React, { useState, useMemo } from 'react';
import { ThemeProductItem } from '../RoboMarketPage';
import {
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Heart,
  Star,
  ChevronRight,
  ChevronLeft,
  Search,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  Leaf,
  User,
  Grid,
  MapPin,
  Tag,
  Percent,
  X
} from 'lucide-react';

interface BotniaStorefrontProps {
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

const BOTNIA_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'bot-1',
    title: 'Centella Madagascar Ampoule',
    subtitle: 'сыворотка для лица',
    category: 'skincare',
    price: 185000,
    oldPrice: 220000,
    image: '/images/flagships/botnia_mist.jpg',
    gallery: ['/images/flagships/botnia_mist.jpg'],
    rating: 4.8,
    reviewsCount: 120,
    badge: 'НОВИНКА',
    desc: 'Успокаивающая ампульная сыворотка со 100% экстрактом центеллы азиатской. Мгновенно снимает раздражения, покраснения и укрепляет защитный кожный барьер.',
    options: ['55 мл', '100 мл +45 000 UZS']
  },
  {
    id: 'bot-2',
    title: 'Gloss Transparent Lip Balm',
    subtitle: 'масло для губ',
    category: 'lips',
    price: 235000,
    oldPrice: 470000,
    image: '/images/flagships/theact_fragrance_hd.jpg',
    gallery: ['/images/flagships/theact_fragrance_hd.jpg'],
    rating: 4.9,
    reviewsCount: 96,
    badge: '-50%',
    desc: 'Глянцевое прозрачное масло-блеск с зеркальным эффектом и экстрактом ягод годжи. Не липнет, питает и разглаживает кожу губ.',
    options: ['8 мл туба с аппликатором']
  },
  {
    id: 'bot-3',
    title: 'Naturence Biotin Hair Complex',
    subtitle: 'витамины для волос',
    category: 'vitamins',
    price: 235000,
    oldPrice: 470000,
    image: '/images/flagships/theact_scrub_jar_hd.jpg',
    gallery: ['/images/flagships/theact_scrub_jar_hd.jpg'],
    rating: 4.8,
    reviewsCount: 65,
    badge: '-50%',
    desc: 'Высокоактивный биотин с цинком и экстрактом бамбука для стимуляции роста волос, укрепления ногтей и сияния кожи.',
    options: ['60 капсул (курс 1 месяц)', '120 капсул (курс 2 месяца) +95 000 UZS']
  },
  {
    id: 'bot-4',
    title: 'LVL UP Everyday Hydration Berry',
    subtitle: 'спортивное питание',
    category: 'supplements',
    price: 65000,
    oldPrice: 85000,
    image: '/images/flagships/theact_lotion_hd.jpg',
    gallery: ['/images/flagships/theact_lotion_hd.jpg'],
    rating: 4.9,
    reviewsCount: 45,
    badge: 'НОВИНКА',
    desc: 'Изотонический порошок с электролитами и экстрактом лесных ягод для быстрого восполнения гидробаланса после тренировок.',
    options: ['1 саше 25 г', 'Упаковка 10 саше +180 000 UZS']
  },
  {
    id: 'bot-5',
    title: 'Дезодорант-стик Crystal Natural',
    subtitle: 'товары для гигиены',
    category: 'hygiene',
    price: 60000,
    oldPrice: 75000,
    image: '/images/flagships/theact_other.jpg',
    gallery: ['/images/flagships/theact_other.jpg'],
    rating: 4.6,
    reviewsCount: 72,
    badge: 'ЭКО',
    desc: 'Натуральный минеральный кристаллический дезодорант без солей алюминия и парабенов. Защита от запаха на 24 часа.',
    options: ['60 г стик']
  },
  {
    id: 'bot-6',
    title: 'Estée Lauder Double Wear SPF 10',
    subtitle: 'тональные средства',
    category: 'makeup',
    price: 415000,
    oldPrice: 670000,
    image: '/images/flagships/rhode_serum.jpg',
    gallery: ['/images/flagships/rhode_serum.jpg'],
    rating: 4.9,
    reviewsCount: 310,
    badge: '-30%',
    desc: 'Легендарный стойкий тональный крем с безупречным матовым финишем. Держится 24 часа без смазывания и блеска.',
    options: ['1N1 Bone', '2C0 Cool Vanilla', '3N1 Ivory Beige']
  }
];

const CATEGORIES_GRID = [
  { id: 'skincare', title: 'Уходовая косметика', img: '/images/flagships/botnia_mist.jpg' },
  { id: 'vitamins', title: 'Витамины', img: '/images/flagships/theact_scrub_jar_hd.jpg' },
  { id: 'hair', title: 'Уход для волос', img: '/images/flagships/theact_clean_model_hd.jpg' },
  { id: 'hygiene', title: 'Товары для гигиены', img: '/images/flagships/theact_other.jpg' },
  { id: 'makeup', title: 'Декоративная косметика', img: '/images/flagships/theact_fragrance_hd.jpg' },
  { id: 'beauty', title: 'Красота', img: '/images/flagships/theact_lotion_hd.jpg' },
  { id: 'supplements', title: 'Пищевые добавки', img: '/images/flagships/theact_body.jpg' },
  { id: 'sport', title: 'Спортивное питание', img: '/images/flagships/rhode_serum.jpg' }
];

export const BotniaStorefront: React.FC<BotniaStorefrontProps> = ({
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
      showToast(next ? 'Добавлено в отложенные ❤️' : 'Удалено из отложенных');
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
    let list = BOTNIA_PRODUCTS;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchQuery]);

  const scrollToCatalog = (cat?: string) => {
    if (cat) setActiveCategory(cat);
    const el = document.getElementById('botnia-catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#F8F9FA] text-[#1E1E1E] min-h-screen font-sans selection:bg-[#E91E63] selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-neutral-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-neutral-700">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP ANNOUNCEMENT BAR (Exact match to косметика4.png) */}
      <div className="bg-[#6B7280] text-white py-1.5 px-4 text-xs font-medium border-b border-neutral-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="hover:underline cursor-pointer">
              % Скидка 20% на первый заказ ›
            </span>
            <span className="hidden sm:inline text-neutral-300">|</span>
            <span className="hidden sm:inline hover:underline cursor-pointer">
              Бесплатная доставка на заказы от 1 000 ₽ ›
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="cursor-pointer">🇷🇺 РУ ▾</span>
            <span className="flex items-center gap-1 cursor-pointer">
              <MapPin className="w-3 h-3 text-pink-300" />
              <span>Укажите Ваш город ▾</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN HEADER WITH SEARCH & ACTIONS (Exact Match to косметика4.png) */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Logo */}
          <div
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="cursor-pointer font-serif tracking-widest text-2xl font-bold uppercase text-neutral-900"
          >
            BOTNIA
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Поиск по 10 000+ товарам красоты и здоровья..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-full border border-neutral-300 bg-neutral-50 text-xs focus:outline-hidden focus:border-pink-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-5 text-xs text-neutral-700">
            <button type="button" className="hidden lg:flex items-center gap-1 hover:text-black cursor-pointer">
              <User className="w-4 h-4" />
              <span>Войти</span>
            </button>
            <button
              type="button"
              onClick={() => showToast('Отложенные товары')}
              className="flex items-center gap-1 hover:text-black cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Отложенные</span>
            </button>
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-1 hover:text-black cursor-pointer relative font-bold"
            >
              <ShoppingBag className="w-4 h-4 text-pink-600" />
              <span>Корзина ({cartCount})</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToCatalog('all')}
              className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Каталог</span>
            </button>
          </div>
        </div>

        {/* Category Nav Strip (Exact match to косметика4.png) */}
        <div className="max-w-7xl mx-auto pt-3 flex items-center gap-5 overflow-x-auto no-scrollbar text-xs font-medium text-neutral-600">
          <button
            type="button"
            onClick={() => scrollToCatalog('skincare')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Уходовая косметика
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('makeup')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Декоративная косметика
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('supplements')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Пищевые добавки
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('beauty')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Красота
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('hair')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Уход для волос
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('vitamins')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Витамины
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('sport')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Спортивное питание
          </button>
          <button
            type="button"
            onClick={() => scrollToCatalog('hygiene')}
            className="hover:text-black whitespace-nowrap cursor-pointer"
          >
            Товары для гигиены
          </button>
          <span className="text-pink-600 font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer">
            <Tag className="w-3 h-3" />
            <span>Новинки</span>
          </span>
          <span className="text-red-600 font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer">
            <Percent className="w-3 h-3" />
            <span>Скидки до 50%</span>
          </span>
        </div>
      </header>

      {/* HERO BANNER: "BOTNIA full-size в подарок от 15 000 ₽" (Exact match to косметика4.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <div className="bg-[#EAE4DC] rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Left Text & Packshot */}
          <div className="space-y-6 z-10 max-w-lg">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-serif tracking-wider uppercase text-neutral-900 font-normal">
                BOTNIA
              </h1>
              <div className="text-2xl sm:text-3xl text-pink-600 font-serif italic">
                full-size в подарок
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 font-medium">
                при покупке органической косметики от 15 000 ₽
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => scrollToCatalog('all')}
                className="px-8 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>В каталог</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Freckled Model & Volcanic stone packshot visual */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg border-2 border-white/60 bg-white">
              <img
                src="/images/flagships/botnia_mist.jpg"
                alt="Botnia Packshot"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="w-48 h-56 sm:w-64 sm:h-72 rounded-2xl overflow-hidden shadow-xl border-2 border-white/60 bg-white">
              <img
                src="/images/flagships/theact_clean_model_hd.jpg"
                alt="Model Face"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Carousel indicator dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <span className="w-2 h-2 rounded-full bg-neutral-800" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
        </div>
      </section>

      {/* 8-TILE CATEGORY GRID (Exact Match to косметика4.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES_GRID.map(cat => (
            <div
              key={cat.id}
              onClick={() => scrollToCatalog(cat.id)}
              className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <h3 className="text-xs font-bold text-neutral-900 group-hover:text-pink-600 transition-colors">
                  {cat.title}
                </h3>
                <span className="text-[10px] text-neutral-400 mt-1 block">перейти ›</span>
              </div>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-50 shrink-0">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* "АКЦИИ И НОВИНКИ" CAROUSEL / GRID (Exact Match to косметика4.png) */}
      <section id="botnia-catalog" className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Акции и новинки
            </h2>
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className="text-xs text-neutral-500 hover:text-black cursor-pointer underline"
            >
              смотреть все
            </button>
          </div>

          <div className="flex items-center gap-1.5">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredProducts.map(p => {
            const isFav = !!favorites[p.id];
            return (
              <div
                key={p.id}
                onClick={() => openPdpModal(p)}
                className="bg-white rounded-2xl p-3 border border-neutral-200 flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {p.badge && (
                      <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded-sm">
                        {p.badge}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={e => toggleFavorite(e, p.id)}
                      className="p-1 text-neutral-300 hover:text-red-500 transition-colors ml-auto"
                      aria-label="В отложенные"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  <div className="aspect-square bg-neutral-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center p-2">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <span className="text-[9px] text-neutral-400 block truncate">
                    {p.subtitle || p.category}
                  </span>
                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 mt-0.5 leading-snug">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{p.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">({p.reviewsCount})</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      {p.price.toLocaleString('ru-RU')} UZS
                    </span>
                    {p.oldPrice && (
                      <span className="text-[10px] text-neutral-400 line-through">
                        {p.oldPrice.toLocaleString('ru-RU')} UZS
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={e => handleQuickAdd(e, p)}
                    className="p-1.5 rounded-lg bg-neutral-900 hover:bg-pink-600 text-white transition-colors cursor-pointer"
                    aria-label="В корзину"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* "БЕСТСЕЛЛЕРЫ" ROW (Exact Match to косметика4.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-200">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Бестселлеры
          </h2>
          <div className="flex items-center gap-1.5">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...BOTNIA_PRODUCTS].reverse().map(p => (
            <div
              key={`best-${p.id}`}
              onClick={() => openPdpModal(p)}
              className="bg-white rounded-2xl p-3 border border-neutral-200 flex flex-col justify-between group cursor-pointer hover:shadow-lg transition-all"
            >
              <div>
                <div className="aspect-square bg-neutral-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center p-2">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>
                <span className="text-[9px] text-neutral-400 block truncate">
                  {p.subtitle || p.category}
                </span>
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-2 mt-0.5 leading-snug">
                  {p.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900">
                  {p.price.toLocaleString('ru-RU')} UZS
                </span>
                <button
                  type="button"
                  onClick={e => handleQuickAdd(e, p)}
                  className="p-1.5 rounded-lg bg-neutral-100 hover:bg-pink-600 hover:text-white text-neutral-800 transition-colors cursor-pointer"
                  aria-label="В корзину"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROMO CODE BANNER (Exact Match: Pink gradient, email form & phone mockup with "ВВЕДИТЕ ПРОМОКОД →") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-gradient-to-r from-[#FBCFE8] via-[#F472B6] to-[#DB2777] rounded-3xl p-8 sm:p-12 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-4 max-w-md z-10">
            <h3 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 leading-tight">
              Дарим промокод <br />
              на скидку 20%
            </h3>
            <p className="text-xs sm:text-sm text-neutral-800 font-medium">
              Укажите свою почту и мы мгновенно отправим промокод на первый заказ
            </p>
            <form
              onSubmit={e => { e.preventDefault(); showToast('Промокод BOTNIA20 отправлен на ваш email!'); }}
              className="flex gap-2 pt-2"
            >
              <input
                type="email"
                placeholder="Введите почту"
                required
                className="px-4 py-2.5 rounded-full bg-white text-neutral-900 text-xs w-full focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold whitespace-nowrap cursor-pointer shadow-md"
              >
                Отправить
              </button>
            </form>
          </div>

          {/* Phone Mockup with badge */}
          <div className="relative z-10">
            <div className="w-48 sm:w-56 h-36 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center p-4 shadow-xl">
              <span className="px-5 py-2.5 rounded-full bg-white text-neutral-900 text-xs font-black uppercase tracking-wider shadow-lg hover:scale-105 transition-transform cursor-pointer">
                ВВЕДИТЕ ПРОМОКОД →
              </span>
            </div>
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
                  <span className="text-[10px] font-bold uppercase text-pink-600">
                    {selectedProduct.subtitle || selectedProduct.category}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-900 mt-0.5">
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

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>

                {selectedProduct.options && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-700">
                      Объем / комплектация:
                    </label>
                    <div className="space-y-1">
                      {selectedProduct.options.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedOptionIdx(i)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                            selectedOptionIdx === i
                              ? 'border-pink-600 bg-pink-50 text-pink-700'
                              : 'border-neutral-200 text-neutral-800'
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
                    className="flex-1 py-3 px-5 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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

      {/* FOOTER (Exact Match to косметика4.png) */}
      <footer className="bg-neutral-900 text-white mt-20 pt-16 pb-12 px-4 sm:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-neutral-800">
          <div className="space-y-4">
            <span className="text-2xl font-serif tracking-widest uppercase">BOTNIA</span>
            <div className="text-base font-bold text-neutral-200">8 812 345 67 89</div>
            <p className="text-neutral-400 text-[11px]">Круглосуточная поддержка покупателей</p>
            <div className="text-neutral-400">info@botniastore.com</div>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3 text-neutral-200">Каталог</h4>
            <ul className="space-y-2 text-neutral-400 text-[11px]">
              <li>Уходовая косметика</li>
              <li>Декоративная косметика</li>
              <li>Пищевые добавки</li>
              <li>Красота и уход для волос</li>
              <li>Витамины</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3 text-neutral-200">О нас</h4>
            <ul className="space-y-2 text-neutral-400 text-[11px]">
              <li>О компании</li>
              <li>Блог экспертов</li>
              <li>Контакты и адреса</li>
              <li>Вакансии</li>
              <li>Акции и сертификаты</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold uppercase tracking-wider mb-3 text-neutral-200">Клиентам</h4>
            <ul className="space-y-2 text-neutral-400 text-[11px]">
              <li>FAQ (Частые вопросы)</li>
              <li>Как сделать заказ</li>
              <li>Оплата и безопасная доставка</li>
              <li>Возврат товара</li>
              <li>Подарочные карты</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
          <div>© 2026 BOTNIA Beauty & Wellness. Все права защищены.</div>
          <div>Договор оферты · Конфиденциальность</div>
        </div>
      </footer>
    </div>
  );
};
