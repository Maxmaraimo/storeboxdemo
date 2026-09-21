import React, { useState, useEffect } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isDark, setIsDark] = useState<boolean>(() => {
    return document.documentElement.classList.contains("dark");
  });

  // Create store modal state
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSubdomain, setNewStoreSubdomain] = useState("");
  const [newStoreType, setNewStoreType] = useState<"online_store" | "restaurant">("online_store");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      setCreateError("Do'kon nomini kiriting");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      await createStore({
        name: newStoreName.trim(),
        subdomain: newStoreSubdomain.trim() || undefined,
        business_type: newStoreType,
      });
      setCreateStoreOpen(false);
      setNewStoreName("");
      setNewStoreSubdomain("");
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || "Do'kon yaratishda xatolik yuz berdi");
    } finally {
      setCreateLoading(false);
    }
  };

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
    <header className="h-16 bg-white/75 dark:bg-[#12141a] backdrop-blur-2xl border border-white/85 dark:border-white/10 rounded-[28px] shadow-[0_16px_40px_-12px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,0.95)] px-4 sm:px-6 flex items-center justify-between sticky top-4 z-30 transition-colors duration-300 gap-3">
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
          <div className="relative">
            <button
              type="button"
              data-testid="region-dropdown-btn"
              onClick={() => {
                setRegionOpen(!regionOpen);
                setPeriodOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors shadow-2xs"
            >
              <Building2 className="w-3 h-3 text-neutral-400" />
              <span className="max-w-[130px] truncate">{currentRegionLabel}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>
            {regionOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-50 text-xs font-medium">
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
          <div className="relative">
            <button
              type="button"
              data-testid="period-dropdown-btn"
              onClick={() => {
                setPeriodOpen(!periodOpen);
                setRegionOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 flex items-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-colors shadow-2xs"
            >
              <span>{currentPeriodLabel}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>
            {periodOpen && (
              <div className="absolute left-0 mt-2 w-44 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-2xl shadow-xl py-1.5 z-50 text-xs font-medium">
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
        <div className="relative">
          <button
            type="button"
            data-testid="notif-bell-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            className="w-9 h-9 rounded-2xl border border-white/80 dark:border-white/10 bg-white/70 dark:bg-white/5 shadow-2xs flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer relative"
            title={totalUnread > 0 ? `${totalUnread} ${t("new") || "ta yangi"} ${t("notifications") || "bildirishnoma"}` : (t("notifications") || "Bildirishnomalar")}
          >
            <Bell className="w-4 h-4" />
            {totalUnread > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white dark:ring-[#18181b] animate-pulse"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-3xl shadow-2xl p-4 z-50 space-y-3">
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
        <div className="relative">
          <button
            type="button"
            data-testid="language-selector-btn"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-white font-bold">
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
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10">
                      {l.badge}
                    </span>
                    <span>{l.label}</span>
                  </span>
                  {lang === l.code && <Check className="w-3.5 h-3.5 text-[#211b2e] dark:text-[#c8ff6a]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile Avatar */}
        <div className="relative">
          <button
            type="button"
            data-testid="user-profile-btn"
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 p-0.5 rounded-2xl hover:scale-105 transition-transform cursor-pointer"
          >
            <div className="w-9 h-9 rounded-2xl bg-[#211B2E] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-black/5 dark:ring-white/5">
              {user?.first_name?.charAt(0) || user?.phone?.slice(-2) || "U"}
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/[0.06] dark:border-white/10 rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs">
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
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors text-left ${
                        store?.id === s.id
                          ? "font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {store?.id === s.id && <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0 ml-1" />}
                    </button>
                  ))}
                  {stores.length < 5 ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUserOpen(false);
                        setCreateError("");
                        setCreateStoreOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus className="w-3 h-3 text-neutral-400" />
                        <span>{t("create_store") || "Yangi do'kon qo'shish"}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-500 font-bold">{stores.length}/5</span>
                    </button>
                  ) : (
                    <div className="px-2 py-1 text-[10px] text-neutral-400 font-medium">
                      Maksimal 5 ta do'kon faol (5/5)
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

      {/* Create Store Modal */}
      {createStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#161b26] rounded-3xl border border-white/80 dark:border-white/10 p-6 sm:p-7 max-w-md w-full shadow-2xl relative space-y-5 animate-scale-in">
            <button
              type="button"
              onClick={() => setCreateStoreOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#211b2e] flex items-center justify-center shadow-lg shadow-[#211b2e]/25 border border-white/10 shrink-0">
                <svg viewBox="0 0 32 32" className="w-6 h-6 stroke-[#c8ff6a] fill-none stroke-[1.8] stroke-linejoin-round">
                  <path d="M7.5 10.8 16 6l8.5 4.8v10.4L16 26l-8.5-4.8V10.8Z"/>
                  <path d="m7.8 10.9 8.2 4.7 8.2-4.7M16 15.6V26"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Yangi do'kon yaratish</h3>
                <p className="text-xs text-slate-400">Bitta hisobda 5 tagacha do'kon ({stores.length}/5)</p>
              </div>
            </div>

            {createError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Do'kon nomi *
                </label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewStoreName(val);
                    setNewStoreSubdomain(val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
                  }}
                  placeholder="Masalan: Burger Bar yoki Premium Market"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#211b2e] dark:focus:border-[#c8ff6a] focus:ring-2 focus:ring-[#c8ff6a]/40 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subdomen (vitrina manzili)
                </label>
                <div className="relative flex rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden focus-within:border-[#211b2e] dark:focus-within:border-[#c8ff6a] focus-within:ring-2 focus-within:ring-[#c8ff6a]/40 transition-all">
                  <input
                    type="text"
                    value={newStoreSubdomain}
                    onChange={(e) => setNewStoreSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="burgerbar"
                    className="flex-1 px-3.5 py-2.5 bg-transparent text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                  <span className="px-3 py-2.5 bg-slate-100 dark:bg-white/10 border-l border-slate-200 dark:border-white/10 text-xs text-slate-500 font-semibold flex items-center">
                    .storebox.uz
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Biznes yo'nalishi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStoreType("online_store")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      newStoreType === "online_store"
                        ? "bg-[#211b2e] text-white border-transparent shadow-md shadow-[#211b2e]/20"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShoppingBag className="w-3.5 h-3.5 text-[#c8ff6a]" />
                      <span>Online Do'kon</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Tovarlar, kiyim, market</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStoreType("restaurant")}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      newStoreType === "restaurant"
                        ? "bg-[#211b2e] text-white border-transparent shadow-md shadow-[#211b2e]/20"
                        : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <Utensils className="w-3.5 h-3.5 text-[#c8ff6a]" />
                      <span>Restoran / Kafe</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Fast-fud, pitsa, yetkazish</div>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCreateStoreOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/80 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#211b2e] hover:bg-[#2c243d] text-white font-bold text-xs transition-all shadow-lg shadow-[#211b2e]/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {createLoading ? (
                    <span>Yaratilmoqda...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-[#c8ff6a]" />
                      <span>Yaratish va o'tish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
