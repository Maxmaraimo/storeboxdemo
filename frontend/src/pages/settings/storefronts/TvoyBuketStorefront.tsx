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
  ChevronDown,
  Search,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  Check,
  User,
  X,
  Play
} from 'lucide-react';

interface TvoyBuketStorefrontProps {
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

const TVOYBUKET_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'tb-1',
    title: 'Букет 25 роз, розовый микс',
    category: 'roses',
    price: 385000,
    oldPrice: 450000,
    image: '/images/flagships/flora_bouquet.jpg',
    gallery: ['/images/flagships/flora_bouquet.jpg'],
    rating: 5.0,
    reviewsCount: 310,
    badge: 'Хит продаж',
    desc: 'Нежнейшие эквадорские розы розовых оттенков в матовой дизайнерской бумаге.'
  },
  {
    id: 'tb-2',
    title: 'Букет 25 роз, Шепот сердца',
    category: 'roses',
    price: 385000,
    oldPrice: 450000,
    image: '/images/flagships/tvoybuket_roses.jpg',
    gallery: ['/images/flagships/tvoybuket_roses.jpg'],
    rating: 5.0,
    reviewsCount: 480,
    badge: 'Хит продаж',
    desc: 'Классический конусный букет из 25 алых роз с кружевными лепестками в крафте.'
  },
  {
    id: 'tb-3',
    title: 'Букет 25 тюльпанов микс',
    category: 'tulips',
    price: 385000,
    oldPrice: 495000,
    image: '/images/flagships/flora_bouquet.jpg',
    gallery: ['/images/flagships/flora_bouquet.jpg'],
    rating: 4.8,
    reviewsCount: 190,
    badge: '%',
    desc: 'Разноцветные голландские тюльпаны первого весеннего среза.'
  },
  {
    id: 'tb-4',
    title: 'Букет с гиацинтами и мускари',
    category: 'hyacinths',
    price: 165000,
    oldPrice: 190000,
    image: '/images/flagships/maison_peonies_hd.jpg',
    gallery: ['/images/flagships/maison_peonies_hd.jpg'],
    rating: 4.9,
    reviewsCount: 85,
    badge: 'N',
    desc: 'Ароматный весенний букет в нежной розовой тишью.'
  },
  {
    id: 'tb-5',
    title: 'Букет с гиацинтами Одиссея',
    category: 'hyacinths',
    price: 375000,
    oldPrice: 420000,
    image: '/images/flagships/maison_peonies_hd.jpg',
    gallery: ['/images/flagships/maison_peonies_hd.jpg'],
    rating: 4.9,
    reviewsCount: 110,
    desc: 'Сиреневые и лавандовые гиацинты с эвкалиптом и белой лентой.'
  },
  {
    id: 'tb-6',
    title: 'Букет 15 тюльпанов красные',
    category: 'tulips',
    price: 125000,
    oldPrice: 150000,
    image: '/images/flagships/tvoybuket_roses.jpg',
    gallery: ['/images/flagships/tvoybuket_roses.jpg'],
    rating: 4.8,
    reviewsCount: 220,
    desc: 'Ярко-красные бутоны в классической крафтовой упаковке.'
  },
  {
    id: 'tb-7',
    title: 'Букет 101 тюльпан белые',
    category: 'tulips',
    price: 825000,
    oldPrice: 950000,
    image: '/images/flagships/maison_peonies_hd.jpg',
    gallery: ['/images/flagships/maison_peonies_hd.jpg'],
    rating: 5.0,
    reviewsCount: 95,
    desc: 'Огромная охапка из 101 белоснежного тюльпана с атласным бантом.'
  },
  {
    id: 'tb-8',
    title: 'Букет Неженка пионовидный',
    category: 'roses',
    price: 195000,
    oldPrice: 230000,
    image: '/images/flagships/flora_bouquet.jpg',
    gallery: ['/images/flagships/flora_bouquet.jpg'],
    rating: 4.9,
    reviewsCount: 160,
    desc: 'Кустовые пионовидные розы пудрового оттенка в подарочной упаковке.'
  },
  {
    id: 'tb-9',
    title: 'Букет 51 королевский тюльпан',
    category: 'tulips',
    price: 345000,
    oldPrice: 390000,
    image: '/images/flagships/tvoybuket_roses.jpg',
    gallery: ['/images/flagships/tvoybuket_roses.jpg'],
    rating: 5.0,
    reviewsCount: 270,
    desc: 'Двухцветные тюльпаны сорта Strong Gold & Red с плотными лепестками.'
  }
];

export const TvoyBuketStorefront: React.FC<TvoyBuketStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchFlower, setSearchFlower] = useState('');
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
      showToast(next ? 'Добавлено в избранное ❤️' : 'Удалено из избранного');
      return { ...prev, [id]: next };
    });
  };

  const openPdpModal = (product: ThemeProductItem) => {
    setSelectedProduct(product);
    setPdpQuantity(1);
  };

  const handlePdpAddToCart = () => {
    if (!selectedProduct) return;
    onAddToCart(selectedProduct, pdpQuantity, 'Фирменный букет');
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, 'Фирменный букет');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const filteredProducts = useMemo(() => {
    let list = TVOYBUKET_PRODUCTS;
    if (activeCategory !== 'all') {
      list = list.filter(p => p.category === activeCategory);
    }
    if (searchFlower.trim()) {
      const q = searchFlower.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
    }
    return list;
  }, [activeCategory, searchFlower]);

  return (
    <div className="bg-[#FFFFFF] text-[#1E1E1E] min-h-screen font-sans selection:bg-rose-500 selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-neutral-900 text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-rose-300">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER (Exact match to цветы3.png: Каталог, О компании, Контакты, Твой Букет, Search, User, Wishlist, Cart) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-6 sm:px-12 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="hidden md:flex items-center gap-6 text-xs text-neutral-600 font-medium">
            <span className="hover:text-black cursor-pointer">Каталог ▾</span>
            <span className="hover:text-black cursor-pointer">О компании ▾</span>
            <span className="hover:text-black cursor-pointer">Контакты ▾</span>
          </nav>

          {/* Center Logo */}
          <div
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-sm font-semibold text-neutral-700">Твой</span>
            <span className="text-xl">💐</span>
            <span className="text-base font-bold text-neutral-900">Букет</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-700">
            <button
              type="button"
              className="p-1 hover:text-black cursor-pointer"
              aria-label="Поиск"
            >
              <Search className="w-4 h-4" />
            </button>
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
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION: "21 КРАСНАЯ РОЗА ЭЛЬ ТОПО" with Circular Pink Spotlight (Exact Match to цветы3.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Title & Links */}
          <div className="lg:col-span-4 space-y-6">
            <h1 className="text-3xl sm:text-5xl font-serif text-neutral-900 leading-tight uppercase tracking-tight">
              21 КРАСНАЯ <br />
              РОЗА ЭЛЬ <br />
              ТОПО
            </h1>
            <div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('tvoy-catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-xs uppercase tracking-wider text-rose-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>ПЕРЕЙТИ В АКЦИИ</span>
                <span>›</span>
              </button>
            </div>

            {/* Carousel navigation buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                aria-label="Назад"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:border-black cursor-pointer"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Вперед"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-500 hover:border-black cursor-pointer"
              >
                →
              </button>
            </div>
          </div>

          {/* Center Giant Circular Pink Spotlight Bouquet */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            {/* Soft pink circular spotlight background */}
            <div className="w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-[#FCECEF] flex items-center justify-center relative shadow-inner">
              <img
                src="/images/flagships/tvoybuket_roses.jpg"
                alt="21 Красная роза Эль Торо"
                className="w-72 sm:w-84 h-72 sm:h-84 object-contain filter drop-shadow-2xl"
              />
              {/* Floating Price Tag */}
              <div className="absolute top-8 right-6 bg-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md border border-neutral-100">
                8 000 ₽
              </div>
            </div>
          </div>

          {/* Right Smaller Circular Thumbnails */}
          <div className="lg:col-span-3 flex lg:flex-col justify-center items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#FDF5E6] p-2 flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-transform">
              <img src="/images/flagships/flora_bouquet.jpg" alt="Thumb 1" className="w-full h-full object-contain" />
            </div>
            <div className="w-24 h-24 rounded-full bg-[#F5EEF8] p-2 flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-transform">
              <img src="/images/flagships/maison_peonies_hd.jpg" alt="Thumb 2" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* "ВЫБЕРИ СВОЙ БУКЕТ ЦВЕТОВ" CATALOG SECTION (Exact Match to цветы3.png) */}
      <section id="tvoy-catalog" className="max-w-7xl mx-auto px-6 sm:px-12 py-12 border-t border-neutral-200">
        <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 mb-8">
          Выбери свой букет цветов
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR FILTERS */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 text-xs">
              <span className="font-bold text-neutral-900">Фильтр</span>
              <button
                type="button"
                onClick={() => { setActiveCategory('all'); setSearchFlower(''); }}
                className="text-neutral-400 hover:text-black cursor-pointer"
              >
                ✕ Скрыть фильтр
              </button>
            </div>

            {/* Price filter */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-neutral-800">Цена:</span>
              <div className="flex items-center gap-2">
                <input type="text" defaultValue="200 ₽" className="w-20 p-1.5 border border-neutral-300 rounded-md text-xs text-center" />
                <span>—</span>
                <input type="text" defaultValue="10 000 ₽" className="w-24 p-1.5 border border-neutral-300 rounded-md text-xs text-center" />
              </div>
              <div className="space-y-1 text-neutral-600 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="price" />
                  <span>До 600 ₽</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="price" />
                  <span>600-2 000 ₽</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="price" />
                  <span>2 000-5 000 ₽</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="price" defaultChecked />
                  <span>5 000-10 000 ₽</span>
                </label>
              </div>
            </div>

            {/* Flower type checkboxes */}
            <div className="space-y-2 text-xs pt-3 border-t border-neutral-200">
              <span className="font-bold text-neutral-800">Цветы:</span>
              <input
                type="text"
                placeholder="Быстрый поиск..."
                value={searchFlower}
                onChange={e => setSearchFlower(e.target.value)}
                className="w-full p-1.5 border border-neutral-300 rounded-md text-xs"
              />
              <div className="space-y-1 text-neutral-600 pt-1">
                {[
                  { name: 'Розы', cat: 'roses' },
                  { name: 'Тюльпаны', cat: 'tulips' },
                  { name: 'Хризантемы', cat: 'all' },
                  { name: 'Герберы', cat: 'all' },
                  { name: 'Пионы', cat: 'all' },
                  { name: 'Гиацинты', cat: 'hyacinths' },
                  { name: 'Эустома', cat: 'all' }
                ].map(item => (
                  <label
                    key={item.name}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setActiveCategory(item.cat)}
                  >
                    <input type="checkbox" checked={activeCategory === item.cat} readOnly />
                    <span>{item.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Accordions */}
            <div className="space-y-2 text-xs pt-3 border-t border-neutral-200 text-neutral-700">
              {['Цвет', 'Количество', 'Высота', 'Кому', 'Повод'].map(tag => (
                <div key={tag} className="flex items-center justify-between py-1 cursor-pointer hover:text-black">
                  <span>{tag}:</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                </div>
              ))}
            </div>
          </aside>

          {/* RIGHT 3x3 GRID (9 Circular Spotlight Bouquet Cards) */}
          <main className="lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {filteredProducts.map(p => {
                const isFav = !!favorites[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => openPdpModal(p)}
                    className="flex flex-col items-center text-center group cursor-pointer"
                  >
                    {/* Pink circular spotlight background */}
                    <div className="w-56 h-56 rounded-full bg-[#FCECEF] relative flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300">
                      {p.badge && (
                        <span className="absolute top-3 left-4 text-[10px] text-rose-500 font-bold bg-white/80 px-2 py-0.5 rounded-full">
                          {p.badge}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={e => toggleFavorite(e, p.id)}
                        className="absolute top-3 right-4 p-1 text-neutral-400 hover:text-red-500"
                        aria-label="В избранное"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      <div className="w-48 h-48 flex items-center justify-center p-2">
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-contain filter drop-shadow-md"
                        />
                      </div>
                    </div>

                    <h4 className="text-xs font-medium text-neutral-800 line-clamp-1 max-w-[200px]">
                      {p.title}
                    </h4>
                    <div className="text-sm font-bold text-neutral-900 mt-1">
                      {p.price.toLocaleString('ru-RU')} UZS
                    </div>

                    {/* Quick quantity & "В КОРЗИНУ" button */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center border border-neutral-300 rounded-full px-2 py-0.5 text-xs text-neutral-600">
                        <span>-</span>
                        <span className="mx-2 font-bold">1</span>
                        <span>+</span>
                      </div>
                      <button
                        type="button"
                        onClick={e => handleQuickAdd(e, p)}
                        className="px-4 py-1.5 rounded-full border border-neutral-300 hover:border-black text-[11px] font-bold text-neutral-800 hover:bg-black hover:text-white transition-colors cursor-pointer uppercase"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center pt-12">
              <button
                type="button"
                className="px-8 py-3 rounded-full border border-neutral-300 hover:border-black text-xs font-bold uppercase tracking-wider text-neutral-800 transition-colors cursor-pointer"
              >
                ПОКАЗАТЬ ЕЩЕ
              </button>
            </div>
          </main>
        </div>
      </section>

      {/* EMOTIONAL CUSTOMER REVIEWS SECTION (Exact Match to цветы3.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-16 border-t border-neutral-200">
        <h2 className="text-2xl sm:text-3xl font-serif text-center text-neutral-900 mb-12">
          Когда эмоции переполняют, <br />
          о нас начинают говорить
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Review text */}
          <div className="lg:col-span-4 bg-[#F9F9FA] rounded-2xl p-6 border border-neutral-200 space-y-3">
            <p className="text-xs text-neutral-600 leading-relaxed font-light">
              «Самая лучшая компания по изысканным букетам, с большим удовольствием рекомендую вас своим друзьям, у вас очень красивые композиции. Есть огромный выбор букетов как и по ценовой категории, так же и по случаям, и кому. Также очень удобная доставка и оплата.»
            </p>
            <span className="text-[10px] text-neutral-400 block pt-2">08 Августа 2026</span>
          </div>

          {/* Center customer with tulip bouquet and video play icon */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-[#FCECEF] shadow-lg flex items-center justify-center group cursor-pointer">
              <img
                src="/images/flagships/theact_clean_model_hd.jpg"
                alt="Наталья с букетом"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute w-12 h-12 rounded-full bg-white/90 text-rose-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-rose-600 ml-0.5" />
              </div>
            </div>
          </div>

          {/* Author info & controls */}
          <div className="lg:col-span-4 space-y-3 lg:pl-6">
            <h3 className="text-lg font-serif text-neutral-900">Наталья</h3>
            <p className="text-xs text-neutral-500">Букет 51 розовый тюльпан</p>
            <div className="flex items-center gap-1 text-xs font-bold text-rose-500">
              <Star className="w-4 h-4 fill-rose-500" />
              <span>4,5</span>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="button"
                aria-label="Назад"
                className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 hover:border-black cursor-pointer"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Вперед"
                className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 shadow-xs cursor-pointer"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail gallery of happy customers */}
        <div className="flex items-center justify-center gap-4 mt-12 overflow-x-auto no-scrollbar py-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-200 shrink-0 shadow-xs cursor-pointer hover:border-rose-400 transition-colors"
            >
              <img
                src="/images/flagships/theact_clean_model_hd.jpg"
                alt={`Client ${i}`}
                className="w-full h-full object-cover"
              />
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
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-pink-50/50 p-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-rose-600">
                    Твой Букет
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 mt-0.5">
                    {selectedProduct.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-neutral-800">
                    <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>{selectedProduct.rating.toFixed(1)}</span>
                    <span className="text-neutral-400 font-normal">
                      ({selectedProduct.reviewsCount} отзывов)
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 leading-relaxed">
                  {selectedProduct.desc}
                </p>

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
                    className="flex-1 py-3 px-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
      <footer className="bg-white border-t border-neutral-200 mt-20 py-10 px-6 sm:px-12 text-center text-xs text-neutral-500">
        <div className="font-serif text-lg text-neutral-900 mb-1">Твой Букет</div>
        <div>© 2026 Сеть цветочных салонов «Твой Букет». StoreBox Showcase Demo.</div>
      </footer>
    </div>
  );
};
