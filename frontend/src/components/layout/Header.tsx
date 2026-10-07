import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
  Check,
  Plus,
  Store as StoreIcon,
  Settings as SettingsIcon,
  ShoppingCart,
  MessageSquare,
  Menu,
  User,
  UserPlus,
  X,
  Loader2,
  Sparkles,
  Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Language } from "../../i18n/translations";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, store, stores, switchStore, logout, lang, setLang, t } = useAuth();
  const { totalUnread, notifications, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const handleThemeChanged = (e: any) => {
      setIsDark(e.detail === "dark");
    };
    window.addEventListener("themechanged", handleThemeChanged);
    return () => window.removeEventListener("themechanged", handleThemeChanged);
  }, []);

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle("dark");
    setIsDark(dark);
    const newTheme = dark ? "dark" : "light";
    localStorage.setItem("storebox_theme", newTheme);
    window.dispatchEvent(new CustomEvent("themechanged", { detail: newTheme }));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/dashboard/login/";
    }
  };


  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const languages: { code: Language; label: string; badge: string }[] = [
    { code: "ru", label: "Русский", badge: "RU" },
    { code: "uz", label: "O'zbek", badge: "UZ" },
    { code: "en", label: "English", badge: "EN" },
  ];

  const storefrontUrl = store?.storefront_url || (store?.subdomain ? `/store/${store.subdomain}/` : "#");

  return (
    <header className="h-14 bg-white dark:bg-[#18181B] border-b border-slate-200/80 dark:border-zinc-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors select-none">
      {/* 1. Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            title={lang === "ru" ? "Открыть меню" : "Open menu"}
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Search input: shown on sm+, collapsed to icon button on mobile */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="header-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={
              lang === "ru"
                ? "Поиск по магазину (товары, заказы, клиенты)..."
                : lang === "en"
                ? "Search store (products, orders, customers)..."
                : "Qidiruv (mahsulot, buyurtma, mijoz)..."
            }
            className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-slate-100/80 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/60 focus:bg-white dark:focus:bg-zinc-900 focus:border-slate-400 dark:focus:border-zinc-500 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
            <kbd className="text-[10px] font-sans text-slate-400 bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 px-1 py-0.5 rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Mobile Search Icon Button */}
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title={lang === "ru" ? "Поиск" : "Search"}
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Full-width Mobile Search Bar Overlay */}
        {mobileSearchOpen && (
          <div className="fixed inset-x-0 top-0 h-14 bg-white dark:bg-[#18181B] border-b border-slate-200 dark:border-zinc-800 px-4 flex items-center gap-3 z-50 animate-in fade-in">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setMobileSearchOpen(false);
                  navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              placeholder={lang === "ru" ? "Поиск по магазину..." : "Search..."}
              className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Store Domain Pill */}
        {store?.subdomain && (
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-normal text-slate-600 dark:text-zinc-300 transition-colors shrink-0"
            title={lang === "ru" ? "Открыть витрину" : "Open storefront"}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-normal">{store.subdomain}.storebox.uz</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        )}
      </div>

      {/* 2. Right: Theme, Notifications, Language, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          title={isDark ? "Светлая тема" : "Темная тема"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            data-testid="notif-bell-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer relative"
            title={lang === "ru" ? "Уведомления" : "Notifications"}
          >
            <Bell className="w-4 h-4" />
            {totalUnread > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-zinc-800"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg p-3.5 z-50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {lang === "ru" ? "Уведомления" : "Bildirishnomalar"}
                  </span>
                  {totalUnread > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                      {totalUnread}
                    </span>
                  )}
                </div>
                {totalUnread > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await markAllRead();
                    }}
                    className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    {lang === "ru" ? "Прочитать все" : "Barchasini o'qish"}
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-6 text-center space-y-1">
                  <div className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {lang === "ru" ? "Нет новых уведомлений" : "Yangi bildirishnomalar yo'q"}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {lang === "ru" ? "Все заказы и сообщения обработаны" : "Barcha yangiliklar ko'rib chiqilgan"}
                  </p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5 no-scrollbar">
                  {notifications.map((item) => (
                    <Link
                      key={item.id}
                      to={item.url}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 text-slate-600 dark:text-zinc-400">
                        {item.type === "order" ? <ShoppingCart className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.body}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Language Selector Dropdown */}
        <div ref={langRef} className="relative">
          <button
            type="button"
            data-testid="language-selector-btn"
            onClick={() => setLangOpen(!langOpen)}
            className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>{languages.find((l) => l.code === lang)?.badge || "RU"}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg py-1 z-50 text-xs">
              {languages.map((l) => {
                const isActive = lang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 transition-colors cursor-pointer text-left ${
                      isActive
                        ? "text-slate-900 dark:text-white font-medium bg-slate-50 dark:bg-zinc-800"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span>{l.label}</span>
                    {isActive && <Check className="w-3 h-3 text-slate-900 dark:text-white" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            data-testid="user-profile-btn"
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 flex items-center justify-center text-xs font-semibold shrink-0">
              {(user?.first_name || user?.username || user?.phone || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <div className="font-medium text-slate-900 dark:text-white leading-tight truncate max-w-[100px]">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : (user?.username || user?.phone || "Admin")}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg py-1.5 z-50 text-xs divide-y divide-slate-100 dark:divide-zinc-800">
              <div className="px-3.5 py-2">
                <div className="font-semibold text-slate-900 dark:text-white truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : (user?.username || user?.phone || "Admin")}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user?.phone || store?.name || "StoreBox"}
                </div>
              </div>

              {/* Stores switcher */}
              <div className="py-1">
                <div className="px-3.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  {lang === "ru" ? "Магазины" : "Do'konlar"}
                </div>
                {stores && stores.length > 0 ? (
                  stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        switchStore(s.id);
                        setUserOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-1.5 transition-colors text-left ${
                        store?.id === s.id
                          ? "font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-zinc-800"
                          : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {store?.id === s.id && <Check className="w-3 h-3 text-slate-900 dark:text-white" />}
                    </button>
                  ))
                ) : (
                  <div className="px-3.5 py-1 text-slate-600 dark:text-zinc-400">{store?.name || "StoreBox"}</div>
                )}
                <a
                  href="/onboarding/?new=1"
                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-zinc-900 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer text-left"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{lang === "ru" ? "Добавить магазин" : "Do'kon qo'shish"}</span>
                </a>
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === "ru" ? "Настройки" : "Sozlamalar"}</span>
                </Link>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-1.5 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <StoreIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === "ru" ? "Витрина" : "Vitrina"}</span>
                </a>
              </div>

              <div className="py-1 space-y-0.5">
                <a
                  href="/register/?switch=1"
                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === "ru" ? "Добавить аккаунт" : "Yangi hisob yaratish"}</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false);
                    window.location.href = "/dashboard/login/?switch=1";
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === "ru" ? "Сменить аккаунт" : "Boshqa hisobga o'tish"}</span>
                </button>
                <button
                  type="button"
                  data-testid="header-logout-btn"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>{lang === "ru" ? "Выйти" : "Chiqish"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
