import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Share2,
  Download,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
  Check,
  Headphones,
  SlidersHorizontal
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Language } from "../../i18n/translations";

export const Header: React.FC = () => {
  const { user, store, logout, lang, setLang, t } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
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
    await logout();
    navigate("/login");
  };

  const languages: { code: Language; label: string; badge: string }[] = [
    { code: "uz", label: "O`zbek", badge: "UZ" },
    { code: "ru", label: "Русский", badge: "RU" },
    { code: "en", label: "English", badge: "EN" },
  ];

  return (
    <header className="h-16 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-[28px] shadow-sm px-4 sm:px-6 flex items-center justify-between sticky top-4 z-30 transition-colors duration-300 gap-3">
      {/* 1. LEFT: SEARCH PILL (matching Photo 1 & 2) */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Qidiruv (mahsulot, buyurtma, mijoz)..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-transparent hover:border-black/[0.06] dark:hover:border-white/10 focus:border-neutral-400 focus:bg-white dark:focus:bg-black/30 text-xs font-medium text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all"
          />
        </div>

        {/* Store Domain Badge */}
        {store?.subdomain && (
          <a
            href={`/store/${store.subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 hover:border-neutral-400 transition-all text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 shadow-2xs group shrink-0"
            title="Jonli do'konni ochish"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{store.subdomain}.storebox.uz</span>
            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          </a>
        )}
      </div>

      {/* 2. RIGHT: FILTER PILLS, SHARE, EXPORT, THEME, PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Filter Pills */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-black/[0.04] dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors">
            <span>Barcha hududlar</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-white/5 border border-black/[0.04] dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-neutral-200/60 dark:hover:bg-white/10 transition-colors">
            <span>Oxirgi 30 kun</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          onClick={() => window.open('/dashboard/orders/export/', '_blank')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-neutral-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Eksport</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          title={isDark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>

        {/* Notification Bell with Red Badge (from Photo 1, 2, 3) */}
        <div className="relative">
          <button
            type="button"
            className="w-9 h-9 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white dark:ring-slate-900"></span>
          </button>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-black">
              {languages.find((l) => l.code === lang)?.badge}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-50 text-xs font-semibold">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors ${
                    lang === l.code ? "text-neutral-900 dark:text-white font-bold bg-black/5 dark:bg-white/10" : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-neutral-200 dark:bg-white/10">
                      {l.badge}
                    </span>
                    <span>{l.label}</span>
                  </span>
                  {lang === l.code && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 p-0.5 rounded-2xl hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-xs font-black shadow-sm ring-2 ring-black/5 dark:ring-white/10">
              {user?.first_name?.charAt(0) || user?.phone?.slice(-2) || "U"}
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs">
              <div className="p-2 border-b border-black/[0.06] dark:border-white/10">
                <div className="font-bold text-neutral-900 dark:text-white truncate">{user?.first_name || "Admin"}</div>
                <div className="text-[10px] text-neutral-400 font-mono">{user?.phone}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("logout") || "Chiqish"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
