import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  Download,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  LogOut,
  Check,
  Plus,
  Building2,
  Store as StoreIcon,
  Settings as SettingsIcon,
  ShoppingCart,
  MessageSquare,
  X,
  ShoppingBag,
  Utensils,
  AlertCircle
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Language } from "../../i18n/translations";

export const Header: React.FC = () => {
  const { user, store, stores, switchStore, createStore, logout, lang, setLang, t } = useAuth();
  const { totalUnread, notifications, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

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
      if (regionRef.current && !regionRef.current.contains(target)) {
        setRegionOpen(false);
      }
      if (periodRef.current && !periodRef.current.contains(target)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLang = () => {
    setLangOpen((prev) => {
      const next = !prev;
      if (next) {
        setUserOpen(false);
        setNotifOpen(false);
        setRegionOpen(false);
        setPeriodOpen(false);
      }
      return next;
    });
  };

  const toggleUser = () => {
    setUserOpen((prev) => {
      const next = !prev;
      if (next) {
        setLangOpen(false);
        setNotifOpen(false);
        setRegionOpen(false);
        setPeriodOpen(false);
      }
      return next;
    });
  };

  const toggleNotif = () => {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        setLangOpen(false);
        setUserOpen(false);
        setRegionOpen(false);
        setPeriodOpen(false);
      }
      return next;
    });
  };

  const toggleRegion = () => {
    setRegionOpen((prev) => {
      const next = !prev;
      if (next) {
        setLangOpen(false);
        setUserOpen(false);
        setNotifOpen(false);
        setPeriodOpen(false);
      }
      return next;
    });
  };

  const togglePeriod = () => {
    setPeriodOpen((prev) => {
      const next = !prev;
      if (next) {
        setLangOpen(false);
        setUserOpen(false);
        setNotifOpen(false);
        setRegionOpen(false);
      }
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains("dark");
  });

  // Real store branches query
  const { data: branchesData } = useQuery({
    queryKey: ["branches", store?.id],
    queryFn: async () => {
      const res = await api.get("/branches/");
      return res.data as {
        branches: Array<{ id: number; name: string; is_main?: boolean; address?: string }>;
        total: number;
      };
    },
    enabled: !!user,
  });

  const selectedBranch = searchParams.get("branch") || "all";
  const selectedPeriod = searchParams.get("period") || "today";

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
      navigate(`/orders?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const languages: { code: Language; label: string; badge: string }[] = [
    { code: "uz", label: "O`zbek", badge: "UZ" },
    { code: "ru", label: "Русский", badge: "RU" },
    { code: "en", label: "English", badge: "EN" },
  ];

  const realBranches = branchesData?.branches || [];
  const branchOptions = [
    { id: "all", label: t("all_regions") || "Barcha filiallar" },
    ...realBranches.map((b) => ({
      id: String(b.id),
      label: b.name + (b.is_main ? ` (${t("main_branch") || "Asosiy"})` : ""),
    })),
  ];

  const periodOptions = [
    { id: "today", label: t("today") || "Bugun" },
    { id: "week", label: t("last_7_days") || "Oxirgi 7 kun" },
    { id: "month", label: t("last_30_days") || "Oxirgi 30 kun" },
    { id: "quarter", label: t("this_quarter") || "Shu chorak" },
    { id: "year", label: t("this_year") || "Har yil" },
  ];

  const currentRegionLabel =
    branchOptions.find((r) => r.id === selectedBranch)?.label || t("all_regions") || "Barcha filiallar";
  const currentPeriodLabel =
    periodOptions.find((p) => p.id === selectedPeriod)?.label || t("today") || "Bugun";

  return (
    <header className="h-16 bg-white/75 dark:bg-[#12141a] backdrop-blur-2xl border border-white/85 dark:border-white/10 rounded-[28px] shadow-[0_16px_40px_-12px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] px-4 sm:px-6 flex items-center justify-between sticky top-4 z-50 transition-colors duration-300 gap-3">
      {/* 1. LEFT: SEARCH PILL */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            data-testid="header-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("search_placeholder") || "Qidiruv (mahsulot, buyurtma, mijoz)..."}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white/60 dark:bg-white/5 border border-black/[0.06] dark:border-white/10 focus:border-[#c8ff6a]/80 focus:bg-white dark:focus:bg-black/30 text-xs font-medium text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
          />
        </div>

        {/* Store Domain Badge */}
        {store?.subdomain && (
          <a
            href={store.storefront_url || `/store/${store.subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/80 dark:border-white/10 hover:border-[#c8ff6a]/60 transition-all text-xs font-bold text-neutral-700 dark:text-neutral-200 shadow-2xs group shrink-0"
            title={t("open_storefront_live") || "Jonli do'konni ochish"}
          >
            <span className="w-2 h-2 rounded-full bg-[#c8ff6a] animate-pulse"></span>
            <span>{store.subdomain}.storebox.uz</span>
            <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          </a>
        )}
      </div>

      {/* 2. RIGHT: FILTER PILLS, SHARE, EXPORT, THEME, PROFILE */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Quick Filter Pills */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300">
          {/* Branch / Region Dropdown */}
          <div ref={regionRef} className="relative">
            <button
              type="button"
              data-testid="region-dropdown-btn"
              onClick={toggleRegion}
              className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors shadow-2xs"
            >
              <Building2 className="w-3 h-3 text-neutral-400" />
              <span className="max-w-[130px] truncate">{currentRegionLabel}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>
            {regionOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-medium">
                {branchOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        if (opt.id === "all") {
                          next.delete("branch");
                        } else {
                          next.set("branch", opt.id);
                        }
                        return next;
                      });
                      setRegionOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left ${
                      selectedBranch === opt.id ? "text-neutral-900 dark:text-white font-bold bg-black/5 dark:bg-white/10" : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selectedBranch === opt.id && <Check className="w-3.5 h-3.5 text-[#211b2e] dark:text-[#c8ff6a] shrink-0 ml-2" />}
                  </button>
                ))}
                <div className="pt-1 mt-1 border-t border-black/[0.06] dark:border-white/10 px-2">
                  <Link
                    to="/settings/branches"
                    onClick={() => setRegionOpen(false)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-800 dark:text-neutral-200 hover:underline py-1.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t("manage_branches") || "Filiallarni boshqarish"}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Period Dropdown */}
          <div ref={periodRef} className="relative">
            <button
              type="button"
              data-testid="period-dropdown-btn"
              onClick={togglePeriod}
              className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors shadow-2xs"
            >
              <span>{currentPeriodLabel}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
            {periodOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-medium">
                {periodOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        if (opt.id === "today") {
                          next.delete("period");
                        } else {
                          next.set("period", opt.id);
                        }
                        return next;
                      });
                      setPeriodOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors ${
                      selectedPeriod === opt.id ? "text-neutral-900 dark:text-white font-bold bg-black/5 dark:bg-white/10" : "text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedPeriod === opt.id && <Check className="w-3.5 h-3.5 text-[#211b2e] dark:text-[#c8ff6a]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <button
          type="button"
          data-testid="export-btn"
          onClick={() => window.open('/dashboard/orders/export/', '_blank')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t("export_btn") || "Eksport"}</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          data-testid="theme-toggle-btn"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-2xs flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          title={isDark ? (t("light_mode_on") || "Yorug' rejimga o'tish") : (t("dark_mode_on") || "Qorong'i rejimga o'tish")}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-700" />}
        </button>

        {/* Notification Bell with Dynamic Red Badge & Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            data-testid="notif-bell-btn"
            onClick={toggleNotif}
            className="w-9 h-9 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-2xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer relative"
            title={totalUnread > 0 ? `${totalUnread} ${t("new") || "ta yangi"} ${t("notifications") || "bildirishnoma"}` : (t("notifications") || "Bildirishnomalar")}
          >
            <Bell className="w-4 h-4" />
            {totalUnread > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white dark:ring-[#18181b] animate-pulse"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/10 rounded-3xl shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.06] dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-900 dark:text-white">{t("notifications") || "Bildirishnomalar"}</span>
                  {totalUnread > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                      {totalUnread} {t("new") || "yangi"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400">
                      0
                    </span>
                  )}
                </div>
                {totalUnread > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await markAllRead();
                    }}
                    className="text-[11px] font-bold text-brand hover:underline cursor-pointer"
                  >
                    {t("mark_all_read") || "Barchasini o'qish"}
                  </button>
                )}
              </div>

              {/* Notification list or empty state */}
              {notifications.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    {t("no_notifications") || "Yangi bildirishnomalar yo'q"}
                  </div>
                  <p className="text-[11px] text-neutral-400 max-w-[220px] mx-auto">
                    {t("all_caught_up") || "Barcha buyurtmalar va xabarlar ko'rib chiqilgan"}
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {notifications.map((item) => (
                    <Link
                      key={item.id}
                      to={item.url}
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 p-2.5 rounded-2xl bg-neutral-50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer border border-black/[0.03] dark:border-white/5"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.type === "order" 
                          ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e]" 
                          : "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e]"
                      }`}>
                        {item.type === "order" ? <ShoppingCart className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
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

        {/* Language Selector */}
        <div ref={langRef} className="relative">
          <button
            type="button"
            data-testid="language-selector-btn"
            onClick={toggleLang}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border transition-all cursor-pointer ${
              langOpen
                ? "border-[#211b2e] dark:border-[#c8ff6a] bg-neutral-200/90 dark:bg-white/15 ring-2 ring-[#211b2e]/10 dark:ring-[#c8ff6a]/20"
                : "border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10"
            } text-xs font-bold text-slate-700 dark:text-slate-200`}
            title={lang === "ru" ? "Сменить язык" : lang === "en" ? "Change language" : "Tilni o'zgartirish"}
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white font-bold">
              {languages.find((l) => l.code === lang)?.badge || "UZ"}
            </span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/15 rounded-2xl shadow-2xl py-1.5 z-50 text-xs font-semibold ring-1 ring-black/5 animate-in fade-in duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-black/[0.04] dark:border-white/10 mb-1">
                {lang === "ru" ? "Язык" : lang === "en" ? "Language" : "Til"}
              </div>
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
                    className={`w-full flex items-center justify-between px-3 py-2 transition-colors cursor-pointer text-left ${
                      isActive
                        ? "text-neutral-900 dark:text-white font-bold bg-[#211b2e]/5 dark:bg-[#c8ff6a]/10"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e]"
                          : "bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-white/10"
                      }`}>
                        {l.badge}
                      </span>
                      <span className="text-xs font-semibold">{l.label}</span>
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#211b2e] dark:text-[#c8ff6a] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            data-testid="user-profile-btn"
            onClick={toggleUser}
            className="flex items-center gap-2 p-0.5 rounded-2xl hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#211B2E] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-black/5 dark:ring-white/5">
              {user?.first_name?.charAt(0) || user?.phone?.slice(-2) || "U"}
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#181a20] border border-neutral-200 dark:border-white/10 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-xs">
              <div className="p-2 border-b border-black/[0.06] dark:border-white/10">
                <div className="font-bold text-neutral-900 dark:text-white truncate">{user?.first_name || "Admin"}</div>
                <div className="text-[10px] text-neutral-400">{user?.phone}</div>
              </div>

              {stores && stores.length > 0 && (
                <div className="p-1 border-b border-black/[0.06] dark:border-white/10 space-y-0.5">
                  <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                    <StoreIcon className="w-3 h-3 text-neutral-400" />
                    <span>{t("stores") || "Do'konlar"}</span>
                  </div>
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={async () => {
                        await switchStore(s.id);
                        setUserOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-all text-left ${
                        store?.id === s.id
                          ? "font-bold bg-[#211b2e] text-white dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-xs"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/10"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {store?.id === s.id && <Check className="w-3.5 h-3.5 text-[#c8ff6a] dark:text-[#211b2e] shrink-0 ml-1" />}
                    </button>
                  ))}
                  {stores.length < 5 ? (
                    <a
                      href="/onboarding/?new=1"
                      className="w-full flex items-center justify-between px-2.5 py-2 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus className="w-3 h-3 text-neutral-400" />
                        <span>{t("create_store") || t("add_store") || "Yangi do'kon qo'shish"}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500 font-bold">{stores.length}/5</span>
                    </a>
                  ) : (
                    <div className="px-2 py-1 text-[10px] text-neutral-400 font-medium">
                      {t("max_stores_reached") || "Maksimal 5 ta do'kon faol (5/5)"}
                    </div>
                  )}
                </div>
              )}

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
