import React, { useState } from "react";
import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Menu,
  Sparkles,
} from "lucide-react";
import { SidekickPanel } from "../ai/SidekickPanel";
import { PageBreadcrumbs } from "./PageBreadcrumbs";

export const AppLayout: React.FC = () => {
  const { user, loading, lang: language } = useAuth();
  const { newOrdersCount } = useNotifications();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidekickOpen, setSidekickOpen] = useState(false);

  // Global keyboard shortcut (Cmd+J / Ctrl+J) and custom event to toggle Sidekick
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setSidekickOpen((prev) => !prev);
      }
    };
    const handleOpenSidekickEvent = () => {
      setSidekickOpen(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("storebox:open-sidekick", handleOpenSidekickEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("storebox:open-sidekick", handleOpenSidekickEvent);
    };
  }, []);

  React.useEffect(() => {
    if (language === "ru") {
      document.title = "StoreBox — Панель управления магазином";
    } else if (language === "en") {
      document.title = "StoreBox — Store Management Dashboard";
    } else {
      document.title = "StoreBox — Do'kon Boshqaruv Paneli";
    }
  }, [language]);

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#edf2f8] dark:bg-[#151020]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#6d5a88] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-normal text-slate-500">
            {language === "ru" ? "Загрузка..." : "Yuklanmoqda..."}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isCurrent = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname === "";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="storebox-app-shell min-h-screen flex text-[#171321] dark:text-zinc-100 transition-colors">
      {/* 1. Sidebar (Desktop Docked + Mobile Slide-over Drawer) */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Workspace Column */}
      {/* 2. Main Workspace Column (shrinks smoothly when Sidekick push-column is open) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300">
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSidekick={() => setSidekickOpen((prev) => !prev)}
        />

        <main
          className={`flex-1 px-3 sm:px-5 ${
            sidekickOpen ? "sidekick-open lg:px-4 xl:px-5" : "lg:px-8"
          } py-5 pb-24 lg:pb-12 max-w-[1440px] w-full mx-auto min-w-0 transition-all duration-300`}
        >
          <PageBreadcrumbs />
          <Outlet />
        </main>

        {/* Floating Quick AI Button (hidden when Sidekick is already open) */}
        {!sidekickOpen && (
          <button
            type="button"
            onClick={() => setSidekickOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-35 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#211b2e] hover:bg-[#151020] text-white shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer group border border-zinc-700"
            title="Открыть StoreBox Sidekick AI (Cmd+J)"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8d7ca5] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8d7ca5]"></span>
            </span>
            <Sparkles className="w-4 h-4 text-[#8d7ca5] group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-semibold tracking-tight pr-0.5 hidden sm:inline">Sidekick AI</span>
          </button>
        )}

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#211b2e]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-around z-30 px-2 shadow-xs">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">
              {language === "ru" ? "Главная" : language === "en" ? "Home" : "Asosiy"}
            </span>
          </Link>

          <Link
            to="/orders"
            className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/orders") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={1.6} />
            {newOrdersCount > 0 && (
              <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full bg-[#8d7ca5] text-white text-[9px] font-bold flex items-center justify-center">
                {newOrdersCount}
              </span>
            )}
            <span className="text-[10px]">
              {language === "ru" ? "Заказы" : language === "en" ? "Orders" : "Buyurtma"}
            </span>
          </Link>

          <Link
            to="/products"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/products") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">
              {language === "ru" ? "Товары" : language === "en" ? "Products" : "Mahsulot"}
            </span>
          </Link>

          <Link
            to="/analytics"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/analytics") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">
              {language === "ru" ? "Аналитика" : language === "en" ? "Analytics" : "Tahlil"}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Menu className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">
              {language === "ru" ? "Меню" : language === "en" ? "Menu" : "Menyu"}
            </span>
          </button>
        </nav>
      </div>

      {/* 3. Shopify Sidekick Docked Push-Column (Desktop) & Drawer (Mobile) */}
      <SidekickPanel
        isOpen={sidekickOpen}
        onClose={() => setSidekickOpen(false)}
      />
    </div>
  );
};
