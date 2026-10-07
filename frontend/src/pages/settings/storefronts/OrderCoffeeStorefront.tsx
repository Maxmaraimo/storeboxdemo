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
  RotateCcw,
  Plus,
  Minus,
  Coffee,
  Flame,
  Clock,
  X
} from 'lucide-react';

interface OrderCoffeeStorefrontProps {
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

// 8 authentic drinks directly from reference 'еда1.png'
const COFFEE_PRODUCTS: ThemeProductItem[] = [
  {
    id: 'cf-1',
    title: 'Espresso',
    category: 'classic',
    price: 45000,
    oldPrice: 50000,
    image: '/images/flagships/coffee_espresso.jpg',
    gallery: ['/images/flagships/coffee_espresso.jpg', '/images/flagships/coffee_iced_latte.jpg'],
    rating: 4.9,
    reviewsCount: 320,
    badge: 'CLASSIC',
    desc: 'pure strong coffee. Концентрированный шот свежесваренной 100% спешелти арабики с бархатистой золотистой пенкой crema.',
    options: ['Одинарный шот (30 мл)', 'Двойной Doppio (60 мл) +10 000 UZS'],
    specs: {
      'Состав': '100% Specialty Arabica (Эфиопия)',
      'Объем': '30 мл / 60 мл',
      'Крепость': 'Экстра-плотный шот',
      'Обжарка': 'Свежая светлая City Roast'
    }
  },
  {
    id: 'cf-2',
    title: 'Americano',
    category: 'classic',
    price: 35000,
    oldPrice: 40000,
    image: '/images/flagships/coffee_americano.jpg',
    gallery: ['/images/flagships/coffee_americano.jpg', '/images/flagships/coffee_iced_latte.jpg'],
    rating: 4.8,
    reviewsCount: 290,
    badge: 'CLASSIC',
    desc: 'espresso + hot water. Двойной шот эспрессо, мягко раскрытый чистой горячей или ледяной водой. Чистый кофейный баланс.',
    options: ['M (250 мл)', 'L (350 мл) +6 000 UZS'],
    specs: {
      'Состав': 'Двойной эспрессо + фильтрованная вода',
      'Температура': 'Горячий (85°C) или Со льдом',
      'Ноты': 'Какао-бобы, сухофрукты, фундук'
    }
  },
  {
    id: 'cf-3',
    title: 'Latte',
    category: 'milk',
    price: 34000,
    oldPrice: 38000,
    image: '/images/flagships/coffee_latte.jpg',
    gallery: ['/images/flagships/coffee_latte.jpg', '/images/flagships/coffee_iced_latte.jpg'],
    rating: 5.0,
    reviewsCount: 480,
    badge: 'POPULAR',
    desc: 'espresso + lots of milk + little foam. Нежнейший эспрессо со взбитым шелковистым молоком и тонким слоем микропенки.',
    options: ['M (300 мл)', 'L (400 мл) +8 000 UZS'],
    specs: {
      'Состав': 'Эспрессо, фермерское молоко, микропенка',
      'Сладость': 'Естественная молочная сладость',
      'Альтернативное молоко': 'Овсяное / Миндальное / Кокосовое'
    }
  },
  {
    id: 'cf-4',
    title: 'Macchiato',
    category: 'milk',
    price: 42000,
    oldPrice: 48000,
    image: '/images/flagships/coffee_macchiato.jpg',
    gallery: ['/images/flagships/coffee_macchiato.jpg'],
    rating: 4.9,
    reviewsCount: 175,
    badge: 'SPECIAL',
    desc: 'espresso + small milk foam. Насыщенный эспрессо, смягченный нежным пятнышком теплой молочной пены сверху.',
    options: ['Стандарт (80 мл)', 'Двойной (120 мл) +8 000 UZS'],
    specs: {
      'Подача': 'В демитасе из термостекла',
      'Интенсивность': 'Высокая крепость с кремовым послевкусием'
    }
  },
  {
    id: 'cf-5',
    title: 'Irish Coffee',
    category: 'specialty',
    price: 44000,
    oldPrice: 50000,
    image: '/images/flagships/coffee_irish.jpg',
    gallery: ['/images/flagships/coffee_irish.jpg', '/images/flagships/coffee_iced_latte.jpg'],
    rating: 4.9,
    reviewsCount: 210,
    badge: 'SIGNATURE',
    desc: 'coffee + whiskey essence + cream. Знаменитый согревающий коктейль из фильтр-кофе, карамельного сахара и шапки холодных взбитых сливок.',
    options: ['Классический (250 мл)', 'XL (350 мл) +10 000 UZS'],
    specs: {
      'Профиль': 'Карамельно-дубовые ноты, мягкие сливки',
      'Безалкогольный': 'Крафтовый безалкогольный ирландский сироп'
    }
  },
  {
    id: 'cf-6',
    title: 'Flat White',
    category: 'milk',
    price: 32000,
    oldPrice: 38000,
    image: '/images/flagships/coffee_flat_white.jpg',
    gallery: ['/images/flagships/coffee_flat_white.jpg'],
    rating: 4.9,
    reviewsCount: 390,
    badge: 'BARISTA CHOICE',
    desc: 'espresso + thin layer of milk foam. Истинный австралийский фаворит: двойной шот ристретто с глянцевым бархатным молоком.',
    options: ['M (200 мл)', 'Double Flat (300 мл) +8 000 UZS'],
    specs: {
      'Экстракция': 'Двойной ристретто',
      'Молоко': 'Тонкая шелковистая микропенка 0.5 см'
    }
  },
  {
    id: 'cf-7',
    title: 'Lungo',
    category: 'classic',
    price: 38000,
    oldPrice: 42000,
    image: '/images/flagships/coffee_lungo.jpg',
    gallery: ['/images/flagships/coffee_lungo.jpg'],
    rating: 4.7,
    reviewsCount: 140,
    badge: 'CLASSIC',
    desc: 'long espresso, more water. Удлиненная экстракция эспрессо, раскрывающая глубокие древесные и шоколадные ноты обжарки.',
    options: ['Стандарт (110 мл)', 'Grande (160 мл) +6 000 UZS'],
    specs: {
      'Время экстракции': '55 секунд',
      'Характер': 'Легкая горчинка темного шоколада'
    }
  },
  {
    id: 'cf-8',
    title: 'Vienna Coffee',
    category: 'sweet',
    price: 40000,
    oldPrice: 46000,
    image: '/images/flagships/coffee_vienna.jpg',
    gallery: ['/images/flagships/coffee_vienna.jpg'],
    rating: 5.0,
    reviewsCount: 260,
    badge: 'SWEET DESSERT',
    desc: 'espresso + whipped cream. Венский десертный кофе: двойной эспрессо под высокой шапкой натуральных взбитых сливок с шоколадной стружкой.',
    options: ['250 мл', '350 мл +8 000 UZS'],
    specs: {
      'Топпинг': '100% натуральные сливки 33% и тертый бельгийский шоколад'
    }
  }
];

// Featured Drink from bottom of 'еда1.png'
const FEATURED_ICED_LATTE: ThemeProductItem = {
  id: 'cf-featured',
  title: 'Iced Latte Special Edition',
  category: 'iced',
  price: 52000,
  oldPrice: 62000,
  image: '/images/flagships/coffee_iced_latte.jpg',
  gallery: ['/images/flagships/coffee_iced_latte.jpg', '/images/flagships/coffee_latte.jpg'],
  rating: 5.0,
  reviewsCount: 540,
  badge: 'NEW ALLETION',
  desc: 'A refreshing coffee drink made with espresso, cold milk, and ice. It has a smooth, light flavor, balancing the strength of espresso with the creaminess of milk. Perfect for hot days or when you want a cool, energizing coffee without being too strong.',
  options: ['M (350 мл)', 'L (450 мл) +10 000 UZS'],
  specs: {
    'Подача': 'Ледяной стакан, крафтовый лед, черная эко-соломинка',
    'Калорийность': '145 ккал',
    'Зерно': 'Brazil Santos & Ethiopia Yirgacheffe'
  }
};

export const OrderCoffeeStorefront: React.FC<OrderCoffeeStorefrontProps> = ({
  cartCount,
  onOpenCart,
  onAddToCart
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ThemeProductItem | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [selectedMilk, setSelectedMilk] = useState<'whole' | 'oat' | 'almond'>('whole');
  const [pdpQuantity, setPdpQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickAdd = (p: ThemeProductItem) => {
    onAddToCart(p, 1, p.options?.[0] || 'Стандарт');
    showToast(`«${p.title}» добавлен в корзину`);
  };

  const openCustomModal = (p: ThemeProductItem) => {
    setSelectedProduct(p);
    setSelectedOptionIdx(0);
    setSelectedMilk('whole');
    setPdpQuantity(1);
  };

  const handleModalAddToCart = () => {
    if (!selectedProduct) return;
    const opt = selectedProduct.options?.[selectedOptionIdx] || 'Стандарт';
    const milkLabel = selectedMilk === 'oat'
      ? ' + Овсяное Oatly'
      : selectedMilk === 'almond'
      ? ' + Миндальное молоко'
      : ' + Классическое молоко';
    const extraPrice = (selectedOptionIdx > 0 ? 8000 : 0) + (selectedMilk !== 'whole' ? 6000 : 0);
    onAddToCart(selectedProduct, pdpQuantity, opt, milkLabel, extraPrice);
    showToast(`«${selectedProduct.title}» (${opt}${milkLabel}) добавлен в корзину`);
    setSelectedProduct(null);
  };

  const filteredDrinks = useMemo(() => {
    if (activeCategory === 'all') return COFFEE_PRODUCTS;
    if (activeCategory === 'iced') return COFFEE_PRODUCTS.filter(p => p.id === 'cf-1' || p.id === 'cf-2' || p.id === 'cf-3');
    if (activeCategory === 'milk') return COFFEE_PRODUCTS.filter(p => p.category === 'milk');
    if (activeCategory === 'classic') return COFFEE_PRODUCTS.filter(p => p.category === 'classic');
    if (activeCategory === 'specialty') return COFFEE_PRODUCTS.filter(p => p.category === 'specialty');
    if (activeCategory === 'sweet') return COFFEE_PRODUCTS.filter(p => p.category === 'sweet');
    return COFFEE_PRODUCTS;
  }, [activeCategory]);

  return (
    <div className="bg-[#FAF7F2] text-[#3E2723] min-h-screen font-sans selection:bg-[#8B5E3C] selection:text-white pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#3E2723] text-white shadow-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in border border-[#A27357]">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER (Matching 'еда1.png' minimalist aesthetic) */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EBDCCF] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-black tracking-wider text-[#3E2723] uppercase">
              ORDER <span className="text-[#8B5E3C]">COFFEE</span>
            </span>
            <span className="font-serif italic text-sm text-[#8B5E3C] hidden sm:inline">
              Welcome
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="px-5 py-2 rounded-full bg-[#8B5E3C] hover:bg-[#70482B] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>my basket</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#8B5E3C] text-[10px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. HERO SECTION (Matching 'еда1.png' Iced Coffee on stone pedestal) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F2ECE1] to-[#FAF7F2] py-12 sm:py-20 border-b border-[#EBDCCF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col items-center text-center relative z-10">
            <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-wider text-[#3E2723] mb-1">
              ORDER <span className="text-[#8B5E3C]">COFFEE</span>
            </h1>
            <p className="font-serif italic text-2xl sm:text-4xl text-[#8B5E3C] -mt-2 sm:-mt-4 mb-6">
              Welcome
            </p>

            {/* Central Pedestal Coffee Cup Visual */}
            <div className="relative my-4 cursor-pointer group" onClick={() => openCustomModal(FEATURED_ICED_LATTE)}>
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 bg-white group-hover:scale-105 transition-transform duration-500">
                <img
                  src="/images/flagships/coffee_iced_latte.jpg"
                  alt="Order Coffee Welcome"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-[#8B5E3C] text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                <span>Свежесваренный холодный кофе</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MENU DRINKS SECTION (Exact replica of 'еда1.png') */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#3E2723]">
              Menu
            </h2>
            <p className="font-serif italic text-xl text-[#8B5E3C]">
              drinks
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCart}
            className="self-start sm:self-auto px-6 py-2.5 rounded-full bg-[#8B5E3C] hover:bg-[#70482B] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            my basket ({cartCount})
          </button>
        </div>

        {/* Category Pills (Matching 'еда1.png': Iced coffee, Milk-Based, Classic, Specialty, Sweet) */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-6 text-xs font-bold">
          {[
            { id: 'all', label: 'All Drinks' },
            { id: 'iced', label: 'Iced coffee' },
            { id: 'milk', label: 'Milk-Based Coffee' },
            { id: 'classic', label: 'Classic Coffee' },
            { id: 'specialty', label: 'Specialty Coffee' },
            { id: 'sweet', label: 'Sweet Coffee' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full cursor-pointer transition-all whitespace-nowrap shadow-xs ${
                activeCategory === cat.id
                  ? 'bg-[#8B5E3C] text-white font-black shadow-md'
                  : 'bg-[#EBDCCF] text-[#5D4037] hover:bg-[#DFC8B5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 2x4 Drinks Grid with exact framed beige cards from 'еда1.png' */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-4">
          {filteredDrinks.map(p => (
            <div
              key={p.id}
              className="bg-[#F5EFEB] rounded-2xl p-3.5 sm:p-4 border-2 border-[#E5DACD] flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              {/* Product Packshot in White Frame */}
              <div
                onClick={() => openCustomModal(p)}
                className="bg-white rounded-xl p-3 aspect-[3/4] flex items-center justify-center mb-3 cursor-pointer overflow-hidden border border-[#E5DACD]/60 group"
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="max-h-40 sm:max-h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title & Description Recipe */}
              <div className="space-y-1 mb-3">
                <h3
                  onClick={() => openCustomModal(p)}
                  className="font-bold text-sm sm:text-base text-[#3E2723] hover:text-[#8B5E3C] cursor-pointer"
                >
                  {p.title}
                </h3>
                <p className="text-[11px] text-[#8D6E63] line-clamp-1 leading-snug">
                  {p.desc.split('.')[0]}
                </p>
              </div>

              {/* Price & to cart button */}
              <div className="pt-2 border-t border-[#E5DACD] flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs sm:text-sm text-[#3E2723]">
                    {(p.price / 8000).toFixed(2)}$
                  </span>
                  <p className="text-[10px] text-[#8D6E63]">
                    {p.price.toLocaleString('ru-RU')} UZS
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAdd(p)}
                  className="px-3.5 py-1.5 rounded-full bg-[#EBDCCF] hover:bg-[#8B5E3C] hover:text-white text-[#5D4037] text-[11px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  to cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* "More" Center Button */}
        <div className="text-center mt-10">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className="px-8 py-2.5 rounded-full bg-[#8B5E3C] hover:bg-[#70482B] text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md"
          >
            More Drinks
          </button>
        </div>
      </section>

      {/* 4. FEATURED NEW DRINK BANNER (Matching bottom section of 'еда1.png') */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        <div className="bg-gradient-to-r from-[#FFD7CE] via-[#FCE4DC] to-[#FFF0EB] rounded-3xl p-6 sm:p-12 border border-[#F5C2B5] shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <div>
                <span className="text-3xl sm:text-5xl font-black text-white drop-shadow-xs block leading-none">
                  New <span className="font-serif italic font-normal text-xl sm:text-2xl text-[#8B5E3C]">alletion</span>
                </span>
                <h3 className="text-4xl sm:text-6xl font-black text-[#3E2723] uppercase tracking-tight mt-1">
                  drink
                </h3>
              </div>

              <div className="space-y-2 max-w-lg">
                <h4 className="text-xl sm:text-2xl font-bold text-[#3E2723]">
                  Iced Latte
                </h4>
                <p className="text-xs sm:text-sm text-[#5D4037] leading-relaxed">
                  A refreshing coffee drink made with espresso, cold milk, and ice. It has a smooth, light flavor, balancing the strength of espresso with the creaminess of milk. Perfect for hot days or when you want a cool, energizing coffee without being too strong.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#3E2723]">
                    6.50$
                  </span>
                  <span className="text-base text-[#8D6E63] line-through font-bold">
                    7.80$
                  </span>
                  <span className="text-xs text-[#8B5E3C] font-bold">
                    (52 000 UZS)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickAdd(FEATURED_ICED_LATTE)}
                  className="px-6 py-3 rounded-full bg-[#8B5E3C] hover:bg-[#70482B] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Order Now</span>
                </button>
              </div>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <div
                onClick={() => openCustomModal(FEATURED_ICED_LATTE)}
                className="w-56 h-72 sm:w-64 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-white cursor-pointer group"
              >
                <img
                  src="/images/flagships/coffee_iced_latte.jpg"
                  alt="New drink Iced Latte"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DRINK CUSTOMIZATION & PDP MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EBDCCF] relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-[#5D4037] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-36 h-44 mx-auto bg-white rounded-2xl p-3 shadow-md border border-[#EBDCCF] flex items-center justify-center mb-4">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.title}
                  className="max-h-full object-contain"
                />
              </div>
              <h3 className="text-2xl font-black text-[#3E2723]">{selectedProduct.title}</h3>
              <p className="text-xs text-[#8D6E63] mt-1 max-w-sm mx-auto">{selectedProduct.desc}</p>
            </div>

            {/* Size Options */}
            {selectedProduct.options && selectedProduct.options.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase text-[#8D6E63] mb-2">Выберите размер:</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedProduct.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOptionIdx(idx)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedOptionIdx === idx
                          ? 'border-[#8B5E3C] bg-[#8B5E3C] text-white shadow-xs'
                          : 'border-[#EBDCCF] bg-white text-[#5D4037] hover:border-[#8B5E3C]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Milk Option */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-[#8D6E63] mb-2">Молоко:</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {[
                  { id: 'whole', label: 'Классическое' },
                  { id: 'oat', label: 'Овсяное (+6к)' },
                  { id: 'almond', label: 'Миндаль (+6к)' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMilk(m.id as any)}
                    className={`py-2 px-2 text-center rounded-xl border transition-all cursor-pointer ${
                      selectedMilk === m.id
                        ? 'border-[#8B5E3C] bg-[#8B5E3C] text-white shadow-xs'
                        : 'border-[#EBDCCF] bg-white text-[#5D4037] hover:border-[#8B5E3C]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper & Add Button */}
            <div className="flex items-center gap-4 pt-4 border-t border-[#EBDCCF]">
              <div className="flex items-center border border-[#EBDCCF] rounded-full bg-white p-1">
                <button
                  type="button"
                  onClick={() => setPdpQuantity(Math.max(1, pdpQuantity - 1))}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold">{pdpQuantity}</span>
                <button
                  type="button"
                  onClick={() => setPdpQuantity(pdpQuantity + 1)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleModalAddToCart}
                className="flex-1 py-3 px-6 rounded-full bg-[#8B5E3C] hover:bg-[#70482B] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Добавить в корзину · {((selectedProduct.price + (selectedOptionIdx > 0 ? 8000 : 0) + (selectedMilk !== 'whole' ? 6000 : 0)) * pdpQuantity).toLocaleString('ru-RU')} UZS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
