import React from "react";
import { UserCheck, Plus, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const StaffPage: React.FC = () => {
  const { t } = useAuth();
  const staff = [
    { id: 1, name: "Ozodbek M.", role: "Egasi (Admin)", phone: "+998 90 000 00 00", status: "active" },
    { id: 2, name: "Alisher K.", role: "Menejer", phone: "+998 93 111 22 33", status: "active" },
    { id: 3, name: "Jasurbek T.", role: "Kassir / Kuryer", phone: "+998 97 444 55 66", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("staff")}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Xodimlar huquqlari va kirish nazorati</p>
        </div>
        <button type="button" className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Xodim taklif qilish</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Xodim</th>
                <th className="p-4">Lavozim</th>
                <th className="p-4">Telefon</th>
                <th className="p-4 text-center">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{s.name}</td>
                  <td className="p-4 text-slate-600 font-semibold">{s.role}</td>
                  <td className="p-4 font-mono text-slate-400">{s.phone}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Faol</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
