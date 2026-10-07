import React from "react";
import { Share2, Bot, Globe, QrCode, Database } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export const PlatformsPage: React.FC = () => {
  const { store, t } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">{t("platforms") || "Platformalar"}</h1>
        <p className="text-xs text-slate-500 mt-1">{t("platforms_subtitle") || "Sotuv kanallari va tashqi integratsiyalar"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/platforms/telegram" className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t("telegram_bot")}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("platforms_tg_desc")}</p>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              {t("status_active")}
            </span>
            <span className="text-xs font-medium text-blue-600 hover:text-blue-700">Sozlamalar →</span>
          </div>
        </Link>

        <Link to="/platforms/qr" className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t("qr_catalog")}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("platforms_qr_desc")}</p>
            </div>
          </div>
          <div className="pt-2 text-xs font-medium text-blue-600">{t("open_btn")} →</div>
        </Link>

        <Link to="/yespos" className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Database className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t("platforms_yespos_title")}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("platforms_yespos_desc")}</p>
            </div>
          </div>
          <div className="pt-2 text-xs font-medium text-blue-600">{t("open_btn")} →</div>
        </Link>

        <Link to="/design" className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3 hover:border-slate-300 transition-all block">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{t("design_studio_title") || "Vitrina Dizayni"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("design_studio_subtitle") || "Mavzular, ranglar va onlayn do'kon ko'rinishi"}</p>
            </div>
          </div>
          <div className="pt-2 text-xs font-medium text-blue-600">{t("open_btn") || "Ochish →"}</div>
        </Link>
      </div>
    </div>
  );
};
