import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Store, Globe, Phone, DollarSign } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { store, t } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("settings") || "Sozlamalar"}</h1>
        <p className="text-xs text-slate-500 mt-0.5">Do`koningizning asosiy sozlamalari va ma`lumotlari</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Do`kon nomi</label>
          <input
            type="text"
            readOnly
            value={store?.name || ""}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Subdomen</label>
          <input
            type="text"
            readOnly
            value={`${store?.subdomain || ""}.storebox.uz`}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Valyuta</label>
          <input
            type="text"
            readOnly
            value={store?.currency || "UZS"}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800"
          />
        </div>
      </div>
    </div>
  );
};
