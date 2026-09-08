import React, { useState } from "react";
import { Tag, Plus, Percent, Calendar, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const DiscountsPage: React.FC = () => {
  const { t } = useAuth();
  const [promos, setPromos] = useState([
    { id: 1, code: "SUMMER10", discount_type: "percent", value: 10, min_order: 150000, usages: 45, is_active: true },
    { id: 2, code: "WELCOME", discount_type: "fixed", value: 20000, min_order: 100000, usages: 120, is_active: true },
    { id: 3, code: "VIP20", discount_type: "percent", value: 20, min_order: 500000, usages: 8, is_active: false },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("discounts")} va Promokodlar</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mijozlarni jalb qilish uchun chegirmalar va aksiyalar</p>
        </div>
        <button
          type="button"
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi promokod</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promos.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" />
                <span className="font-mono font-black text-base text-slate-900">{p.code}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                {p.is_active ? 'Faol' : 'O`chirilgan'}
              </span>
            </div>

            <div className="text-2xl font-black text-brand">
              {p.discount_type === 'percent' ? `${p.value}%` : `${p.value.toLocaleString()} so'm`}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Minimal buyurtma:</span>
              <span className="font-bold text-slate-700">{p.min_order.toLocaleString()} so'm</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Foydalanishlar:</span>
              <span className="font-bold text-slate-700">{p.usages} marta</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
