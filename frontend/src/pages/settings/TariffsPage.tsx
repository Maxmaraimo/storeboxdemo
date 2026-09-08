import React from "react";
import { BadgePercent, Check, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const TariffsPage: React.FC = () => {
  const { t } = useAuth();
  const plans = [
    { name: "Start", price: "0 so'm", period: "bepul", features: ["100 tagacha tovar", "Telegram bot", "Standart dizayn", "1 ta filial"], current: false },
    { name: "Pro", price: "249 000 so'm", period: "oyiga", features: ["Cheksiz tovarlar", "Telegram bot + Veb-sayt", "AI Dizayn Studio", "YES POS integratsiyasi", "3 ta filial"], current: true },
    { name: "Enterprise", price: "699 000 so'm", period: "oyiga", features: ["Barcha Pro imkoniyatlar", "Shaxsiy domen", "Cheksiz filiallar", "24/7 VIP qo'llab-quvvatlash"], current: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("tariffs")}</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Do'koningiz obunasi va tarif rejasi</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.name} className={`bg-white rounded-3xl border ${p.current ? 'border-brand shadow-lg ring-2 ring-brand/20' : 'border-slate-200/80 shadow-xs'} p-6 space-y-6 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">{p.name}</h2>
                {p.current && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-brand border border-emerald-200">Joriy tarif</span>
                )}
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-slate-900">{p.price}</span>
                <span className="text-xs text-slate-400 font-medium ml-1">/ {p.period}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs text-slate-600 font-medium">
                    <Check className="w-4 h-4 text-brand shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className={`w-full py-3 rounded-2xl text-xs font-black transition-colors ${
                p.current
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-brand text-white hover:bg-brand-dark shadow-xs"
              }`}
            >
              {p.current ? "Tarifni uzaytirish" : "Tarifni tanlash"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
