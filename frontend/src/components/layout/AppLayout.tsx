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
  Menu
} from "lucide-react";

export const AppLayout: React.FC = () => {
  const { user, loading, lang: language } = useAuth();
  const { newOrdersCount } = useNotifications();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="h-screen flex items-center justify-center bg-[#F6F6F7] dark:bg-[#111213]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
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
    <div className="min-h-screen flex bg-[#F6F6F7] dark:bg-[#111213] text-slate-900 dark:text-zinc-100 transition-colors">
      {/* 1. Sidebar (Desktop Docked + Mobile Slide-over Drawer) */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-12 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>

        {/* 3. Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-around z-30 px-2 shadow-xs">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">{language === "ru" ? "Главная" : "Asosiy"}</span>
          </Link>

          <Link
            to="/orders"
            className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/orders") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShoppingCart className="w-4 h-4" strokeWidth={1.6} />
            {newOrdersCount > 0 && (
              <span className="absolute top-0 right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {newOrdersCount}
              </span>
            )}
            <span className="text-[10px]">{language === "ru" ? "Заказы" : "Buyurtma"}</span>
          </Link>

          <Link
            to="/products"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/products") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Package className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">{language === "ru" ? "Товары" : "Mahsulot"}</span>
          </Link>

          <Link
            to="/analytics"
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg transition-colors ${
              isCurrent("/analytics") ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">{language === "ru" ? "Аналитика" : "Tahlil"}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Menu className="w-4 h-4" strokeWidth={1.6} />
            <span className="text-[10px]">{language === "ru" ? "Меню" : "Menyu"}</span>
          </button>
        </nav>
      </div>
    </div>
  );
};
