import React, { useState, useEffect } from "react";
import {
  Send,
  Sparkles,
  CreditCard,
  Truck,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Clock,
  MapPin,
  RefreshCw,
  Bot,
  Smartphone,
  Check
} from "lucide-react";

interface FeaturesBentoProps {
  lang?: "uz" | "ru" | "en";
}

export const FeaturesBento: React.FC<FeaturesBentoProps> = ({ lang = "ru" }) => {
  // Multilingual translations
  const t = {
    ru: {
      kicker: "Возможности платформы",
      title: "Экосистема, созданная побеждать в e-commerce",
      lead: "Каждый инструмент StoreBox спроектирован для максимальной конверсии: от интерактивного Telegram-магазина до мгновенного ИИ и прозрачной логистики.",
      
      // Card 1: Telegram WebApp
      card1Badge: "WEBAPP АКТИВЕН",
      card1Title: "Telegram WebApp",
      card1Desc: "Полноценная витрина меню прямо в Telegram. Заказ и мгновенная оплата в 1 клик без перехода на сторонние сайты.",
      card1Item1: "Мгновенный каталог и карточки товаров",
      card1Item2: "Оплата через Click, Payme и Telegram Stars",
      card1Product1: "Фирменный бургер Angus",
      card1Price1: "65 000 UZS",
      card1Product2: "Комбо с картофелем фри",
      card1Price2: "85 000 UZS",
      card1Add: "+ В корзину",
      card1MainBtn: "Оформить заказ • 150 000 UZS",
      card1Notify: "Заказ #4920 успешно оплачен в Telegram!",
      card1LivePing: "⚡ Заказ в 2 клика • Оплачено",

      // Card 2: AI Ассистент & CRM
      card2Badge: "AI & CRM ИНТЕЛЛЕКТ",
      card2Title: "AI Ассистент & CRM",
      card2Desc: "Генерация сочных описаний блюд и товаров за 0.8 сек, умная сегментация базы клиентов.",
      card2Prompt: "Создать сочное описание для сочного стейка Ribeye...",
      card2AiSpeed: "⚡ 0.8с генерация",
      card2Accuracy: "Точность: 99.4%",
      card2AiText: "«Мраморная говядина зернового откорма, обжаренная на открытом огне с ароматным розмарином. Идеальная сочность и дымный аромат премиум-класса.»",
      card2Tag1: "#ПремиумСтейк",
      card2Tag2: "#ХитПродаж",
      card2Tag3: "#ШефРекомендует",
      card2Regen: "Сгенерировать ещё",
      card2LtvMetric: "+38% LTV клиентов",
      card2VipClient: "VIP Клиент: Сардор Т. (14 заказов)",

      // Card 3: YES POS Касса & Платежи
      card3Badge: "ФИСКАЛИЗАЦИЯ ПО ОФД",
      card3Title: "YES POS Касса",
      card3Desc: "Моментальный перенос товаров из постов соцсетей, бесшовная синхронизация цен и остатков.",
      card3Item1: "0% комиссий StoreBox — фиксированный тариф",
      card3Item2: "Мгновенная печать фискальных чеков ГНК",
      card3Click: "Click Up",
      card3Payme: "Payme",
      card3Uzum: "Uzum Bank",
      card3Active: "Подключено",
      card3FiscalReceipt: "Чек #8942 выбит • 0.3с",
      card3Sync: "Синхронизация с кассой YES POS: 100% онлайн",

      // Card 4: Быстрая доставка и логистика
      card4Badge: "ЖИВОЙ GPS & ЛОГИСТИКА",
      card4Title: "Быстрая Доставка & GPS",
      card4Desc: "Интеграция с Yandex Go, расчет стоимости по координатам и контроль курьеров на интерактивной карте в реальном времени.",
      card4Item1: "Авто-вызов Yandex Delivery и курьеров парка",
      card4Item2: "Клиент видит перемещение курьера на живой карте",
      card4Item3: "Оптимизация маршрутов и авто-распределение за 0.1с",
      card4CourierName: "Курьер: Фарход М. • Скутер #402",
      card4Status: "В пути к клиенту • ул. Амира Темура, 42",
      card4TimerLabel: "Расчётное время прибытия:",
      card4TimerVal: "25-35 мин",
      card4LiveStatus: "● В пути к клиенту",
      card4DestBadge: "ул. Амира Темура, 42 • Yandex API ✓"
    },
    uz: {
      kicker: "Platforma imkoniyatlari",
      title: "E-commerce'da g'alaba qozonish uchun ekotizim",
      lead: "StoreBox-ning har bir vositasi maksimal savdo uchun ishlab chiqilgan: interaktiv Telegram-do'kondan tortib, sun'iy intellekt va tezkor logistikagacha.",
      
      card1Badge: "WEBAPP FAOL",
      card1Title: "Telegram WebApp",
      card1Desc: "Telegram ichidagi to'laqonli internet-do'kon. Tashqi saytlarga o'tmasdan 1 bosishda buyurtma va to'lov.",
      card1Item1: "Tezkor tovarlar katalogi va menyu",
      card1Item2: "Click, Payme va Telegram Stars orqali to'lov",
      card1Product1: "Angus maxsus burgeri",
      card1Price1: "65 000 UZS",
      card1Product2: "Fri kartoshkasi bilan kombo",
      card1Price2: "85 000 UZS",
      card1Add: "+ Savatga",
      card1MainBtn: "Buyurtma berish • 150 000 UZS",
      card1Notify: "Buyurtma #4920 Telegram orqali muvaffaqiyatli to'landi!",
      card1LivePing: "⚡ 2 bosishda buyurtma • To'landi",

      card2Badge: "AI & CRM INTELLEKT",
      card2Title: "AI Assistent & CRM",
      card2Desc: "0.8 soniyada mahsulot va taomlarga sotuvchi tavsiflar yaratish, mijozlar bazasini aqlli segmentlash.",
      card2Prompt: "Ribeye steyki uchun jozibali tavsif yozish...",
      card2AiSpeed: "⚡ 0.8s generatsiya",
      card2Accuracy: "Aniqlik: 99.4%",
      card2AiText: "«Ochiq olovda xushbo'y rozmarin bilan pishirilgan donli bo'rdoqi mol go'shti. Premium darajadagi betakror lazzat va xushbo'y tam.»",
      card2Tag1: "#PremiumSteyk",
      card2Tag2: "#HitSavdo",
      card2Tag3: "#OshpazTavsiyasi",
      card2Regen: "Yana yaratish",
      card2LtvMetric: "+38% mijozlar LTV",
      card2VipClient: "VIP Mijoz: Sardor T. (14 buyurtma)",

      card3Badge: "OFD FISKALLASHTIRISH",
      card3Title: "YES POS Kassa",
      card3Desc: "Ijtimoiy tarmoq postlaridan tovarlarni bir zumda ko'chirish, narxlar va qoldiqlarni uzluksiz sinxronlash.",
      card3Item1: "StoreBox komissiyasi 0% — qat'iy tarif",
      card3Item2: "DSQ fiskal cheklarini bir zumda chop etish",
      card3Click: "Click Up",
      card3Payme: "Payme",
      card3Uzum: "Uzum Bank",
      card3Active: "Ulangan",
      card3FiscalReceipt: "Chek #8942 chop etildi • 0.3s",
      card3Sync: "YES POS kassasi bilan sinxronizatsiya: 100% online",

      card4Badge: "JONLI GPS & LOGISTIKA",
      card4Title: "Tezkor Yetkazish & GPS",
      card4Desc: "Yandex Go bilan to'liq integratsiya, koordinatalar bo'yicha narx hisoblash va kuryerlarni xaritada real vaqtda kuzatish.",
      card4Item1: "Yandex Delivery va shaxsiy kuryerlarni avto-chaqirish",
      card4Item2: "Mijoz xaritada kuryer harakatini jonli ko'radi",
      card4Item3: "Marshrutni optimallashtirish va 0.1s taqsimlash",
      card4CourierName: "Kuryer: Farhod M. • Skuter #402",
      card4Status: "Mijoz tomon yo'lda • Amir Temur ko'chasi, 42",
      card4TimerLabel: "Yetib borishning taxminiy vaqti:",
      card4TimerVal: "25-35 daqiqa",
      card4LiveStatus: "● Mijoz tomon yo'lda",
      card4DestBadge: "Amir Temur ko'chasi, 42 • Yandex API ✓"
    },
    en: {
      kicker: "Platform Capabilities",
      title: "An Ecosystem Built to Dominate E-commerce",
      lead: "Every StoreBox feature is engineered for maximum conversion: from interactive Telegram stores to instant AI content and transparent logistics.",
      
      card1Badge: "WEBAPP ACTIVE",
      card1Title: "Telegram WebApp",
      card1Desc: "Full-featured menu storefront right inside Telegram. 1-click ordering and instant payments without leaving the messenger.",
      card1Item1: "Instant product catalog & interactive showcase",
      card1Item2: "Payments via Click, Payme & Telegram Stars",
      card1Product1: "Signature Angus Burger",
      card1Price1: "65 000 UZS",
      card1Product2: "Crispy French Fries Combo",
      card1Price2: "85 000 UZS",
      card1Add: "+ Add to Cart",
      card1MainBtn: "Checkout Now • 150 000 UZS",
      card1Notify: "Order #4920 completed successfully in Telegram!",
      card1LivePing: "⚡ 2-Click Order • Paid",

      card2Badge: "AI & CRM INTELLIGENCE",
      card2Title: "AI Assistant & CRM",
      card2Desc: "Craft appetizing dish & product descriptions in 0.8s, automated customer database segmentation.",
      card2Prompt: "Write a mouthwatering description for Ribeye Steak...",
      card2AiSpeed: "⚡ 0.8s generated",
      card2Accuracy: "Accuracy: 99.4%",
      card2AiText: "«Grain-fed marbled beef grilled over open flame with fragrant rosemary. The ultimate smoky tenderness and five-star taste experience.»",
      card2Tag1: "#PremiumSteak",
      card2Tag2: "#BestSeller",
      card2Tag3: "#ChefChoice",
      card2Regen: "Regenerate",
      card2LtvMetric: "+38% customer LTV",
      card2VipClient: "VIP Client: Sardor T. (14 orders)",

      card3Badge: "OFD FISCALIZATION",
      card3Title: "YES POS Checkout",
      card3Desc: "Instant product transfer from social posts, real-time inventory and pricing sync across all branches.",
      card3Item1: "0% StoreBox commission — fixed monthly rate",
      card3Item2: "Instant official QR fiscal receipts",
      card3Click: "Click Up",
      card3Payme: "Payme",
      card3Uzum: "Uzum Bank",
      card3Active: "Connected",
      card3FiscalReceipt: "Receipt #8942 printed • 0.3s",
      card3Sync: "YES POS Terminal Synchronization: 100% Online",

      card4Badge: "LIVE GPS & LOGISTICS",
      card4Title: "Fast Delivery & GPS",
      card4Desc: "Full Yandex Go integration, dynamic coordinate pricing, and real-time live courier tracking on dark map.",
      card4Item1: "Instant auto-dispatch to Yandex Delivery & couriers",
      card4Item2: "Live animated map tracking for customers",
      card4Item3: "Smart route optimization in 0.1 seconds",
      card4CourierName: "Courier: Farkhod M. • Scooter #402",
      card4Status: "Out for Delivery • 42 Amir Temur Ave",
      card4TimerLabel: "Estimated Delivery Time:",
      card4TimerVal: "25-35 min",
      card4LiveStatus: "● In transit to customer",
      card4DestBadge: "42 Amir Temur Ave • Yandex API ✓"
    }
  };

  const str = t[lang] || t.ru;

  const [cartCount, setCartCount] = useState<number>(2);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [deliverySeconds, setDeliverySeconds] = useState<number>(1120);

  useEffect(() => {
    const timer = setInterval(() => {
      setDeliverySeconds((prev) => (prev > 10 ? prev - 1 : 1120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  const handleSimulateAi = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
    }, 750);
  };

  return (
    <section
      id="features"
      className="relative w-full pt-24 lg:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-28"
    >
      {/* Ambient Volumetric Lighting Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* SECTION HEADER */}
      <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs font-black text-[#c8ff6a] uppercase tracking-wider backdrop-blur-md mb-4 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-[#c8ff6a]" />
          <span>{str.kicker}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-5">
          {str.title}
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          {str.lead}
        </p>
      </div>

      {/* BENTO GRID: 4 COLUMNS ARCHITECTURE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
        
        {/* ========================================================================= */}
        {/* BLOCK 1: TELEGRAM WEBAPP (Large Left Card - Spans 2 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-2 md:col-span-2 group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-950 via-slate-900 to-sky-950 border border-white/15 hover:border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.01] overflow-hidden flex flex-col justify-between min-h-[490px]">
          
          {/* Subtle Radial Blue Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-sky-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-sky-500/25 transition-all duration-500" />

          {/* Card Top Content */}
          <div className="relative z-10 space-y-4 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{str.card1Badge}</span>
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
              {str.card1Title}
            </h3>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {str.card1Desc}
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-cyan-200 font-semibold bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                {str.card1Item1}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-cyan-200 font-semibold bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                {str.card1Item2}
              </span>
            </div>
          </div>

          {/* TELEGRAM MINI APP SMARTPHONE MOCKUP FRAME WITH FLOATING 3D BADGES */}
          <div className="relative z-10 w-full pt-2">
            
            {/* Main Phone Glass Stage */}
            <div className="relative w-full rounded-2xl bg-slate-900/90 border border-blue-400/25 p-4 shadow-2xl backdrop-blur-xl space-y-3">
              
              {/* Telegram App Bar Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 flex items-center justify-center text-white font-black text-xs shadow-md">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-wide">StoreBox Food Shop</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">bot • онлайн 24/7</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-mono text-cyan-300">TG MiniApp 2.0</span>
                </div>
              </div>

              {/* Food & Goods Catalog Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                
                {/* Product 1 */}
                <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0 text-xl shadow-inner">
                    🍔
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{str.card1Product1}</h4>
                    <p className="text-xs font-black text-[#c8ff6a]">{str.card1Price1}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartCount(c => c + 1)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {str.card1Add}
                  </button>
                </div>

                {/* Product 2 */}
                <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 text-xl shadow-inner">
                    🍟
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{str.card1Product2}</h4>
                    <p className="text-xs font-black text-[#c8ff6a]">{str.card1Price2}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCartCount(c => c + 1)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {str.card1Add}
                  </button>
                </div>

              </div>

              {/* Main Button */}
              <div className="pt-1">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-between shadow-lg shadow-blue-600/30 transition-all transform active:scale-[0.99] cursor-pointer"
                >
                  <span>{str.card1MainBtn} ({cartCount})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Floating 3D Micro-UI 1: Top-Right Instant Order Chip */}
            <div className="absolute -top-3.5 right-4 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/40 text-white text-xs font-black shadow-xl backdrop-blur-xl transition-transform duration-500 group-hover:translate-y-[-4px]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{str.card1LivePing}</span>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* BLOCK 2: AI АССИСТЕНТ & CRM (Center Vertical Card - Spans 1 Col) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-1 md:col-span-1 group relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-purple-950 via-slate-900 to-fuchsia-950 border border-white/15 hover:border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.01] overflow-hidden flex flex-col justify-between min-h-[490px]">
          
          {/* Subtle violet glowing spot */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-fuchsia-500/25 transition-all duration-500" />

          {/* Card Top Info */}
          <div className="relative z-10 space-y-3 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black tracking-wide uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>{str.card2Badge}</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {str.card2Title}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {str.card2Desc}
            </p>
          </div>

          {/* AI INTERACTION WIDGET WITH 3D FLOATING LAYERS */}
          <div className="relative z-10 w-full rounded-2xl bg-black/50 border border-fuchsia-500/25 p-4 shadow-xl backdrop-blur-xl space-y-3">
            
            {/* Simulated Prompt Box */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
                <span className="font-mono text-slate-300 truncate text-[11px]">{str.card2Prompt}</span>
              </div>
              <button
                type="button"
                onClick={handleSimulateAi}
                className="p-1 rounded-lg hover:bg-white/10 text-fuchsia-300 transition-colors shrink-0 cursor-pointer"
                title={str.card2Regen}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiGenerating ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* AI Speed & Accuracy Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#c8ff6a]/15 border border-[#c8ff6a]/30 text-[#c8ff6a] font-black text-[10px]">
                {str.card2AiSpeed}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {str.card2Accuracy}
              </span>
            </div>

            {/* Generated AI Content Output Box */}
            <div className={`p-2.5 rounded-xl bg-fuchsia-950/30 border border-fuchsia-500/30 text-[11px] text-slate-200 leading-relaxed italic transition-opacity duration-300 ${isAiGenerating ? "opacity-40" : "opacity-100"}`}>
              {str.card2AiText}
            </div>

            {/* AI Generated SEO tags */}
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-fuchsia-300">{str.card2Tag1}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-cyan-300">{str.card2Tag2}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-[#c8ff6a]">{str.card2Tag3}</span>
            </div>

            {/* Floating VIP Customer Chip */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">👑 {str.card2VipClient}</span>
              <span className="text-emerald-400 font-black">{str.card2LtvMetric}</span>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* BLOCK 3: YES POS КАССА & ПЛАТЕЖИ (Right Upper Card - Spans 1 Col) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-1 md:col-span-1 group relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-white/15 hover:border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.01] overflow-hidden flex flex-col justify-between min-h-[490px]">
          
          {/* Subtle emerald glowing spot */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-500" />

          {/* Card Top Info */}
          <div className="relative z-10 space-y-3 mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black tracking-wide uppercase backdrop-blur-md">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>{str.card3Badge}</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {str.card3Title}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {str.card3Desc}
            </p>
          </div>

          {/* PAYMENT INTEGRATION CARDS WIDGET WITH FISCAL CHIP */}
          <div className="relative z-10 w-full space-y-2.5">
            
            {/* Click Provider */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#0088cc]/25 border border-[#0088cc]/40 flex items-center justify-center font-black text-[#0088cc] text-[11px]">
                  CL
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{str.card3Click}</h4>
                  <p className="text-[9px] text-slate-400">Мгновенный QR</p>
                </div>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {str.card3Active}
              </span>
            </div>

            {/* Payme Provider */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00cccc]/25 border border-[#00cccc]/40 flex items-center justify-center font-black text-[#00cccc] text-[11px]">
                  PM
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{str.card3Payme}</h4>
                  <p className="text-[9px] text-slate-400">Uzcard / Humo</p>
                </div>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {str.card3Active}
              </span>
            </div>

            {/* Uzum Bank Provider */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6f2dbd]/25 border border-[#6f2dbd]/40 flex items-center justify-center font-black text-[#b76eeb] text-[11px]">
                  UZ
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{str.card3Uzum}</h4>
                  <p className="text-[9px] text-slate-400">Nasiya 0-0-12</p>
                </div>
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {str.card3Active}
              </span>
            </div>

            {/* Floating Fiscal Receipt Status */}
            <div className="p-2 rounded-xl bg-slate-950/70 border border-emerald-400/30 flex items-center justify-between text-xs text-white">
              <span className="flex items-center gap-1.5 font-bold text-emerald-200 text-[11px]">
                <span>🧾</span>
                <span>{str.card3FiscalReceipt}</span>
              </span>
              <span className="text-[#c8ff6a] font-mono text-[10px] font-black">0% сборов</span>
            </div>

            {/* Live POS Sync Footer */}
            <div className="pt-0.5 flex items-center gap-2 text-[10px] font-mono text-emerald-400/90">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
              <span className="truncate">{str.card3Sync}</span>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* BLOCK 4: БЫСТРАЯ ДОСТАВКА И ЛОГИСТИКА (Wide Lower Card - Spans 4 Cols) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 md:col-span-2 group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-amber-950 via-slate-900 to-orange-950 border border-white/15 hover:border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.01] overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 min-h-[380px]">
          
          {/* Subtle amber glowing spot */}
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/25 transition-all duration-500" />

          {/* Left Text & Platform Highlights */}
          <div className="relative z-10 space-y-4 max-w-xl shrink-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>{str.card4Badge}</span>
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
              {str.card4Title}
            </h3>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {str.card4Desc}
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-amber-200 font-semibold">
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-[10px] font-black">✓</span>
                <span>{str.card4Item1}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-amber-200 font-semibold">
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-[10px] font-black">✓</span>
                <span>{str.card4Item2}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-amber-200 font-semibold">
                <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center text-[10px] font-black">✓</span>
                <span>{str.card4Item3}</span>
              </div>
            </div>

            {/* Live Delivery Status Indicator */}
            <div className="pt-2 flex items-center gap-3">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-500/25 border border-emerald-300/50 text-emerald-200 font-black text-sm shadow-lg backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{str.card4TimerVal}</span>
              </div>
              <span className="text-xs font-extrabold text-amber-200 tracking-wide">
                {str.card4LiveStatus}
              </span>
            </div>
          </div>

          {/* VECTOR DARK MAP TRACKING WIDGET WITH LIVE RADAR */}
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-slate-950/80 border border-amber-500/20 p-4 shadow-2xl backdrop-blur-xl overflow-hidden shrink-0">
            
            {/* SVG Dark City Map Illustration */}
            <div className="w-full h-36 relative rounded-xl bg-[#090d16] border border-white/5 overflow-hidden flex items-center justify-center">
              
              {/* Map Road Grid lines */}
              <svg className="w-full h-full opacity-35" viewBox="0 0 400 150" fill="none">
                <path d="M 0 30 Q 150 40 400 20" stroke="#334155" strokeWidth="3" />
                <path d="M 0 110 Q 200 90 400 130" stroke="#334155" strokeWidth="3" />
                <path d="M 70 0 L 100 150" stroke="#1e293b" strokeWidth="2" />
                <path d="M 220 0 L 190 150" stroke="#1e293b" strokeWidth="2" />
                <path d="M 330 0 L 350 150" stroke="#1e293b" strokeWidth="2" />
                {/* Active Delivery Route Glow Line */}
                <path
                  d="M 60 110 C 130 110, 160 50, 310 40"
                  stroke="url(#route-grad-amber)"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="route-grad-amber" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Hub Origin Pin */}
              <div className="absolute left-6 bottom-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-slate-300 font-bold shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>StoreBox Hub</span>
              </div>

              {/* Moving Courier Pin on Map */}
              <div className="absolute left-[54%] top-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-amber-950 border border-amber-400 px-2.5 py-1 rounded-full text-[10px] font-black text-amber-200 shadow-lg shadow-amber-500/30 animate-bounce">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Express</span>
              </div>

              {/* Customer Destination Pin */}
              <div className="absolute right-6 top-4 flex items-center gap-1.5 bg-[#c8ff6a]/15 border border-[#c8ff6a]/40 px-2 py-1 rounded-lg text-[10px] text-[#c8ff6a] font-bold shadow-md">
                <MapPin className="w-3 h-3 text-[#c8ff6a]" />
                <span>Toshkent</span>
              </div>

            </div>

            {/* Courier Telemetry Detail Bar */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-xs font-bold text-white">{str.card4CourierName}</div>
                <div className="text-[11px] text-slate-400">{str.card4Status}</div>
              </div>
              <div className="flex flex-col sm:items-end justify-center">
                <div className="text-[11px] text-slate-400 font-medium">{str.card4TimerLabel}</div>
                <div className="text-sm font-black font-mono text-[#c8ff6a] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimer(deliverySeconds)}</span>
                </div>
              </div>
            </div>

            {/* Destination Pill & Live API status */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-amber-200 font-bold">📍 {str.card4DestBadge}</span>
              <span className="text-emerald-400 font-black">Yandex Go Active</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default FeaturesBento;
