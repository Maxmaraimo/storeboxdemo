import React, { useState } from "react";
import { Package, Search, Plus, AlertCircle, ArrowDownUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const WarehousePage: React.FC = () => {
  const { t } = useAuth();
  const [search, setSearch] = useState("");

  const stockItems = [
    { id: 1, name: "Smartfon X Pro", sku: "SMP-001", current_stock: 45, min_stock: 10, cost: 2800000, price: 3400000, status: "ok" },
    { id: 2, name: "Simsiz quloqchinlar", sku: "EAR-202", current_stock: 4, min_stock: 15, cost: 180000, price: 290000, status: "low" },
    { id: 3, name: "USB-C kabel (2m)", sku: "CAB-014", current_stock: 0, min_stock: 20, cost: 25000, price: 55000, status: "out" },
    { id: 4, name: "Tezkor quvvatlagich 65W", sku: "CHG-065", current_stock: 32, min_stock: 10, cost: 120000, price: 210000, status: "ok" },
  ];

  const filtered = stockItems.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("warehouse")}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mahsulot qoldiqlari, minimal zaxira va ombor harakati</p>
        </div>
        <button
          type="button"
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Kirim qilish</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nomi yoki artikul bo'yicha qidiruv..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Mahsulot</th>
                <th className="p-4">Artikul</th>
                <th className="p-4 text-right">Qoldiq</th>
                <th className="p-4 text-right">Min. zaxira</th>
                <th className="p-4 text-right">Tan narx</th>
                <th className="p-4 text-right">Sotuv narxi</th>
                <th className="p-4 text-center">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{item.name}</td>
                  <td className="p-4 font-mono text-slate-400">{item.sku}</td>
                  <td className="p-4 text-right font-bold text-slate-900">{item.current_stock} ta</td>
                  <td className="p-4 text-right text-slate-400">{item.min_stock} ta</td>
                  <td className="p-4 text-right font-mono">{item.cost.toLocaleString()} so'm</td>
                  <td className="p-4 text-right font-mono font-bold text-brand">{item.price.toLocaleString()} so'm</td>
                  <td className="p-4 text-center">
                    {item.status === "ok" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Yetarli</span>
                    )}
                    {item.status === "low" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Kam qoldi</span>
                    )}
                    {item.status === "out" && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Tugagan</span>
                    )}
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
