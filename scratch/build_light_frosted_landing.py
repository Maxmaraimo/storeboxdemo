import os
import re

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates", "core", "landing.html")

def get_template_content():
    return """{% extends "base.html" %}

{% block title %}{{ t.page_title }}{% endblock %}

{% block extra_head %}
<style>
    /* ============================================================ */
    /* STOREBOX LIGHT FROSTED GLASS & DEEP DARK-PURPLE DESIGN SYSTEM */
    /* ============================================================ */
    
    :root {
        --bg-cosmic-deep: #080417;
        --bg-cosmic-mid: #0D0726;
        --bg-cosmic-surface: #140B35;
        --brand-violet: #7C3AED;
        --brand-purple: #8B5CF6;
        --brand-glow: rgba(124, 58, 237, 0.35);
    }

    /* Light Frosted Glass (White Glass Panels over Dark Violet Canvas) */
    .glass-frosted-light {
        background: rgba(255, 255, 255, 0.90);
        backdrop-filter: blur(24px) saturate(190%);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.65);
        box-shadow: 0 20px 45px -10px rgba(124, 58, 237, 0.08), 
                    0 4px 16px -2px rgba(0, 0, 0, 0.03), 
                    inset 0 1px 2px 0 rgba(255, 255, 255, 0.95);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-frosted-light:hover {
        background: rgba(255, 255, 255, 0.98);
        border-color: rgba(139, 92, 246, 0.45);
        box-shadow: 0 25px 50px -10px rgba(124, 58, 237, 0.15), 
                    0 8px 25px -4px rgba(0, 0, 0, 0.05),
                    inset 0 1px 2px 0 rgba(255, 255, 255, 1);
        transform: translateY(-2px);
    }

    /* Semi-Translucent Light Frosted Glass (Darker sections) */
    .glass-frosted-dark {
        background: rgba(20, 14, 46, 0.82);
        backdrop-filter: blur(28px) saturate(180%);
        -webkit-backdrop-filter: blur(28px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.28);
    }

    /* Floating Pill Navbar */
    .glass-pill-nav {
        background: rgba(14, 8, 36, 0.82);
        backdrop-filter: blur(28px) saturate(180%);
        -webkit-backdrop-filter: blur(28px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.5), 
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.25);
    }

    /* Glass Badges in Hero */
    .glass-badge-hero {
        background: rgba(255, 255, 255, 0.09);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.18);
        box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.35), 
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.2);
        transition: all 0.25s ease;
    }
    .glass-badge-hero:hover {
        background: rgba(255, 255, 255, 0.16);
        border-color: rgba(167, 139, 250, 0.5);
        transform: translateY(-1px);
    }

    /* Floating HUD Glass Cards */
    @keyframes float-hud-1 {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
    }
    @keyframes float-hud-2 {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(8px); }
    }
    @keyframes float-phone {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-6px) rotate(0.5deg); }
    }
    .animate-float-hud-1 {
        animation: float-hud-1 5s ease-in-out infinite;
    }
    .animate-float-hud-2 {
        animation: float-hud-2 6s ease-in-out infinite;
    }
    .animate-float-phone {
        animation: float-phone 7s ease-in-out infinite;
    }
    .hud-glass-badge {
        background: rgba(22, 15, 52, 0.88);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 
                    0 0 30px -5px rgba(124, 58, 237, 0.3), 
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.3);
    }

    /* 3D Perspective Canvas */
    .perspective-1200 { perspective: 1200px; }
    .transform-style-3d { transform-style: preserve-3d; }

    /* Perspective 3D Grid Plane for Hero */
    .hero-perspective-grid {
        background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        background-size: 44px 44px;
        mask-image: radial-gradient(ellipse 65% 55% at 50% 0%, #000 70%, transparent 100%);
        -webkit-mask-image: radial-gradient(ellipse 65% 55% at 50% 0%, #000 70%, transparent 100%);
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

    /* Infinite Marquee Animation */
    @keyframes marquee-scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
    }
    .animate-marquee {
        display: flex;
        width: max-content;
        animation: marquee-scroll 28s linear infinite;
    }
    .animate-marquee:hover {
        animation-play-state: paused;
    }

    /* Device Showcase Shadow */
    .device-specular-glow {
        box-shadow: 0 35px 90px -20px rgba(0, 0, 0, 0.8), 
                    0 0 50px -10px rgba(124, 58, 237, 0.35),
                    inset 0 1px 2px 0 rgba(255, 255, 255, 0.3);
    }
    .phone-floating-shadow {
        box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.75), 
                    0 0 35px -5px rgba(124, 58, 237, 0.3),
                    inset 0 1px 1px 0 rgba(255, 255, 255, 0.4);
    }
</style>
{% endblock %}

{% block content %}
<div class="min-h-screen bg-[#080417] text-slate-800 font-sans antialiased selection:bg-violet-600 selection:text-white">

    <!-- ======================================================== -->
    <!-- 1. HERO SECTION: LIGHT FROSTED GLASS ON DEEP DARK-PURPLE -->
    <!-- ======================================================== -->
    <section class="relative bg-gradient-to-b from-[#080417] via-[#0D0726] to-[#140B35] text-white overflow-hidden pb-24 border-b border-violet-950/50">
        <!-- Ambient Volumetric Lighting & Perspective 3D Grid -->
        <div class="absolute inset-0 pointer-events-none hero-perspective-grid opacity-70"></div>
        <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-violet-600/25 blur-[190px] pointer-events-none rounded-full"></div>
        <div class="absolute top-1/4 left-1/12 w-[500px] h-[500px] bg-indigo-600/20 blur-[160px] pointer-events-none rounded-full"></div>
        <div class="absolute top-1/3 right-1/12 w-[550px] h-[550px] bg-purple-600/20 blur-[170px] pointer-events-none rounded-full"></div>

        <!-- 1.1 FLOATING PILL NAVBAR -->
        <header class="relative z-50 pt-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div class="glass-pill-nav rounded-full px-5 py-3 flex items-center justify-between">
                
                <!-- Left: Logo & Brand -->
                <a href="/" class="flex items-center gap-2.5 group">
                    <div class="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6035EE] via-[#7C3AED] to-[#A78BFA] flex items-center justify-center shadow-lg shadow-purple-600/35 group-hover:scale-105 transition transform">
                        <i data-lucide="layers" class="w-5 h-5 text-white"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                            StoreBox
                            <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 border border-violet-400/30">2.0</span>
                        </span>
                    </div>
                </a>

                <!-- Center: Exact Menu Links -->
                <nav class="hidden lg:flex items-center space-x-1 text-xs font-bold text-slate-300">
                    <a href="#analytics" class="px-3 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_features }}</a>
                    <a href="#showcase" class="px-3 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.showcase_badge }}</a>
                    <a href="#resto" class="px-3 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.resto_badge }}</a>
                    <a href="#how" class="px-3 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_how }}</a>
                    <a href="#pricing" class="px-3 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_pricing }}</a>
                    <a href="#contact" class="px-3 py-2 rounded-full hover:text-white hover:bg-white/10 transition">{{ t.nav_contact }}</a>
                </nav>

                <!-- Right: Language Switcher & Login CTA -->
                <div class="flex items-center gap-3">
                    <!-- Language Dropdown -->
                    <div class="relative">
                        <button onclick="toggleLangDropdown(event)" class="glass-badge-hero px-3 py-1.5 rounded-full text-xs font-bold text-slate-200 flex items-center gap-1.5 hover:text-white transition cursor-pointer">
                            <i data-lucide="globe" class="w-3.5 h-3.5 text-violet-400"></i>
                            <span>{% if lang == 'ru' %}RU{% elif lang == 'en' %}EN{% else %}UZ{% endif %}</span>
                            <i data-lucide="chevron-down" class="w-3 h-3 text-slate-400"></i>
                        </button>
                        <div id="langDropdown" class="hidden absolute right-0 mt-2 w-32 glass-frosted-dark rounded-2xl border border-white/20 shadow-2xl py-1.5 z-50 text-xs font-semibold">
                            <a href="?lang=uz" class="flex items-center justify-between px-3.5 py-2 hover:bg-white/10 transition text-slate-200 hover:text-white {% if lang == 'uz' or not lang %}text-violet-400 font-black{% endif %}">
                                <span>O'zbek</span>
                                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">UZ</span>
                            </a>
                            <a href="?lang=ru" class="flex items-center justify-between px-3.5 py-2 hover:bg-white/10 transition text-slate-200 hover:text-white {% if lang == 'ru' %}text-violet-400 font-black{% endif %}">
                                <span>Русский</span>
                                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">RU</span>
                            </a>
                            <a href="?lang=en" class="flex items-center justify-between px-3.5 py-2 hover:bg-white/10 transition text-slate-200 hover:text-white {% if lang == 'en' %}text-violet-400 font-black{% endif %}">
                                <span>English</span>
                                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">EN</span>
                            </a>
                        </div>
                    </div>

                    <!-- Login CTA Button -->
                    <a href="/login/" class="shimmer-btn px-5 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg shadow-purple-600/35 transition transform hover:scale-105">
                        {{ t.nav_login }}
                    </a>

                    <!-- Mobile Menu Hamburger -->
                    <button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10">
                        <i data-lucide="menu" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Mobile Drawer Menu -->
            <div id="mobileMenuDrawer" class="hidden md:hidden mt-2 backdrop-blur-2xl bg-[#0F0A26]/95 border border-white/20 rounded-2xl shadow-2xl p-4 transition-all text-white">
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
                        <a href="/login/" class="block text-center w-full py-2.5 text-xs font-bold text-white bg-violet-600 rounded-xl shadow-md">{{ t.nav_login }}</a>
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

            <!-- 5 KEY TRUST BADGES & PILLS (LIGHT FROSTED GLASS) -->
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
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200">
                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
                    <span>{{ t.stat_uptime }}</span>
                </div>
                <div class="glass-badge-hero px-3.5 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-slate-200">
                    <i data-lucide="receipt" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>{{ t.badge_fiscal }}</span>
                </div>
            </div>

            <!-- PRIMARY ACTION BUTTONS -->
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <a href="/register/" class="shimmer-btn w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#6035EE] via-[#7C3AED] to-[#A855F7] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-600/35 flex items-center justify-center gap-2 transition transform hover:scale-105 active:scale-95">
                    <span>{{ t.hero_cta_free }}</span>
                    <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </a>
                <a href="/store/shop-655/" target="_blank" class="glass-badge-hero w-full sm:w-auto px-7 py-4 rounded-full text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-white/15 transition">
                    <i data-lucide="play-circle" class="w-4 h-4 text-violet-400"></i>
                    <span>{{ t.hero_cta_demo }}</span>
                </a>
            </div>
        </div>

        <!-- ======================================================== -->
        <!-- 1.3 CENTRAL DUAL DEVICE STAGE: BROWSER + IPHONE           -->
        <!-- ======================================================== -->
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 z-20">
            
            <!-- Floating HUD Badge 1: Top-Left (Live Revenue) -->
            <div class="hidden xl:flex items-center gap-3.5 px-4 py-3 rounded-2xl hud-glass-badge absolute -top-8 -left-2 z-40 animate-float-hud-1">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <i data-lucide="trending-up" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <span class="text-[11px] font-bold text-slate-300">Yangi tushum (Live)</span>
                    </div>
                    <div class="text-sm font-black text-white tracking-tight">+14 850 000 UZS</div>
                    <div class="text-[10px] text-emerald-400 font-medium">94 ta muvaffaqiyatli buyurtma</div>
                </div>
            </div>

            <!-- Floating HUD Badge 2: Top-Right (Realtime TMA + Web Sync) -->
            <div class="hidden xl:flex items-center gap-3.5 px-4 py-3 rounded-2xl hud-glass-badge absolute -top-6 -right-2 z-40 animate-float-hud-2">
                <div class="w-10 h-10 rounded-xl bg-violet-600/25 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0 shadow-inner">
                    <i data-lucide="bot" class="w-5 h-5"></i>
                </div>
                <div>
                    <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                        <i data-lucide="zap" class="w-3 h-3 text-amber-400"></i>
                        <span>Sinxron TMA + Web</span>
                    </div>
                    <div class="text-sm font-black text-white tracking-tight">&lt; 1 soniya</div>
                    <div class="text-[10px] text-violet-300 font-medium">Yagona ombor va mijozlar bazasi</div>
                </div>
            </div>

            <!-- Floating HUD Badge 3: Bottom-Left (Local Payments) -->
            <div class="hidden xl:flex items-center gap-3.5 px-4 py-3 rounded-2xl hud-glass-badge absolute -bottom-7 -left-2 z-40 animate-float-hud-2">
                <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0 shadow-inner">
                    <i data-lucide="credit-card" class="w-5 h-5"></i>
                </div>
                <div>
                    <span class="text-[11px] font-bold text-slate-300">Mahalliy to'lovlar</span>
                    <div class="text-xs font-black text-white tracking-tight">Click • Payme • Uzum</div>
                    <div class="text-[10px] text-sky-400 font-medium">0% qo'shimcha komissiya</div>
                </div>
            </div>

            <!-- Floating HUD Badge 4: Bottom-Right (Fiscal Soliq OFD) -->
            <div class="hidden xl:flex items-center gap-3.5 px-4 py-3 rounded-2xl hud-glass-badge absolute -bottom-8 -right-2 z-40 animate-float-hud-1">
                <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <i data-lucide="receipt" class="w-5 h-5"></i>
                </div>
                <div>
                    <span class="text-[11px] font-bold text-slate-300">Soliq / OFD tizimi</span>
                    <div class="text-xs font-black text-emerald-300 tracking-tight">100% Avtomatik Fiskal</div>
                    <div class="text-[10px] text-slate-400 font-medium">QR-kodli qonuniy cheklar</div>
                </div>
            </div>

            <!-- MAIN SHOWCASE WINDOW (MAC OS GLASS FRAMEWORK) -->
            <div id="heroMockupWindow" class="rounded-3xl border border-white/20 bg-slate-900/60 backdrop-blur-2xl device-specular-glow overflow-hidden transition-all duration-300">
                
                <!-- Mockup Mac OS Header -->
                <div class="px-5 py-3.5 border-b border-white/15 bg-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <!-- Left: Window Dots & Store Title -->
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-1.5">
                            <span class="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/50"></span>
                            <span class="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50"></span>
                            <span class="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/50"></span>
                        </div>
                        <div class="h-4 w-px bg-white/20 mx-1"></div>
                        <div class="flex items-center gap-2">
                            <span class="font-extrabold text-sm text-white tracking-tight">StoreBox 2.0</span>
                            <span class="px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 text-[10px] font-bold border border-violet-400/30">Haqiqiy platforma</span>
                        </div>
                    </div>

                    <!-- Center: Mode Switcher (HD Screenshot vs Interactive Dual Stage) -->
                    <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-white/10 text-[11px]">
                        <button type="button" onclick="switchHeroDisplay('screenshot')" id="heroTabScreenshot" class="px-3 py-1 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer">
                            <i data-lucide="image" class="w-3.5 h-3.5"></i>
                            <span>Haqiqiy interfeys (HD)</span>
                        </button>
                        <button type="button" onclick="switchHeroDisplay('interactive')" id="heroTabInteractive" class="px-3 py-1 rounded-full text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition cursor-pointer">
                            <i data-lucide="play" class="w-3 h-3"></i>
                            <span>Jonli interaktiv ko'rinish</span>
                        </button>
                    </div>

                    <!-- Right: Zoom CTA & Register -->
                    <div class="flex items-center gap-2.5">
                        <button type="button" onclick="openLightbox(window.innerWidth < 768 ? '/static/images/hero-dashboard-mobile.png' : '/static/images/hero-dashboard-desktop.png', 'StoreBox 2.0 — Boshqaruv paneli va real vitrina')" class="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer">
                            <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-violet-400"></i>
                            <span class="hidden sm:inline">Kattalashtirish</span>
                        </button>
                        <a href="/register/" class="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1 transition">
                            <span>Boshlash →</span>
                        </a>
                    </div>
                </div>

                <!-- 1.3.A High-Fidelity Dashboard Screenshot Container (Default) -->
                <div id="heroScreenshotContainer" class="relative group cursor-pointer overflow-hidden bg-[#0A071E]" onclick="openLightbox(window.innerWidth < 768 ? '/static/images/hero-dashboard-mobile.png' : '/static/images/hero-dashboard-desktop.png', 'StoreBox 2.0 — Boshqaruv paneli va real vitrina')">
                    <picture>
                        <source media="(max-width: 767px)" srcset="/static/images/hero-dashboard-mobile.png">
                        <img src="/static/images/hero-dashboard-desktop.png" alt="StoreBox 2.0 Real Light Dashboard & Storefront" class="w-full h-auto object-cover transform group-hover:scale-[1.01] transition duration-500">
                    </picture>
                    <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span class="px-4 py-2 rounded-full bg-white/95 text-slate-900 font-bold text-xs shadow-2xl flex items-center gap-2">
                            <i data-lucide="zoom-in" class="w-4 h-4 text-violet-600"></i>
                            <span>Kattalashtirib ko'rish (Full HD)</span>
                        </span>
                    </div>
                </div>

                <!-- 1.3.B Interactive Real Platform Stage (Browser + Phone Dual View) -->
                <div id="heroInteractiveContainer" class="hidden bg-slate-100 text-slate-800 p-4 sm:p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        <!-- LEFT & CENTER: REAL LIGHT STOREBOX MERCHANT CABINET (8 COLS) -->
                        <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
                            <!-- Cabinet Header -->
                            <div class="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    <span class="text-xs font-bold text-slate-700">shop-655.storebox.uz</span>
                                    <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">Onlayn</span>
                                </div>
                                <div class="flex items-center gap-3 text-xs text-slate-600 font-semibold">
                                    <span>O'zbekcha</span>
                                    <div class="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-[11px] font-bold">01</div>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
                                <!-- White Sidebar (As seen in video!) -->
                                <div class="hidden md:block md:col-span-4 border-r border-slate-200 bg-white p-3 space-y-1 text-xs">
                                    <!-- Sidebar Logo -->
                                    <div class="flex items-center gap-2 px-2 py-2 mb-2">
                                        <div class="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-black">S</div>
                                        <div>
                                            <div class="font-black text-slate-900 text-xs">StoreBox 2.0</div>
                                            <div class="text-[10px] text-slate-400 font-bold">PLATFORM</div>
                                        </div>
                                        <span class="ml-auto px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[9px] font-bold">PRO</span>
                                    </div>

                                    <!-- Navigation Items -->
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center gap-2 font-medium cursor-pointer">
                                        <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-400"></i>
                                        <span>Boshqaruv paneli</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-between font-medium cursor-pointer">
                                        <span class="flex items-center gap-2">
                                            <i data-lucide="shopping-bag" class="w-4 h-4 text-slate-400"></i>
                                            <span>Buyurtmalar</span>
                                        </span>
                                        <span class="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">12</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center gap-2 font-medium cursor-pointer">
                                        <i data-lucide="users" class="w-4 h-4 text-slate-400"></i>
                                        <span>Mijozlar</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center justify-between font-medium cursor-pointer">
                                        <span class="flex items-center gap-2">
                                            <i data-lucide="message-square" class="w-4 h-4 text-slate-400"></i>
                                            <span>Chat</span>
                                        </span>
                                        <span class="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">4</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center gap-2 font-medium cursor-pointer">
                                        <i data-lucide="package" class="w-4 h-4 text-slate-400"></i>
                                        <span>Mahsulotlar</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl bg-violet-50 text-violet-700 font-bold flex items-center justify-between cursor-pointer border border-violet-200/80">
                                        <span class="flex items-center gap-2">
                                            <i data-lucide="palette" class="w-4 h-4 text-violet-600"></i>
                                            <span>Dizayn & AI</span>
                                        </span>
                                        <span class="px-1.5 py-0.5 rounded bg-violet-600 text-white text-[9px] font-bold">AI</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center gap-2 font-medium cursor-pointer">
                                        <i data-lucide="bot" class="w-4 h-4 text-slate-400"></i>
                                        <span>Telegram bot</span>
                                    </div>
                                    <div class="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 flex items-center gap-2 font-medium cursor-pointer">
                                        <i data-lucide="settings" class="w-4 h-4 text-slate-400"></i>
                                        <span>Sozlamalar</span>
                                    </div>
                                </div>

                                <!-- Workspace Content Area -->
                                <div class="md:col-span-8 p-4 space-y-4 bg-slate-50/70">
                                    <!-- Store Logo & Name Card -->
                                    <div class="bg-white rounded-xl p-3 border border-slate-200/80 flex items-center gap-3">
                                        <div class="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-xs">
                                            PRIME
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="text-[11px] font-bold text-slate-400">Do'kon nomi:</div>
                                            <input type="text" value="StoreBox Demo Restoran" class="w-full text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 focus:outline-none" readonly>
                                        </div>
                                        <button class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition">
                                            Yuklash
                                        </button>
                                    </div>

                                    <!-- AI Design Studio Card -->
                                    <div class="bg-[#150E36] rounded-2xl p-4 text-white border border-violet-500/30 shadow-md">
                                        <div class="flex items-center justify-between mb-2">
                                            <div class="flex items-center gap-2">
                                                <i data-lucide="sparkles" class="w-4 h-4 text-violet-400"></i>
                                                <span class="text-xs font-black text-white">Sun'iy intellekt (AI) Dizayn Studio</span>
                                            </div>
                                            <span class="px-2 py-0.5 rounded-full bg-violet-600 text-[9px] font-extrabold uppercase">AI PRO</span>
                                        </div>
                                        <div class="text-[11px] text-violet-200 mb-3">Biznes yo'nalishingizni tanlang:</div>

                                        <!-- Niche Pills -->
                                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                                            <button onclick="handleNicheClick('restoran')" id="btnNicheRestoran" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-violet-700 shadow-sm flex items-center justify-center gap-1.5">
                                                <i data-lucide="utensils" class="w-3.5 h-3.5"></i>
                                                <span>Restoran & Kafe</span>
                                            </button>
                                            <button onclick="handleNicheClick('gullar')" id="btnNicheGullar" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 border border-violet-800/40 flex items-center justify-center gap-1.5">
                                                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-pink-400"></i>
                                                <span>Gullar & Sovg'a</span>
                                            </button>
                                            <button onclick="handleNicheClick('elektronika')" id="btnNicheElektronika" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 border border-violet-800/40 flex items-center justify-center gap-1.5">
                                                <i data-lucide="smartphone" class="w-3.5 h-3.5 text-sky-400"></i>
                                                <span>Elektronika</span>
                                            </button>
                                            <button onclick="handleNicheClick('kiyim')" id="btnNicheKiyim" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 border border-violet-800/40 flex items-center justify-center gap-1.5">
                                                <i data-lucide="shirt" class="w-3.5 h-3.5 text-amber-400"></i>
                                                <span>Kiyim & Butik</span>
                                            </button>
                                            <button onclick="handleNicheClick('oziq')" id="btnNicheOziq" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 border border-violet-800/40 flex items-center justify-center gap-1.5">
                                                <i data-lucide="box" class="w-3.5 h-3.5 text-emerald-400"></i>
                                                <span>Oziq-ovqat</span>
                                            </button>
                                            <button onclick="handleNicheClick('qahva')" id="btnNicheQahva" class="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 border border-violet-800/40 flex items-center justify-center gap-1.5">
                                                <i data-lucide="coffee" class="w-3.5 h-3.5 text-orange-400"></i>
                                                <span>Qahvaxona</span>
                                            </button>
                                        </div>

                                        <!-- AI Input with Action -->
                                        <div class="flex items-center gap-2">
                                            <input id="aiNicheInput" type="text" value="Restoran menyusi va taomlar rasmlarini avtomatik yuklash..." class="flex-1 text-xs bg-slate-950/60 border border-violet-700/50 rounded-xl px-3 py-2 text-violet-200 focus:outline-none" readonly>
                                            <button onclick="showMockupToast('AI generatsiya faollashtirildi!')" class="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition shadow-sm shrink-0">
                                                Qo'llash
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Quick KPI Summary Chips -->
                                    <div class="grid grid-cols-3 gap-2 text-slate-800">
                                        <div class="bg-white p-2.5 rounded-xl border border-slate-200">
                                            <div class="text-[10px] text-slate-400 font-bold">Bugungi tushum</div>
                                            <div class="text-xs font-black text-slate-900">+14 850 000 UZS</div>
                                            <div class="text-[10px] text-emerald-600 font-bold">+28.4%</div>
                                        </div>
                                        <div class="bg-white p-2.5 rounded-xl border border-slate-200">
                                            <div class="text-[10px] text-slate-400 font-bold">Buyurtmalar</div>
                                            <div class="text-xs font-black text-slate-900">24 ta faol</div>
                                            <div class="text-[10px] text-blue-600 font-bold">+4 yangi</div>
                                        </div>
                                        <div class="bg-white p-2.5 rounded-xl border border-slate-200">
                                            <div class="text-[10px] text-slate-400 font-bold">O'rtacha chek</div>
                                            <div class="text-xs font-black text-slate-900">185 000 UZS</div>
                                            <div class="text-[10px] text-violet-600 font-bold">Stabil</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- RIGHT: REAL IPHONE STOREFRONT (4 COLS) -->
                        <div class="lg:col-span-4 flex flex-col items-center">
                            <div class="text-xs font-extrabold text-slate-400 mb-2 flex items-center gap-1.5">
                                <i data-lucide="smartphone" class="w-3.5 h-3.5 text-violet-400"></i>
                                <span>Jonli vitrina (Mobil ko'rinish)</span>
                            </div>

                            <!-- iPhone Titanium Device Frame -->
                            <div class="w-full max-w-[340px] bg-slate-900 rounded-[42px] p-3 border-4 border-slate-700 phone-floating-shadow animate-float-phone">
                                <!-- Dynamic Island -->
                                <div class="w-24 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-end px-2">
                                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse"></div>
                                </div>

                                <!-- Screen Container -->
                                <div class="bg-slate-50 rounded-[30px] overflow-hidden text-slate-900 flex flex-col min-h-[460px]">
                                    <!-- Storefront Header -->
                                    <div class="px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between">
                                        <div class="flex items-center gap-2">
                                            <div class="w-6 h-6 rounded-lg bg-slate-900 text-emerald-400 flex items-center justify-center text-[10px] font-black">P</div>
                                            <span class="font-extrabold text-xs text-slate-900">Demo Restoran</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <button class="relative p-1.5 rounded-full bg-slate-100 text-slate-700">
                                                <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i>
                                                <span id="phoneCartBadge" class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center">2</span>
                                            </button>
                                            <a href="/login/" class="px-2 py-1 rounded-md bg-violet-100 text-violet-700 text-[10px] font-bold">Kirish</a>
                                        </div>
                                    </div>

                                    <!-- Promo Banner -->
                                    <div class="p-3">
                                        <div class="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 rounded-2xl p-3 text-white shadow-sm">
                                            <span class="px-2 py-0.5 rounded bg-rose-500 text-[9px] font-black uppercase">AKSIYA</span>
                                            <div class="font-black text-xs mt-1">«StoreBox Demo Restoran»</div>
                                            <div class="text-[10px] text-violet-200">Eng sara taomlar va 25-35 min tezkor yetkazib berish</div>
                                        </div>
                                    </div>

                                    <!-- Category Chips -->
                                    <div class="px-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                                        <span class="px-2.5 py-1 rounded-full bg-violet-600 text-white shrink-0">Barchasi</span>
                                        <span class="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">Fast-Fud</span>
                                        <span class="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">Issiq taom</span>
                                        <span class="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">Salatlar</span>
                                    </div>

                                    <!-- Product Cards Grid -->
                                    <div class="p-3 grid grid-cols-2 gap-2">
                                        <!-- Dish 1: Burger -->
                                        <div class="bg-white rounded-xl p-2 border border-slate-200 shadow-xs flex flex-col justify-between">
                                            <div class="h-20 bg-amber-50 rounded-lg flex items-center justify-center font-bold text-[11px] text-amber-800 relative">
                                                <span class="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[8px] font-bold absolute top-1 left-1">-13%</span>
                                                [ BURGER ]
                                            </div>
                                            <div class="font-bold text-[11px] text-slate-900 mt-1.5 leading-tight">Katta Burger Classic</div>
                                            <div class="text-[9px] text-slate-400">Marmar mol go'shti</div>
                                            <div class="flex items-center justify-between mt-2">
                                                <span class="text-[11px] font-black text-emerald-600">48 000 UZS</span>
                                                <button onclick="addPhoneItem('Burger')" class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs hover:bg-violet-700 transition cursor-pointer">+</button>
                                            </div>
                                        </div>

                                        <!-- Dish 2: Pizza -->
                                        <div class="bg-white rounded-xl p-2 border border-slate-200 shadow-xs flex flex-col justify-between">
                                            <div class="h-20 bg-rose-50 rounded-lg flex items-center justify-center font-bold text-[11px] text-rose-800 relative">
                                                <span class="px-1.5 py-0.5 rounded bg-rose-500 text-white text-[8px] font-bold absolute top-1 left-1">-13%</span>
                                                [ PITSA ]
                                            </div>
                                            <div class="font-bold text-[11px] text-slate-900 mt-1.5 leading-tight">Pitsa Margarita 32sm</div>
                                            <div class="text-[9px] text-slate-400">Mozzarella pishlog'i</div>
                                            <div class="flex items-center justify-between mt-2">
                                                <span class="text-[11px] font-black text-emerald-600">65 000 UZS</span>
                                                <button onclick="addPhoneItem('Pitsa')" class="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs hover:bg-violet-700 transition cursor-pointer">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Floating Order Toast inside Phone -->
                                    <div class="mt-auto p-2.5">
                                        <div class="bg-slate-900 rounded-xl p-2 text-white flex items-center gap-2 shadow-md">
                                            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                                            <div class="text-[10px] leading-tight flex-1">
                                                <div class="font-bold text-emerald-300">Yangi buyurtma tushdi!</div>
                                                <div class="text-slate-300">+96 000 UZS • Payme</div>
                                            </div>
                                            <a href="/store/shop-655/" target="_blank" class="px-2 py-1 rounded bg-violet-600 text-[9px] font-bold">Ochish</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- Toast feedback inside interactive mode -->
                    <div id="mockupToast" class="hidden mt-3 p-2.5 rounded-xl bg-violet-900/90 border border-violet-500 text-xs font-bold text-white text-center shadow-lg transition-all">
                        Amal bajarildi
                    </div>
                </div>

            </div>

            <!-- Mobile HUD Micro-Grid (Screens < xl) -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 xl:hidden">
                <div class="p-3 rounded-2xl hud-glass-badge flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <i data-lucide="trending-up" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-[10px] text-slate-400 font-medium truncate">Yangi tushum</div>
                        <div class="text-xs font-black text-white truncate">+14.8M UZS</div>
                    </div>
                </div>
                <div class="p-3 rounded-2xl hud-glass-badge flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-violet-600/25 text-violet-300 flex items-center justify-center shrink-0">
                        <i data-lucide="bot" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-[10px] text-slate-400 font-medium truncate">TMA + Web</div>
                        <div class="text-xs font-black text-white truncate">&lt; 1 soniya</div>
                    </div>
                </div>
                <div class="p-3 rounded-2xl hud-glass-badge flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                        <i data-lucide="credit-card" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-[10px] text-slate-400 font-medium truncate">To'lovlar</div>
                        <div class="text-xs font-black text-white truncate">Click • Payme</div>
                    </div>
                </div>
                <div class="p-3 rounded-2xl hud-glass-badge flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <i data-lucide="receipt" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="text-[10px] text-slate-400 font-medium truncate">Soliq OFD</div>
                        <div class="text-xs font-black text-white truncate">100% Avtomatik</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 2. TRUSTED BRANDS MARQUEE ON FROSTED GLASS TRACK          -->
    <!-- ======================================================== -->
    <section class="py-10 bg-[#0A061F] border-b border-violet-950/50 overflow-hidden relative">
        <div class="max-w-7xl mx-auto px-4 mb-5 text-center">
            <span class="text-xs font-extrabold uppercase tracking-wider text-violet-300 bg-violet-950/60 border border-violet-700/40 px-3.5 py-1 rounded-full">
                1 000+ dan ortiq faol brendlar va tadbirkorlar ishonchi
            </span>
        </div>

        <div class="relative w-full overflow-hidden flex [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div class="animate-marquee py-2 flex items-center gap-6 text-sm font-black text-slate-300">
                <!-- Brand Item 1 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-violet-600/25 text-violet-400 flex items-center justify-center">
                        <i data-lucide="utensils" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Jumanji</span>
                </div>
                <!-- Brand Item 2 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-amber-600/25 text-amber-400 flex items-center justify-center">
                        <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">XonXonim</span>
                </div>
                <!-- Brand Item 3 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-rose-600/25 text-rose-400 flex items-center justify-center">
                        <i data-lucide="fish" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">SUSHI BAR</span>
                </div>
                <!-- Brand Item 4 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-purple-600/25 text-purple-400 flex items-center justify-center">
                        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Mona Restaurant</span>
                </div>
                <!-- Brand Item 5 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-emerald-600/25 text-emerald-400 flex items-center justify-center">
                        <i data-lucide="coffee" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Bek Osiyo</span>
                </div>
                <!-- Brand Item 6 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-yellow-600/25 text-yellow-400 flex items-center justify-center">
                        <i data-lucide="box" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Сыроварня</span>
                </div>
                <!-- Brand Item 7 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-sky-600/25 text-sky-400 flex items-center justify-center">
                        <i data-lucide="trees" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Lago Park</span>
                </div>
                <!-- Brand Item 8 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-blue-600/25 text-blue-400 flex items-center justify-center">
                        <i data-lucide="activity" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">DI sport</span>
                </div>
                <!-- Brand Item 9 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-indigo-600/25 text-indigo-400 flex items-center justify-center">
                        <i data-lucide="shirt" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Zero Fashion</span>
                </div>
                <!-- Brand Item 10 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-teal-600/25 text-teal-400 flex items-center justify-center">
                        <i data-lucide="palette" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">LYAGAN</span>
                </div>
                <!-- Brand Item 11 -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-amber-600/25 text-amber-400 flex items-center justify-center">
                        <i data-lucide="award" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">N'Medov</span>
                </div>

                <!-- Duplicate Loop for Seamless Infinite Scroll -->
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-violet-600/25 text-violet-400 flex items-center justify-center">
                        <i data-lucide="utensils" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">Jumanji</span>
                </div>
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-amber-600/25 text-amber-400 flex items-center justify-center">
                        <i data-lucide="chef-hat" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">XonXonim</span>
                </div>
                <div class="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-[#140E33] border border-white/10 hover:border-violet-500/50 hover:bg-[#1C1445] transition-all cursor-default shadow-sm">
                    <span class="w-7 h-7 rounded-xl bg-rose-600/25 text-rose-400 flex items-center justify-center">
                        <i data-lucide="fish" class="w-3.5 h-3.5"></i>
                    </span>
                    <span class="text-white tracking-tight">SUSHI BAR</span>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 3. PLATFORM CAPABILITIES: STOREBOX AFZALLIKLARI (BENTO)  -->
    <!-- ======================================================== -->
    <section id="analytics" class="py-24 bg-[#F8F9FD] text-slate-800 relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs tracking-wider uppercase border border-violet-200">
                    {{ t.analytics_badge }}
                </span>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mt-4 mb-4">
                    {{ t.analytics_title }}
                </h2>
                <p class="text-base sm:text-lg text-slate-600 font-normal">
                    {{ t.analytics_subtitle }}
                </p>
            </div>

            <!-- Bento Grid matching Video Frame 8 ("Robosell Afzalliklari") -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                <!-- Bento Card 1: Trafik manbalari (Donut Chart) 4 Cols -->
                <div class="md:col-span-4 glass-frosted-light rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-extrabold text-lg text-slate-900">{{ t.analytics_traffic_title }}</h3>
                            <span class="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">Kunlik</span>
                        </div>
                        <p class="text-xs text-slate-500 mb-6">Barcha trafik manbalarini yagona boshqaruv panelida kuzatib boring</p>
                    </div>

                    <div class="flex items-center justify-between gap-4">
                        <div>
                            <div class="text-4xl font-black text-slate-900">709</div>
                            <div class="text-xs font-semibold text-slate-500">{{ t.analytics_traffic_users }}</div>
                        </div>
                        <!-- SVG Donut Chart -->
                        <div class="relative w-28 h-28 shrink-0">
                            <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" stroke-width="3.8"></circle>
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#7C3AED" stroke-width="3.8" stroke-dasharray="68, 100"></circle>
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#38BDF8" stroke-width="3.8" stroke-dasharray="24, 100" stroke-dashoffset="-68"></circle>
                                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F59E0B" stroke-width="3.8" stroke-dasharray="8, 100" stroke-dashoffset="-92"></circle>
                            </svg>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-slate-200/80 mt-4 flex items-center justify-between text-xs text-slate-600 font-semibold">
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-violet-600"></span><span>Telegram (68%)</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span><span>Web (24%)</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>Insta (8%)</span></div>
                    </div>
                </div>

                <!-- Bento Card 2: Savdo statistikasi (Stat Pills) 4 Cols -->
                <div class="md:col-span-4 glass-frosted-light rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-extrabold text-lg text-slate-900">{{ t.analytics_sales_stats }}</h3>
                            <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">Jonli</span>
                        </div>
                        <p class="text-xs text-slate-500 mb-6">Har doim yangiliklardan xabardor bo'ling va savdoda yangi cho'qqilarni zabt eting</p>
                    </div>

                    <div class="space-y-3">
                        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
                            <div class="flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                                    <i data-lucide="trending-up" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] text-slate-400 font-bold uppercase">Daromad</div>
                                    <div class="text-sm font-black text-slate-900">3 485 695 UZS</div>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">+2.3%</span>
                        </div>

                        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
                            <div class="flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                                    <i data-lucide="users" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] text-slate-400 font-bold uppercase">Jami Mijozlar</div>
                                    <div class="text-sm font-black text-slate-900">4 786 nafar</div>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold">+14 yangi</span>
                        </div>

                        <div class="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
                            <div class="flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                                    <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                                </div>
                                <div>
                                    <div class="text-[10px] text-slate-400 font-bold uppercase">Buyurtmalar</div>
                                    <div class="text-sm font-black text-slate-900">214 ta</div>
                                </div>
                            </div>
                            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">+0.78%</span>
                        </div>
                    </div>
                </div>

                <!-- Bento Card 3: Platforma hisoboti (Channels) 4 Cols -->
                <div class="md:col-span-4 glass-frosted-light rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-extrabold text-lg text-slate-900">{{ t.analytics_platform_report }}</h3>
                            <span class="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">Haftalik</span>
                        </div>
                        <p class="text-xs text-slate-500 mb-6">Har bir platforma qancha buyurtma keltirayotganini aniq bilib turasiz</p>
                    </div>

                    <div class="mb-4">
                        <div class="text-3xl font-black text-slate-900">205 <span class="text-sm font-medium text-slate-500">buyurtma</span></div>
                    </div>

                    <div class="space-y-3.5">
                        <div>
                            <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                <span class="flex items-center gap-1.5"><i data-lucide="bot" class="w-3.5 h-3.5 text-blue-500"></i><span>Telegram bot</span></span>
                                <span>118 ta (58%)</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-blue-500 h-2.5 rounded-full" style="width: 58%"></div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                <span class="flex items-center gap-1.5"><i data-lucide="globe" class="w-3.5 h-3.5 text-violet-500"></i><span>Veb-sayt</span></span>
                                <span>64 ta (31%)</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-violet-600 h-2.5 rounded-full" style="width: 31%"></div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                <span class="flex items-center gap-1.5"><i data-lucide="smartphone" class="w-3.5 h-3.5 text-pink-500"></i><span>Instagram Web</span></span>
                                <span>23 ta (11%)</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-pink-500 h-2.5 rounded-full" style="width: 11%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bento Card 4: Savdolar dinamikasi (Area Chart) 6 Cols -->
                <div class="md:col-span-6 glass-frosted-light rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-extrabold text-lg text-slate-900">{{ t.analytics_sales_dynamics }}</h3>
                            <span class="text-xs font-bold text-violet-600">Haftalik daromad</span>
                        </div>
                        <p class="text-xs text-slate-500 mb-4">Biznesingizdan tushayotgan daromadni real vaqtda nazorat qiling</p>
                    </div>

                    <!-- SVG Smooth Area Curve -->
                    <div class="relative w-full h-44 my-2">
                        <svg class="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.35"/>
                                    <stop offset="100%" stop-color="#7C3AED" stop-opacity="0.0"/>
                                </linearGradient>
                            </defs>
                            <path d="M0,130 C70,110 120,140 180,70 C240,10 300,90 380,40 C440,5 470,20 500,10 L500,160 L0,160 Z" fill="url(#chartGrad)"/>
                            <path d="M0,130 C70,110 120,140 180,70 C240,10 300,90 380,40 C440,5 470,20 500,10" fill="none" stroke="#7C3AED" stroke-width="3"/>
                            <circle cx="380" cy="40" r="5" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2"/>
                        </svg>
                        <!-- Peak Tooltip -->
                        <div class="absolute top-2 right-24 bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md">
                            Shanba: 3 765 000 UZS
                        </div>
                    </div>

                    <div class="flex items-center justify-between text-xs font-bold text-slate-400 pt-2 border-t border-slate-200">
                        <span>Dsh</span><span>Ssh</span><span>Chr</span><span>Pay</span><span>Jum</span><span class="text-violet-700">Shan</span><span>Yak</span>
                    </div>
                </div>

                <!-- Bento Card 5: Top 10 Mahsulotlar 6 Cols -->
                <div class="md:col-span-6 glass-frosted-light rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="font-extrabold text-lg text-slate-900">{{ t.analytics_top_products }}</h3>
                            <span class="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">Kunlik</span>
                        </div>
                        <p class="text-xs text-slate-500 mb-4">Eng ko'p sotilayotgan mahsulotlarni kuzatib boring va omborni to'ldiring</p>
                    </div>

                    <div class="space-y-2.5">
                        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/70">
                            <div class="flex items-center gap-3">
                                <span class="font-mono font-bold text-slate-400 text-xs">01</span>
                                <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">BURGER</div>
                                <div>
                                    <div class="font-bold text-xs text-slate-900">Katta Burger Classic</div>
                                    <div class="text-[10px] text-slate-400">145 ta sotuv</div>
                                </div>
                            </div>
                            <span class="text-xs font-black text-emerald-600">6 960 000 UZS</span>
                        </div>

                        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/70">
                            <div class="flex items-center gap-3">
                                <span class="font-mono font-bold text-slate-400 text-xs">02</span>
                                <div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-[10px]">PITSA</div>
                                <div>
                                    <div class="font-bold text-xs text-slate-900">Pitsa Margarita 32sm</div>
                                    <div class="text-[10px] text-slate-400">92 ta sotuv</div>
                                </div>
                            </div>
                            <span class="text-xs font-black text-emerald-600">5 980 000 UZS</span>
                        </div>

                        <div class="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200/70">
                            <div class="flex items-center gap-3">
                                <span class="font-mono font-bold text-slate-400 text-xs">03</span>
                                <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">LAVASH</div>
                                <div>
                                    <div class="font-bold text-xs text-slate-900">Mol go'shtli Lavash Big</div>
                                    <div class="text-[10px] text-slate-400">88 ta sotuv</div>
                                </div>
                            </div>
                            <span class="text-xs font-black text-emerald-600">3 520 000 UZS</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 4. SHOWCASE: STOREBOX DO'KON (UNIVERSAL E-COMMERCE)       -->
    <!-- ======================================================== -->
    <section class="py-24 bg-white text-slate-800 relative border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <div class="inline-flex items-center gap-2 mb-3">
                    <span class="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs tracking-wider uppercase border border-violet-200">
                        {{ t.showcase_badge }}
                    </span>
                    <span class="px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs tracking-wider uppercase border border-blue-200">
                        {{ t.shop_badge }}
                    </span>
                </div>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mt-4 mb-4">
                    Kiyim, elektronika va butiklar uchun zamonaviy vitrina
                </h2>
                <p class="text-base sm:text-lg text-slate-600 font-normal">
                    Tovar kartochkalari, rang va razmer tanlash, buyurtma berish — barchasi bir sahifada qulay joylashtirilgan.
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <!-- Left: E-Commerce Features -->
                <div class="lg:col-span-6 space-y-6">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">Galereya va 360° tovar suratlari</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">Mijozlar tovarlarni turli burchaklardan ko'rishi, ranglar palitrasi va o'lchamlarini bir zumda tanlashi mumkin.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">Telegram TMA ichida 1 tugma bilan xarid</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">Hech qanday murakkab formalar yo'q. Telefon raqami va manzil avtomatik to'ldiriladi.</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">Avtomatik qoldiqlar va ombor integratsiyasi</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">Tovarlar soni tugaganda tizim avtomatik buyurtmani to'xtatadi va yangi kirimni talab qiladi.</p>
                        </div>
                    </div>

                    <div class="pt-4 flex flex-wrap items-center gap-4">
                        <button onclick="openLightbox('/static/images/storefront-product-mobile.png', 'StoreBox Do\'kon — Mahsulot sahifasi')" class="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-600/25 flex items-center gap-2 transition">
                            <i data-lucide="maximize-2" class="w-4 h-4"></i>
                            <span>Vitrinasini ko'rish</span>
                        </button>
                    </div>
                </div>

                <!-- Right: Product Mockup -->
                <div class="lg:col-span-6 flex justify-center">
                    <div class="relative group cursor-pointer" onclick="openLightbox('/static/images/storefront-product-mobile.png', 'StoreBox Do\'kon — Mahsulot sahifasi')">
                        <img src="/static/images/storefront-product-mobile.png" alt="StoreBox Do'kon Mahsulot Sahifasi" class="max-w-[340px] w-full rounded-[36px] shadow-2xl border border-slate-200 transform group-hover:scale-102 transition duration-300">
                        <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-[36px] flex items-center justify-center pointer-events-none">
                            <span class="px-4 py-2 rounded-full bg-white/95 text-slate-900 font-bold text-xs shadow-xl flex items-center gap-2">
                                <i data-lucide="zoom-in" class="w-4 h-4 text-blue-600"></i>
                                <span>Kattalashtirish</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 5. SHOWCASE: STOREBOX RESTORAN                          -->
    <!-- ======================================================== -->
    <section class="py-24 bg-[#F8F9FD] text-slate-800 relative border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-xs tracking-wider uppercase border border-emerald-200">
                    {{ t.resto_badge }}
                </span>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mt-4 mb-4">
                    {{ t.resto_title }}
                </h2>
                <p class="text-base sm:text-lg text-slate-600 font-normal">
                    {{ t.resto_subtitle }}
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <!-- Left: 4 Advantage Checklists -->
                <div class="lg:col-span-6 space-y-6">
                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.resto_f1_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.resto_f1_desc }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.resto_f2_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.resto_f2_desc }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.resto_f3_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.resto_f3_desc }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4">
                        <div class="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                            <i data-lucide="check" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.resto_f4_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.resto_f4_desc }}</p>
                        </div>
                    </div>

                    <div class="pt-4 flex flex-wrap items-center gap-4">
                        <a href="/store/shop-655/" target="_blank" class="px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-lg shadow-purple-600/25 flex items-center gap-2 transition">
                            <span>{{ t.resto_cta }}</span>
                            <i data-lucide="external-link" class="w-4 h-4"></i>
                        </a>
                        <button onclick="openLightbox('/static/images/restaurant-mobile.png', 'StoreBox Restoran — Jonli vitrina')" class="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center gap-2 transition">
                            <i data-lucide="maximize-2" class="w-4 h-4 text-violet-600"></i>
                            <span>Kattalashtirish</span>
                        </button>
                    </div>
                </div>

                <!-- Right: Restaurant Mockup -->
                <div class="lg:col-span-6 flex justify-center">
                    <div class="relative group cursor-pointer" onclick="openLightbox('/static/images/restaurant-mobile.png', 'StoreBox Restoran — Jonli vitrina')">
                        <img src="/static/images/restaurant-mobile.png" alt="StoreBox Restoran Vitrinasi" class="max-w-[340px] w-full rounded-[36px] shadow-2xl border border-slate-200 transform group-hover:scale-102 transition duration-300">
                        <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity rounded-[36px] flex items-center justify-center pointer-events-none">
                            <span class="px-4 py-2 rounded-full bg-white/95 text-slate-900 font-bold text-xs shadow-xl flex items-center gap-2">
                                <i data-lucide="zoom-in" class="w-4 h-4 text-violet-600"></i>
                                <span>Kattalashtirish</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 6. SHOWCASE: STOREBOX DIZAYN STUDIYASI (NO-CODE BUILDER)  -->
    <!-- ======================================================== -->
    <section class="py-24 bg-white text-slate-800 relative border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs tracking-wider uppercase border border-violet-200">
                    {{ t.design_studio_badge }}
                </span>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mt-4 mb-4">
                    {{ t.design_studio_title }}
                </h2>
                <p class="text-base sm:text-lg text-slate-600 font-normal">
                    {{ t.design_studio_subtitle }}
                </p>
            </div>

            <!-- Design Studio Preview Frame -->
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-300 bg-white group cursor-pointer" onclick="openLightbox('/static/images/design-studio-showcase.png', 'StoreBox Dizayn Studiyasi')">
                <img src="/static/images/design-studio-showcase.png" alt="StoreBox Design Studio" class="w-full h-auto object-cover transform group-hover:scale-[1.01] transition duration-500">
                <div class="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span class="px-5 py-2.5 rounded-full bg-white/95 text-slate-900 font-bold text-sm shadow-2xl flex items-center gap-2">
                        <i data-lucide="zoom-in" class="w-4 h-4 text-violet-600"></i>
                        <span>Dizayn Studiyasini kattalashtirib ko'rish</span>
                    </span>
                </div>
            </div>

            <div class="mt-8 flex justify-center">
                <a href="/dashboard/design/" class="px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-xl shadow-purple-600/25 flex items-center gap-2 transition transform hover:scale-105">
                    <i data-lucide="palette" class="w-4 h-4"></i>
                    <span>Dizayn Studiyasiga o'tish</span>
                </a>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 7. CHAT HUB: MIJOZLAR BILAN CHAT (FRAME 22 BENCHMARK)    -->
    <!-- ======================================================== -->
    <section class="py-24 bg-gradient-to-b from-[#080417] via-[#0D0726] to-[#140B35] text-white relative">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="px-4 py-1.5 rounded-full bg-violet-900/60 text-violet-300 font-extrabold text-xs tracking-wider uppercase border border-violet-700/40">
                    {{ t.chat_hub_badge }}
                </span>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-white mt-4 mb-4">
                    {{ t.chat_hub_title }}
                </h2>
                <p class="text-base sm:text-lg text-slate-300 font-normal">
                    {{ t.chat_hub_subtitle }}
                </p>
            </div>

            <!-- Chat Showcase Showcase -->
            <div class="relative rounded-3xl overflow-hidden device-specular-glow border border-white/20 group cursor-pointer" onclick="openLightbox('/static/images/chat-showcase.png', 'Mijozlar bilan jonli chat')">
                <img src="/static/images/chat-showcase.png" alt="StoreBox Chat Hub" class="w-full h-auto object-cover transform group-hover:scale-[1.01] transition duration-500">
                <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span class="px-5 py-2.5 rounded-full bg-white text-slate-900 font-bold text-sm shadow-2xl flex items-center gap-2">
                        <i data-lucide="zoom-in" class="w-4 h-4 text-violet-600"></i>
                        <span>Chat tizimini kattalashtirish</span>
                    </span>
                </div>
            </div>

            <div class="mt-8 flex justify-center">
                <a href="/dashboard/chats/" class="px-8 py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-xl shadow-purple-600/35 flex items-center gap-2 transition transform hover:scale-105">
                    <i data-lucide="message-square" class="w-4 h-4"></i>
                    <span>Chat boshqaruviga o'tish</span>
                </a>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 8. ONBOARDING: QANDAY BOSHLASH MUMKIN? (FRAME 32 BENCHMARK) -->
    <!-- ======================================================== -->
    <section class="py-24 bg-white text-slate-800 relative border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-16">
                <span class="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs tracking-wider uppercase border border-violet-200">
                    {{ t.how_badge }}
                </span>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mt-4 mb-4">
                    {{ t.how_title }}
                </h2>
                <p class="text-base sm:text-lg text-slate-600 font-normal">
                    {{ t.how_subtitle }}
                </p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <!-- 4 Steps Timeline -->
                <div class="lg:col-span-7 space-y-6">
                    <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div class="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            01
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.how_step1_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.how_step1_desc }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div class="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            02
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.how_step2_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.how_step2_desc }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div class="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            03
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.how_step3_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.how_step3_desc }}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <div class="w-12 h-12 rounded-2xl bg-violet-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            04
                        </div>
                        <div>
                            <h4 class="font-black text-lg text-slate-900 mb-1">{{ t.how_step4_title }}</h4>
                            <p class="text-sm text-slate-600 leading-relaxed">{{ t.how_step4_desc }}</p>
                        </div>
                    </div>
                </div>

                <!-- Video / Guide Preview Card with Play Button -->
                <div class="lg:col-span-5">
                    <div class="bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-950 rounded-3xl p-8 text-white shadow-2xl border border-white/20 flex flex-col items-center justify-center text-center min-h-[380px] relative overflow-hidden">
                        <div class="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/30 rounded-full blur-3xl"></div>
                        <div class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center mb-6 shadow-xl transform hover:scale-110 transition cursor-pointer">
                            <i data-lucide="play" class="w-8 h-8 text-white fill-white ml-1"></i>
                        </div>
                        <span class="px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white font-extrabold text-xs uppercase tracking-wider mb-2">
                            {{ t.how_video_guide_btn|safe }}
                        </span>
                        <h3 class="font-black text-2xl text-white mb-2">{{ t.how_video_guide_title|default:"StoreBox video yo'riqnomasi" }}</h3>
                        <p class="text-sm text-violet-200 max-w-xs mb-6">3 daqiqada platformadan qanday foydalanishni bilib oling</p>
                        <a href="/register/" class="px-6 py-3 rounded-xl bg-white text-violet-900 font-extrabold text-xs shadow-lg hover:bg-violet-50 transition">
                            Hoziroq ro'yxatdan o'ting
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    
    <!-- ======================================================== -->
    <!-- 9. COST SAVINGS COMPARISON (MINIMAL EXPENDITURE SAVINGS) -->
    <!-- ======================================================== -->
    <section class="py-24 bg-gradient-to-b from-[#080417] via-[#0D0726] to-[#140B35] text-white relative border-b border-violet-950/50 overflow-hidden">
        <!-- Ambient lighting -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-600/15 blur-[160px] pointer-events-none rounded-full"></div>

        <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="text-center max-w-3xl mx-auto mb-14">
                <span class="px-4 py-1.5 rounded-full bg-violet-900/60 text-violet-300 font-extrabold text-xs tracking-wider uppercase border border-violet-700/40">
                    {{ t.compare_col_storebox|safe }}
                </span>
                <h2 class="text-2xl sm:text-4xl font-black tracking-tight text-white mt-4 mb-4 uppercase">
                    {{ t.compare_title|safe }}
                </h2>
                <p class="text-base text-slate-300 font-normal">
                    {{ t.compare_subtitle|safe }}
                </p>
            </div>

            <!-- Comparison Frosted Glass Table Card -->
            <div class="glass-frosted-dark rounded-3xl overflow-hidden border border-white/15 shadow-2xl backdrop-blur-2xl">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-white/15 bg-white/5">
                                <th class="py-4 px-6 text-xs font-black uppercase text-slate-300">{{ t.compare_col_service|safe }}</th>
                                <th class="py-4 px-6 text-xs font-black uppercase text-rose-300">{{ t.compare_col_custom|safe }}</th>
                                <th class="py-4 px-6 text-xs font-black uppercase text-emerald-300 bg-violet-600/20 border-l border-white/10">{{ t.compare_col_storebox|safe }}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/10 text-sm">
                            <tr class="hover:bg-white/5 transition">
                                <td class="py-4 px-6 font-bold text-white">{{ t.compare_f1|safe }}</td>
                                <td class="py-4 px-6 text-slate-400 font-medium line-through decoration-rose-500/60">{{ t.compare_f1_custom|safe }}</td>
                                <td class="py-4 px-6 bg-violet-600/10 border-l border-white/10 font-black text-emerald-400">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                                        <span>{{ t.compare_included|safe }}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-white/5 transition">
                                <td class="py-4 px-6 font-bold text-white">{{ t.compare_f2|safe }}</td>
                                <td class="py-4 px-6 text-slate-400 font-medium line-through decoration-rose-500/60">{{ t.compare_f2_custom|safe }}</td>
                                <td class="py-4 px-6 bg-violet-600/10 border-l border-white/10 font-black text-emerald-400">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                                        <span>{{ t.compare_included|safe }}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-white/5 transition">
                                <td class="py-4 px-6 font-bold text-white">{{ t.compare_f3|safe }}</td>
                                <td class="py-4 px-6 text-slate-400 font-medium line-through decoration-rose-500/60">{{ t.compare_f3_custom|safe }}</td>
                                <td class="py-4 px-6 bg-violet-600/10 border-l border-white/10 font-black text-emerald-400">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                                        <span>{{ t.compare_included|safe }}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-white/5 transition">
                                <td class="py-4 px-6 font-bold text-white">{{ t.compare_f4|safe }}</td>
                                <td class="py-4 px-6 text-slate-400 font-medium line-through decoration-rose-500/60">{{ t.compare_f4_custom|safe }}</td>
                                <td class="py-4 px-6 bg-violet-600/10 border-l border-white/10 font-black text-emerald-400">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                                        <span>{{ t.compare_included|safe }}</span>
                                    </div>
                                </td>
                            </tr>
                            <tr class="hover:bg-white/5 transition">
                                <td class="py-4 px-6 font-bold text-white">{{ t.compare_f5|safe }}</td>
                                <td class="py-4 px-6 text-slate-400 font-medium line-through decoration-rose-500/60">{{ t.compare_f5_custom|safe }}</td>
                                <td class="py-4 px-6 bg-violet-600/10 border-l border-white/10 font-black text-emerald-400">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                                        <span>{{ t.compare_included|safe }}</span>
                                    </div>
                                </td>
                            </tr>
                            <!-- Total Row -->
                            <tr class="bg-violet-950/70 border-t-2 border-violet-500 font-black">
                                <td class="py-5 px-6 text-white text-base">{{ t.compare_total|safe }}</td>
                                <td class="py-5 px-6 text-rose-400 text-sm font-black">{{ t.compare_total_custom|safe }}</td>
                                <td class="py-5 px-6 bg-emerald-950/40 border-l border-white/10 text-emerald-300 text-lg font-black">
                                    <div class="flex items-center gap-2">
                                        <i data-lucide="sparkles" class="w-5 h-5 text-emerald-400 shrink-0"></i>
                                        <span>{{ t.compare_total_storebox|safe }}</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 10. TARIFLAR (PRICING WITH DURATION SWITCHER)             -->
    <!-- ======================================================== -->
    <section id="pricing" class="py-24 bg-[#F8F9FD] text-slate-800 relative border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-3xl mx-auto mb-12">
                <span class="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs tracking-wider uppercase border border-violet-200">
                    {{ t.pricing_badge }}
                </span>
                <h2 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mt-4 mb-4">
                    {{ t.pricing_title }}
                </h2>
                <p class="text-base sm:text-lg text-slate-600 font-normal">
                    {{ t.pricing_subtitle }}
                </p>

                <!-- Duration Switcher -->
                <div class="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-white border border-slate-300 shadow-sm mt-8">
                    <button type="button" onclick="setBillingDuration(3)" id="durBtn3" class="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer">
                        3 oy <span class="text-[10px] text-violet-600 font-extrabold">(-10%)</span>
                    </button>
                    <button type="button" onclick="setBillingDuration(6)" id="durBtn6" class="px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer">
                        6 oy <span class="text-[10px] text-violet-600 font-extrabold">(-15%)</span>
                    </button>
                    <button type="button" onclick="setBillingDuration(12)" id="durBtn12" class="px-4 py-2 rounded-full text-xs font-bold bg-violet-600 text-white shadow-sm transition cursor-pointer">
                        12 oy <span class="text-[10px] text-amber-300 font-extrabold">(-20%)</span>
                    </button>
                </div>
            </div>

            <!-- Pricing Cards Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <!-- Plan 1: Start -->
                <div class="glass-frosted-light rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Kichik biznes uchun</span>
                        <h3 class="text-2xl font-black text-slate-900 mt-1 mb-3">Start</h3>
                        <div class="flex items-baseline gap-1 mb-6">
                            <span id="priceStart" class="text-4xl font-black text-slate-900">199 000</span>
                            <span class="text-xs font-bold text-slate-500">UZS / oyiga</span>
                        </div>
                        <div class="space-y-3 text-xs font-semibold text-slate-600 border-t border-slate-200/80 pt-6 mb-8">
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>100 tagacha mahsulotlar</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Telegram bot vitrinasi</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Click va Payme to'lovlari</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Soliq OFD integratsiyasi</span></div>
                        </div>
                    </div>
                    <a href="/register/?plan=start&duration=12" id="planLinkStart" class="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs text-center transition">
                        Start tarifini tanlash
                    </a>
                </div>

                <!-- Plan 2: Basic -->
                <div class="glass-frosted-light rounded-3xl p-8 flex flex-col justify-between">
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">O'sayotgan bizneslar</span>
                        <h3 class="text-2xl font-black text-slate-900 mt-1 mb-3">Basic</h3>
                        <div class="flex items-baseline gap-1 mb-6">
                            <span id="priceBasic" class="text-4xl font-black text-slate-900">399 000</span>
                            <span class="text-xs font-bold text-slate-500">UZS / oyiga</span>
                        </div>
                        <div class="space-y-3 text-xs font-semibold text-slate-600 border-t border-slate-200/80 pt-6 mb-8">
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>1 000 tagacha mahsulotlar</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Telegram bot va Veb-sayt</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Mijozlar bilan live chat</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Promokodlar va aksiyalar</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>Kuryerlar va xodimlar qo'shish</span></div>
                        </div>
                    </div>
                    <a href="/register/?plan=basic&duration=12" id="planLinkBasic" class="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-xs text-center transition">
                        Basic tarifini tanlash
                    </a>
                </div>

                <!-- Plan 3: Professional (Featured) -->
                <div class="relative rounded-3xl p-8 bg-gradient-to-b from-[#180E3E] to-[#0E0826] text-white border-2 border-violet-500 shadow-2xl flex flex-col justify-between">
                    <div class="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md">
                        Eng ommabop
                    </div>
                    <div>
                        <span class="text-xs font-bold text-violet-300 uppercase tracking-wider">Katta korxonalar va tarmoqlar</span>
                        <h3 class="text-2xl font-black text-white mt-1 mb-3">Professional</h3>
                        <div class="flex items-baseline gap-1 mb-6">
                            <span id="pricePro" class="text-4xl font-black text-white">699 000</span>
                            <span class="text-xs font-bold text-violet-300">UZS / oyiga</span>
                        </div>
                        <div class="space-y-3 text-xs font-semibold text-slate-200 border-t border-violet-800/60 pt-6 mb-8">
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Cheksiz mahsulotlar va buyurtmalar</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Shaxsiy domen (masalan: mybrand.uz)</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Sun'iy intellekt (AI) Dizayn Studio</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>YES POS va 1C integratsiyasi</span></div>
                            <div class="flex items-center gap-2"><i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>24/7 Shaxsiy menedjer qo'llab-quvvatlashi</span></div>
                        </div>
                    </div>
                    <a href="/register/?plan=pro&duration=12" id="planLinkPro" class="shimmer-btn w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-black text-xs text-center shadow-lg shadow-purple-600/35 transition transform hover:scale-102">
                        Professional tarifini boshlash
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 11. CONTACT & INQUIRY (HALI HAM SAVOLLAR BORMIMI?)       -->
    <!-- ======================================================== -->
    <section id="contact" class="py-24 bg-white text-slate-800 relative border-b border-slate-200/80">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="glass-frosted-light rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl relative overflow-hidden">
                <div class="text-center max-w-2xl mx-auto mb-10">
                    <span class="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-extrabold text-xs tracking-wider uppercase border border-violet-200">
                        {{ t.nav_contact }}
                    </span>
                    <h2 class="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-4 mb-3">
                        {{ t.contact_box_title }}
                    </h2>
                    <p class="text-sm sm:text-base text-slate-600 font-normal">
                        {{ t.contact_box_subtitle }}
                    </p>
                </div>

                <form id="landingLeadForm" onsubmit="submitLeadForm(event)" class="space-y-4 max-w-xl mx-auto">
                    {% csrf_token %}
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t.contact_name_label }}</label>
                            <input type="text" id="leadName" required placeholder="{{ t.contact_name_ph }}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t.contact_phone_label }}</label>
                            <input type="tel" id="leadPhone" required placeholder="+998 90 123 45 67" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t.contact_company_label }}</label>
                        <input type="text" id="leadCompany" placeholder="{{ t.contact_company_ph }}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">{{ t.contact_message_label }}</label>
                        <textarea id="leadMessage" rows="3" placeholder="{{ t.contact_message_ph }}" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition"></textarea>
                    </div>
                    <div class="pt-2">
                        <button type="submit" id="leadSubmitBtn" class="shimmer-btn w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm shadow-lg shadow-purple-600/30 transition transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer">
                            <span>{{ t.contact_submit_btn }}</span>
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                    <div id="leadSuccessMsg" class="hidden p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center">
                        {{ t.contact_success_msg }}
                    </div>
                </form>

                <!-- Phone & Direct Contact Bar -->
                <div class="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-slate-600">
                    <a href="tel:{{ t.footer_phone }}" class="flex items-center gap-2 text-violet-700 hover:text-violet-800 transition">
                        <i data-lucide="phone-call" class="w-4 h-4 text-violet-600"></i>
                        <span>{{ t.footer_phone }}</span>
                    </a>
                    <span class="text-slate-300">•</span>
                    <div class="flex items-center gap-2 text-slate-500">
                        <i data-lucide="clock" class="w-4 h-4 text-slate-400"></i>
                        <span>{{ t.footer_phone_hours }}</span>
                    </div>
                    <span class="text-slate-300">•</span>
                    <a href="mailto:{{ t.footer_email }}" class="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition">
                        <i data-lucide="mail" class="w-4 h-4 text-violet-600"></i>
                        <span>{{ t.footer_email }}</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- ======================================================== -->
    <!-- 12. FOOTER                                               -->
    <!-- ======================================================== -->
    <footer class="py-14 bg-[#060313] text-slate-400 text-xs border-t border-violet-950/40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                <!-- Col 1: Brand -->
                <div class="space-y-3 md:col-span-1">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6035EE] via-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center font-black shadow-md">S</div>
                        <span class="font-extrabold text-white text-base">StoreBox 2.0</span>
                    </div>
                    <p class="text-slate-400 text-xs leading-relaxed">
                        {{ t.footer_desc }}
                    </p>
                </div>

                <!-- Col 2: Navigation -->
                <div>
                    <h5 class="font-black text-white text-xs uppercase tracking-wider mb-3">{{ t.footer_col_product }}</h5>
                    <ul class="space-y-2 text-xs">
                        <li><a href="#analytics" class="hover:text-white transition">{{ t.nav_features }}</a></li>
                        <li><a href="#showcase" class="hover:text-white transition">{{ t.showcase_badge }}</a></li>
                        <li><a href="#resto" class="hover:text-white transition">{{ t.resto_badge }}</a></li>
                        <li><a href="/dashboard/design/" class="hover:text-white transition">{{ t.design_studio_badge }}</a></li>
                        <li><a href="#pricing" class="hover:text-white transition">{{ t.nav_pricing }}</a></li>
                    </ul>
                </div>

                <!-- Col 3: Company -->
                <div>
                    <h5 class="font-black text-white text-xs uppercase tracking-wider mb-3">{{ t.footer_col_company }}</h5>
                    <ul class="space-y-2 text-xs">
                        <li><a href="#how" class="hover:text-white transition">{{ t.how_title }}</a></li>
                        <li><a href="#news" class="hover:text-white transition">{{ t.nav_news }}</a></li>
                        <li><a href="#reviews" class="hover:text-white transition">{{ t.nav_about }}</a></li>
                        <li><a href="/register/" class="hover:text-white transition">{{ t.hero_cta_free }}</a></li>
                    </ul>
                </div>

                <!-- Col 4: Contacts & Support -->
                <div>
                    <h5 class="font-black text-white text-xs uppercase tracking-wider mb-3">{{ t.footer_col_contacts }}</h5>
                    <ul class="space-y-2 text-xs">
                        <li class="flex items-center gap-2">
                            <i data-lucide="phone" class="w-3.5 h-3.5 text-violet-400"></i>
                            <a href="tel:{{ t.footer_phone }}" class="text-white font-bold hover:text-violet-300 transition">{{ t.footer_phone }}</a>
                        </li>
                        <li class="text-slate-500 text-[11px]">{{ t.footer_phone_hours }}</li>
                        <li class="flex items-center gap-2 pt-1">
                            <i data-lucide="mail" class="w-3.5 h-3.5 text-violet-400"></i>
                            <a href="mailto:{{ t.footer_email }}" class="hover:text-white transition">{{ t.footer_email }}</a>
                        </li>
                        <li class="flex items-start gap-2 pt-1">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5"></i>
                            <span class="text-[11px] text-slate-500">{{ t.footer_address }}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
                <div>
                    {{ t.footer_rights }}
                </div>
                <div class="flex items-center gap-4 text-xs">
                    <a href="#" class="hover:text-slate-300 transition">{{ t.footer_privacy }}</a>
                    <a href="#" class="hover:text-slate-300 transition">{{ t.footer_terms }}</a>
                </div>
            </div>
        </div>
    </footer>

    <!-- ======================================================== -->
    <!-- LIGHTBOX MODAL (RETINA INSPECTION)                       -->
    <!-- ======================================================== -->
    <div id="imageLightboxModal" class="hidden fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onclick="closeLightbox(event)">
        <div class="relative max-w-6xl w-full max-h-[90vh] flex flex-col items-center" onclick="event.stopPropagation()">
            <button onclick="closeLightbox()" class="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer">
                <i data-lucide="x" class="w-6 h-6"></i>
            </button>
            <img id="lightboxImage" src="" alt="Enlarged Showcase" class="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/20">
            <div id="lightboxCaption" class="mt-3 text-xs font-bold text-slate-300"></div>
        </div>
    </div>

</div>

<!-- Client scripts -->
<script>
    // Language Dropdown Toggle
    function toggleLangDropdown(e) {
        e.stopPropagation();
        const dd = document.getElementById('langDropdown');
        if (dd) dd.classList.toggle('hidden');
    }
    document.addEventListener('click', function() {
        const dd = document.getElementById('langDropdown');
        if (dd && !dd.classList.contains('hidden')) dd.classList.add('hidden');
    });

    // Mobile Menu
    function toggleMobileMenu() {
        const drawer = document.getElementById('mobileMenuDrawer');
        if (drawer) drawer.classList.toggle('hidden');
    }
    function closeMobileMenu() {
        const drawer = document.getElementById('mobileMenuDrawer');
        if (drawer) drawer.classList.add('hidden');
    }

    // Hero Display Switcher: HD Screenshot vs Interactive
    function switchHeroDisplay(mode) {
        const sc = document.getElementById('heroScreenshotContainer');
        const ic = document.getElementById('heroInteractiveContainer');
        const tabS = document.getElementById('heroTabScreenshot');
        const tabI = document.getElementById('heroTabInteractive');

        if (mode === 'screenshot') {
            if (sc) sc.classList.remove('hidden');
            if (ic) ic.classList.add('hidden');
            if (tabS) {
                tabS.className = "px-3 py-1 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer";
            }
            if (tabI) {
                tabI.className = "px-3 py-1 rounded-full text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition cursor-pointer";
            }
        } else {
            if (sc) sc.classList.add('hidden');
            if (ic) ic.classList.remove('hidden');
            if (tabI) {
                tabI.className = "px-3 py-1 rounded-full bg-violet-600 text-white font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer";
            }
            if (tabS) {
                tabS.className = "px-3 py-1 rounded-full text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition cursor-pointer";
            }
            if (window.lucide) lucide.createIcons();
        }
    }

    // Phone Cart Counter
    let phoneCartCount = 2;
    function addPhoneItem(name) {
        phoneCartCount++;
        const badge = document.getElementById('phoneCartBadge');
        if (badge) badge.innerText = phoneCartCount;
        showMockupToast(name + " savatga qo'shildi! Jami: " + phoneCartCount + " ta");
    }

    // Interactive Niche Buttons
    function handleNicheClick(niche) {
        const input = document.getElementById('aiNicheInput');
        const niches = ['restoran', 'gullar', 'elektronika', 'kiyim', 'oziq', 'qahva'];
        niches.forEach(n => {
            const btn = document.getElementById('btnNiche' + n.charAt(0).toUpperCase() + n.slice(1));
            if (btn) {
                if (n === niche) {
                    btn.className = "px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white text-violet-700 shadow-sm flex items-center justify-center gap-1.5";
                } else {
                    btn.className = "px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-violet-950/60 text-violet-200 hover:bg-violet-900/60 border border-violet-800/40 flex items-center justify-center gap-1.5";
                }
            }
        });

        if (input) {
            if (niche === 'restoran') input.value = "Restoran menyusi va taomlar rasmlarini avtomatik yuklash...";
            else if (niche === 'gullar') input.value = "Gullar guldastalari va sovg'alar to'plamini yuklash...";
            else if (niche === 'elektronika') input.value = "Smartfonlar, gadjetlar va aksessuarlar katalogini yuklash...";
            else if (niche === 'kiyim') input.value = "Kiyimlar, poyafzal va razmerlar jadvalini yaratish...";
            else if (niche === 'oziq') input.value = "Oziq-ovqat mahsulotlari va ichimliklar ro'yxatini yuklash...";
            else if (niche === 'qahva') input.value = "Qahva turlari, shirinliklar va desertlar menyusini tuzish...";
        }
        showMockupToast("Nisha tanlandi: " + niche.toUpperCase());
    }

    // Mockup Toast
    function showMockupToast(msg) {
        const toast = document.getElementById('mockupToast');
        if (toast) {
            toast.innerText = msg;
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 2500);
        }
    }

    // Lightbox Modal
    function openLightbox(src, caption) {
        const modal = document.getElementById('imageLightboxModal');
        const img = document.getElementById('lightboxImage');
        const cap = document.getElementById('lightboxCaption');
        if (modal && img) {
            img.src = src;
            if (cap) cap.innerText = caption || '';
            modal.classList.remove('hidden');
        }
    }
    function closeLightbox() {
        const modal = document.getElementById('imageLightboxModal');
        if (modal) modal.classList.add('hidden');
    }

    // Pricing Duration Switcher
    let currentDuration = 12;
    const pricingRates = {
        3: { start: '219 000', basic: '439 000', pro: '769 000' },
        6: { start: '209 000', basic: '419 000', pro: '729 000' },
        12: { start: '199 000', basic: '399 000', pro: '699 000' },
    };

    function setBillingDuration(months) {
        currentDuration = months;
        [3, 6, 12].forEach(m => {
            const btn = document.getElementById('durBtn' + m);
            if (btn) {
                if (m === months) {
                    btn.className = "px-4 py-2 rounded-full text-xs font-bold bg-violet-600 text-white shadow-sm transition cursor-pointer";
                } else {
                    btn.className = "px-4 py-2 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer";
                }
            }
        });

        const rates = pricingRates[months];
        if (rates) {
            const pS = document.getElementById('priceStart');
            const pB = document.getElementById('priceBasic');
            const pP = document.getElementById('pricePro');
            if (pS) pS.innerText = rates.start;
            if (pB) pB.innerText = rates.basic;
            if (pP) pP.innerText = rates.pro;
        }

        const lS = document.getElementById('planLinkStart');
        const lB = document.getElementById('planLinkBasic');
        const lP = document.getElementById('planLinkPro');
        if (lS) lS.href = '/register/?plan=start&duration=' + months;
        if (lB) lB.href = '/register/?plan=basic&duration=' + months;
        if (lP) lP.href = '/register/?plan=pro&duration=' + months;
    }

    // Lead Consultation Submission
    async function submitLeadForm(e) {
        e.preventDefault();
        const name = document.getElementById('leadName') ? document.getElementById('leadName').value.trim() : '';
        const phone = document.getElementById('leadPhone') ? document.getElementById('leadPhone').value.trim() : '';
        const company = document.getElementById('leadCompany') ? document.getElementById('leadCompany').value.trim() : '';
        const message = document.getElementById('leadMessage') ? document.getElementById('leadMessage').value.trim() : '';
        const btn = document.getElementById('leadSubmitBtn');
        const success = document.getElementById('leadSuccessMsg');

        if (!name || !phone) return;

        try {
            if (btn) btn.disabled = true;
            const csrfEl = document.querySelector('[name=csrfmiddlewaretoken]');
            const csrfToken = csrfEl ? csrfEl.value : '';
            const res = await fetch('/api/lead/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({ name, phone, company, message })
            });
            const data = await res.json();
            if (data.success) {
                if (success) success.classList.remove('hidden');
                const form = document.getElementById('landingLeadForm');
                if (form) form.reset();
            } else {
                alert(data.error || "Xatolik yuz berdi");
            }
        } catch(err) {
            console.error(err);
        } finally {
            if (btn) btn.disabled = false;
        }
    }

    // Initialize Lucide Icons on load
    document.addEventListener('DOMContentLoaded', function() {
        if (window.lucide) {
            lucide.createIcons();
        }
    });
</script>
{% endblock %}
"""

if __name__ == "__main__":
    content = get_template_content()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully wrote updated landing page template to: {OUTPUT_FILE}")
