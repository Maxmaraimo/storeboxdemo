import React from "react";
import { Send } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const FloatingSupport: React.FC = () => {
  const { lang } = useAuth();
  const titles = {
    uz: "To'g'ridan-to'g'ri aloqa",
    ru: "Прямая связь",
    en: "Direct Support"
  };
  const tooltips = {
    uz: "Telegram orqali to'g'ridan-to'g'ri bog'lanish",
    ru: "Прямая связь через Telegram",
    en: "Direct contact via Telegram"
  };

  return (
    <a
      href="https://t.me/storebox_support"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group border border-slate-700/60"
      title={tooltips[lang] || tooltips.uz}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8ff6a] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8ff6a]"></span>
      </span>
      <Send className="w-3.5 h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
      <span className="text-xs font-bold tracking-tight">{titles[lang] || titles.uz}</span>
    </a>
  );
};
