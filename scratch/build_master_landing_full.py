import os

def generate_landing_html():
    return """{% extends "base.html" %}

{% block title %}{{ t.page_title }}{% endblock %}

{% block extra_head %}
<style>
    /* ============================================================ */
    /* STOREBOX PREMIUM GLASSMORPHISM & DESIGN SYSTEM               */
    /* ============================================================ */
    
    /* True Frosted Glassmorphism (Light Sections) */
    .glass-card {
        background: rgba(255, 255, 255, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(226, 232, 240, 0.85);
        box-shadow: 0 10px 30px -5px rgba(124, 58, 237, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.02);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-card:hover {
        background: rgba(255, 255, 255, 0.96);
        border-color: rgba(139, 92, 246, 0.45);
        box-shadow: 0 20px 40px -10px rgba(124, 58, 237, 0.12), 0 8px 20px -4px rgba(0, 0, 0, 0.04);
        transform: translateY(-2px);
    }

    /* True Frosted Glassmorphism (Dark Sections) */
    .glass-card-dark {
        background: rgba(18, 14, 40, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(139, 92, 246, 0.22);
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
    }

    /* Floating Pill Navbar */
    .glass-pill-nav {
        background: rgba(15, 10, 38, 0.85);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }

    /* Glass Badges in Hero */
    .glass-badge-hero {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.16);
        box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3);
        transition: all 0.25s ease;
    }
    .glass-badge-hero:hover {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(167, 139, 250, 0.45);
        transform: translateY(-1px);
    }

    /* 3D Perspective Canvas */
    .perspective-1200 { perspective: 1200px; }
    .transform-style-3d { transform-style: preserve-3d; }
    
    /* Clean micro-pattern */
    .bg-grid-violet-pattern {
        background-image: radial-gradient(rgba(124, 58, 237, 0.08) 1.2px, transparent 1.2px);
        background-size: 24px 24px;
    }

    /* Perspective 3D Grid Plane for Hero */
    .hero-perspective-grid {
        background-image: linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
        background-size: 40px 40px;
        mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%);
        -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%);
    }

    /* Shimmer Button */
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
        transform: rotate(30deg);
        animation: shimmer-swipe 4s infinite;
    }
    @keyframes shimmer-swipe {
        0% { transform: translateX(-100%) rotate(30deg); }
        30%, 100% { transform: translateX(100%) rotate(30deg); }
    }

    /* Pulse animation for live orders */
    @keyframes live-pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.03); opacity: 0.85; }
    }
    .animate-live-pulse {
        animation: live-pulse 2.5s ease-in-out infinite;
    }

    /* Typing animation dots */
    @keyframes typing-dot {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
    }
    .typing-dot {
        animation: typing-dot 1.4s infinite ease-in-out both;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
</style>
{% endblock %}

{% block content %}
<div class="min-h-screen bg-[#F8F9FD] bg-grid-violet-pattern text-slate-800 font-sans antialiased selection:bg-violet-600 selection:text-white">

    <!-- ======================================================== -->
    <!-- 1. HERO SECTION (DEEP DARK #070519 WITH GLASSMORPHIC HUD) -->
    <!-- ======================================================== -->
    <section class="relative bg-[#070519] text-white overflow-hidden pb-24 border-b border-violet-950/40">
        <!-- Perspective 3D Grid & Ambient Glows -->
        <div class="absolute inset-0 pointer-events-none hero-perspective-grid opacity-60"></div>
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-600/20 blur-[180px] pointer-events-none rounded-full"></div>
        <div class="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/15 blur-[140px] pointer-events-none rounded-full"></div>
        <div class="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-purple-600/15 blur-[150px] pointer-events-none rounded-full"></div>

        <!-- 1.1 FLOATING PILL NAVBAR -->
        <header class="relative z-50 pt-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div class="glass-pill-nav rounded-full px-5 py-3 flex items-center justify-between">
                
                <!-- Left: Logo & Brand -->
                <a href="/" class="flex items-center gap-2.5 group">
                    <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6035EE] via-[#7C3AED] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition transform">
                        <i data-lucide="layers" class="w-5 h-5 text-white"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                            StoreBox
                            <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 border border-violet-400/30">2.0</span>
                        </span>
                    </div>
                </a>

                <!-- Center: Exact Menu Links (Robosell.uz Standard) -->
                <nav class="hidden md:flex items-center space-x-1 text-xs font-bold text-slate-300">
                    <a href="#analytics" class="px-3.5 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_features }}</a>
                    <a href="#pricing" class="px-3.5 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_pricing }}</a>
                    <a href="#contact" class="px-3.5 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_contact }}</a>
                    <a href="#news" class="px-3.5 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_news }}</a>
                    <a href="#reviews" class="px-3.5 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_about }}</a>
                </nav>

                <!-- Right: Language Switcher & Login CTA -->
                <div class="flex items-center gap-3">
                    <!-- Language Dropdown -->
                    <div class="relative">
                        <button onclick="toggleLangDropdown(event)" class="glass-badge-hero px-3 py-1.5 rounded-full text-xs font-bold text-slate-200 flex items-center gap-1.5 hover:text-white transition">
                            <span>{% if lang == 'ru' %}🇷🇺 Рус{% elif lang == 'en' %}🇬🇧 Eng{% else %}🇺🇿 O'zb{% endif %}</span>
                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400"></i>
                        </button>
                        <div id="langDropdown" class="hidden absolute right-0 mt-2 w-32 glass-card-dark rounded-2xl border border-white/15 shadow-2xl py-1.5 z-50 text-xs font-semibold">
                            <a href="?lang=uz" class="flex items-center gap-2 px-3.5 py-2 hover:bg-white/10 transition text-slate-200 hover:text-white {% if lang == 'uz' or not lang %}text-violet-400 font-black{% endif %}">
                                <span>🇺🇿</span> <span>O'zbek</span>
                            </a>
                            <a href="?lang=ru" class="flex items-center gap-2 px-3.5 py-2 hover:bg-white/10 transition text-slate-200 hover:text-white {% if lang == 'ru' %}text-violet-400 font-black{% endif %}">
                                <span>🇷🇺</span> <span>Русский</span>
                            </a>
                            <a href="?lang=en" class="flex items-center gap-2 px-3.5 py-2 hover:bg-white/10 transition text-slate-200 hover:text-white {% if lang == 'en' %}text-violet-400 font-black{% endif %}">
                                <span>🇬🇧</span> <span>English</span>
                            </a>
                        </div>
                    </div>

                    <!-- Login CTA Button -->
                    <a href="/login/" class="shimmer-btn px-5 py-2 rounded-full bg-[#704fe6] hover:bg-[#5e3ed6] text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition transform hover:scale-105">
                        {{ t.nav_login }}
                    </a>

                    <!-- Mobile Menu Hamburger -->
                    <button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10">
                        <i data-lucide="menu" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile Drawer Menu -->
            <div id="mobileMenuDrawer" class="hidden md:hidden mt-2 backdrop-blur-2xl bg-[#0F0A26]/95 border border-white/15 rounded-2xl shadow-2xl p-4 transition-all text-white">
                <nav class="flex flex-col space-y-2.5 text-sm font-semibold text-slate-200">
                    <a href="#analytics" onclick="closeMobileMenu()" class="px-3 py-2 rounded-lg hover:bg-white/10 transition">{{ t.nav_features }}</a>
                    <a href="#pricing" onclick="closeMobileMenu()" class="px-3 py-2 rounded-lg hover:bg-white/10 transition">{{ t.nav_pricing }}</a>
                    <a href="#contact" onclick="closeMobileMenu()" class="px-3 py-2 rounded-lg hover:bg-white/10 transition">{{ t.nav_contact }}</a>
                    <a href="#news" onclick="closeMobileMenu()" class="px-3 py-2 rounded-lg hover:bg-white/10 transition">{{ t.nav_news }}</a>
                    <a href="#reviews" onclick="closeMobileMenu()" class="px-3 py-2 rounded-lg hover:bg-white/10 transition">{{ t.nav_about }}</a>
                    <div class="h-px bg-white/10 my-2"></div>
                    <div class="flex items-center justify-between pt-1">
                        <span class="text-xs text-slate-400 font-bold uppercase">Til:</span>
                        <div class="flex items-center gap-2">
                            <a href="?lang=uz" class="px-2.5 py-1 rounded-md text-xs font-bold {% if lang == 'uz' or not lang %}bg-violet-600 text-white{% else %}bg-white/10 text-slate-300{% endif %}">UZ</a>
                            <a href="?lang=ru" class="px-2.5 py-1 rounded-md text-xs font-bold {% if lang == 'ru' %}bg-violet-600 text-white{% else %}bg-white/10 text-slate-300{% endif %}">RU</a>
                            <a href="?lang=en" class="px-2.5 py-1 rounded-md text-xs font-bold {% if lang == 'en' %}bg-violet-600 text-white{% else %}bg-white/10 text-slate-300{% endif %}">EN</a>
                        </div>
                    </div>
                    <div class="pt-2">
                        <a href="/login/" class="block text-center w-full py-2.5 text-xs font-bold text-white bg-[#704fe6] rounded-xl shadow-md">{{ t.nav_login }}</a>
                    </div>
                </nav>
            </div>
        </header>

        <!-- 1.2 HERO TITLE & SUBTITLE -->
        <div class="pt-12 sm:pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative z-10">
            <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.12] mb-5">
                {{ t.hero_title_prefix }}<br>
                <span class="bg-gradient-to-r from-white via-violet-200 to-purple-300 bg-clip-text text-transparent">{{ t.hero_title_suffix }}</span>
            </h1>

            <p class="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
                {{ t.hero_subtitle }}
            </p>

            <!-- 5 KEY TRUST BADGES & PILLS (FROSTED GLASS) -->
            <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-4xl mx-auto mb-8">
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span class="text-white">{{ t.stat_speed }}</span>
                </div>
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200">
                    <i data-lucide="percent" class="w-3.5 h-3.5 text-violet-400"></i>
                    <span>{{ t.stat_commission }}</span>
                </div>
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200">
                    <i data-lucide="smartphone" class="w-3.5 h-3.5 text-blue-400"></i>
                    <span>{{ t.stat_channels }}</span>
                </div>
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200 border-emerald-500/30 bg-emerald-950/20">
                    <i data-lucide="receipt" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span class="text-emerald-300">{{ t.badge_fiscal }}</span>
                </div>
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-sky-400"></i>
                    <span>{{ t.stat_uptime }}</span>
                </div>
            </div>

            <!-- CTAs -->
            <div class="flex flex-wrap items-center justify-center gap-4">
                <a href="/register/" class="shimmer-btn px-8 py-3.5 rounded-full bg-[#704fe6] hover:bg-[#5e3ed6] text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition transform hover:scale-105 flex items-center gap-2">
                    <span>{{ t.hero_cta_free }}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
                <button onclick="openPlatformVideoModal()" class="glass-badge-hero px-6 py-3.5 rounded-full text-slate-200 hover:text-white font-bold text-sm transition flex items-center gap-2">
                    <i data-lucide="play-circle" class="w-4 h-4 text-violet-400"></i>
                    <span>{{ t.hero_cta_demo }}</span>
                </button>
            </div>
        </div>

        <!-- 1.3 HIGH-FIDELITY STOREBOX DASHBOARD MOCKUP (ROBOSELL BENCHMARK) -->
        <div class="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-20 mt-4">
            <div id="heroMockupWindow" class="glass-card-dark rounded-3xl border border-[#2B2256] shadow-[0_30px_90px_rgba(0,0,0,0.75)] overflow-hidden transition-all duration-300">
                
                <!-- Mockup Mac OS Header -->
                <div class="px-5 py-3.5 border-b border-[#251D4A] bg-[#161131] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <!-- Left: Window Dots & Store Selector -->
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1.5">
                            <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50"></span>
                            <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50"></span>
                            <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50"></span>
                        </div>
                        <div class="h-4 w-px bg-slate-700/60 mx-1"></div>
                        <div class="flex items-center gap-2">
                            <span class="font-extrabold text-sm text-white tracking-tight">storebox</span>
                            <div class="px-2.5 py-1 rounded-lg bg-[#1D1740] border border-violet-700/40 text-[11px] font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                                <span>Samarqand Milliy Taomlari</span>
                                <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400"></i>
                            </div>
                            <button class="w-6 h-6 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">+</button>
                        </div>
                    </div>

                    <!-- Right: Controls & Balance Pill -->
                    <div class="flex items-center gap-3">
                        <!-- Dark / Light Mode Switcher Pill -->
                        <div class="px-2 py-1 rounded-full bg-[#0D0924] border border-white/10 flex items-center gap-1 text-[11px]">
                            <button onclick="toggleMockupTheme('light')" id="mockupLightBtn" class="px-2 py-0.5 rounded-full text-slate-400 hover:text-white flex items-center gap-1">
                                <i data-lucide="sun" class="w-3 h-3"></i> Light
                            </button>
                            <button onclick="toggleMockupTheme('dark')" id="mockupDarkBtn" class="px-2.5 py-0.5 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1 shadow-sm">
                                <i data-lucide="moon" class="w-3 h-3"></i> Dark
                            </button>
                        </div>

                        <!-- Balance Indicator -->
                        <div class="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A143A] border border-violet-800/40 text-[11px]">
                            <span class="text-slate-400 font-medium">Balans:</span>
                            <span class="font-black text-emerald-400">27 320 000 UZS</span>
                            <button class="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-black leading-none">+</button>
                        </div>

                        <!-- Notifications & User -->
                        <div class="relative">
                            <i data-lucide="bell" class="w-4 h-4 text-slate-400 hover:text-white cursor-pointer"></i>
                            <span class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                        </div>
                        <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
                            SM
                        </div>
                        <button class="px-3 py-1 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1">
                            <span>+ Yangi buyurtma</span>
                        </button>
                    </div>
                </div>

                <!-- Mockup Body (Sidebar + Orders Content) -->
                <div class="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
                    <!-- Sidebar -->
                    <div class="hidden md:block md:col-span-3 border-r border-[#251D4A] bg-[#0E0A24]/90 p-4 space-y-1.5 text-xs font-semibold">
                        <div class="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2.5 cursor-pointer">
                            <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                            <span>Boshqaruv paneli</span>
                        </div>
                        <div class="px-3 py-2 rounded-xl bg-violet-600/30 text-white border border-violet-500/30 flex items-center justify-between font-bold cursor-pointer">
                            <span class="flex items-center gap-2.5">
                                <i data-lucide="shopping-bag" class="w-4 h-4 text-violet-400"></i>
                                <span>Buyurtmalar</span>
                            </span>
                            <span class="px-1.5 py-0.5 rounded-full bg-violet-600 text-[10px] text-white font-black">7</span>
                        </div>
                        <div class="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2.5 cursor-pointer">
                            <i data-lucide="users" class="w-4 h-4"></i>
                            <span>Mijozlar bazasi</span>
                        </div>
                        <div class="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-between cursor-pointer">
                            <span class="flex items-center gap-2.5">
                                <i data-lucide="message-square" class="w-4 h-4"></i>
                                <span>Mijozlar bilan chat</span>
                            </span>
                            <span class="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">94</span>
                        </div>
                        <div class="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2.5 cursor-pointer">
                            <i data-lucide="pie-chart" class="w-4 h-4"></i>
                            <span>Marketing & Aksiya</span>
                        </div>
                        <div class="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2.5 cursor-pointer">
                            <i data-lucide="grid" class="w-4 h-4"></i>
                            <span>Kategoriyalar</span>
                        </div>
                        <div class="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center gap-2.5 cursor-pointer">
                            <i data-lucide="package" class="w-4 h-4"></i>
                            <span>Mahsulotlar</span>
                        </div>
                        <div class="pt-6">
                            <div class="p-3 rounded-2xl bg-gradient-to-b from-violet-900/30 to-purple-900/10 border border-violet-700/30 text-[11px] text-slate-300">
                                <div class="font-bold text-white mb-1 flex items-center gap-1.5">
                                    <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
                                    <span>StoreBox Pro</span>
                                </div>
                                <span>Faol obuna: Cheksiz buyurtmalar</span>
                            </div>
                        </div>
                    </div>

                    <!-- Main Table Area -->
                    <div class="md:col-span-9 p-4 sm:p-5 flex flex-col justify-between">
                        <div>
                            <!-- Header & Filter Tabs -->
                            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <h3 class="text-base font-extrabold text-white">Buyurtmalar ro'yxati (List of orders)</h3>
                                <div class="flex items-center gap-2">
                                    <button class="px-3 py-1.5 rounded-xl bg-[#1A143A] hover:bg-[#231B4D] border border-white/10 text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                                        <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5"></i>
                                        <span>Filtrlar</span>
                                    </button>
                                    <button class="px-3 py-1.5 rounded-xl bg-[#1A143A] hover:bg-[#231B4D] border border-white/10 text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
                                        <i data-lucide="download" class="w-3.5 h-3.5"></i>
                                        <span>Eksport</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Tabs (Robo.uz Order Statuses) -->
                            <div class="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs font-bold border-b border-[#251D4A]">
                                <button class="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-extrabold shrink-0 shadow-sm">Barchasi</button>
                                <button class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                                    <span>Yangi</span>
                                    <span class="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">7</span>
                                </button>
                                <button class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                                    <span>Jarayonda</span>
                                    <span class="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">3</span>
                                </button>
                                <button class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                                    <span>Kechikkan</span>
                                    <span class="px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 text-[10px]">4</span>
                                </button>
                                <button class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white shrink-0 flex items-center gap-1.5">
                                    <span>Yetkazildi</span>
                                    <span class="px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 text-[10px]">13</span>
                                </button>
                            </div>

                            <!-- Live Incoming Order Notification Alert -->
                            <div id="liveIncomingAlert" class="mb-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs animate-live-pulse">
                                <div class="flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                    <span class="font-bold text-emerald-300">Yangi buyurtma keldi!</span>
                                    <span class="text-slate-300 hidden sm:inline">#87660 — Otabek Yo'ldoshev (Payme: 145 000 UZS)</span>
                                </div>
                                <span class="text-[10px] text-emerald-400 font-mono">Hozirgina</span>
                            </div>

                            <!-- Orders Table -->
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr class="text-slate-400 border-b border-[#251D4A] pb-2">
                                            <th class="py-2.5 px-3 font-semibold">BUYURTMA ID</th>
                                            <th class="py-2.5 px-3 font-semibold">MIJOZ ISMI</th>
                                            <th class="py-2.5 px-3 font-semibold">SANA & VAQT</th>
                                            <th class="py-2.5 px-3 font-semibold">SUMMA</th>
                                            <th class="py-2.5 px-3 font-semibold">TO'LOV</th>
                                            <th class="py-2.5 px-3 font-semibold">TURI</th>
                                            <th class="py-2.5 px-3 font-semibold">STATUS</th>
                                            <th class="py-2.5 px-3 font-semibold text-center">AMALLAR</th>
                                        </tr>
                                    </thead>
                                    <tbody id="mockupTableBody" class="divide-y divide-[#201842] text-slate-200">
                                        <!-- Row 1 -->
                                        <tr id="row-87659" class="hover:bg-white/5 transition">
                                            <td class="py-3 px-3 font-mono font-bold text-violet-400">#87659</td>
                                            <td class="py-3 px-3 font-semibold">Sarvarbek Erkinjonov</td>
                                            <td class="py-3 px-3 text-slate-400">17:35; Bugun</td>
                                            <td class="py-3 px-3 font-black text-white">107 000 UZS</td>
                                            <td class="py-3 px-3"><span class="text-emerald-400 font-bold">💵 Naqd</span></td>
                                            <td class="py-3 px-3 text-slate-300">Olib ketish</td>
                                            <td class="py-3 px-3"><span id="status-87659" class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">Yangi</span></td>
                                            <td class="py-3 px-3 text-center">
                                                <div id="actions-87659" class="flex items-center justify-center gap-1.5">
                                                    <button onclick="handleMockupOrderAction('87659', 'reject')" class="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white text-[11px] font-bold transition">Bekor</button>
                                                    <button onclick="handleMockupOrderAction('87659', 'confirm')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition">Tasdiqlash</button>
                                                </div>
                                            </td>
                                        </tr>
                                        <!-- Row 2 -->
                                        <tr id="row-127855" class="hover:bg-white/5 transition">
                                            <td class="py-3 px-3 font-mono font-bold text-violet-400">#127855</td>
                                            <td class="py-3 px-3 font-semibold">Jacob Jones</td>
                                            <td class="py-3 px-3 text-slate-400">17:33; Bugun</td>
                                            <td class="py-3 px-3 font-black text-white">248 500 UZS</td>
                                            <td class="py-3 px-3"><span class="text-sky-400 font-bold">💳 Click</span></td>
                                            <td class="py-3 px-3 text-slate-300">Yetkazish</td>
                                            <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px]">Jarayonda</span></td>
                                            <td class="py-3 px-3 text-center">
                                                <button onclick="showMockupToast('Buyurtma #127855 yetkazilmoqda!')" class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold shadow-sm transition">Yo'lda</button>
                                            </td>
                                        </tr>
                                        <!-- Row 3 -->
                                        <tr id="row-127854" class="hover:bg-white/5 transition">
                                            <td class="py-3 px-3 font-mono font-bold text-violet-400">#127854</td>
                                            <td class="py-3 px-3 font-semibold">Dilshodbek Karimov</td>
                                            <td class="py-3 px-3 text-slate-400">17:15; Bugun</td>
                                            <td class="py-3 px-3 font-black text-white">65 000 UZS</td>
                                            <td class="py-3 px-3"><span class="text-cyan-400 font-bold">💳 Payme</span></td>
                                            <td class="py-3 px-3 text-slate-300">Olib ketish</td>
                                            <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-bold text-[10px]">Tayyor</span></td>
                                            <td class="py-3 px-3 text-center">
                                                <button onclick="showMockupToast('Buyurtma #127854 mijozga topshirildi!')" class="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold transition">Topshirish</button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Feedback Toast inside Mockup -->
                        <div id="mockupToast" class="hidden mt-3 p-2.5 rounded-xl bg-violet-900/80 border border-violet-500 text-xs font-bold text-white text-center shadow-lg transition-all">
                            Amal bajarildi
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 2. STOREBOX AFZALLIKLARI (5 BENTO ANALYTICS CARDS - CLEAN WHITE SAAS) -->
    <!-- ======================================================== -->
    <section id="analytics" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-14">
            <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                {{ t.analytics_badge|safe }}
            </h2>
            <p class="text-slate-600 text-sm sm:text-base">
                {{ t.analytics_subtitle }}
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <!-- Card 1: Trafik manbalari (Donut Chart 709 Users) -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-slate-900 text-base">{{ t.analytics_traffic_title }}</h3>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Barcha manbalar</span>
                    </div>

                    <!-- Donut Chart representation -->
                    <div class="relative w-44 h-44 mx-auto my-3 flex items-center justify-center">
                        <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" stroke-width="3"></circle>
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#7C3AED" stroke-width="3.5" stroke-dasharray="42 58" stroke-dashoffset="0"></circle>
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3B82F6" stroke-width="3.5" stroke-dasharray="35 65" stroke-dashoffset="-42"></circle>
                            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#EC4899" stroke-width="3.5" stroke-dasharray="23 77" stroke-dashoffset="-77"></circle>
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span class="text-3xl font-black text-slate-900 leading-none">709</span>
                            <span class="text-[11px] font-semibold text-slate-400 mt-1">{{ t.analytics_traffic_users }}</span>
                        </div>
                    </div>

                    <!-- Traffic Breakdown Legend -->
                    <div class="space-y-2 pt-2 text-xs font-semibold text-slate-600">
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-violet-600"></span>{{ t.analytics_traffic_tg }}</span>
                            <span class="font-bold text-slate-900">64%</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>{{ t.analytics_traffic_search }}</span>
                            <span class="font-bold text-slate-900">26%</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-pink-500"></span>{{ t.analytics_traffic_social }}</span>
                            <span class="font-bold text-slate-900">10%</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: Savdo statistikasi -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-slate-900 text-base">{{ t.analytics_sales_stats }}</h3>
                        <span class="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">+28.4% o'sish</span>
                    </div>

                    <div class="space-y-4 my-2">
                        <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-bold">
                                    <i data-lucide="wallet" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <div class="text-xs text-slate-500 font-medium">Haftalik daromad</div>
                                    <div class="text-base font-black text-slate-900">32 450 000 UZS</div>
                                </div>
                            </div>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <div class="text-xs text-slate-500 font-medium">Bajarilgan buyurtmalar</div>
                                    <div class="text-base font-black text-slate-900">412 ta</div>
                                </div>
                            </div>
                        </div>

                        <div class="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold">
                                    <i data-lucide="credit-card" class="w-5 h-5"></i>
                                </div>
                                <div>
                                    <div class="text-xs text-slate-500 font-medium">O'rtacha chek</div>
                                    <div class="text-base font-black text-slate-900">78 500 UZS</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 3: Platforma hisoboti (Telegram / Web / Instagram) -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-slate-900 text-base">{{ t.analytics_platform_report }}</h3>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Hafta</span>
                    </div>

                    <div class="space-y-4 my-2">
                        <!-- Telegram Bot -->
                        <div>
                            <div class="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span class="flex items-center gap-2 text-slate-800">
                                    <i data-lucide="send" class="w-3.5 h-3.5 text-blue-500"></i>
                                    {{ t.analytics_channel_tg }}
                                </span>
                                <span class="text-violet-700 font-black">54 buyurtma</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-gradient-to-r from-blue-500 to-violet-600 h-2.5 rounded-full" style="width: 75%"></div>
                            </div>
                        </div>

                        <!-- Veb-sayt -->
                        <div>
                            <div class="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span class="flex items-center gap-2 text-slate-800">
                                    <i data-lucide="globe" class="w-3.5 h-3.5 text-emerald-500"></i>
                                    {{ t.analytics_channel_web }}
                                </span>
                                <span class="text-slate-600 font-black">28 buyurtma</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full" style="width: 40%"></div>
                            </div>
                        </div>

                        <!-- Instagram -->
                        <div>
                            <div class="flex items-center justify-between text-xs font-bold mb-1.5">
                                <span class="flex items-center gap-2 text-slate-800">
                                    <i data-lucide="instagram" class="w-3.5 h-3.5 text-pink-500"></i>
                                    {{ t.analytics_channel_insta }}
                                </span>
                                <span class="text-slate-600 font-black">18 buyurtma</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-gradient-to-r from-pink-500 to-rose-500 h-2.5 rounded-full" style="width: 25%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 4: Top 10 mahsulot (Span 2 cols on lg) -->
            <div class="glass-card rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-slate-900 text-base">{{ t.analytics_top_products }}</h3>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Eng ko'p sotilganlar</span>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="text-slate-400 border-b border-slate-100">
                                    <th class="py-2.5 font-semibold">MAHSULOT</th>
                                    <th class="py-2.5 font-semibold">KATEGORIYA</th>
                                    <th class="py-2.5 font-semibold text-right">SOTILDI</th>
                                    <th class="py-2.5 font-semibold text-right">DAROMAD</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                                <tr>
                                    <td class="py-3 flex items-center gap-2.5">
                                        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=60&auto=format&fit=crop&q=80" class="w-8 h-8 rounded-lg object-cover">
                                        <span class="font-bold text-slate-900">Katta Burger Classic</span>
                                    </td>
                                    <td class="py-3 text-slate-500">Fast-fud</td>
                                    <td class="py-3 text-right font-bold text-slate-900">142 ta</td>
                                    <td class="py-3 text-right font-black text-violet-700">6 816 000 UZS</td>
                                </tr>
                                <tr>
                                    <td class="py-3 flex items-center gap-2.5">
                                        <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=60&auto=format&fit=crop&q=80" class="w-8 h-8 rounded-lg object-cover">
                                        <span class="font-bold text-slate-900">Pitsa Margarita 32sm</span>
                                    </td>
                                    <td class="py-3 text-slate-500">Pitsa</td>
                                    <td class="py-3 text-right font-bold text-slate-900">98 ta</td>
                                    <td class="py-3 text-right font-black text-violet-700">6 370 000 UZS</td>
                                </tr>
                                <tr>
                                    <td class="py-3 flex items-center gap-2.5">
                                        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=60&auto=format&fit=crop&q=80" class="w-8 h-8 rounded-lg object-cover">
                                        <span class="font-bold text-slate-900">Qovurma Lag'mon</span>
                                    </td>
                                    <td class="py-3 text-slate-500">Issiq taomlar</td>
                                    <td class="py-3 text-right font-bold text-slate-900">84 ta</td>
                                    <td class="py-3 text-right font-black text-violet-700">3 780 000 UZS</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Card 5: Savdolar dinamikasi (Curved SVG Graph) -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-extrabold text-slate-900 text-base">{{ t.analytics_sales_dynamics }}</h3>
                        <span class="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">Haftalik o'sish</span>
                    </div>

                    <!-- Clean SVG Line Chart -->
                    <div class="my-3">
                        <svg class="w-full h-32" viewBox="0 0 200 80" fill="none">
                            <defs>
                                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.3"></stop>
                                    <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d="M0,60 C30,50 60,70 90,35 C120,10 150,40 200,15 L200,80 L0,80 Z" fill="url(#curveGradient)"></path>
                            <path d="M0,60 C30,50 60,70 90,35 C120,10 150,40 200,15" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"></path>
                            <circle cx="90" cy="35" r="4" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2"></circle>
                            <circle cx="200" cy="15" r="4" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2"></circle>
                        </svg>
                        <div class="flex justify-between text-[11px] text-slate-400 font-bold px-1 mt-1">
                            <span>Dush</span>
                            <span>Sesh</span>
                            <span>Chor</span>
                            <span>Pay</span>
                            <span>Jum</span>
                            <span>Shan</span>
                            <span>Yak</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 3. MOSLASHUVCHAN DIZAYN (DARK INTERACTIVE DEVICE SHOWCASE) -->
    <!-- ======================================================== -->
    <section id="showcase" class="py-20 px-4 sm:px-6 lg:px-8 bg-[#070519] text-white border-y border-violet-950/40 relative overflow-hidden scroll-mt-24">
        <!-- Ambient radial glow -->
        <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-600/15 blur-[160px]"></div>
        </div>

        <div class="text-center max-w-3xl mx-auto mb-10 relative z-10">
            <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                {{ t.showcase_badge|safe }}
            </h2>
            <p class="text-slate-400 text-sm sm:text-base leading-relaxed">
                {{ t.showcase_subtitle }}
            </p>
        </div>

        <!-- Interactive Layout Controls -->
        <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-10 relative z-10">
            <div class="text-xs text-slate-400 font-medium">
                Kompyuter va mobil qurilmalarda real vaqtda ko'rinish
            </div>

            <!-- Controls: Platformalar & Dizayn turlari -->
            <div class="flex flex-wrap items-center gap-3">
                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-bold">Platforma:</span>
                    <div class="p-1 rounded-2xl bg-[#140E33] border border-white/10 flex items-center text-xs font-bold">
                        <button id="toggleWebBtn" onclick="switchSimPlatform('web')" class="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white shadow-sm transition flex items-center gap-1.5">
                            <i data-lucide="globe" class="w-3.5 h-3.5"></i>
                            <span>Veb-sayt</span>
                        </button>
                        <button id="toggleTgBtn" onclick="switchSimPlatform('telegram')" class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5">
                            <i data-lucide="send" class="w-3.5 h-3.5"></i>
                            <span>Telegram WebApp</span>
                        </button>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <span class="text-xs text-slate-400 font-bold">Soha:</span>
                    <div class="p-1 rounded-2xl bg-[#140E33] border border-white/10 flex items-center text-xs font-bold">
                        <button id="toggleRestoBtn" onclick="switchSimNiche('restaurant')" class="px-3.5 py-1.5 rounded-xl bg-violet-600 text-white shadow-sm transition flex items-center gap-1.5">
                            <i data-lucide="utensils" class="w-3.5 h-3.5"></i>
                            <span>Restoran</span>
                        </button>
                        <button id="toggleShopBtn" onclick="switchSimNiche('shop')" class="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5">
                            <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
                            <span>Onlayn do'kon</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Devices Container (Laptop + Mobile Side by Side) -->
        <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            <!-- Laptop Device Mockup (Desktop View) -->
            <div id="simLaptopContainer" class="lg:col-span-8 bg-[#120E28] rounded-3xl p-3 border border-violet-800/40 shadow-2xl transition-all duration-300">
                <!-- Browser bar -->
                <div class="px-4 py-2 bg-[#1A143A] rounded-2xl flex items-center justify-between mb-3 text-xs text-slate-400 border border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <div id="simUrlBar" class="px-4 py-0.5 rounded-lg bg-[#0F0A24] text-[11px] font-mono text-slate-300 truncate max-w-xs text-center border border-white/5">
                        https://samarqand-taomlari.storebox.uz
                    </div>
                    <div class="flex items-center gap-2">
                        <i data-lucide="lock" class="w-3 h-3 text-emerald-400"></i>
                    </div>
                </div>

                <!-- Live Storefront Screen Content -->
                <div class="bg-white text-slate-900 rounded-2xl p-5 overflow-hidden min-h-[380px] shadow-inner">
                    <!-- Storefront Top Header -->
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                        <div class="flex items-center gap-2.5">
                            <div id="simBrandLogo" class="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-sm">
                                🍔
                            </div>
                            <span id="simBrandName" class="font-extrabold text-sm text-slate-900">Samarqand Taomlari</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs font-bold">
                            <span class="px-3 py-1 rounded-full bg-violet-50 text-violet-700">9:00 - 23:00 Ochiq</span>
                            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Sliding Banner -->
                    <div id="simBannerContainer" class="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-5 mb-5 relative overflow-hidden flex items-center justify-between shadow-md">
                        <div class="relative z-10 max-w-sm">
                            <span class="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">Aksiya</span>
                            <h4 id="simBannerTitle" class="text-lg font-black leading-tight mb-1">Maxsus Chegirma — Barcha menyu uchun 20%</h4>
                            <p id="simBannerSubtitle" class="text-xs text-violet-100">Bugun buyurtma bering va 30 daqiqada bepul yetkazib berishga ega bo'ling!</p>
                        </div>
                        <div class="hidden sm:block">
                            <span class="px-4 py-2 rounded-xl bg-white text-violet-700 font-extrabold text-xs shadow">Buyurtma berish</span>
                        </div>
                    </div>

                    <!-- Categories Row -->
                    <div id="simCategoriesRow" class="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none text-xs font-bold">
                        <span class="px-3.5 py-1.5 rounded-full bg-violet-600 text-white shrink-0">Barchasi</span>
                        <span class="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 shrink-0">Fast-Fud</span>
                        <span class="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 shrink-0">Milliy Taomlar</span>
                        <span class="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 shrink-0">Pitsalar</span>
                        <span class="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 shrink-0">Ichimliklar</span>
                    </div>

                    <!-- Products Grid with Interactive Click Trigger -->
                    <div id="simProductsGrid" class="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                        <!-- Product 1 -->
                        <div onclick="openProductPreviewModal('Katta Burger Classic', '48 000 UZS', 'Marmar mol go\\'shti, karamellangan piyoz, maxsus sous', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80')" class="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-violet-300 hover:shadow-md transition cursor-pointer group">
                            <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80" class="w-full h-24 object-cover rounded-xl mb-2 group-hover:scale-105 transition transform">
                            <div class="font-extrabold text-xs text-slate-900 truncate">Katta Burger Classic</div>
                            <div class="text-[11px] text-slate-500 line-clamp-1 mb-1.5">Marmar mol go'shti</div>
                            <div class="flex items-center justify-between">
                                <span class="font-black text-xs text-violet-700">48 000 UZS</span>
                                <button class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">+</button>
                            </div>
                        </div>

                        <!-- Product 2 -->
                        <div onclick="openProductPreviewModal('Pitsa Margarita 32sm', '65 000 UZS', 'Mozzarella pishlog\\'i, pomidor, maxsus rayhon sousi', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80')" class="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-violet-300 hover:shadow-md transition cursor-pointer group">
                            <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80" class="w-full h-24 object-cover rounded-xl mb-2 group-hover:scale-105 transition transform">
                            <div class="font-extrabold text-xs text-slate-900 truncate">Pitsa Margarita 32sm</div>
                            <div class="text-[11px] text-slate-500 line-clamp-1 mb-1.5">Mozzarella, pomidor</div>
                            <div class="flex items-center justify-between">
                                <span class="font-black text-xs text-violet-700">65 000 UZS</span>
                                <button class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">+</button>
                            </div>
                        </div>

                        <!-- Product 3 -->
                        <div onclick="openProductPreviewModal('Qovurma Lag\\'mon', '45 000 UZS', 'Mol go\\'shti, cho\\'zma xamir, yangi sabzavotlar', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80')" class="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-violet-300 hover:shadow-md transition cursor-pointer group">
                            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80" class="w-full h-24 object-cover rounded-xl mb-2 group-hover:scale-105 transition transform">
                            <div class="font-extrabold text-xs text-slate-900 truncate">Qovurma Lag'mon</div>
                            <div class="text-[11px] text-slate-500 line-clamp-1 mb-1.5">Mol go'shti, sabzavotlar</div>
                            <div class="flex items-center justify-between">
                                <span class="font-black text-xs text-violet-700">45 000 UZS</span>
                                <button class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile Device Mockup (iPhone 16 Pro Frame) -->
            <div class="lg:col-span-4 flex justify-center">
                <div class="relative w-[290px] rounded-[48px] border-4 border-slate-800 bg-slate-950 p-2 shadow-2xl ring-1 ring-white/20">
                    <!-- Dynamic Island -->
                    <div class="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-30 flex items-center justify-end px-2">
                        <span class="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                    </div>

                    <!-- Screen -->
                    <div class="rounded-[40px] bg-white text-slate-900 overflow-hidden text-xs h-[480px] flex flex-col justify-between pt-6">
                        <!-- Telegram TMA Header Bar -->
                        <div class="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] font-bold">
                            <span class="text-blue-500 flex items-center gap-1">✕ Telegram WebApp</span>
                            <span id="simMobileBrand" class="font-black text-slate-900">Do'kon</span>
                            <span class="text-slate-400">•••</span>
                        </div>

                        <!-- Scrollable Feed -->
                        <div class="p-3 overflow-y-auto space-y-3 flex-1">
                            <!-- Mobile Promo Banner -->
                            <div class="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-3 shadow-sm">
                                <span class="text-[9px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded">Aksiya</span>
                                <div class="font-black text-xs mt-1">20% chegirma oling</div>
                                <div class="text-[10px] text-violet-100">Barcha mahsulotlarga</div>
                            </div>

                            <!-- Mobile Categories Carousel -->
                            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
                                <span class="px-2.5 py-1 rounded-full bg-violet-600 text-white shrink-0">Barchasi</span>
                                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">Fast-Fud</span>
                                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">Pitsalar</span>
                                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">Ichimlik</span>
                            </div>

                            <!-- Mobile Item List -->
                            <div onclick="openProductPreviewModal('Katta Burger Classic', '48 000 UZS', 'Marmar mol go\\'shti, karamellangan piyoz', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                                <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&auto=format&fit=crop&q=80" class="w-12 h-12 rounded-lg object-cover">
                                <div class="flex-1">
                                    <div class="font-bold text-xs text-slate-900">Katta Burger</div>
                                    <div class="text-[10px] text-slate-500">Marmar go'sht</div>
                                    <div class="font-black text-xs text-violet-700 mt-0.5">48 000 UZS</div>
                                </div>
                                <button class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">+</button>
                            </div>

                            <div onclick="openProductPreviewModal('Pitsa Margarita 32sm', '65 000 UZS', 'Mozzarella pishlog\\'i, pomidor', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80')" class="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                                <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&auto=format&fit=crop&q=80" class="w-12 h-12 rounded-lg object-cover">
                                <div class="flex-1">
                                    <div class="font-bold text-xs text-slate-900">Pitsa Margarita</div>
                                    <div class="text-[10px] text-slate-500">Mozzarella</div>
                                    <div class="font-black text-xs text-violet-700 mt-0.5">65 000 UZS</div>
                                </div>
                                <button class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs">+</button>
                            </div>
                        </div>

                        <!-- Mobile Bottom Bar -->
                        <div class="p-2.5 border-t border-slate-100 bg-slate-50">
                            <button class="w-full py-2 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-between px-3">
                                <span>Savatni ko'rish</span>
                                <span>48 000 UZS →</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 4. STOREBOX ISHONCHLI HAMKOR (CLEAN LIGHT PARTNERSHIP BANNER) -->
    <!-- ======================================================== -->
    <section class="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div class="max-w-4xl mx-auto py-12 px-6 rounded-3xl bg-gradient-to-b from-violet-50/80 to-purple-50/40 border border-violet-100 shadow-sm relative overflow-hidden">
            <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 font-bold text-xs uppercase tracking-wider mb-3 relative z-10">
                {{ t.shop_badge|safe }}
            </div>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3 relative z-10">
                StoreBox - Sizning ishonchli biznes hamkoringiz
            </h2>
            <p class="text-slate-600 text-sm sm:text-base max-w-xl mx-auto mb-8 relative z-10">
                StoreBox bilan hayotingizni yengillashtiring va biznesingiz daromadini oshiring
            </p>
            <a href="/register/" class="shimmer-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#704fe6] hover:bg-[#5e3ed6] text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition transform hover:scale-105 relative z-10">
                <span>Bepul sinab ko'ring</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </a>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 5. STOREBOX RESTORAN (EXACT FEATURE CHECKLIST & APP SHOWCASE) -->
    <!-- ======================================================== -->
    <section id="resto" class="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <!-- Left: iPhone Restaurant Mockup -->
            <div class="lg:col-span-5 order-2 lg:order-1">
                <div class="relative mx-auto max-w-[280px] rounded-[40px] border-4 border-slate-800 bg-slate-900 p-2 shadow-2xl">
                    <div class="rounded-[32px] bg-white text-slate-900 overflow-hidden text-xs h-[520px] flex flex-col justify-between">
                        <!-- Top header -->
                        <div class="p-4 border-b border-slate-100">
                            <div class="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3 text-violet-600"></i> Boburshoh dahasi, 111 ▼</span>
                                <span class="text-violet-600 font-bold">Ochiq</span>
                            </div>
                            <div class="font-black text-sm text-slate-900">Robo Restoran</div>
                        </div>

                        <!-- Menu items list -->
                        <div class="p-3 space-y-2.5 overflow-y-auto flex-1">
                            <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <span class="px-2.5 py-1 rounded-full bg-violet-600 text-white text-[10px] font-bold">Lag'mon</span>
                                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">Manti</span>
                                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">Somsa</span>
                                <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">Shashlik</span>
                            </div>

                            <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&auto=format&fit=crop&q=80" class="w-14 h-14 rounded-lg object-cover">
                                <div class="flex-1">
                                    <div class="font-bold text-slate-900 text-xs">Uyg'urcha Qovurma Lag'mon</div>
                                    <div class="text-[10px] text-slate-500">Mol go'shti, sabzavotlar</div>
                                    <div class="font-black text-violet-600 text-xs mt-1">45 000 UZS</div>
                                </div>
                                <button class="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold">+</button>
                            </div>

                            <div class="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&auto=format&fit=crop&q=80" class="w-14 h-14 rounded-lg object-cover">
                                <div class="flex-1">
                                    <div class="font-bold text-slate-900 text-xs">Maxsus Tandir Somsa</div>
                                    <div class="text-[10px] text-slate-500">Qo'y go'shti, mayin piyoz</div>
                                    <div class="font-black text-violet-600 text-xs mt-1">12 000 UZS</div>
                                </div>
                                <button class="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold">+</button>
                            </div>
                        </div>

                        <!-- Footer Order CTA -->
                        <div class="p-3 border-t border-slate-100 bg-slate-50">
                            <button class="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-between px-3">
                                <span>2 ta taom tanlandi</span>
                                <span>57 000 UZS →</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: 4 Checklist Cards & CTA -->
            <div class="lg:col-span-7 order-1 lg:order-2">
                <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                    {{ t.resto_badge|safe }}
                </h2>
                <p class="text-slate-600 text-sm sm:text-base mb-8">
                    Mehmonlaringiz uchun qulaylik yarating va savdolaringizni oshiring
                </p>

                <div class="space-y-4 mb-8">
                    <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm mb-0.5">Reklama bannerlari</h4>
                            <p class="text-xs text-slate-500">Sizning mehmonlaringiz ko'rishi aniq bo'lgan bannerlar</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm mb-0.5">Promokodlar</h4>
                            <p class="text-xs text-slate-500">Doimiy mehmonlarga promokodlar sovg'a qiling</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm mb-0.5">Chegirmalar/Aksiyalar</h4>
                            <p class="text-xs text-slate-500">Barcha mehmonlar uchun chegirmalar/aksiyalar o'tkazing</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                        <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm mb-0.5">Qidiruv shakli</h4>
                            <p class="text-xs text-slate-500">Kerakli taomni tezda toping</p>
                        </div>
                    </div>
                </div>

                <a href="/register/" class="shimmer-btn inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#704fe6] hover:bg-[#5e3ed6] text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 transition">
                    <span>Boshlash</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
            </div>

        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 5.5 STOREBOX QANDAY ISHLAYDI? (HOW IT WORKS - 4 STEPS + VIDEO GUIDE) -->
    <!-- ======================================================== -->
    <section id="how" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-14">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-700 font-bold text-xs uppercase tracking-wider mb-4">
                {{ t.how_badge }}
            </span>
            <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                {{ t.how_title|safe }}
            </h2>
            <p class="text-slate-600 text-sm sm:text-base mb-6">
                {{ t.how_subtitle }}
            </p>
            <button onclick="openPlatformVideoModal()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition transform hover:scale-105">
                <i data-lucide="play-circle" class="w-4 h-4"></i>
                <span>{{ t.how_video_guide_btn|safe }}</span>
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Step 1 -->
            <div class="glass-card rounded-3xl p-6 relative overflow-hidden">
                <div class="text-4xl font-black text-violet-200 mb-3">{{ t.how_step1_num }}</div>
                <h3 class="font-extrabold text-slate-900 text-base mb-2">{{ t.how_step1_title }}</h3>
                <p class="text-xs text-slate-500 leading-relaxed">{{ t.how_step1_desc }}</p>
            </div>
            <!-- Step 2 -->
            <div class="glass-card rounded-3xl p-6 relative overflow-hidden">
                <div class="text-4xl font-black text-violet-200 mb-3">{{ t.how_step2_num }}</div>
                <h3 class="font-extrabold text-slate-900 text-base mb-2">{{ t.how_step2_title }}</h3>
                <p class="text-xs text-slate-500 leading-relaxed">{{ t.how_step2_desc }}</p>
            </div>
            <!-- Step 3 -->
            <div class="glass-card rounded-3xl p-6 relative overflow-hidden">
                <div class="text-4xl font-black text-violet-200 mb-3">{{ t.how_step3_num }}</div>
                <h3 class="font-extrabold text-slate-900 text-base mb-2">{{ t.how_step3_title }}</h3>
                <p class="text-xs text-slate-500 leading-relaxed">{{ t.how_step3_desc }}</p>
            </div>
            <!-- Step 4 -->
            <div class="glass-card rounded-3xl p-6 relative overflow-hidden">
                <div class="text-4xl font-black text-violet-200 mb-3">{{ t.how_step4_num }}</div>
                <h3 class="font-extrabold text-slate-900 text-base mb-2">{{ t.how_step4_title }}</h3>
                <p class="text-xs text-slate-500 leading-relaxed">{{ t.how_step4_desc }}</p>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 6. MIJOZLARINGIZ BILAN DOIMO ALOQADA BO'LING (DARK SECTION WITH LIVE CHAT) -->
    <!-- ======================================================== -->
    <section id="chat" class="py-20 px-4 sm:px-6 lg:px-8 bg-[#070519] text-white border-y border-violet-950/40 relative overflow-hidden scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-14">
            <h2 class="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                Mijozlaringiz bilan doimo aloqada bo'ling
            </h2>
            <p class="text-slate-400 text-sm sm:text-base">
                Endi mijozlar bilan muloqot qilish yanada qulay. Admin panelidan chiqmasdan turib mijoz bilan yozishmalarni olib boring
            </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            
            <!-- Left: Laptop Admin Chat View -->
            <div class="lg:col-span-7 bg-[#140E33] rounded-3xl p-5 shadow-2xl border border-violet-900/40">
                <div class="flex items-center justify-between pb-3 mb-3 border-b border-violet-900/30 text-xs font-bold text-slate-200">
                    <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Mijozlar bilan onlayn chat</span>
                    </span>
                    <span class="text-violet-400">94 yangi xabar</span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 min-h-[260px]">
                    <!-- Mini Chat List -->
                    <div class="sm:col-span-4 border-r border-violet-900/30 space-y-1.5 text-xs">
                        <div class="p-2 rounded-xl bg-violet-600/30 text-white font-bold flex items-center justify-between">
                            <span>Jacob Jones</span>
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                        </div>
                        <div class="p-2 rounded-xl text-slate-400 hover:bg-white/5 flex items-center justify-between">
                            <span>Kathryn Murphy</span>
                            <span class="text-[10px] text-slate-500">18:30</span>
                        </div>
                        <div class="p-2 rounded-xl text-slate-400 hover:bg-white/5 flex items-center justify-between">
                            <span>Guy Hawkins</span>
                            <span class="text-[10px] text-slate-500">18:02</span>
                        </div>
                    </div>

                    <!-- Chat Dialog Area -->
                    <div class="sm:col-span-8 flex flex-col justify-between p-2 space-y-3 text-xs">
                        <div class="space-y-2.5">
                            <div class="p-3 rounded-2xl bg-[#1A143A] text-slate-200 max-w-[85%]">
                                Assalomu alaykum, buyurtmangiz holatini tekshirib beramiz.
                            </div>
                            <div class="p-3 rounded-2xl bg-violet-600 text-white max-w-[85%] ml-auto text-right">
                                Rahmat, kutib qolaman!
                            </div>
                            <div class="p-3 rounded-2xl bg-[#1A143A] text-slate-200 max-w-[85%] flex items-center gap-2">
                                <span>Tez orada to'liq ma'lumot beramiz</span>
                                <div class="flex items-center gap-1">
                                    <span class="w-1.5 h-1.5 rounded-full bg-violet-400 typing-dot"></span>
                                    <span class="w-1.5 h-1.5 rounded-full bg-violet-400 typing-dot"></span>
                                    <span class="w-1.5 h-1.5 rounded-full bg-violet-400 typing-dot"></span>
                                </div>
                            </div>
                        </div>

                        <!-- Chat input bar -->
                        <div class="flex items-center gap-2 pt-2 border-t border-violet-900/30">
                            <input type="text" placeholder="Xabar yozing..." class="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500">
                            <button class="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Mobile Customer Chat Preview -->
            <div class="lg:col-span-5 flex justify-center">
                <div class="w-[260px] rounded-[36px] border-4 border-slate-800 bg-[#0E0B20] p-3 shadow-2xl text-xs text-white">
                    <div class="flex items-center gap-2 border-b border-white/10 pb-2 mb-3">
                        <div class="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center font-bold text-[10px]">SB</div>
                        <div>
                            <div class="font-bold text-[11px]">StoreBox Yordam</div>
                            <div class="text-[9px] text-emerald-400">Onlayn</div>
                        </div>
                    </div>
                    <div class="space-y-2 text-[11px]">
                        <div class="p-2.5 rounded-2xl bg-white/10 text-slate-200 max-w-[90%]">
                            Men yuborgan buyurtma vaqtida yetib kelmaganligi sababli supportga murojaat qilgandim.
                        </div>
                        <div class="p-2.5 rounded-2xl bg-violet-600 text-white max-w-[85%] ml-auto">
                            Rahmat, kutib qolaman
                        </div>
                        <div class="p-2 rounded-xl bg-white/10 text-slate-300 text-[10px] italic">
                            Menejer javob yozmoqda...
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 7. OAV VA MATBUOT BIZ HAQIMIZDA (MEDIA SOCIAL PROOF & VIDEO DEMO) -->
    <!-- ======================================================== -->
    <section id="news" class="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-10">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-700 font-bold text-xs uppercase tracking-wider mb-3">
                OAV va Matbuot
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                Bitta platformadan foydalanib, onlayn biznesni qanday boshlash mumkin?
            </h2>
            <p class="text-slate-600 text-xs sm:text-sm">
                StoreBox platformasi biznesga onlayn kirish jarayonini soddalashtiradi, xavflarni kamaytiradi va ishga tushirishni sezilarli darajada tezlashtiradi.
            </p>
        </div>

        <!-- Media Logos Row -->
        <div class="flex flex-wrap items-center justify-center gap-8 sm:gap-14 mb-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
            <span class="text-xl sm:text-2xl font-black tracking-tighter text-slate-800">KAPITAL</span>
            <span class="text-xl sm:text-2xl font-black tracking-wider text-slate-800">REPOST</span>
            <span class="text-xl sm:text-2xl font-black tracking-tight text-slate-800">SPOT.UZ</span>
            <span class="text-xl sm:text-2xl font-black tracking-tight text-slate-800">GAZETA.UZ</span>
            <span class="text-xl sm:text-2xl font-black tracking-tight text-slate-800">DARYO</span>
        </div>

        <!-- Video Interview & Platform Demo Card -->
        <div class="max-w-4xl mx-auto rounded-3xl overflow-hidden glass-card p-4 sm:p-6 shadow-xl border border-violet-100">
            <div class="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center group cursor-pointer" onclick="openPlatformVideoModal()">
                <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&auto=format&fit=crop&q=80" class="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                
                <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                    <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-violet-500 transition transform mb-3">
                        <i data-lucide="play" class="w-7 h-7 sm:w-9 sm:h-9 fill-current translate-x-0.5"></i>
                    </div>
                    <h3 class="text-lg sm:text-2xl font-black tracking-tight drop-shadow-md mb-1">StoreBox platformasi bo'yicha video yo'riqnoma va intervyu</h3>
                    <p class="text-xs sm:text-sm text-slate-200 max-w-md">15 daqiqada onlayn do'kon va Telegram botni ochish jarayoni</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 8. HAMKORLAR BIZ HAQIMIZDA (4 REVIEW CARDS) -->
    <!-- ======================================================== -->
    <section id="reviews" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-14">
            <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Hamkorlar biz haqimizda
            </h2>
            <p class="text-slate-600 text-sm sm:text-base">
                Biz bilan ishlayotgan tadbirkorlar erishgan natijalar va ularning samimiy fikrlari
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Review 1 -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-1 text-amber-400 mb-3 text-xs">
                        ★★★★★
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed mb-6">
                        "StoreBox orqali biz bir kunda to'liq do'konimizni ochdik. Telegram bot orqali savdolarimiz 3 barobarga oshdi."
                    </p>
                </div>
                <div class="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div class="w-9 h-9 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-xs">M</div>
                    <div>
                        <div class="font-bold text-slate-900 text-xs">Murod</div>
                        <div class="text-[11px] text-slate-400">Muborak Parfum</div>
                    </div>
                </div>
            </div>

            <!-- Review 2 -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-1 text-amber-400 mb-3 text-xs">
                        ★★★★★
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed mb-6">
                        "Mijozlarimizga oziq-ovqat buyurtma qilish va yetkazib berish jarayonini tez va qulay qildi. Sayt dizayni ajoyib!"
                    </p>
                </div>
                <div class="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div class="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">A</div>
                    <div>
                        <div class="font-bold text-slate-900 text-xs">Anvar</div>
                        <div class="text-[11px] text-slate-400">Halol Go'sht</div>
                    </div>
                </div>
            </div>

            <!-- Review 3 -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-1 text-amber-400 mb-3 text-xs">
                        ★★★★★
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed mb-6">
                        "Restoranimiz uchun QR menyu va stol buyurtmasi tizimini juda tez ishga tushirdik. Ofitsiantlar ishi yengillashdi."
                    </p>
                </div>
                <div class="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div class="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">A</div>
                    <div>
                        <div class="font-bold text-slate-900 text-xs">Artur</div>
                        <div class="text-[11px] text-slate-400">Jumanji Restoran</div>
                    </div>
                </div>
            </div>

            <!-- Review 4 -->
            <div class="glass-card rounded-3xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center gap-1 text-amber-400 mb-3 text-xs">
                        ★★★★★
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed mb-6">
                        "Qimmat dasturchilarga pul sarflamasdan o'z brendim do'konini yaratdim. To'lov tizimlari o'rnatilgani juda qulay."
                    </p>
                </div>
                <div class="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div class="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-xs">K</div>
                    <div>
                        <div class="font-bold text-slate-900 text-xs">Kamil</div>
                        <div class="text-[11px] text-slate-400">Temir Darvozalar</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 9. BIZNING BLOGIMIZNI O'QING (3 BLOG POSTS) -->
    <!-- ======================================================== -->
    <section id="blog" class="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-14">
            <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Bizning blogimizni o'qing
            </h2>
            <p class="text-slate-600 text-sm sm:text-base">
                Yangi texnologiyalarni o'rganing va elektron tijoratda daromadni oshirish sirlari
            </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
                <div>
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <span class="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">Telegram Bot</span>
                        <h3 class="font-black text-slate-900 text-base mb-2">StoreBox uz: Telegram botlari orqali savdoni 3x oshirish sirlari</h3>
                        <p class="text-xs text-slate-500 line-clamp-2">Telegram Mini App do'konining oddiy botlardan afzalliklari va mijozlarni jalb qilish usullari.</p>
                    </div>
                </div>
                <div class="px-6 pb-6 pt-2 text-xs text-slate-400 font-semibold flex items-center justify-between border-t border-slate-100">
                    <span>15 May, 2026</span>
                    <span>4 daqiqa mutolaa</span>
                </div>
            </div>

            <div class="glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
                <div>
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">Platforma yangiliklari</span>
                        <h3 class="font-black text-slate-900 text-base mb-2">StoreBox uz ning ikkinchi versiyasi nimalarni o'z ichiga oladi?</h3>
                        <p class="text-xs text-slate-500 line-clamp-2">Yangi dizayn, AI yordamchi, fiskal chek integratsiyasi va yaxshilangan tahlillar bilan tanishing.</p>
                    </div>
                </div>
                <div class="px-6 pb-6 pt-2 text-xs text-slate-400 font-semibold flex items-center justify-between border-t border-slate-100">
                    <span>22 May, 2026</span>
                    <span>5 daqiqa mutolaa</span>
                </div>
            </div>

            <div class="glass-card rounded-3xl overflow-hidden flex flex-col justify-between">
                <div>
                    <img src="https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">E-commerce</span>
                        <h3 class="font-black text-slate-900 text-base mb-2">Bitta platformadan foydalanib, onlayn biznesni qanday boshlash mumkin?</h3>
                        <p class="text-xs text-slate-500 line-clamp-2">Noldan boshlab birinchi daromadgacha bo'lgan to'liq qadam-baqadam biznes yo'riqnoma.</p>
                    </div>
                </div>
                <div class="px-6 pb-6 pt-2 text-xs text-slate-400 font-semibold flex items-center justify-between border-t border-slate-100">
                    <span>01 Iyun, 2026</span>
                    <span>6 daqiqa mutolaa</span>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 10. TARIFLAR VA QIYOSIY JADVAL (PRICING SWITCHER & EXPENSE TABLE) -->
    <!-- ======================================================== -->
    <section id="pricing" class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-24">
        <div class="text-center max-w-3xl mx-auto mb-10">
            <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Tariflar
            </h2>
            <p class="text-slate-600 text-sm sm:text-base mb-8">
                O'z biznesingiz ko'lamiga mos tarifni tanlang va qimmat dasturlash xarajatlarini unuting
            </p>

            <!-- 3 / 6 / 12 Month Duration Switcher -->
            <div class="inline-flex p-1.5 rounded-full bg-slate-200/80 border border-slate-300 text-xs font-extrabold gap-1">
                <button id="planBtn3" onclick="setBillingDuration(3)" class="px-5 py-2 rounded-full bg-white text-slate-900 shadow-sm transition">3 oy</button>
                <button id="planBtn6" onclick="setBillingDuration(6)" class="px-5 py-2 rounded-full text-slate-600 hover:text-slate-900 transition flex items-center gap-1">
                    <span>6 oy</span>
                    <span class="text-[10px] text-emerald-600 font-black bg-emerald-100 px-1.5 py-0.2 rounded-full">-10%</span>
                </button>
                <button id="planBtn12" onclick="setBillingDuration(12)" class="px-5 py-2 rounded-full text-slate-600 hover:text-slate-900 transition flex items-center gap-1">
                    <span>12 oy</span>
                    <span class="text-[10px] text-violet-600 font-black bg-violet-100 px-1.5 py-0.2 rounded-full">-20%</span>
                </button>
            </div>
        </div>

        <!-- 3 Pricing Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            <!-- Start Plan -->
            <div class="glass-card rounded-3xl p-7 flex flex-col justify-between">
                <div>
                    <div class="font-extrabold text-xl text-slate-900 mb-2">Start</div>
                    
                    <div class="mb-6">
                        <span id="priceStartVal" class="text-3xl font-black text-slate-900">200 000</span>
                        <span class="text-xs text-slate-500 font-bold">UZS</span>
                    </div>

                    <ul class="space-y-3.5 text-xs text-slate-600 mb-8">
                        <li class="flex items-center gap-2.5"><i data-lucide="send" class="w-4 h-4 text-blue-500"></i><span>Telegram bot (WebApp)</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="globe" class="w-4 h-4 text-violet-500"></i><span>Veb-sayt (Subdomen)</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="credit-card" class="w-4 h-4 text-emerald-500"></i><span>Click, Payme to'lovlar</span></li>
                    </ul>
                </div>
                <a href="/register/" class="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center shadow transition">
                    Boshlash
                </a>
            </div>

            <!-- Basic Plan -->
            <div class="glass-card rounded-3xl p-7 flex flex-col justify-between">
                <div>
                    <div class="font-extrabold text-xl text-slate-900 mb-2">Basic</div>
                    
                    <div class="mb-6">
                        <span id="priceBasicVal" class="text-3xl font-black text-slate-900">500 000</span>
                        <span class="text-xs text-slate-500 font-bold">UZS</span>
                    </div>

                    <ul class="space-y-3.5 text-xs text-slate-600 mb-8">
                        <li class="flex items-center gap-2.5"><i data-lucide="send" class="w-4 h-4 text-blue-500"></i><span>Telegram bot (WebApp)</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="globe" class="w-4 h-4 text-violet-500"></i><span>Mustaqil Veb-sayt</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="qr-code" class="w-4 h-4 text-sky-500"></i><span>QR Menyu/Katalog</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="instagram" class="w-4 h-4 text-rose-500"></i><span>Instagram integratsiya</span></li>
                    </ul>
                </div>
                <a href="/register/" class="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs text-center shadow transition">
                    Boshlash
                </a>
            </div>

            <!-- Professional Plan (Highlighted with crown badge) -->
            <div class="glass-card rounded-3xl p-7 flex flex-col justify-between border-2 border-violet-600 shadow-xl shadow-purple-500/10 relative transform md:-translate-y-2">
                <div class="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider shadow flex items-center gap-1">
                    <i data-lucide="crown" class="w-3 h-3"></i>
                    <span>Pro</span>
                </div>
                <div>
                    <div class="font-extrabold text-xl text-slate-900 mb-2">Professional</div>
                    
                    <div class="mb-6">
                        <span id="priceProVal" class="text-3xl font-black text-slate-900">900 000</span>
                        <span class="text-xs text-slate-500 font-bold">UZS</span>
                    </div>

                    <ul class="space-y-3.5 text-xs text-slate-600 mb-8">
                        <li class="flex items-center gap-2.5"><i data-lucide="send" class="w-4 h-4 text-blue-500"></i><span>Telegram bot (WebApp)</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="globe" class="w-4 h-4 text-violet-500"></i><span>Shaxsiy domenli Veb-sayt</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="qr-code" class="w-4 h-4 text-sky-500"></i><span>QR Menyu va stol boshqaruvi</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="receipt" class="w-4 h-4 text-emerald-500"></i><span>Avtomatik fiskal cheklar</span></li>
                        <li class="flex items-center gap-2.5"><i data-lucide="zap" class="w-4 h-4 text-sky-600"></i><span>ClickSuperApp & YES POS</span></li>
                    </ul>
                </div>
                <a href="/register/" class="shimmer-btn w-full py-3 rounded-xl bg-[#704fe6] hover:bg-[#5e3ed6] text-white font-bold text-xs text-center shadow-lg shadow-violet-500/25 transition">
                    Boshlash
                </a>
            </div>

        </div>

        <!-- Expand button for full features -->
        <div class="text-center mt-10 mb-14">
            <button onclick="toggleFullFeaturesList()" class="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-violet-300 text-violet-700 hover:bg-violet-50 text-xs font-bold transition">
                <span>Xususiyatlarning to'liq ro'yxati</span>
                <i id="fullFeaturesChevron" data-lucide="chevron-down" class="w-4 h-4 transition-transform"></i>
            </button>
        </div>

        <!-- FULL FEATURES LIST (COLLAPSIBLE) -->
        <div id="fullFeaturesList" class="hidden mb-16 glass-card rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto text-xs">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b-2 border-slate-200 text-slate-900 font-bold">
                            <th class="py-3 px-4">Funksiyalar va imkoniyatlar</th>
                            <th class="py-3 px-4 text-center">Start</th>
                            <th class="py-3 px-4 text-center">Basic</th>
                            <th class="py-3 px-4 text-center text-violet-600">Professional</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr><td class="py-3 px-4">Telegram WebApp (TMA) do'kon</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                        <tr><td class="py-3 px-4">Mustaqil Veb-sayt va domen ulash</td><td class="text-center text-slate-400">Subdomen</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                        <tr><td class="py-3 px-4">QR Menyu va stol raqami orqali buyurtma</td><td class="text-center text-slate-300">—</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                        <tr><td class="py-3 px-4">Click, Payme, Uzum to'lov integratsiyasi</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                        <tr><td class="py-3 px-4">YES POS kassa va omborxona sinxronizatsiyasi</td><td class="text-center text-slate-300">—</td><td class="text-center text-emerald-600 font-bold">✓</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                        <tr><td class="py-3 px-4">Avtomatik fiskal cheklar (Soliq / OFD)</td><td class="text-center text-slate-300">—</td><td class="text-center text-slate-300">—</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                        <tr><td class="py-3 px-4">24/7 Shaxsiy menejer va texnik yordam</td><td class="text-center text-slate-300">—</td><td class="text-center text-slate-300">—</td><td class="text-center text-emerald-600 font-bold">✓</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- COST COMPARISON TABLE (EXACT ROBO.UZ BENCHMARK) -->
        <div id="compare" class="glass-card rounded-3xl p-6 sm:p-10 max-w-5xl mx-auto scroll-mt-24">
            <h3 class="text-base sm:text-xl font-black text-slate-900 text-center mb-6 tracking-tight uppercase">
                {{ t.compare_title|safe }}
            </h3>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr class="border-b-2 border-slate-200 text-slate-600">
                            <th class="py-3 px-4 font-bold">Xizmat</th>
                            <th class="py-3 px-4 font-bold text-slate-500">Maxsus dasturlash (1 oydan boshlangan muddat)</th>
                            <th class="py-3 px-4 font-bold text-violet-700 bg-violet-50/70 rounded-t-xl">StoreBox (Obunaga kiritilgan)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr>
                            <td class="py-3.5 px-4 font-semibold flex items-center gap-2">
                                <i data-lucide="send" class="w-3.5 h-3.5 text-blue-500"></i>
                                <span>Telegram bot</span>
                            </td>
                            <td class="py-3.5 px-4 text-slate-500">5 000 000 - 7 000 000 So'm</td>
                            <td class="py-3.5 px-4 text-emerald-600 font-bold bg-violet-50/70">Obunaga kiritilgan</td>
                        </tr>
                        <tr>
                            <td class="py-3.5 px-4 font-semibold flex items-center gap-2">
                                <i data-lucide="globe" class="w-3.5 h-3.5 text-violet-500"></i>
                                <span>Veb-sayt</span>
                            </td>
                            <td class="py-3.5 px-4 text-slate-500">15 000 000 - 20 000 000 So'm</td>
                            <td class="py-3.5 px-4 text-emerald-600 font-bold bg-violet-50/70">Obunaga kiritilgan</td>
                        </tr>
                        <tr>
                            <td class="py-3.5 px-4 font-semibold flex items-center gap-2">
                                <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-emerald-500"></i>
                                <span>Administrator paneli</span>
                            </td>
                            <td class="py-3.5 px-4 text-slate-500">5 000 000 - 7 000 000 So'm</td>
                            <td class="py-3.5 px-4 text-emerald-600 font-bold bg-violet-50/70">Obunaga kiritilgan</td>
                        </tr>
                        <tr class="font-extrabold text-sm border-t-2 border-slate-300">
                            <td class="py-4 px-4 text-slate-900">Jami tejaladigan mablag'</td>
                            <td class="py-4 px-4 text-rose-600">25 000 000 - 34 000 000 So'm</td>
                            <td class="py-4 px-4 text-violet-700 bg-violet-100/70 rounded-b-xl">500 000 So'm / oy dan</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 11. FAQ BO'LIMI (5 ACCORDION ITEMS) -->
    <!-- ======================================================== -->
    <section id="faq" class="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-24">
        <div class="text-center mb-14">
            <h2 class="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Ko'p beriladigan savollar
            </h2>
            <p class="text-slate-600 text-sm sm:text-base">
                Platforma bo'yicha eng muhim savollarga tezkor javoblar
            </p>
        </div>

        <div class="space-y-4 mb-16">
            
            <div class="faq-item glass-card rounded-2xl p-5 cursor-pointer transition" onclick="toggleFaq(this)">
                <div class="flex items-center justify-between font-extrabold text-sm sm:text-base text-slate-900">
                    <span>Qanday qilib veb-sayt yaratish mumkin?</span>
                    <span class="faq-icon w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">+</span>
                </div>
                <div class="faq-content hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                    StoreBox platformasida ro'yxatdan o'tasiz, o'z do'koningiz nomini kiritasiz va mahsulotlaringizni joylaysiz. Sizning shaxsiy veb-saytingiz bir necha daqiqada avtomatik ishga tushadi!
                </div>
            </div>

            <div class="faq-item glass-card rounded-2xl p-5 cursor-pointer transition" onclick="toggleFaq(this)">
                <div class="flex items-center justify-between font-extrabold text-sm sm:text-base text-slate-900">
                    <span>Qanday qilib Telegram bot yaratish mumkin?</span>
                    <span class="faq-icon w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">+</span>
                </div>
                <div class="faq-content hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                    Telegram-da @BotFather orqali yangi bot yaratib, uning API tokenini StoreBox boshqaruv paneliga kiritasiz. Tizimimiz botni bir zumda WebApp va menyu bilan ta'minlaydi.
                </div>
            </div>

            <div class="faq-item glass-card rounded-2xl p-5 cursor-pointer transition" onclick="toggleFaq(this)">
                <div class="flex items-center justify-between font-extrabold text-sm sm:text-base text-slate-900">
                    <span>Onlayn to'lovlarni ulash mumkinmi?</span>
                    <span class="faq-icon w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">+</span>
                </div>
                <div class="faq-content hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                    Ha, sizga qulay bo'lishi uchun biz Payme, Click, Uzum Pay va boshqa to'lov tizimlarini qo'shdik. Barcha to'lovlar to'g'ridan-to'g'ri sizning hisobingizga kelib tushadi.
                </div>
            </div>

            <div class="faq-item glass-card rounded-2xl p-5 cursor-pointer transition" onclick="toggleFaq(this)">
                <div class="flex items-center justify-between font-extrabold text-sm sm:text-base text-slate-900">
                    <span>Fiskal cheklar qanday chiqariladi?</span>
                    <span class="faq-icon w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">+</span>
                </div>
                <div class="faq-content hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                    StoreBox Davlat Soliq Qo'mitasi va OFD tizimiga to'liq integratsiya qilingan. Har bir to'lov bo'yicha mijozga avtomatik QR-kodli elektron fiskal chek yuboriladi.
                </div>
            </div>

            <div class="faq-item glass-card rounded-2xl p-5 cursor-pointer transition" onclick="toggleFaq(this)">
                <div class="flex items-center justify-between font-extrabold text-sm sm:text-base text-slate-900">
                    <span>Bepul sinov muddati bormi?</span>
                    <span class="faq-icon w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-bold shrink-0">+</span>
                </div>
                <div class="faq-content hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                    Ha, ro'yxatdan o'tganingizdan so'ng barcha funksiyalardan 14 kun davomida mutlaqo bepul foydalanishingiz mumkin. Karta ma'lumotlari talab qilinmaydi!
                </div>
            </div>

        </div>

        <!-- ======================================================== -->
        <!-- 12. HALI HAM SAVOLLARINIGIZ BORMI? (CONSULTATION FORM) -->
        <!-- ======================================================== -->
        <div id="contact" class="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden scroll-mt-24">
            <h3 class="text-2xl sm:text-3xl font-black text-slate-900 mb-2">{{ t.contact_box_title|safe }}</h3>
            <p class="text-xs sm:text-sm text-slate-500 mb-8 max-w-md mx-auto">Izlayotgan javobni topa olmayapsizmi? Yordam uchun jamoamiz bilan bog'laning.</p>

            <form id="leadConsultationForm" onsubmit="handleLeadSubmit(event)" class="space-y-4 max-w-lg mx-auto text-left">
                {% csrf_token %}
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Ism *</label>
                        <input type="text" id="leadName" required placeholder="Ismingizni kiriting" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">Kompaniya</label>
                        <input type="text" id="leadCompany" placeholder="Kompaniyani kiriting" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Telefon raqami *</label>
                    <input type="tel" id="leadPhone" required placeholder="+998 (90) 123-45-67" value="+998 " class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition font-mono">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">Xabar yoki savolingiz</label>
                    <textarea id="leadMessage" rows="3" placeholder="Sizni qiziqtirgan savolni yozing..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-xs text-slate-900 focus:outline-none focus:border-violet-500 transition"></textarea>
                </div>

                <div id="leadFeedbackAlert" class="hidden p-3 rounded-xl text-xs font-bold text-center"></div>

                <button type="submit" id="leadSubmitBtn" class="shimmer-btn w-full py-3.5 rounded-xl bg-[#704fe6] hover:bg-[#5e3ed6] text-white font-black text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2">
                    <span>Yuborish</span>
                    <i data-lucide="send" class="w-4 h-4"></i>
                </button>
            </form>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 13. FOOTER (DARK #070514) -->
    <!-- ======================================================== -->
    <footer class="bg-[#070514] text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-violet-950/40 text-xs">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            <!-- Col 1: Brand & Contact -->
            <div class="space-y-4">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white shadow-md">
                        <i data-lucide="layers" class="w-4 h-4"></i>
                    </div>
                    <span class="font-black text-base text-white">StoreBox</span>
                </div>
                <p class="text-xs text-slate-500 leading-relaxed">
                    O'zbekistonda Telegram va Veb-do'konlar yaratish bo'yicha eng ilg'or SaaS platformasi.
                </p>
                <div class="text-sm font-bold text-white pt-2">+998(78) 113 82 12</div>
                <div class="text-xs text-slate-400">info@storebox.uz</div>
            </div>

            <!-- Col 2: Mahsulot -->
            <div class="space-y-2.5">
                <div class="font-black text-white text-sm mb-1">Mahsulot</div>
                <ul class="space-y-2 text-slate-400">
                    <li><a href="#resto" class="hover:text-violet-400 transition">{{ t.resto_badge|safe }}</a></li>
                    <li><a href="#showcase" class="hover:text-violet-400 transition">{{ t.shop_badge|safe }}</a></li>
                    <li><a href="#analytics" class="hover:text-violet-400 transition">Statistika va tahlillar</a></li>
                    <li><a href="#heroMockupWindow" class="hover:text-violet-400 transition">Buyurtmalar ro'yxati</a></li>
                    <li><a href="#pricing" class="hover:text-violet-400 transition">Tariflar va narxlar</a></li>
                </ul>
            </div>

            <!-- Col 3: Kompaniya -->
            <div class="space-y-2.5">
                <div class="font-black text-white text-sm mb-1">Kompaniya</div>
                <ul class="space-y-2 text-slate-400">
                    <li><a href="#news" class="hover:text-violet-400 transition">OAV va Yangiliklar</a></li>
                    <li><a href="#reviews" class="hover:text-violet-400 transition">Mijozlar fikrlari</a></li>
                    <li><a href="#blog" class="hover:text-violet-400 transition">Blog maqolalari</a></li>
                    <li><a href="#faq" class="hover:text-violet-400 transition">Ko'p beriladigan savollar</a></li>
                    <li><a href="#contact" class="hover:text-violet-400 transition">Bog'lanish</a></li>
                </ul>
            </div>

            <!-- Col 4: Manzil va Tarmoqlar -->
            <div class="space-y-3">
                <div class="font-black text-white text-sm mb-1">Manzil</div>
                <p class="text-slate-500">Toshkent shahri, Mirobod tumani, Oybek ko'chasi 42-uy</p>
                <div class="pt-2">
                    <div class="font-bold text-white text-xs mb-2">Ijtimoiy tarmoqlar:</div>
                    <div class="flex items-center gap-2.5">
                        <a href="https://t.me/storebox_uz" target="_blank" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-violet-600 text-white flex items-center justify-center transition">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </a>
                        <a href="https://instagram.com/storebox_uz" target="_blank" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-violet-600 text-white flex items-center justify-center transition">
                            <i data-lucide="instagram" class="w-4 h-4"></i>
                        </a>
                        <a href="https://youtube.com" target="_blank" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-violet-600 text-white flex items-center justify-center transition">
                            <i data-lucide="youtube" class="w-4 h-4"></i>
                        </a>
                    </div>
                </div>
            </div>

        </div>

        <div class="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
            <div>© 2026 StoreBox Platform. Barcha huquqlar himoyalangan.</div>
            <div class="flex items-center gap-4">
                <a href="#" class="hover:text-slate-400 transition">Maxfiylik siyosati</a>
                <a href="#" class="hover:text-slate-400 transition">Ommaviy oferta</a>
            </div>
        </div>
    </footer>

</div>

<!-- ============================================================ -->
<!-- INTERACTIVE MODALS (VIDEO DEMO & PRODUCT PREVIEW)            -->
<!-- ============================================================ -->

<!-- Platform Video Demo Modal -->
<div id="platformVideoModal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/80 backdrop-blur-md p-4 transition-all duration-300">
    <div class="relative w-full max-w-4xl rounded-3xl overflow-hidden glass-card-dark border border-violet-500/40 p-2 shadow-2xl">
        <div class="flex items-center justify-between p-3 border-b border-white/10 text-xs font-bold text-white">
            <span class="flex items-center gap-2">
                <i data-lucide="play-circle" class="w-4 h-4 text-violet-400"></i>
                <span>StoreBox Platforma Demo Videosi</span>
            </span>
            <button onclick="closePlatformVideoModal()" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold">✕</button>
        </div>
        <div class="aspect-video w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
            <iframe id="videoIframe" class="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
    </div>
</div>

<!-- Product Preview Modal (For Device Showcase) -->
<div id="productPreviewModal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/70 backdrop-blur-sm p-4 transition-all">
    <div class="relative w-full max-w-md rounded-3xl overflow-hidden bg-white text-slate-900 border border-slate-200 p-6 shadow-2xl space-y-4">
        <button onclick="closeProductPreviewModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">✕</button>
        <img id="modalProductImg" src="" class="w-full h-48 object-cover rounded-2xl shadow-inner">
        <div>
            <h4 id="modalProductTitle" class="text-lg font-black text-slate-900">Mahsulot</h4>
            <div id="modalProductPrice" class="text-base font-black text-violet-700 mt-0.5">0 UZS</div>
            <p id="modalProductDesc" class="text-xs text-slate-500 mt-2 leading-relaxed">Tavsif</p>
        </div>
        <div class="pt-2">
            <button onclick="addToCartMockup()" class="shimmer-btn w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs shadow-md shadow-purple-600/30 transition flex items-center justify-center gap-2">
                <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                <span>Savatga qo'shish</span>
            </button>
        </div>
    </div>
</div>

<!-- ============================================================ -->
<!-- CLIENT-SIDE INTERACTIVITY SCRIPTS                           -->
<!-- ============================================================ -->
<script>
    // 1. Language Dropdown Toggle
    function toggleLangDropdown(e) {
        e.stopPropagation();
        const drop = document.getElementById('langDropdown');
        drop.classList.toggle('hidden');
    }
    document.addEventListener('click', () => {
        const drop = document.getElementById('langDropdown');
        if (drop && !drop.classList.contains('hidden')) {
            drop.classList.add('hidden');
        }
    });

    // 2. Mobile Menu Drawer Toggle
    function toggleMobileMenu() {
        const drawer = document.getElementById('mobileMenuDrawer');
        drawer.classList.toggle('hidden');
    }
    function closeMobileMenu() {
        const drawer = document.getElementById('mobileMenuDrawer');
        drawer.classList.add('hidden');
    }

    // 3. Hero Mockup Theme Switcher
    function toggleMockupTheme(mode) {
        const win = document.getElementById('heroMockupWindow');
        const lightBtn = document.getElementById('mockupLightBtn');
        const darkBtn = document.getElementById('mockupDarkBtn');
        if (mode === 'light') {
            win.classList.remove('bg-[#120E28]');
            win.classList.add('bg-white');
            lightBtn.className = 'px-2.5 py-0.5 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1 shadow-sm';
            darkBtn.className = 'px-2 py-0.5 rounded-full text-slate-400 hover:text-white flex items-center gap-1';
        } else {
            win.classList.add('bg-[#120E28]');
            win.classList.remove('bg-white');
            darkBtn.className = 'px-2.5 py-0.5 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1 shadow-sm';
            lightBtn.className = 'px-2 py-0.5 rounded-full text-slate-400 hover:text-white flex items-center gap-1';
        }
    }

    // 4. Hero Mockup Order Actions (Reject / Confirm)
    function handleMockupOrderAction(orderId, action) {
        const statusEl = document.getElementById('status-' + orderId);
        const actionsEl = document.getElementById('actions-' + orderId);
        if (action === 'confirm') {
            statusEl.className = 'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]';
            statusEl.innerText = 'Tasdiqlandi';
            actionsEl.innerHTML = '<span class="text-xs text-emerald-400 font-bold">✓ Qabul qilindi</span>';
            showMockupToast('Buyurtma #' + orderId + ' tasdiqlandi va oshxonaga yuborildi!');
        } else {
            statusEl.className = 'px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px]';
            statusEl.innerText = 'Bekor qilindi';
            actionsEl.innerHTML = '<span class="text-xs text-rose-400 font-bold">✕ Bekor</span>';
            showMockupToast('Buyurtma #' + orderId + ' bekor qilindi.');
        }
    }

    function showMockupToast(msg) {
        const toast = document.getElementById('mockupToast');
        toast.innerText = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
    }

    // 5. Device Showcase Switchers (Platform & Niche)
    let currentSimPlatform = 'web';
    let currentSimNiche = 'restaurant';

    const nichePresets = {
        restaurant: {
            brandLogo: '🍔',
            brandName: 'Samarqand Taomlari',
            bannerTitle: 'Maxsus Chegirma — Barcha menyu uchun 20%',
            bannerSubtitle: 'Bugun buyurtma bering va 30 daqiqada bepul yetkazib berishga ega bo\\'ling!',
            categories: ['Barchasi', 'Fast-Fud', 'Milliy Taomlar', 'Pitsalar', 'Ichimliklar'],
            products: [
                { title: 'Katta Burger Classic', price: '48 000 UZS', desc: 'Marmar go\\'shti', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&auto=format&fit=crop&q=80' },
                { title: 'Pitsa Margarita 32sm', price: '65 000 UZS', desc: 'Mozzarella, pomidor', img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80' },
                { title: 'Qovurma Lag\\'mon', price: '45 000 UZS', desc: 'Mol go\\'shti, sabzavotlar', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80' }
            ]
        },
        shop: {
            brandLogo: '🛍️',
            brandName: 'Trend Wear Tashkent',
            bannerTitle: 'Yangi Mavsumiy Kolleksiya — 30% Chegirma',
            bannerSubtitle: 'Eng so\\'nggi urfdagi kiyimlar va aksessuarlar, O\\'zbekiston bo\\'ylab yetkazish!',
            categories: ['Barchasi', 'Xudi & Svitshot', 'Krossovkalar', 'Futbolkalar', 'Sumkalar'],
            products: [
                { title: 'Oversize Xudi Premium', price: '280 000 UZS', desc: '100% Paxta, qalin mato', img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&auto=format&fit=crop&q=80' },
                { title: 'Oq Sport Krossovka', price: '420 000 UZS', desc: 'Havo o\\'tkazuvchi qulay taglik', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80' },
                { title: 'Charm Kamar Classic', price: '95 000 UZS', desc: 'Tabiiy charm, mustahkam metall', img: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&auto=format&fit=crop&q=80' }
            ]
        }
    };

    function switchSimPlatform(plat) {
        currentSimPlatform = plat;
        const webBtn = document.getElementById('toggleWebBtn');
        const tgBtn = document.getElementById('toggleTgBtn');
        const urlBar = document.getElementById('simUrlBar');
        if (plat === 'web') {
            webBtn.className = 'px-3.5 py-1.5 rounded-xl bg-violet-600 text-white shadow-sm transition flex items-center gap-1.5';
            tgBtn.className = 'px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5';
            urlBar.innerText = 'https://samarqand-taomlari.storebox.uz';
        } else {
            tgBtn.className = 'px-3.5 py-1.5 rounded-xl bg-violet-600 text-white shadow-sm transition flex items-center gap-1.5';
            webBtn.className = 'px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5';
            urlBar.innerText = 't.me/StoreboxDemoBot/app';
        }
    }

    function switchSimNiche(niche) {
        currentSimNiche = niche;
        const restoBtn = document.getElementById('toggleRestoBtn');
        const shopBtn = document.getElementById('toggleShopBtn');
        if (niche === 'restaurant') {
            restoBtn.className = 'px-3.5 py-1.5 rounded-xl bg-violet-600 text-white shadow-sm transition flex items-center gap-1.5';
            shopBtn.className = 'px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5';
        } else {
            shopBtn.className = 'px-3.5 py-1.5 rounded-xl bg-violet-600 text-white shadow-sm transition flex items-center gap-1.5';
            restoBtn.className = 'px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1.5';
        }

        const data = nichePresets[niche];
        document.getElementById('simBrandLogo').innerText = data.brandLogo;
        document.getElementById('simBrandName').innerText = data.brandName;
        document.getElementById('simMobileBrand').innerText = data.brandName;
        document.getElementById('simBannerTitle').innerText = data.bannerTitle;
        document.getElementById('simBannerSubtitle').innerText = data.bannerSubtitle;

        // Render categories
        const catRow = document.getElementById('simCategoriesRow');
        catRow.innerHTML = data.categories.map((c, i) => 
            `<span class="px-3.5 py-1.5 rounded-full ${i === 0 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'} shrink-0">${c}</span>`
        ).join('');

        // Render products
        const prodGrid = document.getElementById('simProductsGrid');
        prodGrid.innerHTML = data.products.map(p => `
            <div onclick="openProductPreviewModal('${p.title}', '${p.price}', '${p.desc}', '${p.img}')" class="p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-violet-300 hover:shadow-md transition cursor-pointer group">
                <img src="${p.img}" class="w-full h-24 object-cover rounded-xl mb-2 group-hover:scale-105 transition transform">
                <div class="font-extrabold text-xs text-slate-900 truncate">${p.title}</div>
                <div class="text-[11px] text-slate-500 line-clamp-1 mb-1.5">${p.desc}</div>
                <div class="flex items-center justify-between">
                    <span class="font-black text-xs text-violet-700">${p.price}</span>
                    <button class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">+</button>
                </div>
            </div>
        `).join('');
    }

    // 6. Pricing Period Switcher (3, 6, 12 Months with Discounts)
    function setBillingDuration(months) {
        const btn3 = document.getElementById('planBtn3');
        const btn6 = document.getElementById('planBtn6');
        const btn12 = document.getElementById('planBtn12');

        const activeClass = 'px-5 py-2 rounded-full bg-white text-slate-900 shadow-sm transition';
        const inactiveClass = 'px-5 py-2 rounded-full text-slate-600 hover:text-slate-900 transition flex items-center gap-1';

        btn3.className = months === 3 ? activeClass : inactiveClass;
        btn6.className = months === 6 ? activeClass : inactiveClass;
        btn12.className = months === 12 ? activeClass : inactiveClass;

        const startEl = document.getElementById('priceStartVal');
        const basicEl = document.getElementById('priceBasicVal');
        const proEl = document.getElementById('priceProVal');

        if (months === 3) {
            startEl.innerText = '200 000';
            basicEl.innerText = '500 000';
            proEl.innerText = '900 000';
        } else if (months === 6) {
            startEl.innerText = '180 000'; // 10% off
            basicEl.innerText = '450 000';
            proEl.innerText = '810 000';
        } else {
            startEl.innerText = '160 000'; // 20% off
            basicEl.innerText = '400 000';
            proEl.innerText = '720 000';
        }
    }

    // 7. Toggle Full Features List
    function toggleFullFeaturesList() {
        const list = document.getElementById('fullFeaturesList');
        const chevron = document.getElementById('fullFeaturesChevron');
        list.classList.toggle('hidden');
        chevron.classList.toggle('rotate-180');
    }

    // 8. FAQ Accordion Toggle
    function toggleFaq(item) {
        const content = item.querySelector('.faq-content');
        const icon = item.querySelector('.faq-icon');
        if (content.classList.contains('hidden')) {
            content.classList.remove('hidden');
            icon.innerText = '−';
            icon.className = 'faq-icon w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-bold shrink-0';
        } else {
            content.classList.add('hidden');
            icon.innerText = '+';
            icon.className = 'faq-icon w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0';
        }
    }

    // 9. Video Modal
    function openPlatformVideoModal() {
        const modal = document.getElementById('platformVideoModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    function closePlatformVideoModal() {
        const modal = document.getElementById('platformVideoModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    // 10. Product Preview Modal (Device Showcase Interaction)
    function openProductPreviewModal(title, price, desc, img) {
        document.getElementById('modalProductTitle').innerText = title;
        document.getElementById('modalProductPrice').innerText = price;
        document.getElementById('modalProductDesc').innerText = desc;
        document.getElementById('modalProductImg').src = img;
        const modal = document.getElementById('productPreviewModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    function closeProductPreviewModal() {
        const modal = document.getElementById('productPreviewModal');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    function addToCartMockup() {
        closeProductPreviewModal();
        showMockupToast('Mahsulot savatga qo\\'shildi!');
    }

    // 11. Lead Consultation Form Handler (POST /api/lead/ & /api/lead-inquiry/)
    async function handleLeadSubmit(e) {
        e.preventDefault();
        const btn = document.getElementById('leadSubmitBtn');
        const alertBox = document.getElementById('leadFeedbackAlert');
        const name = document.getElementById('leadName').value.trim();
        const company = document.getElementById('leadCompany').value.trim();
        const phone = document.getElementById('leadPhone').value.trim();
        const message = document.getElementById('leadMessage').value.trim();

        btn.disabled = true;
        btn.innerHTML = '<span>Yuborilmoqda...</span>';

        try {
            const res = await fetch('/api/lead/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]') ? document.querySelector('[name=csrfmiddlewaretoken]').value : ''
                },
                body: JSON.stringify({ name, company, phone, message })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alertBox.className = 'p-3 rounded-xl text-xs font-bold text-center bg-emerald-100 text-emerald-800 border border-emerald-300';
                alertBox.innerText = 'Rahmat! So\\'rovingiz qabul qilindi. Tez orada mutaxassisimiz siz bilan bog\\'lanadi.';
                alertBox.classList.remove('hidden');
                document.getElementById('leadConsultationForm').reset();
            } else {
                alertBox.className = 'p-3 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-800 border border-rose-300';
                alertBox.innerText = data.error || 'Xatolik yuz berdi. Iltimos telefon raqamingizni tekshirib qayta yuboring.';
                alertBox.classList.remove('hidden');
            }
        } catch (err) {
            alertBox.className = 'p-3 rounded-xl text-xs font-bold text-center bg-rose-100 text-rose-800 border border-rose-300';
            alertBox.innerText = 'Tarmoqda xatolik yuz berdi. Qayta urinib ko\\'ring.';
            alertBox.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<span>Yuborish</span><i data-lucide=\"send\" class=\"w-4 h-4\"></i>';
            if (window.lucide) lucide.createIcons();
        }
    }

    // Auto format phone number
    document.getElementById('leadPhone')?.addEventListener('input', function(e) {
        if (!this.value.startsWith('+998')) {
            this.value = '+998 ';
        }
    });
</script>
{% endblock %}
"""

if __name__ == '__main__':
    html = generate_landing_html()
    with open('templates/core/landing.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully wrote templates/core/landing.html (Size: %d bytes)" % len(html))
