import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe, Headphones, LogOut, ChevronDown, User, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Language } from "../../i18n/translations";

export const Header: React.FC = () => {
  const { user, store, lang, setLang, logout, t } = useAuth();
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "uz", label: "O`zbek", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇺🇸" },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* LEFT: STORE DOMAIN BADGE */}
      <div className="flex items-center gap-3">
        {store?.subdomain ? (
          <a
            href={`/store/${store.subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-mono font-bold text-slate-700"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{store.subdomain}.storebox.uz</span>
          </a>
        ) : (
          <span className="text-xs font-black text-slate-900">StoreBox Dashboard</span>
        )}
      </div>

      {/* RIGHT: LANGUAGE, SUPPORT, USER */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* LANGUAGE SELECTOR */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>{languages.find((l) => l.code === lang)?.flag}</span>
            <span className="hidden sm:inline">{languages.find((l) => l.code === lang)?.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {langOpen && (
            <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 transition-colors ${
                    lang === l.code ? "text-brand font-bold bg-emerald-50/50" : "text-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </span>
                  {lang === l.code && <Check className="w-3.5 h-3.5 text-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SUPPORT MODAL BUTTON */}
        <a
          href="https://t.me/storebox_support"
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 text-xs font-bold transition-colors"
          title={t("support") || "Qo`llab-quvvatlash"}
        >
          <Headphones className="w-4 h-4 text-brand" />
        </a>

        {/* USER DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black">
              {user?.first_name?.charAt(0) || user?.phone?.slice(-2) || "U"}
            </div>
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 space-y-1 text-xs">
              <div className="p-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 truncate">{user?.first_name || "Admin"}</div>
                <div className="text-[10px] text-slate-400 font-mono">{user?.phone}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors"
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
