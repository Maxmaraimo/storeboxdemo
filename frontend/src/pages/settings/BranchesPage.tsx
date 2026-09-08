import React from "react";
import { MapPin, Plus, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const BranchesPage: React.FC = () => {
  const { t } = useAuth();
  const branches = [
    { id: 1, name: "Asosiy filial", address: "Toshkent sh., Chilonzor tumani, 9-mavze", phone: "+998 71 200 00 00", is_main: true },
    { id: 2, name: "Yunusobod filiali", address: "Toshkent sh., Yunusobod tumani, 4-mavze", phone: "+998 71 200 00 01", is_main: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("branches")}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Do'koningiz filiallari va qabul punktlari</p>
        </div>
        <button type="button" className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Filial qo'shish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">{b.name}</h2>
              {b.is_main && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Asosiy</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{b.address}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{b.phone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
