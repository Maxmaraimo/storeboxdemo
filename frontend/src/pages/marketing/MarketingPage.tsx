import React, { useState } from "react";
import { Megaphone, Send, Tag, MessageSquare, Image, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const MarketingPage: React.FC = () => {
  const { t } = useAuth();
  const [activeTab, setActiveTab] = useState("broadcast");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("marketing")}</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">{t("marketing_subtitle")}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("broadcast")}
          className={`px-4 py-2 rounded-xl transition-colors ${activeTab === "broadcast" ? "bg-brand text-white shadow-xs font-black" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {t("broadcast")}
        </button>
        <button
          onClick={() => setActiveTab("promocodes")}
          className={`px-4 py-2 rounded-xl transition-colors ${activeTab === "promocodes" ? "bg-brand text-white shadow-xs font-black" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {t("promocodes")}
        </button>
        <button
          onClick={() => setActiveTab("banner")}
          className={`px-4 py-2 rounded-xl transition-colors ${activeTab === "banner" ? "bg-brand text-white shadow-xs font-black" : "text-slate-600 hover:bg-slate-100"}`}
        >
          {t("banner")}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        {activeTab === "broadcast" && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-base font-black text-slate-900">{t("marketing_broadcast_title")}</h2>
            <p className="text-xs text-slate-500">{t("marketing_broadcast_subtitle")}</p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">{t("marketing_msg_text")}</label>
              <textarea
                rows={4}
                placeholder={t("marketing_msg_ph")}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand"
              />
            </div>
            <button
              type="button"
              className="px-5 py-2.5 bg-brand text-white rounded-xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>{t("marketing_send_msg")}</span>
            </button>
          </div>
        )}

        {activeTab === "promocodes" && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">{t("active_promocodes_title")}</h2>
            <p className="text-xs text-slate-500">{t("active_promocodes_desc")}</p>
          </div>
        )}

        {activeTab === "banner" && (
          <div className="space-y-4">
            <h2 className="text-base font-black text-slate-900">{t("banner_section_title")}</h2>
            <p className="text-xs text-slate-500">{t("banner_section_desc")}</p>
          </div>
        )}
      </div>
    </div>
  );
};
