import React, { useState } from "react";
import { Share2, Bot, Globe, QrCode, Database } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export const PlatformsPage: React.FC = () => {
  const { store, t } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("platforms")}</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Sotuv kanallari va tashqi integratsiyalar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Telegram Bot</h2>
              <p className="text-[11px] text-slate-500">Telegram orqali to'g'ridan-to'g'ri buyurtma qabul qilish</p>
            </div>
          </div>
          <div className="pt-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Faol</span>
          </div>
        </div>

        <Link to="/platforms/qr" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:border-brand transition-colors block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">{t("qr_catalog")}</h2>
              <p className="text-[11px] text-slate-500">Stol va peshtaxtalar uchun tayyor A5/A6 pechat format</p>
            </div>
          </div>
          <div className="pt-2 text-xs font-bold text-brand">Ochish →</div>
        </Link>

        <a href="/dashboard/yespos/" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:border-brand transition-colors block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">YES POS Integratsiyasi</h2>
              <p className="text-[11px] text-slate-500">Tovarlar, narxlar va qoldiqlarni avtomatik sinxronlash</p>
            </div>
          </div>
          <div className="pt-2 text-xs font-bold text-brand">Ochish →</div>
        </a>

        <Link to="/design" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 hover:border-brand transition-colors block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Dizayn & AI Studio</h2>
              <p className="text-[11px] text-slate-500">Mavzular, ranglar va onlayn do'kon ko'rinishi</p>
            </div>
          </div>
          <div className="pt-2 text-xs font-bold text-brand">Ochish →</div>
        </Link>
      </div>
    </div>
  );
};
