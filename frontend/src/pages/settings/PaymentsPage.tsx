import React, { useState } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const PaymentsPage: React.FC = () => {
  const { t } = useAuth();
  const [gateways, setGateways] = useState([
    { id: "cash", name: "Naqd pul yoki terminal", desc: "Buyurtma yetkazilganda to'lov", active: true },
    { id: "payme", name: "Payme", desc: "Payme ilovasi orqali onlayn to'lov", active: true },
    { id: "click", name: "Click Up", desc: "Click orqali to'lov", active: true },
    { id: "uzum", name: "Uzum Pay", desc: "Uzum bank orqali tezkor to'lov", active: false },
  ]);

  const toggle = (id: string) => {
    setGateways(gateways.map((g) => g.id === id ? { ...g, active: !g.active } : g));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("payment_methods")}</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Onlayn to'lov tizimlari va qabul usullari</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((g) => (
          <div key={g.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                <CreditCard className="w-5 h-5 text-brand" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">{g.name}</h2>
                <p className="text-[11px] text-slate-500">{g.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                g.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
              }`}
            >
              {g.active ? "Ulangan" : "O'chirilgan"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
