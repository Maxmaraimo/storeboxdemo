import React, { useState } from "react";
import { FileText, Search, ExternalLink, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const IkpuPage: React.FC = () => {
  const { t } = useAuth();
  const [search, setSearch] = useState("");

  const ikpuList = [
    { code: "01111001001000000", package_code: "123456", name: "Bug'doy va arpa mahsulotlari", vat_rate: 12 },
    { code: "01121001001000000", package_code: "123457", name: "Sabzavotlar va mevalar", vat_rate: 12 },
    { code: "10711001001000000", package_code: "123458", name: "Non va non-bulka mahsulotlari", vat_rate: 0 },
    { code: "47711001001000000", package_code: "123459", name: "Kiyim-kechak va poyabzallar", vat_rate: 12 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("ikpu")} — Tasnif MXIK kodlari</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Fiskal cheklar va soliq integratsiyasi uchun MXIK kodlari</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="MXIK kodi yoki tovar toifasi bo'yicha qidiruv..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">MXIK Kodi</th>
                <th className="p-4">Paket kodi</th>
                <th className="p-4">Nomi</th>
                <th className="p-4 text-center">QQS stavkasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {ikpuList.map((item) => (
                <tr key={item.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-900">{item.code}</td>
                  <td className="p-4 font-mono text-slate-400">{item.package_code}</td>
                  <td className="p-4 font-bold text-slate-800">{item.name}</td>
                  <td className="p-4 text-center font-bold text-brand">{item.vat_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
