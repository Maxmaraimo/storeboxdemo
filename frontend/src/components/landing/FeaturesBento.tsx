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
  Sliders,
  ChevronRight,
  Bot
} from "lucide-react";

interface FeaturesBentoProps {
  lang?: "uz" | "ru" | "en";
}

export const FeaturesBento: React.FC<FeaturesBentoProps> = ({ lang = "ru" }) => {
  // Translations
  const t = {
    ru: {
      kicker: "Возможности платформы",
      title: "Экосистема, созданная побеждать в e-commerce",
      lead: "Каждый инструмент StoreBox спроектирован для максимальной конверсии: от интерактивного Telegram-магазина до мгновенного ИИ и прозрачной логистики.",
      // Card 1: Telegram
      card1Badge: "Telegram Mini App 2.0",
      card1Title: "Полноценный магазин внутри Telegram",
      card1Desc: "Клиенты выбирают товары, применяют промокоды и оплачивают покупки в мессенджере без переходов на сторонние сайты. Конверсия выше на 43%.",
      card1BotName: "StoreBox Online Shop",
      card1BotStatus: "bot • онлайн 24/7",
      card1Product1: "Беспроводные наушники Pro",
      card1Price1: "640 000 UZS",
      card1Product2: "Смарт-часы Ultra 2 Titanium",
      card1Price2: "1 850 000 UZS",
      card1Add: "+ В корзину",
      card1Added: "✓ В корзине",
      card1MainBtn: "Оформить заказ (2 товара) • 2 490 000 UZS",
      card1Notify: "Новый заказ #4920 успешно оплачен через Telegram WebApp!",
      // Card 2: AI
      card2Badge: "AI Content Engine",
      card2Title: "ИИ-генерация товаров и текстов за секунды",
      card2Desc: "Нейросеть мгновенно формулирует продающие описания, подбирает релевантные теги и оптимизирует SEO-характеристики ваших карточек.",
      card2Prompt: "Сгенерировать продающее описание для кроссовок Nike...",
      card2AiSpeed: "⚡ ИИ сгенерировано за 0.8с",
      card2AiText: "«Премиальная эко-кожа, фирменная амортизация Air Sole и ультралегкий дышащий текстиль. Идеальны для динамичного ритма Ташкента.»",
      card2Tag1: "#Кроссовки",
      card2Tag2: "#Оригинал",
      card2Tag3: "#БыстраяДоставка",
      card2Regen: "Сгенерировать ещё",
      card2Accuracy: "Точность описания: 99.4%",
      // Card 3: POS & Payments
      card3Badge: "YES POS & FinTech Hub",
      card3Title: "Касса, склад и платежи Узбекистана",
      card3Desc: "Бесшовная фискализация, автосписание и моментальная синхронизация остатков по всем торговым точкам и кассам YES POS.",
      card3Click: "Click Up & QR",
      card3ClickSub: "Мгновенная фискализация (0.1с)",
      card3Payme: "Payme One-Click",
      card3PaymeSub: "Быстрая оплата картами Uzcard/Humo",
      card3Uzum: "Uzum Bank & Nasiya",
      card3UzumSub: "Рассрочка 0-0-12 и онлайн-сплит",
      card3Active: "Активно",
      card3Sync: "Синхронизация с кассой YES POS: 100% онлайн",
      // Card 4: Logistics & Delivery
      card4Badge: "Smart Logistics & Routing",
      card4Title: "Быстрая доставка и живой трекинг на карте",
      card4Desc: "Автоматическое распределение заказов по курьерам, расчет оптимального маршрута и отображение перемещения в реальном времени.",
      card4CourierName: "Курьер: Фарход М. • Скутер #402",
      card4Status: "В пути к клиенту • ул. Амира Темура, 42",
      card4TimerLabel: "Расчётное время прибытия:",
      card4Progress: "Маршрут выполнен на 85%",
      card4DeliveredIn: "18 мин 40 сек"
    },
    uz: {
      kicker: "Platforma imkoniyatlari",
      title: "E-commerce'da g'alaba qozonish uchun ekotizim",
      lead: "StoreBox-ning har bir vositasi maksimal savdo uchun ishlab chiqilgan: interaktiv Telegram-do'kondan tortib, sun'iy intellekt va tezkor logistikagacha.",
      card1Badge: "Telegram Mini App 2.0",
      card1Title: "Telegram ichidagi to'laqonli internet-do'kon",
      card1Desc: "Mijozlar tovarlarni tanlaydilar, promokodlarni kiritadilar va messenjerdan chiqmasdan xarid qiladilar. Konversiya 43% ga yuqori.",
      card1BotName: "StoreBox Online Shop",
      card1BotStatus: "bot • 24/7 faol",
      card1Product1: "Simsiz quloqchinlar Pro",
      card1Price1: "640 000 UZS",
      card1Product2: "Smart-soat Ultra 2 Titanium",
      card1Price2: "1 850 000 UZS",
      card1Add: "+ Savatga",
      card1Added: "✓ Savatda",
      card1MainBtn: "Buyurtma berish (2 ta) • 2 490 000 UZS",
      card1Notify: "Yangi buyurtma #4920 Telegram WebApp orqali muvaffaqiyatli to'landi!",
      card2Badge: "AI Content Engine",
      card2Title: "Tovar va matnlarni bir zumda AI bilan yaratish",
      card2Desc: "Neyrotarmoq mahsulotlaringiz uchun jozibador tavsiflar yozadi, teglarni tanlaydi va SEO parametrlarini bir necha soniyada moslaydi.",
      card2Prompt: "Nike krossovkalari uchun sotuvchi matn yozish...",
      card2AiSpeed: "⚡ AI tomonidan 0.8 soniyada yaratildi",
      card2AiText: "«Yuqori sifatli eko-teri, Air Sole qulay yostiqchalari va nafas oluvchi yengil mato. Toshkent shahrining faol hayot tarzi uchun ideal tanlov.»",
      card2Tag1: "#Krossovka",
      card2Tag2: "#Original",
      card2Tag3: "#TezkorYetkazish",
      card2Regen: "Yana yaratish",
      card2Accuracy: "Tavsif aniqligi: 99.4%",
      card3Badge: "YES POS & FinTech Hub",
      card3Title: "Kassa, ombor va O'zbekiston to'lov tizimlari",
      card3Desc: "Bir zumda fiskallashtirish, avtomatik yechish va barcha savdo nuqtalari hamda YES POS kassalari bilan qoldiqlar sinxronizatsiyasi.",
      card3Click: "Click Up & QR",
      card3ClickSub: "Tezkor fiskallashtirish (0.1s)",
      card3Payme: "Payme One-Click",
      card3PaymeSub: "Uzcard/Humo orqali bir bosishda to'lov",
      card3Uzum: "Uzum Bank & Nasiya",
      card3UzumSub: "0-0-12 muddatli to'lov va online split",
      card3Active: "Faol",
      card3Sync: "YES POS kassasi bilan sinxronizatsiya: 100% online",
      card4Badge: "Smart Logistics & Routing",
      card4Title: "Tezkor yetkazish va xaritada jonli kuzatuv",
      card4Desc: "Buyurtmalarni kuryerlar o'rtasida avtomatik taqsimlash, eng qulay yo'nalishni hisoblash va real vaqt rejimida jonli kuzatish.",
      card4CourierName: "Kuryer: Farhod M. • Skuter #402",
      card4Status: "Mijoz tomon yo'lda • Amir Temur ko'chasi, 42",
      card4TimerLabel: "Yetib borishning taxminiy vaqti:",
      card4Progress: "Yo'nalish 85% yakunlandi",
      card4DeliveredIn: "18 daqiqa 40 soniya"
    },
    en: {
      kicker: "Platform Capabilities",
      title: "An Ecosystem Built to Dominate E-commerce",
      lead: "Every StoreBox feature is engineered for maximum conversion: from interactive Telegram stores to instant AI content and transparent logistics.",
      card1Badge: "Telegram Mini App 2.0",
      card1Title: "Full-Featured Store Inside Telegram",
      card1Desc: "Customers browse products, apply promo codes, and complete checkout without ever leaving Telegram. Increases conversions by 43%.",
      card1BotName: "StoreBox Online Shop",
      card1BotStatus: "bot • online 24/7",
      card1Product1: "Wireless Earbuds Pro",
      card1Price1: "640 000 UZS",
      card1Product2: "Smart Watch Ultra 2 Titanium",
      card1Price2: "1 850 000 UZS",
      card1Add: "+ Add to Cart",
      card1Added: "✓ In Cart",
      card1MainBtn: "Place Order (2 items) • 2 490 000 UZS",
      card1Notify: "New order #4920 completed via Telegram WebApp!",
      card2Badge: "AI Content Engine",
      card2Title: "AI Product & Copy Generation in Seconds",
      card2Desc: "Neural models instantly craft persuasive product descriptions, select high-ranking keywords, and optimize SEO attributes.",
      card2Prompt: "Write a high-converting description for Nike sneakers...",
      card2AiSpeed: "⚡ AI Generated in 0.8s",
      card2AiText: "«Premium breathable eco-leather, signature Air Sole cushioning, and ultra-durable street style. Built for the modern pace of the city.»",
      card2Tag1: "#Sneakers",
      card2Tag2: "#Original",
      card2Tag3: "#FastShipping",
      card2Regen: "Generate Again",
      card2Accuracy: "Accuracy Rate: 99.4%",
      card3Badge: "YES POS & FinTech Hub",
      card3Title: "POS Checkout, Inventory & Uzbekistan Payments",
      card3Desc: "Seamless fiscalization, instant auto-debit, and real-time inventory synchronization across all retail stores and YES POS terminals.",
      card3Click: "Click Up & QR",
      card3ClickSub: "Instant Fiscalization (0.1s)",
      card3Payme: "Payme One-Click",
      card3PaymeSub: "One-touch card debit (Uzcard/Humo)",
      card3Uzum: "Uzum Bank & Nasiya",
      card3UzumSub: "Installments 0-0-12 & online split",
      card3Active: "Active",
      card3Sync: "YES POS Terminal Synchronization: 100% Online",
      card4Badge: "Smart Logistics & Routing",
      card4Title: "Fast Delivery & Live Courier Tracking",
      card4Desc: "Automated order dispatching, real-time optimal routing, and live customer tracking on an interactive dark vector map.",
      card4CourierName: "Courier: Farkhod M. • Scooter #402",
      card4Status: "Out for Delivery • 42 Amir Temur Ave",
      card4TimerLabel: "Estimated Delivery Time:",
      card4Progress: "Route 85% completed",
      card4DeliveredIn: "18m 40s"
    }
  };

  const str = t[lang] || t.ru;

  // State for interactive features
  const [cartCount, setCartCount] = useState<number>(2);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [deliverySeconds, setDeliverySeconds] = useState<number>(1120); // 18m 40s

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
    <section className="relative w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* SECTION HEADER */}
      <div className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs font-bold text-[#c8ff6a] uppercase tracking-wider backdrop-blur-md mb-4 shadow-sm">
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

      {/* BENTO GRID 12-COLUMN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* ========================================================================= */}
        {/* CARD 1: TELEGRAM WEBAPP 2.0 (Spans 7 cols on Desktop) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 group relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#0b162c] via-[#091124] to-[#040814] border border-blue-500/20 hover:border-blue-400/50 shadow-2xl transition-all duration-300 hover:shadow-blue-500/10 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[480px]">
          
          {/* Subtle radial inner glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/25 transition-all duration-500" />

          {/* Card Top Info */}
          <div className="relative z-10 space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs font-extrabold tracking-wide">
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>{str.card1Badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {str.card1Title}
            </h3>
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
              {str.card1Desc}
            </p>
          </div>

          {/* TELEGRAM MINI APP MOCKUP FRAME */}
          <div className="relative z-10 w-full rounded-2xl bg-slate-900/90 border border-blue-400/20 p-4 shadow-2xl backdrop-blur-xl space-y-3">
            
            {/* Telegram Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 flex items-center justify-center text-white font-black text-xs shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-wide">{str.card1BotName}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">{str.card1BotStatus}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-mono">TG MiniApp</span>
              </div>
            </div>

            {/* Catalog Items inside MiniApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Product 1 */}
              <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                  <ShoppingBag className="w-6 h-6" />
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
                <div className="w-12 h-12 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Clock className="w-6 h-6" />
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

            {/* Telegram MainButton Bar */}
            <div className="pt-1">
              <button
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-between shadow-lg shadow-blue-600/30 transition-all transform active:scale-[0.99] cursor-pointer"
              >
                <span>{str.card1MainBtn.replace("(2 товара)", `(${cartCount} ta)`)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Floating Live Telegram Alert */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{str.card1Notify}</span>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* CARD 2: AI CONTENT ASSISTANT (Spans 5 cols on Desktop) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 group relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#1d0d2e] via-[#140822] to-[#07020d] border border-fuchsia-500/20 hover:border-fuchsia-400/50 shadow-2xl transition-all duration-300 hover:shadow-fuchsia-500/10 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[480px]">
          
          {/* Subtle violet glowing spot */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-fuchsia-500/25 transition-all duration-500" />

          {/* Card Top Info */}
          <div className="relative z-10 space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/25 text-fuchsia-300 text-xs font-extrabold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>{str.card2Badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {str.card2Title}
            </h3>
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed">
              {str.card2Desc}
            </p>
          </div>

          {/* AI INTERACTION WIDGET */}
          <div className="relative z-10 w-full rounded-2xl bg-black/40 border border-fuchsia-500/20 p-4 shadow-xl backdrop-blur-xl space-y-3">
            
            {/* Simulated Prompt Box */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
                <span className="font-mono text-slate-300 truncate">{str.card2Prompt}</span>
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#c8ff6a]/15 border border-[#c8ff6a]/30 text-[#c8ff6a] font-black text-[11px]">
                {str.card2AiSpeed}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {str.card2Accuracy}
              </span>
            </div>

            {/* Generated AI Content Output Box */}
            <div className={`p-3 rounded-xl bg-fuchsia-950/20 border border-fuchsia-500/30 text-xs text-slate-200 leading-relaxed italic transition-opacity duration-300 ${isAiGenerating ? "opacity-40" : "opacity-100"}`}>
              {str.card2AiText}
            </div>

            {/* AI Generated SEO tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-fuchsia-300">{str.card2Tag1}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-cyan-300">{str.card2Tag2}</span>
              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-[#c8ff6a]">{str.card2Tag3}</span>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* CARD 3: YES POS & PAYMENT INTEGRATIONS (Spans 5 cols on Desktop) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 group relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#0c221e] via-[#081815] to-[#030a08] border border-emerald-500/20 hover:border-emerald-400/50 shadow-2xl transition-all duration-300 hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[460px]">
          
          {/* Subtle emerald glowing spot */}
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/25 transition-all duration-500" />

          {/* Card Top Info */}
          <div className="relative z-10 space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-300 text-xs font-extrabold tracking-wide">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>{str.card3Badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {str.card3Title}
            </h3>
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed">
              {str.card3Desc}
            </p>
          </div>

          {/* PAYMENT INTEGRATION CARDS WIDGET */}
          <div className="relative z-10 w-full space-y-2.5">
            
            {/* Click Provider */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center font-black text-[#0088cc] text-xs">
                  CL
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{str.card3Click}</h4>
                  <p className="text-[10px] text-slate-400">{str.card3ClickSub}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {str.card3Active}
              </span>
            </div>

            {/* Payme Provider */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00cccc]/20 border border-[#00cccc]/40 flex items-center justify-center font-black text-[#00cccc] text-xs">
                  PM
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{str.card3Payme}</h4>
                  <p className="text-[10px] text-slate-400">{str.card3PaymeSub}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {str.card3Active}
              </span>
            </div>

            {/* Uzum Bank & Nasiya */}
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-3 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#6f2dbd]/20 border border-[#6f2dbd]/40 flex items-center justify-center font-black text-[#b76eeb] text-xs">
                  UZ
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">{str.card3Uzum}</h4>
                  <p className="text-[10px] text-slate-400">{str.card3UzumSub}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {str.card3Active}
              </span>
            </div>

            {/* Live POS Sync Footer */}
            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono text-emerald-400/90">
              <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />
              <span>{str.card3Sync}</span>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* CARD 4: FAST DELIVERY & LOGISTICS MAP (Spans 7 cols on Desktop) */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 group relative rounded-[32px] p-6 sm:p-8 bg-gradient-to-br from-[#121722] via-[#0d121c] to-[#04060a] border border-cyan-500/20 hover:border-cyan-400/50 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/10 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[460px]">
          
          {/* Subtle cyan glowing spot */}
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />

          {/* Card Top Info */}
          <div className="relative z-10 space-y-3 mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 text-xs font-extrabold tracking-wide">
              <Truck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{str.card4Badge}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {str.card4Title}
            </h3>
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
              {str.card4Desc}
            </p>
          </div>

          {/* VECTOR DARK MAP TRACKING WIDGET */}
          <div className="relative z-10 w-full rounded-2xl bg-slate-950/80 border border-cyan-500/20 p-4 shadow-2xl backdrop-blur-xl overflow-hidden">
            
            {/* SVG Dark City Map Illustration */}
            <div className="w-full h-32 sm:h-36 relative rounded-xl bg-[#090d16] border border-white/5 overflow-hidden flex items-center justify-center">
              
              {/* Map Road Grid lines */}
              <svg className="w-full h-full opacity-30" viewBox="0 0 400 150" fill="none">
                <path d="M 0 30 Q 150 40 400 20" stroke="#334155" strokeWidth="3" />
                <path d="M 0 110 Q 200 90 400 130" stroke="#334155" strokeWidth="3" />
                <path d="M 70 0 L 100 150" stroke="#1e293b" strokeWidth="2" />
                <path d="M 220 0 L 190 150" stroke="#1e293b" strokeWidth="2" />
                <path d="M 330 0 L 350 150" stroke="#1e293b" strokeWidth="2" />
                {/* Active Delivery Route Glow Line */}
                <path
                  d="M 60 110 C 130 110, 160 50, 310 40"
                  stroke="url(#route-grad)"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
                <defs>
                  <linearGradient id="route-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00cccc" />
                    <stop offset="100%" stopColor="#c8ff6a" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Hub Origin Pin */}
              <div className="absolute left-10 bottom-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-slate-300 font-bold shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>StoreBox Hub</span>
              </div>

              {/* Moving Courier Pin on Map */}
              <div className="absolute left-[54%] top-[38%] -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-cyan-950 border border-cyan-400 px-2.5 py-1 rounded-full text-[10px] font-black text-cyan-200 shadow-lg shadow-cyan-500/30 animate-bounce">
                <Truck className="w-3.5 h-3.5 text-cyan-400" />
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

            {/* Route Progress Bar */}
            <div className="mt-2.5 w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-[#c8ff6a] h-full rounded-full w-[85%] transition-all duration-500"></div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default FeaturesBento;
