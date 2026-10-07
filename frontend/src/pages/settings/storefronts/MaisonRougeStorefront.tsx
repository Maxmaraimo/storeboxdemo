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
  Plus,
  Minus,
  Check,
  Gift,
  User,
  X
} from 'lucide-react';

interface MaisonRougeStorefrontProps {
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

const MAISON_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'mr-1',
    title: 'Noir Velvet',
    category: 'seasonal',
    price: 3750000,
    oldPrice: 4200000,
    image: '/images/flagships/maison_b1_hd.jpg',
    gallery: ['/images/flagships/maison_b1_hd.jpg', '/images/flagships/maison_hero_hd.jpg'],
    rating: 5.0,
    reviewsCount: 140,
    badge: 'SIGNATURE',
    desc: 'Авторская композиция из редких сортов бордовых роз Grand Prix, темных калл и ниспадающего амаранта в дизайнерской черной керамической вазе.'
  },
  {
    id: 'mr-2',
    title: 'Velvet Blush',
    category: 'seasonal',
    price: 3500000,
    oldPrice: 3900000,
    image: '/images/flagships/maison_b2_hd.jpg',
    gallery: ['/images/flagships/maison_b2_hd.jpg'],
    rating: 4.9,
    reviewsCount: 180,
    badge: 'HAUTE',
    desc: 'Пышный букет из пудровых французских пионовидных роз, лилий и эустомы в элегантной матовой вазе.'
  },
  {
    id: 'mr-3',
    title: 'Golden Reverie',
    category: 'seasonal',
    price: 1500000,
    oldPrice: 1800000,
    image: '/images/flagships/maison_b3_hd.jpg',
    gallery: ['/images/flagships/maison_b3_hd.jpg'],
    rating: 4.9,
    reviewsCount: 95,
    badge: 'BOTANICAL',
    desc: 'Экспрессивный вертикальный букет со стрелициями, антуриумами и тропической зеленью в прозрачном хрустальном цилиндре.'
  },
  {
    id: 'mr-4',
    title: 'Light Nightmare',
    category: 'seasonal',
    price: 3000000,
    oldPrice: 3400000,
    image: '/images/flagships/maison_roses_101_hd.jpg',
    gallery: ['/images/flagships/maison_roses_101_hd.jpg'],
    rating: 5.0,
    reviewsCount: 110,
    badge: 'EXCLUSIVE',
    desc: 'Скульптурный флористический арт-объект с орхидеями сорта Black Pearl и длинными атласными лентами ручной работы.'
  },
  {
    id: 'mr-5',
    title: 'Imperial Peony White Cascade',
    category: 'prive',
    price: 3200000,
    oldPrice: 3600000,
    image: '/images/flagships/maison_peonies_hd.jpg',
    gallery: ['/images/flagships/maison_peonies_hd.jpg'],
    rating: 5.0,
    reviewsCount: 85,
    badge: 'ROUGE PRIVÉ',
    desc: 'Белоснежная моно-охапка из королевских французских пионов с пышным бантом из тончайшего шелка.'
  },
  {
    id: 'mr-6',
    title: '101 Red Roses Couture Sphere',
    category: 'prive',
    price: 6500000,
    oldPrice: 7500000,
    image: '/images/flagships/maison_hero_hd.jpg',
    gallery: ['/images/flagships/maison_hero_hd.jpg'],
    rating: 5.0,
    reviewsCount: 220,
    badge: '101 ROSES',
    desc: 'Королевская охапка из 101 бордовой розы высшего класса 80 см. Доставка на автомобиле представительского класса.'
  }
];

export const MaisonRougeStorefront: React.FC<MaisonRougeStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
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
    onAddToCart(selectedProduct, pdpQuantity, 'Фирменная упаковка Haute Couture');
    showToast(`«${selectedProduct.title}» добавлен в корзину!`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (e: React.MouseEvent, product: ThemeProductItem) => {
    e.stopPropagation();
    onAddToCart(product, 1, 'Фирменная упаковка Haute Couture');
    showToast(`«${product.title}» добавлен в корзину!`);
  };

  return (
    <div className="bg-[#300508] text-white min-h-screen font-serif selection:bg-rose-900 selection:text-white pb-24">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#520910] text-white shadow-2xl text-xs font-sans font-bold flex items-center gap-2.5 animate-in fade-in border border-rose-500/40">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER (Exact match to цветы1.png: Maison Rouge, Collections, Delivery, Reviews, Contact, Cart, User) */}
      <header className="sticky top-0 z-40 bg-[#300508]/95 backdrop-blur-md border-b border-white/10 px-6 sm:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="cursor-pointer text-xl sm:text-2xl font-light tracking-wide text-rose-100"
          >
            Maison Rouge
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-rose-200/80 font-sans">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('maison-seasonal');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Collections
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
            >
              Delivery
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
            >
              Reviews
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          <div className="flex items-center gap-5 text-rose-200">
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-1 hover:text-white cursor-pointer"
              aria-label="Корзина"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <User className="w-4 h-4 hover:text-white cursor-pointer" />
          </div>
        </div>
      </header>

      {/* HERO SECTION: "The Bouquet Edit" Frosted Glass Card (Exact Match to цветы1.png) */}
      <section className="relative min-h-[500px] sm:min-h-[580px] flex items-center justify-center p-6 sm:p-12 border-b border-white/10 overflow-hidden">
        {/* Deep rich bouquet background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/flagships/maison_hero_hd.jpg"
            alt="Maison Rouge Bouquet"
            className="w-full h-full object-cover filter brightness-75 contrast-125 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#300508] via-[#300508]/40 to-[#300508]/60" />
        </div>

        {/* Center Frosted Glass Floating Card */}
        <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl text-center max-w-md w-full space-y-4">
          <span className="text-[10px] sm:text-xs font-sans uppercase tracking-[0.25em] text-rose-300 font-bold block">
            SIGNATURE BOUQUETS
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-normal text-rose-100 tracking-tight leading-tight">
            The Bouquet <br />
            Edit
          </h1>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('maison-seasonal');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-2.5 rounded-full border border-white/60 hover:border-white bg-white/10 hover:bg-white text-white hover:text-neutral-900 text-xs font-sans uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Shop now</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* "SEASONAL" SECTION (Exact Match: — SEASONAL, 4 cards with hearts) */}
      <section id="maison-seasonal" className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
        <div className="text-xs font-sans uppercase tracking-widest text-rose-300/80 mb-8 flex items-center gap-2">
          <span>—</span>
          <span>SEASONAL</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {MAISON_PRODUCTS.slice(0, 4).map(p => {
            const isFav = !!favorites[p.id];
            return (
              <div
                key={p.id}
                onClick={() => openPdpModal(p)}
                className="group cursor-pointer space-y-3"
              >
                <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-lg">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <button
                    type="button"
                    onClick={e => toggleFavorite(e, p.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white/70 hover:text-rose-400 transition-colors cursor-pointer"
                    aria-label="В избранное"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-light text-rose-100 line-clamp-1">{p.title}</h4>
                  <div className="text-xs font-sans font-bold text-rose-300">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CENTERPIECE HAUTE FEATURE: "Rouge Privé" (Exact match: Lace-gloved bridal bouquet) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <div
          onClick={() => openPdpModal(MAISON_PRODUCTS[4])}
          className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl cursor-pointer group min-h-[380px] sm:min-h-[480px] flex items-end p-8 sm:p-12"
        >
          <img
            src="/images/flagships/maison_b2_hd.jpg"
            alt="Rouge Privé"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#300508] via-transparent to-transparent" />

          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-rose-300 font-bold">
              HAUTE COUTURE FLORISTRY
            </span>
            <h3 className="text-3xl sm:text-4xl text-rose-100 font-light">
              Rouge Privé
            </h3>
            <p className="text-xs font-sans text-rose-200/80 max-w-md">
              Эксклюзивные авторские композиции для свадеб, закрытых приемов и незабываемых признаний.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM COLLECTION ROW & "VIEW ALL" (Exact Match to цветы1.png) */}
      <section className="max-w-7xl mx-auto px-6 sm:px-12 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[MAISON_PRODUCTS[4], MAISON_PRODUCTS[0], MAISON_PRODUCTS[1], MAISON_PRODUCTS[3]].map((p, i) => (
            <div
              key={`bottom-${p.id}-${i}`}
              onClick={() => openPdpModal(p)}
              className="group cursor-pointer space-y-3"
            >
              <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-black/30 border border-white/10 shadow-lg">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-light text-rose-100 line-clamp-1">{p.title}</h4>
                <div className="text-xs font-sans font-bold text-rose-300">
                  {p.price.toLocaleString('ru-RU')} UZS
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-12">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('maison-seasonal');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-3 rounded-full border border-white/40 hover:border-white bg-white/5 hover:bg-white text-white hover:text-neutral-900 text-xs font-sans uppercase tracking-widest transition-all cursor-pointer"
          >
            View all collections →
          </button>
        </div>
      </section>

      {/* PDP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#240406] text-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative border border-rose-500/30">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4 font-sans">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                    Maison Rouge Atelier
                  </span>
                  <h3 className="text-xl font-serif text-rose-100 mt-0.5">
                    {selectedProduct.title}
                  </h3>
                </div>

                <p className="text-xs text-rose-200/80 leading-relaxed font-light">
                  {selectedProduct.desc}
                </p>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center border border-white/20 rounded-full p-0.5">
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => Math.max(1, q - 1))}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold">{pdpQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setPdpQuantity(q => q + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handlePdpAddToCart}
                    className="flex-1 py-3 px-5 rounded-full bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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
      <footer className="border-t border-white/10 py-12 px-6 sm:px-12 text-center text-xs font-sans text-rose-300/60">
        <div className="text-base font-serif text-rose-100 mb-2">Maison Rouge</div>
        <div>© 2026 Maison Rouge Haute Floristry. Verified StoreBox Showcase Experience.</div>
      </footer>
    </div>
  );
};
