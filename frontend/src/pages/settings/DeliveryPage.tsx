import React, { useState } from "react";
import { Truck, Plus, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const DeliveryPage: React.FC = () => {
  const { t } = useAuth();
  const [methods, setMethods] = useState([
    { id: 1, name: "Standart yetkazib berish", price: 20000, time: "2-4 soat", is_active: true },
    { id: 2, name: "Tezkor yetkazib berish (Express)", price: 35000, time: "45-60 daqiqa", is_active: true },
    { id: 3, name: "Olib ketish (Samovivoz)", price: 0, time: "Darhol", is_active: true },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("delivery")}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Yetkazib berish zonalari, narxlar va usullari</p>
        </div>
        <button type="button" className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Usul qo'shish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {methods.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-brand" />
                <h2 className="text-xs font-black text-slate-900">{m.name}</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Faol</span>
            </div>
            <div className="text-xl font-black text-brand">
              {m.price === 0 ? "Bepul" : `${m.price.toLocaleString()} so'm`}
            </div>
            <div className="text-xs text-slate-500 font-medium">Muddat: <span className="font-bold text-slate-700">{m.time}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};
