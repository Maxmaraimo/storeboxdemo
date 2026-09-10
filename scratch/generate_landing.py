import os

template_content = r'''{% extends 'base.html' %}

{% block title %}{{ t.page_title }}{% endblock %}

{% block extra_head %}
<style>
    /* 3D Perspective & Depth */
    .perspective-1200 { perspective: 1200px; }
    .transform-style-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }

    /* Custom subtle grid background */
    .bg-grid-violet-pattern {
        background-image: radial-gradient(rgba(139, 92, 246, 0.15) 1px, transparent 1px);
        background-size: 28px 28px;
    }

    /* Ambient glow animation */
    @keyframes pulse-violet {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.85; transform: scale(1.08); }
    }
    .animate-pulse-violet {
        animation: pulse-violet 7s ease-in-out infinite;
    }

    /* Shimmer effect for primary CTA buttons */
    @keyframes shimmer {
        100% { transform: translateX(100%); }
    }
    .shimmer-btn {
        position: relative;
        overflow: hidden;
    }
    .shimmer-btn::after {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
            60deg,
            transparent,
            rgba(255, 255, 255, 0.25),
            transparent
        );
        transform: rotate(25deg);
        animation: shimmer 3.5s infinite cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Dark Glass Card */
    .glass-card-dark {
        background: rgba(15, 14, 23, 0.75);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(139, 92, 246, 0.2);
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    }

    /* Light Glass Card for white sections */
    .glass-card-3d {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(226, 232, 240, 0.85);
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
    }
</style>

<script>
    const I18N = {{ all_translations_json|safe }};
    const CURRENT_LANG = '{{ lang|default:"uz" }}';

    const SIM_STORES = {
        food: {
            name: 'Gold Lavash',
            handle: '@goldlavash_bot',
            avatar: '🌯',
            deliveryTime: '15-25 min',
            rating: '4.95',
            banner: {
                badge: '🔥 AKSIYA -20%',
                badgeRu: '🔥 АКЦИЯ -20%',
                badgeEn: '🔥 SPECIAL -20%',
                title: 'Combo: Lavash + Fri + Cola',
                titleRu: 'Комбо: Лаваш + Фри + Cola',
                titleEn: 'Combo: Beef Lavash + Fries + Cola',
                sub: 'Eng to\'yimli va mazali tushlik',
                subRu: 'Самый вкусный и сочный обед',
                subEn: 'Most delicious lunch combo set',
                img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80'
            },
            chips: [
                { id: 'all', name: '🔥 Barchasi', nameRu: '🔥 Все', nameEn: '🔥 All' },
                { id: 'lavash', name: '🌯 Lavash', nameRu: '🌯 Лаваши', nameEn: '🌯 Lavash' },
                { id: 'burger', name: '🍔 Burger', nameRu: '🍔 Бургеры', nameEn: '🍔 Burgers' },
                { id: 'drinks', name: '🥤 Ichimlik', nameRu: '🥤 Напитки', nameEn: '🥤 Drinks' }
            ],
            items: [
                {
                    id: 1,
                    cat: 'lavash',
                    name: 'Mini Mol Go\'shtli Lavash',
                    nameRu: 'Мини лаваш с говядиной',
                    nameEn: 'Mini Beef Lavash Wrap',
                    price: 32000,
                    oldPrice: 36000,
                    rating: 4.9,
                    badge: 'Xit',
                    badgeRu: 'Хит',
                    badgeEn: 'Hit',
                    img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=350&auto=format&fit=crop&q=80',
                    desc: 'Yupqa qarsildoq xamir, sersuv mol go\'shti, chipslar, pomidor va maxsus sous.',
                    descRu: 'Хрустящий лаваш, рубленая говядина, фирменный соус и картофельные чипсы.',
                    descEn: 'Crispy flatbread, tender beef, crispy chips, tomatoes and secret chef sauce.'
                },
                {
                    id: 2,
                    cat: 'burger',
                    name: 'Double Cheeseburger',
                    nameRu: 'Двойной чизбургер StoreBox',
                    nameEn: 'Double Cheeseburger Deluxe',
                    price: 42000,
                    oldPrice: 48000,
                    rating: 4.8,
                    badge: 'Top',
                    badgeRu: 'Топ',
                    badgeEn: 'Top',
                    img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=350&auto=format&fit=crop&q=80',
                    desc: 'Ikki qavatli grilda pishgan go\'sht, erigan cheddar pishlog\'i va aysberg.',
                    descRu: 'Две сочные котлеты на гриле, двойной сыр чеддер и свежие овощи.',
                    descEn: 'Double grilled beef patties, melted cheddar cheese, pickles and crisp lettuce.'
                },
                {
                    id: 3,
                    cat: 'lavash',
                    name: 'Pishloqli Tovuq Lavash',
                    nameRu: 'Сырный лаваш с курицей',
                    nameEn: 'Cheesy Chicken Lavash',
                    price: 35000,
                    oldPrice: 39000,
                    rating: 4.9,
                    badge: 'Yangi',
                    badgeRu: 'Новинка',
                    badgeEn: 'New',
                    img: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=350&auto=format&fit=crop&q=80',
                    desc: 'Mayin tovuq filesi, erigan mozzarella pishlog\'i va sarimsoqli oq sous.',
                    descRu: 'Нежное филе цыпленка, тающая моцарелла и домашний чесночный соус.',
                    descEn: 'Tender chicken fillet, melted mozzarella and creamy garlic herb sauce.'
                },
                {
                    id: 4,
                    cat: 'drinks',
                    name: 'Coca-Cola 0.5L',
                    nameRu: 'Coca-Cola 0.5L',
                    nameEn: 'Coca-Cola 0.5L',
                    price: 9000,
                    oldPrice: 11000,
                    rating: 5.0,
                    badge: 'Muzdek',
                    badgeRu: 'Холодная',
                    badgeEn: 'Chilled',
                    img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=350&auto=format&fit=crop&q=80',
                    desc: 'Muzdek klassik gazlangan tetiklashtiruvchi ichimlik.',
                    descRu: 'Классический освежающий сильногазированный напиток.',
                    descEn: 'Original chilled refreshing carbonated beverage.'
                }
            ]
        },
        clothes: {
            name: 'Urban Brand',
            handle: '@urban_store_bot',
            avatar: '👕',
            deliveryTime: '1 kun',
            rating: '4.92',
            banner: {
                badge: '⚡️ NEW DROP',
                badgeRu: '⚡️ NEW DROP',
                badgeEn: '⚡️ NEW DROP',
                title: 'Oversize Hoodie & Sneakers',
                titleRu: 'Худи Oversize & Кроссовки',
                titleEn: 'Oversize Hoodie & Sneakers',
                sub: '100% og\'ir paxta • SS\'26',
                subRu: 'Итальянский хлопок 480 г/м² • SS\'26',
                subEn: 'Premium heavy cotton 480g/m² • SS\'26',
                img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=80'
            },
            chips: [
                { id: 'all', name: '🔥 Barchasi', nameRu: '🔥 Все', nameEn: '🔥 All' },
                { id: 'hoodie', name: '👕 Xudi', nameRu: '👕 Худи', nameEn: '👕 Hoodies' },
                { id: 'shoes', name: '👟 Poyabzal', nameRu: '👟 Обувь', nameEn: '👟 Shoes' },
                { id: 'pants', name: '👖 Shimlar', nameRu: '👖 Брюки', nameEn: '👖 Pants' }
            ],
            items: [
                {
                    id: 8,
                    cat: 'hoodie',
                    name: 'Oversize Heavy Hoodie "Tokyo"',
                    nameRu: 'Худи Oversize "Tokyo"',
                    nameEn: 'Oversize Heavy Hoodie "Tokyo"',
                    price: 340000,
                    oldPrice: 420000,
                    rating: 4.9,
                    badge: 'Drop',
                    badgeRu: 'Дроп',
                    badgeEn: 'Drop',
                    img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=350&auto=format&fit=crop&q=80',
                    desc: 'Qalin paxta, metall uchli iplar, erkin bichim.',
                    descRu: 'Премиальный плотный трикотаж, фурнитура из стали, свободный крой.',
                    descEn: 'Premium heavyweight cotton, stainless steel tips, relaxed drop-shoulder fit.'
                },
                {
                    id: 9,
                    cat: 'shoes',
                    name: 'Urban Runner V2 Sneakers',
                    nameRu: 'Кроссовки Urban Runner V2',
                    nameEn: 'Urban Runner V2 Sneakers',
                    price: 520000,
                    oldPrice: 650000,
                    rating: 5.0,
                    badge: 'Xit',
                    badgeRu: 'Хит',
                    badgeEn: 'Hit',
                    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=350&auto=format&fit=crop&q=80',
                    desc: 'Yumshoq amortizatsiya, nafas oluvchi setka, charmdan detallar.',
                    descRu: 'Амортизирующая подошва EVA, дышащий верх и натуральная кожа.',
                    descEn: 'Responsive EVA cushioning, breathable mesh and genuine suede inserts.'
                },
                {
                    id: 10,
                    cat: 'hoodie',
                    name: 'Minimal Zip-Hoodie Black',
                    nameRu: 'Черный зип-худи Minimal',
                    nameEn: 'Minimal Zip-Hoodie Black',
                    price: 360000,
                    oldPrice: 410000,
                    rating: 4.8,
                    badge: 'Baza',
                    badgeRu: 'База',
                    badgeEn: 'Core',
                    img: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=350&auto=format&fit=crop&q=80',
                    desc: 'YKK metall zamok, chuqur kapyushon, ikkita yon cho\'ntak.',
                    descRu: 'Надежная японская молния YKK, глубокий капюшон, плотная ткань.',
                    descEn: 'Reliable Japanese YKK zip, structured hood and kangaroo pocket.'
                }
            ]
        }
    };
</script>
{% endblock %}

{% block content %}
<div class="min-h-screen bg-[#0A0718] text-slate-100 selection:bg-violet-600 selection:text-white relative overflow-x-hidden font-sans"
     x-data="{
         lang: '{{ lang|default:"uz" }}',
         t(k) {
             if (I18N[this.lang] && I18N[this.lang][k]) return I18N[this.lang][k];
             if (I18N['uz'] && I18N['uz'][k]) return I18N['uz'][k];
             return k;
         },
         billingCycle: 'annual',
         displayDevice: 'desktop',
         simCategory: 'food',
         simSubCat: 'all',
         simCart: [
             { id: 1, cat: 'lavash', name: 'Mini Mol Go\'shtli Lavash', nameRu: 'Мини лаваш с говядиной', nameEn: 'Mini Beef Lavash Wrap', price: 32000, qty: 1, img: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=350&auto=format&fit=crop&q=80' },
             { id: 2, cat: 'burger', name: 'Double Cheeseburger', nameRu: 'Двойной чизбургер StoreBox', nameEn: 'Double Cheeseburger Deluxe', price: 42000, qty: 1, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=350&auto=format&fit=crop&q=80' }
         ],
         simNotification: false,
         simLastOrder: null,
         openFaq: 1,
         get currentSimStore() {
             return SIM_STORES[this.simCategory] || SIM_STORES.food;
         },
         get currentFilteredItems() {
             const store = this.currentSimStore;
             if (this.simSubCat === 'all') return store.items;
             return store.items.filter(it => it.cat === this.simSubCat);
         },
         addToSimCart(item) {
             const existing = this.simCart.find(i => i.id === item.id);
             if (existing) {
                 existing.qty += 1;
             } else {
                 this.simCart.push({ ...item, qty: 1 });
             }
         },
         decrementSimItem(id) {
             const existing = this.simCart.find(i => i.id === id);
             if (existing) {
                 if (existing.qty > 1) {
                     existing.qty -= 1;
                 } else {
                     this.simCart = this.simCart.filter(i => i.id !== id);
                 }
             }
         },
         get simTotal() {
             return this.simCart.reduce((acc, item) => acc + (item.price * item.qty), 0);
         },
         get simTotalCount() {
             return this.simCart.reduce((acc, item) => acc + item.qty, 0);
         },
         triggerSimOrder() {
             if (this.simCart.length === 0) return;
             if (window.confetti) {
                 window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
             }
             this.simLastOrder = {
                 id: Math.floor(1000 + Math.random() * 9000),
                 sum: this.simTotal,
                 count: this.simTotalCount
             };
             this.simCart = [];
             this.simNotification = true;
             setTimeout(() => { this.simNotification = false; }, 6000);
         }
     }">

    <!-- Dark Glowing Ambient Lights (Robosell Dark Violet Style) -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-gradient-to-tr from-violet-900/40 via-purple-900/30 to-indigo-900/20 blur-[140px] rounded-full pointer-events-none -z-10 animate-pulse-violet"></div>
    <div class="absolute top-96 right-0 w-[550px] h-[550px] bg-gradient-to-br from-indigo-900/30 via-violet-900/20 to-transparent blur-[130px] rounded-full pointer-events-none -z-10"></div>
    <div class="absolute top-[1400px] left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-900/20 via-violet-950/30 to-transparent blur-[150px] rounded-full pointer-events-none -z-10"></div>

    <!-- Background Subtle Micro-Grid -->
    <div class="absolute inset-0 bg-grid-violet-pattern pointer-events-none -z-10 [mask-image:linear-gradient(to_bottom,white,white_70%,transparent)]"></div>

    <!-- NAVIGATION BAR (Crisp Glassmorphic Dark Violet) -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-[#0F0E1E]/80 border-b border-violet-900/30 transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <!-- Brand Logo -->
            <a href="/" class="flex items-center space-x-3 group">
                <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform duration-300">
                    <i data-lucide="shopping-bag" class="w-6 h-6 text-white stroke-[2.2]"></i>
                </div>
                <div class="flex flex-col">
                    <div class="flex items-center gap-1.5">
                        <span class="text-2xl font-black tracking-tight text-white group-hover:text-violet-400 transition-colors">StoreBox</span>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 tracking-wide uppercase">SaaS</span>
                    </div>
                    <span class="text-[11px] font-medium text-slate-400 tracking-tight" x-text="t('brand_subtitle')">{{ t.brand_subtitle }}</span>
                </div>
            </a>

            <!-- Desktop Nav Links -->
            <nav class="hidden lg:flex items-center space-x-8 text-sm font-semibold text-slate-300">
                <a href="#features" class="hover:text-violet-400 transition-colors" x-text="t('nav_features')">{{ t.nav_features }}</a>
                <a href="#showcase" class="hover:text-violet-400 transition-colors flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                    <span x-text="t('nav_showcase')">{{ t.nav_showcase }}</span>
                </a>
                <a href="#payments" class="hover:text-violet-400 transition-colors" x-text="t('nav_payments')">{{ t.nav_payments }}</a>
                <a href="#pricing" class="hover:text-violet-400 transition-colors" x-text="t('nav_pricing')">{{ t.nav_pricing }}</a>
                <a href="#faq" class="hover:text-violet-400 transition-colors">FAQ</a>
            </nav>

            <!-- Actions & Language Switcher -->
            <div class="flex items-center space-x-3 sm:space-x-4">
                <!-- Lang Toggle (UZ, RU, EN with full server-side & client-side support) -->
                <div class="flex items-center bg-white/10 p-1 rounded-xl text-xs font-bold border border-white/10">
                    <a href="/lang/uz/?next={{ request.get_full_path|urlencode }}"
                       @click="lang = 'uz'"
                       class="px-2.5 py-1 rounded-lg transition-all {% if lang == 'uz' %}bg-violet-600 text-white shadow-xs{% else %}text-slate-400 hover:text-white{% endif %}">UZ</a>
                    <a href="/lang/ru/?next={{ request.get_full_path|urlencode }}"
                       @click="lang = 'ru'"
                       class="px-2.5 py-1 rounded-lg transition-all {% if lang == 'ru' %}bg-violet-600 text-white shadow-xs{% else %}text-slate-400 hover:text-white{% endif %}">RU</a>
                    <a href="/lang/en/?next={{ request.get_full_path|urlencode }}"
                       @click="lang = 'en'"
                       class="px-2.5 py-1 rounded-lg transition-all {% if lang == 'en' %}bg-violet-600 text-white shadow-xs{% else %}text-slate-400 hover:text-white{% endif %}">EN</a>
                </div>

                <a href="/login/" class="hidden sm:inline-flex text-sm font-bold text-slate-300 hover:text-white transition-colors px-3 py-2" x-text="t('nav_login')">
                    {{ t.nav_login }}
                </a>

                <a href="/register/" class="shimmer-btn inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all shadow-lg shadow-violet-600/30 hover:-translate-y-0.5 gap-2">
                    <span x-text="t('nav_register')">{{ t.nav_register }}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4 text-violet-200"></i>
                </a>
            </div>
        </div>
    </header>

    <!-- HERO SECTION (Dark Glowing Purple Robosell Benchmark) -->
    <section class="relative pt-14 sm:pt-20 pb-20 lg:pb-32 overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

            <!-- High-Trust Pill Badge -->
            <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-violet-950/60 border border-violet-500/30 shadow-lg hover:border-violet-400 transition-all duration-300 mb-8 cursor-default">
                <span class="flex h-2.5 w-2.5 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                </span>
                <span class="text-xs sm:text-sm font-semibold text-violet-200" x-text="t('hero_badge')">
                    {{ t.hero_badge }}
                </span>
                <span class="text-xs font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-400/30">v2.4</span>
            </div>

            <!-- Main Heading with Dark Violet Gradient -->
            <h1 class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.2]">
                <span class="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent" x-text="t('hero_title_prefix')">{{ t.hero_title_prefix }}</span>
                <span x-text="t('hero_title_suffix')">{{ t.hero_title_suffix }}</span>
            </h1>

            <!-- Subtitle -->
            <p class="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal" x-text="t('hero_subtitle')">
                {{ t.hero_subtitle }}
            </p>

            <!-- CTA Buttons -->
            <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/register/" class="shimmer-btn w-full sm:w-auto px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-base transition-all shadow-xl shadow-violet-600/35 hover:shadow-violet-600/50 hover:-translate-y-1 flex items-center justify-center gap-3">
                    <span x-text="t('hero_cta_free')">{{ t.hero_cta_free }}</span>
                    <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
                </a>
                <a href="#showcase" class="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base transition-all border border-violet-500/30 shadow-xs hover:border-violet-400 flex items-center justify-center gap-2.5 group">
                    <i data-lucide="play-circle" class="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform"></i>
                    <span x-text="t('hero_cta_demo')">{{ t.hero_cta_demo }}</span>
                </a>
            </div>

            <!-- Key Trust Metric Badges -->
            <div class="mt-12 pt-8 border-t border-violet-900/30 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
                <div class="flex items-center space-x-3.5">
                    <div class="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                        <i data-lucide="check-circle-2" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="text-base font-extrabold text-white" x-text="t('stat_commission')">{{ t.stat_commission }}</div>
                        <div class="text-xs text-slate-400" x-text="t('stat_commission_sub')">{{ t.stat_commission_sub }}</div>
                    </div>
                </div>

                <div class="flex items-center space-x-3.5">
                    <div class="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                        <i data-lucide="send" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="text-base font-extrabold text-white" x-text="t('stat_channels')">{{ t.stat_channels }}</div>
                        <div class="text-xs text-slate-400" x-text="t('stat_channels_sub')">{{ t.stat_channels_sub }}</div>
                    </div>
                </div>

                <div class="flex items-center space-x-3.5">
                    <div class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <i data-lucide="zap" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="text-base font-extrabold text-white" x-text="t('stat_speed')">{{ t.stat_speed }}</div>
                        <div class="text-xs text-slate-400" x-text="t('stat_speed_sub')">{{ t.stat_speed_sub }}</div>
                    </div>
                </div>

                <div class="flex items-center space-x-3.5">
                    <div class="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <i data-lucide="shield-check" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <div class="text-base font-extrabold text-white" x-text="t('stat_uptime')">{{ t.stat_uptime }}</div>
                        <div class="text-xs text-slate-400" x-text="t('stat_uptime_sub')">{{ t.stat_uptime_sub }}</div>
                    </div>
                </div>
            </div>

            <!-- 3D LIVE DASHBOARD PREVIEW MOCKUP (Robosell Dark Dashboard) -->
            <div class="mt-12 sm:mt-16 relative max-w-5xl mx-auto">
                <div class="glass-card-dark rounded-3xl p-3 sm:p-5 border border-violet-500/30 shadow-2xl relative overflow-hidden">
                    <!-- Browser Window Header -->
                    <div class="flex items-center justify-between pb-4 mb-4 border-b border-white/10 px-2">
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                            <span class="ml-2 text-xs font-mono text-slate-400">admin.storebox.uz/dashboard</span>
                        </div>
                        <span class="text-xs font-bold text-violet-400 bg-violet-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online
                        </span>
                    </div>

                    <!-- Live Dashboard Metrics Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                            <span class="text-xs text-slate-400 font-medium" x-text="t('dash_revenue')">{{ t.dash_revenue }}</span>
                            <div class="text-xl sm:text-2xl font-black text-white mt-1">14,850,000 UZS</div>
                            <span class="text-[11px] text-emerald-400 font-bold" x-text="t('dash_growth')">{{ t.dash_growth }}</span>
                        </div>
                        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                            <span class="text-xs text-slate-400 font-medium" x-text="t('dash_orders')">{{ t.dash_orders }}</span>
                            <div class="text-xl sm:text-2xl font-black text-violet-300 mt-1">42 ta</div>
                            <span class="text-[11px] text-slate-400">YES POS sinxron</span>
                        </div>
                        <div class="bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                            <span class="text-xs text-slate-400 font-medium" x-text="t('dash_avg_check')">{{ t.dash_avg_check }}</span>
                            <div class="text-xl sm:text-2xl font-black text-white mt-1">185,000 UZS</div>
                            <span class="text-[11px] text-violet-300">Click & Payme</span>
                        </div>
                    </div>

                    <!-- Floating live order banner -->
                    <div class="bg-gradient-to-r from-violet-900/60 to-purple-900/60 border border-violet-500/40 rounded-2xl p-3.5 flex items-center justify-between text-left">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-sm">
                                ⚡
                            </div>
                            <div>
                                <div class="text-xs sm:text-sm font-bold text-white" x-text="t('dash_recent_order')">{{ t.dash_recent_order }}</div>
                                <div class="text-[11px] text-slate-300">Fast-Food Combo x2 • Samarqand filiali</div>
                            </div>
                        </div>
                        <span class="text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                            +64,000 UZS
                        </span>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- ================================================================= -->
    <!-- INTERACTIVE SHOWCASE ("Moslashuvchan dizayn" - Robosell Benchmark) -->
    <!-- ================================================================= -->
    <section id="showcase" class="py-20 lg:py-28 bg-[#0E0C22] border-y border-violet-900/40 relative overflow-hidden">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-12">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold mb-4">
                    <i data-lucide="monitor-smartphone" class="w-4 h-4"></i>
                    <span x-text="t('showcase_badge')">{{ t.showcase_badge }}</span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white" x-text="t('showcase_title')">
                    {{ t.showcase_title }}
                </h2>
                <p class="mt-4 text-base sm:text-lg text-slate-300" x-text="t('showcase_subtitle')">
                    {{ t.showcase_subtitle }}
                </p>

                <!-- Interactive Switchers (Platform: Website vs Telegram, Niche: Restaurant vs Retail) -->
                <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <!-- Platform toggle -->
                    <div class="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 text-xs font-bold">
                        <button type="button" @click="displayDevice = 'desktop'"
                                :class="displayDevice === 'desktop' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                                class="px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                            <i data-lucide="monitor" class="w-4 h-4"></i>
                            <span x-text="t('toggle_website')">{{ t.toggle_website }}</span>
                        </button>
                        <button type="button" @click="displayDevice = 'mobile'"
                                :class="displayDevice === 'mobile' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                                class="px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                            <i data-lucide="smartphone" class="w-4 h-4"></i>
                            <span x-text="t('toggle_telegram')">{{ t.toggle_telegram }}</span>
                        </button>
                    </div>

                    <!-- Business Niche toggle -->
                    <div class="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10 text-xs font-bold">
                        <button type="button" @click="simCategory = 'food'; simSubCat = 'all'"
                                :class="simCategory === 'food' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                                class="px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                            <span x-text="t('toggle_restaurant')">{{ t.toggle_restaurant }}</span>
                        </button>
                        <button type="button" @click="simCategory = 'clothes'; simSubCat = 'all'"
                                :class="simCategory === 'clothes' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'"
                                class="px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">
                            <span x-text="t('toggle_shop')">{{ t.toggle_shop }}</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Mockup Stage: Either Laptop (Web) or Smartphone (Telegram) -->
            <div class="max-w-5xl mx-auto flex justify-center">

                <!-- DESKTOP / LAPTOP MOCKUP VIEW -->
                <div x-show="displayDevice === 'desktop'" class="w-full bg-[#16132F] rounded-3xl border border-violet-500/30 p-4 sm:p-6 shadow-2xl space-y-4">
                    <!-- Browser Bar -->
                    <div class="flex items-center justify-between pb-3 border-b border-white/10">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full bg-rose-500/80"></span>
                            <span class="w-3 h-3 rounded-full bg-amber-500/80"></span>
                            <span class="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                        </div>
                        <div class="bg-white/10 px-4 py-1.5 rounded-xl text-xs font-mono text-slate-300 w-full max-w-sm text-center truncate">
                            https://<span x-text="currentSimStore.name.toLowerCase().replace(' ', '')">store</span>.storebox.uz
                        </div>
                        <div class="flex items-center gap-2 text-slate-400 text-xs font-bold">
                            <i data-lucide="shopping-cart" class="w-4 h-4 text-violet-400"></i>
                            <span x-text="simTotalCount">0</span>
                        </div>
                    </div>

                    <!-- Storefront Mockup Header -->
                    <div class="bg-gradient-to-r from-violet-900/50 to-purple-900/50 p-4 rounded-2xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl" x-text="currentSimStore.avatar">🌯</span>
                            <div>
                                <h3 class="text-lg font-black text-white" x-text="currentSimStore.name">Store</h3>
                                <p class="text-xs text-slate-300" x-text="currentSimStore.handle">@bot</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="text-xs font-bold text-amber-400 flex items-center gap-1 justify-end">★ <span x-text="currentSimStore.rating">4.9</span></span>
                            <span class="text-[11px] text-slate-400" x-text="currentSimStore.deliveryTime">20 min</span>
                        </div>
                    </div>

                    <!-- Horizontal Category Chips -->
                    <div class="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <template x-for="chip in currentSimStore.chips" :key="chip.id">
                            <button type="button" @click="simSubCat = chip.id"
                                    :class="simSubCat === chip.id ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/15'"
                                    class="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors"
                                    x-text="lang === 'ru' ? chip.nameRu : (lang === 'en' ? chip.nameEn : chip.name)">
                            </button>
                        </template>
                    </div>

                    <!-- Product Items Grid -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <template x-for="item in currentFilteredItems" :key="item.id">
                            <div class="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between hover:border-violet-500/50 transition-all">
                                <div class="space-y-2">
                                    <div class="h-36 rounded-xl overflow-hidden bg-white/5 relative">
                                        <img :src="item.img" :alt="item.name" class="w-full h-full object-cover">
                                        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-violet-600 text-white font-bold text-[10px]"
                                              x-text="lang === 'ru' ? item.badgeRu : (lang === 'en' ? item.badgeEn : item.badge)"></span>
                                    </div>
                                    <h4 class="text-sm font-bold text-white truncate" x-text="lang === 'ru' ? item.nameRu : (lang === 'en' ? item.nameEn : item.name)"></h4>
                                    <p class="text-[11px] text-slate-400 line-clamp-2" x-text="lang === 'ru' ? item.descRu : (lang === 'en' ? item.descEn : item.desc)"></p>
                                </div>
                                <div class="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                                    <span class="text-sm font-black text-white" x-text="item.price.toLocaleString() + ' UZS'"></span>
                                    <button type="button" @click="addToSimCart(item)"
                                            class="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all flex items-center gap-1">
                                        <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                                        <span x-text="t('sim_add_to_cart')">{{ t.sim_add_to_cart }}</span>
                                    </button>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Bottom Live Cart Bar -->
                    <div class="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-slate-400" x-text="t('sim_in_cart')">{{ t.sim_in_cart }}</span>
                            <span class="text-sm font-black text-violet-300 ml-1" x-text="simTotal.toLocaleString() + ' UZS'"></span>
                        </div>
                        <button type="button" @click="triggerSimOrder()"
                                :disabled="simCart.length === 0"
                                class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-extrabold text-xs shadow-md hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-40">
                            <span x-text="t('sim_checkout')">{{ t.sim_checkout }}</span>
                        </button>
                    </div>
                </div>

                <!-- SMARTPHONE / TELEGRAM WEBAPP MOCKUP VIEW -->
                <div x-show="displayDevice === 'mobile'" class="w-full max-w-sm bg-[#16132F] rounded-[40px] border-4 border-slate-800 p-4 shadow-2xl space-y-3 relative">
                    <!-- Telegram App Top Bar -->
                    <div class="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                        <button type="button" class="text-violet-400 font-bold text-xs">Close</button>
                        <div class="text-center">
                            <div class="font-bold text-white text-xs" x-text="currentSimStore.name">Store</div>
                            <div class="text-[9px] text-slate-400">bot</div>
                        </div>
                        <span class="text-slate-400 text-sm">•••</span>
                    </div>

                    <!-- Category Pills (Horizontal Scroll) -->
                    <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        <template x-for="chip in currentSimStore.chips" :key="chip.id">
                            <button type="button" @click="simSubCat = chip.id"
                                    :class="simSubCat === chip.id ? 'bg-violet-600 text-white' : 'bg-white/10 text-slate-300'"
                                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap"
                                    x-text="lang === 'ru' ? chip.nameRu : (lang === 'en' ? chip.nameEn : chip.name)">
                            </button>
                        </template>
                    </div>

                    <!-- Mobile Products List -->
                    <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                        <template x-for="item in currentFilteredItems" :key="item.id">
                            <div class="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center justify-between gap-2.5">
                                <div class="flex items-center gap-2.5 min-w-0">
                                    <img :src="item.img" :alt="item.name" class="w-12 h-12 rounded-lg object-cover shrink-0">
                                    <div class="min-w-0">
                                        <div class="text-xs font-bold text-white truncate" x-text="lang === 'ru' ? item.nameRu : (lang === 'en' ? item.nameEn : item.name)"></div>
                                        <div class="text-[11px] font-black text-violet-300" x-text="item.price.toLocaleString() + ' UZS'"></div>
                                    </div>
                                </div>
                                <button type="button" @click="addToSimCart(item)"
                                        class="px-2.5 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-bold shrink-0">
                                    +
                                </button>
                            </div>
                        </template>
                    </div>

                    <!-- Telegram WebApp Main Button (Simulated Checkout) -->
                    <button type="button" @click="triggerSimOrder()"
                            :disabled="simCart.length === 0"
                            class="w-full py-3 rounded-2xl bg-violet-600 text-white font-extrabold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-between px-4 disabled:opacity-40">
                        <span x-text="t('sim_checkout')">{{ t.sim_checkout }}</span>
                        <span x-text="simTotal.toLocaleString() + ' UZS'">0 UZS</span>
                    </button>
                </div>

            </div>

            <!-- Order Toast Notification -->
            <div x-show="simNotification"
                 x-transition:enter="transition ease-out duration-300 transform"
                 x-transition:enter-start="-translate-y-4 opacity-0"
                 x-transition:enter-end="translate-y-0 opacity-100"
                 x-transition:leave="transition ease-in duration-200 transform"
                 x-transition:leave-start="translate-y-0 opacity-100"
                 x-transition:leave-end="-translate-y-4 opacity-0"
                 class="max-w-md mx-auto mt-6 bg-violet-900/90 border border-violet-400 p-4 rounded-2xl shadow-xl flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0">✓</div>
                <div>
                    <div class="text-xs font-bold text-white" x-text="t('sim_order_success')">{{ t.sim_order_success }}</div>
                    <div class="text-[11px] text-violet-200" x-text="t('sim_order_note')">{{ t.sim_order_note }}</div>
                </div>
            </div>
        </div>
    </section>

    <!-- ================================================================= -->
    <!-- PAYMENTS & POS ECOSYSTEM                                          -->
    <!-- ================================================================= -->
    <section id="payments" class="py-20 lg:py-28 bg-[#0B0918] relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-14">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold mb-4">
                    <i data-lucide="credit-card" class="w-4 h-4"></i>
                    <span x-text="t('eco_badge')">{{ t.eco_badge }}</span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white" x-text="t('eco_title')">
                    {{ t.eco_title }}
                </h2>
                <p class="mt-4 text-base sm:text-lg text-slate-300" x-text="t('eco_subtitle')">
                    {{ t.eco_subtitle }}
                </p>
            </div>

            <!-- Ecosystem Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div class="glass-card-dark rounded-3xl p-6 space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-black">
                        💳
                    </div>
                    <h3 class="text-lg font-bold text-white" x-text="t('eco_payme_title')">{{ t.eco_payme_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('eco_payme_desc')">{{ t.eco_payme_desc }}</p>
                    <div class="pt-2 flex items-center gap-2 text-xs font-bold text-slate-300">
                        <span class="px-2 py-1 rounded-md bg-white/10">Click</span>
                        <span class="px-2 py-1 rounded-md bg-white/10">Payme</span>
                        <span class="px-2 py-1 rounded-md bg-white/10">Uzum Pay</span>
                    </div>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3 border-violet-500/50 shadow-violet-900/30 shadow-xl">
                    <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                        ⚡
                    </div>
                    <h3 class="text-lg font-bold text-white" x-text="t('eco_pos_title')">{{ t.eco_pos_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('eco_pos_desc')">{{ t.eco_pos_desc }}</p>
                    <div class="pt-2 flex items-center gap-2 text-xs font-bold text-slate-300">
                        <span class="px-2 py-1 rounded-md bg-violet-600/40 text-violet-200 border border-violet-500/40">YES POS</span>
                        <span class="px-2 py-1 rounded-md bg-white/10">iiko</span>
                        <span class="px-2 py-1 rounded-md bg-white/10">Jowi</span>
                    </div>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3">
                    <div class="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                        🚚
                    </div>
                    <h3 class="text-lg font-bold text-white" x-text="t('eco_courier_title')">{{ t.eco_courier_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('eco_courier_desc')">{{ t.eco_courier_desc }}</p>
                    <div class="pt-2 flex items-center gap-2 text-xs font-bold text-slate-300">
                        <span class="px-2 py-1 rounded-md bg-white/10">Yandex Go</span>
                        <span class="px-2 py-1 rounded-md bg-white/10">Live GPS</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ================================================================= -->
    <!-- KEY FEATURES                                                      -->
    <!-- ================================================================= -->
    <section id="features" class="py-20 lg:py-28 bg-[#0E0C22] border-t border-violet-900/40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-14">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold mb-4">
                    <i data-lucide="sparkles" class="w-4 h-4"></i>
                    <span x-text="t('feat_badge')">{{ t.feat_badge }}</span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white" x-text="t('feat_title')">
                    {{ t.feat_title }}
                </h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                <div class="glass-card-dark rounded-3xl p-6 space-y-3 hover:border-violet-400 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center">
                        <i data-lucide="send" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-base font-bold text-white" x-text="t('feat_1_title')">{{ t.feat_1_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('feat_1_desc')">{{ t.feat_1_desc }}</p>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3 hover:border-violet-400 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <i data-lucide="qr-code" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-base font-bold text-white" x-text="t('feat_2_title')">{{ t.feat_2_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('feat_2_desc')">{{ t.feat_2_desc }}</p>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3 hover:border-violet-400 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-base font-bold text-white" x-text="t('feat_3_title')">{{ t.feat_3_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('feat_3_desc')">{{ t.feat_3_desc }}</p>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3 hover:border-violet-400 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                        <i data-lucide="printer" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-base font-bold text-white" x-text="t('feat_4_title')">{{ t.feat_4_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('feat_4_desc')">{{ t.feat_4_desc }}</p>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3 hover:border-violet-400 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <i data-lucide="map-pin" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-base font-bold text-white" x-text="t('feat_5_title')">{{ t.feat_5_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('feat_5_desc')">{{ t.feat_5_desc }}</p>
                </div>

                <div class="glass-card-dark rounded-3xl p-6 space-y-3 hover:border-violet-400 transition-all">
                    <div class="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <i data-lucide="megaphone" class="w-5 h-5"></i>
                    </div>
                    <h3 class="text-base font-bold text-white" x-text="t('feat_6_title')">{{ t.feat_6_title }}</h3>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('feat_6_desc')">{{ t.feat_6_desc }}</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ================================================================= -->
    <!-- PRICING SECTION (Clean, Transparent, Robosell Style)               -->
    <!-- ================================================================= -->
    <section id="pricing" class="py-20 lg:py-28 bg-[#0B0918] border-t border-violet-900/40 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-14">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold mb-4">
                    <i data-lucide="tag" class="w-4 h-4"></i>
                    <span x-text="t('price_badge')">{{ t.price_badge }}</span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white" x-text="t('price_title')">
                    {{ t.price_title }}
                </h2>
                <p class="mt-4 text-base text-slate-300" x-text="t('price_subtitle')">
                    {{ t.price_subtitle }}
                </p>

                <!-- Billing Cycle Switch -->
                <div class="mt-8 inline-flex items-center p-1.5 bg-white/10 border border-white/10 rounded-2xl shadow-xs">
                    <button type="button" @click="billingCycle = 'monthly'"
                            :class="billingCycle === 'monthly' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:text-white'"
                            class="px-5 py-2 rounded-xl text-xs font-bold transition-all"
                            x-text="t('billing_monthly')">
                        {{ t.billing_monthly }}
                    </button>
                    <button type="button" @click="billingCycle = 'annual'"
                            :class="billingCycle === 'annual' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-300 hover:text-white'"
                            class="px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5">
                        <span x-text="t('billing_annual')">{{ t.billing_annual }}</span>
                        <span class="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full" x-text="t('billing_discount')">{{ t.billing_discount }}</span>
                    </button>
                </div>
            </div>

            <!-- Pricing Cards Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                <!-- Tier 1: Start -->
                <div class="glass-card-dark p-8 rounded-3xl flex flex-col justify-between hover:border-violet-400 transition-all">
                    <div>
                        <h3 class="text-lg font-bold text-white mb-1" x-text="t('plan_start')">{{ t.plan_start }}</h3>
                        <p class="text-xs text-slate-400 mb-6" x-text="t('plan_start_sub')">{{ t.plan_start_sub }}</p>
                        <div class="mb-6">
                            <span class="text-3xl sm:text-4xl font-black text-white" x-text="t('plan_start_price')">{{ t.plan_start_price }}</span>
                            <div class="text-xs font-bold text-slate-400 mt-1" x-text="t('plan_start_period')">{{ t.plan_start_period }}</div>
                        </div>
                        <ul class="space-y-3 text-xs sm:text-sm text-slate-300 font-medium">
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_start_f1')">{{ t.plan_start_f1 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_start_f2')">{{ t.plan_start_f2 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_start_f3')">{{ t.plan_start_f3 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_start_f4')">{{ t.plan_start_f4 }}</span></li>
                        </ul>
                    </div>
                    <div class="mt-8">
                        <a href="/register/" class="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-colors" x-text="t('cta_try')">
                            {{ t.cta_try }}
                        </a>
                    </div>
                </div>

                <!-- Tier 2: Standard (Highlighted with Violet Glow) -->
                <div class="glass-card-dark p-8 rounded-3xl flex flex-col justify-between border-2 border-violet-500 shadow-2xl relative scale-105 z-10">
                    <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                        <span x-text="t('plan_popular')">{{ t.plan_popular }}</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-white mb-1" x-text="t('plan_standard')">{{ t.plan_standard }}</h3>
                        <p class="text-xs text-slate-400 mb-6" x-text="t('plan_standard_sub')">{{ t.plan_standard_sub }}</p>
                        <div class="mb-6">
                            <span class="text-3xl sm:text-4xl font-black text-violet-300" x-text="billingCycle === 'annual' ? t('plan_standard_price_annual') : t('plan_standard_price_monthly')">{{ t.plan_standard_price_monthly }}</span>
                            <span class="text-xs font-bold text-slate-400" x-text="t('plan_standard_period')">{{ t.plan_standard_period }}</span>
                        </div>
                        <ul class="space-y-3 text-xs sm:text-sm text-slate-200 font-medium">
                            <li class="flex items-center gap-2.5 font-bold text-white"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_standard_f1')">{{ t.plan_standard_f1 }}</span></li>
                            <li class="flex items-center gap-2.5 font-bold text-white"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_standard_f2')">{{ t.plan_standard_f2 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_standard_f3')">{{ t.plan_standard_f3 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_standard_f4')">{{ t.plan_standard_f4 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_standard_f5')">{{ t.plan_standard_f5 }}</span></li>
                        </ul>
                    </div>
                    <div class="mt-8">
                        <a href="/register/" class="shimmer-btn w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm flex items-center justify-center shadow-lg shadow-violet-600/40 transition-all" x-text="t('cta_try')">
                            {{ t.cta_try }}
                        </a>
                    </div>
                </div>

                <!-- Tier 3: Premium -->
                <div class="glass-card-dark p-8 rounded-3xl flex flex-col justify-between hover:border-violet-400 transition-all">
                    <div>
                        <h3 class="text-lg font-bold text-white mb-1" x-text="t('plan_premium')">{{ t.plan_premium }}</h3>
                        <p class="text-xs text-slate-400 mb-6" x-text="t('plan_premium_sub')">{{ t.plan_premium_sub }}</p>
                        <div class="mb-6">
                            <span class="text-3xl sm:text-4xl font-black text-white" x-text="billingCycle === 'annual' ? t('plan_premium_price_annual') : t('plan_premium_price_monthly')">{{ t.plan_premium_price_monthly }}</span>
                            <span class="text-xs font-bold text-slate-400" x-text="t('plan_premium_period')">{{ t.plan_premium_period }}</span>
                        </div>
                        <ul class="space-y-3 text-xs sm:text-sm text-slate-300 font-medium">
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_premium_f1')">{{ t.plan_premium_f1 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_premium_f2')">{{ t.plan_premium_f2 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_premium_f3')">{{ t.plan_premium_f3 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_premium_f4')">{{ t.plan_premium_f4 }}</span></li>
                            <li class="flex items-center gap-2.5"><i data-lucide="check" class="w-4 h-4 text-violet-400 shrink-0"></i><span x-text="t('plan_premium_f5')">{{ t.plan_premium_f5 }}</span></li>
                        </ul>
                    </div>
                    <div class="mt-8">
                        <a href="/register/" class="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center transition-colors" x-text="t('cta_try')">
                            {{ t.cta_try }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ================================================================= -->
    <!-- FAQ ACCORDION                                                     -->
    <!-- ================================================================= -->
    <section id="faq" class="py-20 lg:py-28 bg-[#0E0C22] border-t border-violet-900/40">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-14">
                <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold mb-4">
                    <i data-lucide="help-circle" class="w-4 h-4"></i>
                    <span x-text="t('faq_badge')">{{ t.faq_badge }}</span>
                </div>
                <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-white" x-text="t('faq_title')">
                    {{ t.faq_title }}
                </h2>
                <p class="mt-3 text-sm sm:text-base text-slate-400" x-text="t('faq_subtitle')">
                    {{ t.faq_subtitle }}
                </p>
            </div>

            <div class="space-y-4">
                <!-- FAQ 1 -->
                <div class="glass-card-dark rounded-2xl overflow-hidden border border-violet-500/20">
                    <button type="button" @click="openFaq = openFaq === 1 ? null : 1"
                            class="w-full px-6 py-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between">
                        <span x-text="t('faq_q1')">{{ t.faq_q1 }}</span>
                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200" :class="openFaq === 1 ? 'rotate-180 text-violet-400' : ''"></i>
                    </button>
                    <div x-show="openFaq === 1" class="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                        <span x-text="t('faq_a1')">{{ t.faq_a1 }}</span>
                    </div>
                </div>

                <!-- FAQ 2 -->
                <div class="glass-card-dark rounded-2xl overflow-hidden border border-violet-500/20">
                    <button type="button" @click="openFaq = openFaq === 2 ? null : 2"
                            class="w-full px-6 py-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between">
                        <span x-text="t('faq_q2')">{{ t.faq_q2 }}</span>
                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200" :class="openFaq === 2 ? 'rotate-180 text-violet-400' : ''"></i>
                    </button>
                    <div x-show="openFaq === 2" class="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                        <span x-text="t('faq_a2')">{{ t.faq_a2 }}</span>
                    </div>
                </div>

                <!-- FAQ 3 -->
                <div class="glass-card-dark rounded-2xl overflow-hidden border border-violet-500/20">
                    <button type="button" @click="openFaq = openFaq === 3 ? null : 3"
                            class="w-full px-6 py-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between">
                        <span x-text="t('faq_q3')">{{ t.faq_q3 }}</span>
                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200" :class="openFaq === 3 ? 'rotate-180 text-violet-400' : ''"></i>
                    </button>
                    <div x-show="openFaq === 3" class="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                        <span x-text="t('faq_a3')">{{ t.faq_a3 }}</span>
                    </div>
                </div>

                <!-- FAQ 4 -->
                <div class="glass-card-dark rounded-2xl overflow-hidden border border-violet-500/20">
                    <button type="button" @click="openFaq = openFaq === 4 ? null : 4"
                            class="w-full px-6 py-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between">
                        <span x-text="t('faq_q4')">{{ t.faq_q4 }}</span>
                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200" :class="openFaq === 4 ? 'rotate-180 text-violet-400' : ''"></i>
                    </button>
                    <div x-show="openFaq === 4" class="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                        <span x-text="t('faq_a4')">{{ t.faq_a4 }}</span>
                    </div>
                </div>

                <!-- FAQ 5 -->
                <div class="glass-card-dark rounded-2xl overflow-hidden border border-violet-500/20">
                    <button type="button" @click="openFaq = openFaq === 5 ? null : 5"
                            class="w-full px-6 py-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between">
                        <span x-text="t('faq_q5')">{{ t.faq_q5 }}</span>
                        <i data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-200" :class="openFaq === 5 ? 'rotate-180 text-violet-400' : ''"></i>
                    </button>
                    <div x-show="openFaq === 5" class="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/10 pt-3">
                        <span x-text="t('faq_a5')">{{ t.faq_a5 }}</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ================================================================= -->
    <!-- BOTTOM CALL-TO-ACTION                                             -->
    <!-- ================================================================= -->
    <section class="py-20 bg-gradient-to-b from-[#0B0918] to-[#080612] text-white relative overflow-hidden border-t border-violet-900/40">
        <div class="absolute inset-0 bg-grid-violet-pattern opacity-15 pointer-events-none"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-violet-600/20 blur-[130px] rounded-full pointer-events-none"></div>

        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 class="text-3xl sm:text-5xl font-black tracking-tight mb-6 text-white" x-text="t('bottom_cta_title')">
                {{ t.bottom_cta_title }}
            </h2>
            <p class="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10" x-text="t('bottom_cta_subtitle')">
                {{ t.bottom_cta_subtitle }}
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/register/" class="shimmer-btn px-9 py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-base shadow-xl shadow-violet-600/40 hover:-translate-y-1 transition-all flex items-center gap-2">
                    <span x-text="t('bottom_cta_btn')">{{ t.bottom_cta_btn }}</span>
                    <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
                </a>
                <a href="/login/" class="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-base border border-white/10 transition-all" x-text="t('nav_login')">
                    {{ t.nav_login }}
                </a>
            </div>
        </div>
    </section>

    <!-- ================================================================= -->
    <!-- RICH DARK FOOTER (Robosell.uz Style Benchmark)                    -->
    <!-- ================================================================= -->
    <footer class="bg-[#070510] border-t border-violet-900/40 pt-16 pb-12 text-slate-400 text-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <!-- 4-Column Footer Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <!-- Col 1: Brand Info -->
                <div class="space-y-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white font-black">
                            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
                        </div>
                        <span class="font-extrabold text-white text-xl">StoreBox</span>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed" x-text="t('footer_desc')">
                        {{ t.footer_desc }}
                    </p>
                    <div class="pt-2 flex items-center gap-3">
                        <a href="https://t.me/storebox_support" target="_blank" rel="noopener noreferrer"
                           class="w-9 h-9 rounded-xl bg-white/10 hover:bg-violet-600 text-white flex items-center justify-center transition-colors">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                           class="w-9 h-9 rounded-xl bg-white/10 hover:bg-violet-600 text-white flex items-center justify-center transition-colors">
                            <i data-lucide="instagram" class="w-4 h-4"></i>
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                           class="w-9 h-9 rounded-xl bg-white/10 hover:bg-violet-600 text-white flex items-center justify-center transition-colors">
                            <i data-lucide="youtube" class="w-4 h-4"></i>
                        </a>
                    </div>
                </div>

                <!-- Col 2: Products & Modules -->
                <div class="space-y-3">
                    <h4 class="text-white font-bold text-sm tracking-wide uppercase" x-text="t('footer_col_product')">{{ t.footer_col_product }}</h4>
                    <ul class="space-y-2 text-xs">
                        <li><a href="#features" class="hover:text-violet-400 transition-colors" x-text="t('nav_features')">{{ t.nav_features }}</a></li>
                        <li><a href="#showcase" class="hover:text-violet-400 transition-colors" x-text="t('nav_showcase')">{{ t.nav_showcase }}</a></li>
                        <li><a href="#payments" class="hover:text-violet-400 transition-colors" x-text="t('nav_payments')">{{ t.nav_payments }}</a></li>
                        <li><a href="#pricing" class="hover:text-violet-400 transition-colors" x-text="t('nav_pricing')">{{ t.nav_pricing }}</a></li>
                        <li><a href="/register/" class="hover:text-violet-400 transition-colors" x-text="t('hero_cta_free')">{{ t.hero_cta_free }}</a></li>
                    </ul>
                </div>

                <!-- Col 3: Contacts & Working Hours -->
                <div class="space-y-3">
                    <h4 class="text-white font-bold text-sm tracking-wide uppercase" x-text="t('footer_col_contacts')">{{ t.footer_col_contacts }}</h4>
                    <ul class="space-y-2.5 text-xs">
                        <li class="flex items-center gap-2">
                            <i data-lucide="phone" class="w-4 h-4 text-violet-400 shrink-0"></i>
                            <a href="tel:+998781138212" class="font-mono font-bold text-white hover:text-violet-400 transition-colors" x-text="t('footer_phone')">{{ t.footer_phone }}</a>
                        </li>
                        <li class="flex items-center gap-2 text-slate-400">
                            <i data-lucide="clock" class="w-4 h-4 text-violet-400 shrink-0"></i>
                            <span x-text="t('footer_phone_hours')">{{ t.footer_phone_hours }}</span>
                        </li>
                        <li class="flex items-center gap-2">
                            <i data-lucide="mail" class="w-4 h-4 text-violet-400 shrink-0"></i>
                            <a href="mailto:support@storebox.uz" class="hover:text-violet-400 transition-colors" x-text="t('footer_email')">{{ t.footer_email }}</a>
                        </li>
                        <li class="flex items-start gap-2 text-slate-400">
                            <i data-lucide="map-pin" class="w-4 h-4 text-violet-400 shrink-0 mt-0.5"></i>
                            <span x-text="t('footer_address')">{{ t.footer_address }}</span>
                        </li>
                    </ul>
                </div>

                <!-- Col 4: Quick Sign-up / Login & Security -->
                <div class="space-y-3">
                    <h4 class="text-white font-bold text-sm tracking-wide uppercase">StoreBox Platform</h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        Telegram orqali 15 daqiqada o'z brendingiz vitrinasini oching. Barcha ma'lumotlar shifrlangan va xavfsiz saqlanadi.
                    </p>
                    <div class="pt-2">
                        <a href="/register/" class="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors gap-1.5">
                            <span x-text="t('nav_register')">{{ t.nav_register }}</span>
                            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Bottom Copyright & Legal Links -->
            <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <span class="text-slate-500" x-text="t('footer_rights')">{{ t.footer_rights }}</span>
                <div class="flex items-center gap-6">
                    <a href="#" class="text-slate-500 hover:text-slate-300 transition-colors" x-text="t('footer_privacy')">{{ t.footer_privacy }}</a>
                    <a href="#" class="text-slate-500 hover:text-slate-300 transition-colors" x-text="t('footer_terms')">{{ t.footer_terms }}</a>
                </div>
            </div>
        </div>
    </footer>

</div>
{% endblock %}
'''

with open('templates/core/landing.html', 'w', encoding='utf-8') as f:
    f.write(template_content)

print("landing.html written successfully, size:", len(template_content))
