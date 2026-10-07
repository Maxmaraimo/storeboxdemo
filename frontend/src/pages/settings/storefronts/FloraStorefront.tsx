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
  User,
  X,
  Menu
} from 'lucide-react';

interface FloraStorefrontProps {
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

const FLORA_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'fl-1',
    title: 'Box Roses Crimson Velvet',
    category: 'arrangements',
    price: 650000,
    oldPrice: 750000,
    image: '/images/flagships/tvoybuket_roses.jpg',
    gallery: ['/images/flagships/tvoybuket_roses.jpg'],
    rating: 5.0,
    reviewsCount: 140,
    badge: 'Sale!',
    desc: 'Круглая черная шляпная коробка с 25 отборными бархатными розами. Идеальная геометрия и максимальная стойкость.'
  },
  {
    id: 'fl-2',
    title: 'Box Rose Arrangement Royal',
    category: 'arrangements',
    price: 890000,
    oldPrice: 1100000,
    image: '/images/flagships/flora_bouquet.jpg',
    gallery: ['/images/flagships/flora_bouquet.jpg'],
    rating: 4.9,
    reviewsCount: 220,
    badge: 'Sale!',
    desc: 'Премиальная коробка с эквадорскими розами, нежными пионами и эвкалиптом в авторском флористическом оформлении.'
  },
  {
    id: 'fl-3',
    title: 'Colorful Tulip Spring Bouquet',
    category: 'bouquets',
    price: 420000,
    oldPrice: 480000,
    image: '/images/flagships/flora_bouquet.jpg',
    gallery: ['/images/flagships/flora_bouquet.jpg'],
    rating: 4.8,
    reviewsCount: 190,
    badge: 'Sale!',
    desc: 'Свежайшие голландские тюльпаны ярких весенних оттенков с сочной хрустящей зеленью.'
  },
  {
    id: 'fl-4',
    title: 'White Orchids & Peonies Vase',
    category: 'orchid',
    price: 780000,
    oldPrice: 920000,
    image: '/images/flagships/maison_peonies_hd.jpg',
    gallery: ['/images/flagships/maison_peonies_hd.jpg'],
    rating: 5.0,
    reviewsCount: 110,
    badge: 'Luxe',
    desc: 'Белоснежная композиция в дизайнерской керамической вазе: пионы, орхидеи фаленопсис и эустома.'
  }
];

export const FloraStorefront: React.FC<FloraStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [pdpQuantity, setPdpQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openPdpModal = (product: ThemeProductItem) => {
    setSelectedProduct(product);
    setPdpQuantity(1);
  };

  const handlePdpAddToCart = () => {
    if (!selectedProduct) return;
    onAddToCart(selectedProduct, pdpQuantity, 'Стандартный букет');
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, 'Стандартный букет');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  const filteredProducts = useMemo(() => {
    let list = FLORA_PRODUCTS;
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
    <div className="bg-[#FAF7F6] text-[#222222] min-h-screen font-sans selection:bg-[#E91E63] selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#E91E63] text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-pink-300">
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER (Exact match to цветы2.png: Pink Tulip in circle + Flora, Nav, Pink search, Pink cart, Menu) */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-6 sm:px-12 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full border border-pink-200 flex items-center justify-center text-base bg-pink-50">
              🌷
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-900">
              Flora
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-neutral-700">
            <button
              type="button"
              onClick={() => { setActiveCategory('all'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="hover:text-[#E91E63] cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('bouquets');
                const el = document.getElementById('flora-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#E91E63] cursor-pointer"
            >
              Bouquets
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('arrangements');
                const el = document.getElementById('flora-catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#E91E63] cursor-pointer"
            >
              Arrangements
            </button>
            <button
              type="button"
              className="hover:text-[#E91E63] cursor-pointer"
            >
              Plants
            </button>
            <button
              type="button"
              className="hover:text-[#E91E63] cursor-pointer"
            >
              Orchid
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#E91E63] text-white flex items-center justify-center hover:bg-pink-700 transition-colors cursor-pointer"
              aria-label="Поиск"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              className="relative w-8 h-8 rounded-full bg-[#E91E63] text-white flex items-center justify-center hover:bg-pink-700 transition-colors cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neutral-900 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className="p-1 text-neutral-600 hover:text-black cursor-pointer"
              aria-label="Меню"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO PASTEL BANNER: "Special Smells Special Bouquets" (Exact Match to цветы2.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-[#FDEBF1] rounded-[36px] p-8 sm:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          {/* Carousel arrows */}
          <button
            type="button"
            aria-label="Назад"
            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E91E63] text-white flex items-center justify-center z-10 shadow-md cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Вперед"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E91E63] text-white flex items-center justify-center z-10 shadow-md cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="space-y-4 max-w-md z-10 md:pl-8">
            <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 leading-[1.1] tracking-tight">
              Special Smells <br />
              Special Bouquets
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 font-medium">
              Discover our top-rated flowers and bespoke arrangements!
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('flora-catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 rounded-full bg-[#E91E63] hover:bg-pink-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md inline-flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Start buying now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Fresh Tulip Stems */}
          <div className="w-64 sm:w-80 h-72 sm:h-96 shrink-0 relative flex items-center justify-center">
            <img
              src="/images/flagships/flora_bouquet.jpg"
              alt="Tulips Bouquet"
              className="w-full h-full object-contain filter drop-shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* 4 BESTSELLERS WHITE SHADOWED CARDS ROW (Exact match to цветы2.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => openPdpModal(p)}
              className="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer group"
            >
              <div className="w-36 h-36 rounded-2xl overflow-hidden mb-4 p-2 flex items-center justify-center">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
              </div>

              <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.title}</h4>
              <div className="text-xs font-bold text-neutral-900 mt-1">
                {p.price.toLocaleString('ru-RU')} UZS
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 ARCHED PINK CATEGORY BANNERS (Exact match to цветы2.png) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Private Events */}
          <div
            onClick={() => setActiveCategory('arrangements')}
            className="bg-[#FCEBF1] rounded-3xl p-6 flex flex-col items-center text-center justify-between min-h-[300px] shadow-sm cursor-pointer group hover:shadow-md transition-all"
          >
            <div className="w-36 h-36 rounded-full overflow-hidden p-2">
              <img src="/images/flagships/flora_bouquet.jpg" alt="Events" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] text-pink-600 font-bold">10% Discount Offer</span>
              <h3 className="text-lg font-bold text-neutral-900 mt-0.5">Private Events</h3>
            </div>
            <button
              type="button"
              className="mt-3 px-5 py-2 rounded-full bg-[#E91E63] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-pink-700 transition-colors"
            >
              Shop Now →
            </button>
          </div>

          {/* Card 2: Flora */}
          <div
            onClick={() => setActiveCategory('bouquets')}
            className="bg-[#FCEBF1] rounded-3xl p-6 flex flex-col items-center text-center justify-between min-h-[300px] shadow-sm cursor-pointer group hover:shadow-md transition-all"
          >
            <div className="w-36 h-36 rounded-full overflow-hidden p-2">
              <img src="/images/flagships/tvoybuket_roses.jpg" alt="Flora" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] text-pink-600 font-bold">10% Discount Offer</span>
              <h3 className="text-lg font-bold text-neutral-900 mt-0.5">Flora Seasonal</h3>
            </div>
            <button
              type="button"
              className="mt-3 px-5 py-2 rounded-full bg-[#E91E63] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-pink-700 transition-colors"
            >
              Shop Now →
            </button>
          </div>

          {/* Card 3: Weddings */}
          <div
            onClick={() => setActiveCategory('arrangements')}
            className="bg-[#FCEBF1] rounded-3xl p-6 flex flex-col items-center text-center justify-between min-h-[300px] shadow-sm cursor-pointer group hover:shadow-md transition-all"
          >
            <div className="w-36 h-36 rounded-full overflow-hidden p-2">
              <img src="/images/flagships/maison_peonies_hd.jpg" alt="Weddings" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-[10px] text-pink-600 font-bold">10% Discount Offer</span>
              <h3 className="text-lg font-bold text-neutral-900 mt-0.5">Weddings & Bridal</h3>
            </div>
            <button
              type="button"
              className="mt-3 px-5 py-2 rounded-full bg-[#E91E63] text-white text-xs font-bold uppercase tracking-wider group-hover:bg-pink-700 transition-colors"
            >
              Shop Now →
            </button>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION WITH STACKED PINK ACTION BUTTONS (Exact match to цветы2.png) */}
      <section id="flora-catalog" className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        <div className="flex items-center justify-between mb-8 pb-3 border-b border-neutral-200">
          <span className="text-xs text-neutral-500 font-medium">
            Showing all {filteredProducts.length} results
          </span>
          <select className="bg-white border border-neutral-300 rounded-lg text-xs px-3 py-1.5 focus:outline-hidden">
            <option>Default sorting</option>
            <option>Sort by price: low to high</option>
            <option>Sort by price: high to low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div
              key={p.id}
              onClick={() => openPdpModal(p)}
              className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer text-center relative"
            >
              <div>
                <span className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#E91E63] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  Sale!
                </span>

                <div className="aspect-square bg-transparent rounded-2xl flex items-center justify-center p-2 mb-3">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                  />
                </div>

                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{p.title}</h4>
                <div className="text-xs font-bold text-neutral-900 mt-1">
                  {p.price.toLocaleString('ru-RU')} UZS
                </div>
              </div>

              {/* Stacked Pink Buttons (Exact match: Select Options, Quick View, Compare) */}
              <div className="mt-4 space-y-1.5">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); openPdpModal(p); }}
                  className="w-full py-1.5 rounded-full bg-[#E91E63] hover:bg-pink-700 text-white text-[10px] font-bold uppercase transition-colors"
                >
                  Select Options
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); openPdpModal(p); }}
                  className="w-full py-1.5 rounded-full bg-[#E91E63] hover:bg-pink-700 text-white text-[10px] font-bold uppercase transition-colors"
                >
                  Quick View
                </button>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleQuickAdd(e, p); }}
                  className="w-full py-1.5 rounded-full bg-[#E91E63] hover:bg-pink-700 text-white text-[10px] font-bold uppercase transition-colors"
                >
                  Add To Cart
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
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-pink-50/50 p-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#E91E63]">
                    Flora Bouquets
                  </span>
                  <h3 className="text-xl font-bold text-neutral-900 mt-0.5">
                    {selectedProduct.title}
                  </h3>
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
                    className="flex-1 py-3 px-5 rounded-full bg-[#E91E63] hover:bg-pink-700 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
        <div className="font-bold text-base text-neutral-900 mb-1">Flora Flower Boutique</div>
        <div>© 2026 Flora. Verified StoreBox Showcase Demo.</div>
      </footer>
    </div>
  );
};
