import React from "react";
import { Store as StoreIcon, Download, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const RoboMarketPage: React.FC = () => {
  const { t } = useAuth();
  const apps = [
    { id: 1, name: "YES POS Sinxronizatsiya", desc: "Tovarlar va qoldiqlarni real vaqtda yangilash", installed: true },
    { id: 2, name: "AI Tavsif Generator", desc: "Sun'iy intellekt orqali mahsulot tavsiflarini yozish", installed: true },
    { id: 3, name: "Yandex Go Delivery", desc: "Kuryerlarni avtomatik chaqirish integratsiyasi", installed: false },
    { id: 4, name: "Instagram Shop Sync", desc: "Instagram direct orqali avtomatik sotuvlar", installed: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("storebox_market")}</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Do'koningiz imkoniyatlarini kengaytiruvchi tayyor modullar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-brand flex items-center justify-center font-bold">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">{a.name}</h2>
                <p className="text-[11px] text-slate-500">{a.desc}</p>
              </div>
            </div>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                a.installed
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {a.installed ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>O'rnatilgan</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>O'rnatish</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
