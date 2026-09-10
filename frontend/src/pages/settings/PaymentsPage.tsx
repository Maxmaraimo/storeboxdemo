import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Banknote, Smartphone, Check, Save } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export const PaymentsPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [cashEnabled, setCashEnabled] = useState(true);
  const [terminalEnabled, setTerminalEnabled] = useState(true);
  const [paymeEnabled, setPaymeEnabled] = useState(false);
  const [paymeMerchantId, setPaymeMerchantId] = useState("");
  const [clickEnabled, setClickEnabled] = useState(false);
  const [clickServiceId, setClickServiceId] = useState("");
  const [clickMerchantId, setClickMerchantId] = useState("");
  const [uzumEnabled, setUzumEnabled] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/payments/");
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setCashEnabled(data.cash_enabled ?? true);
      setTerminalEnabled(data.terminal_enabled ?? true);
      setPaymeEnabled(data.payme_enabled ?? false);
      setPaymeMerchantId(data.payme_merchant_id || "");
      setClickEnabled(data.click_enabled ?? false);
      setClickServiceId(data.click_service_id || "");
      setClickMerchantId(data.click_merchant_id || "");
      setUzumEnabled(data.uzum_enabled ?? false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSuccessMsg("");
      const payload = {
        cash_enabled: cashEnabled,
        terminal_enabled: terminalEnabled,
        payme_enabled: paymeEnabled,
        payme_merchant_id: paymeMerchantId,
        click_enabled: clickEnabled,
        click_service_id: clickServiceId,
        click_merchant_id: clickMerchantId,
        uzum_enabled: uzumEnabled,
      };
      return (await api.post("/settings/payments/", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
      setSuccessMsg("To'lov sozlamalari saqlandi!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("payment_methods") || "To'lov usullari"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Onlayn to'lov tizimlari va naqd pul / terminal sozlamalari</p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-5 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saveMutation.isPending ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CASH */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900">Naqd pul</h2>
              <p className="text-[11px] text-slate-500">Kuryerga yetkazilganda to'lash</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCashEnabled(!cashEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              cashEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
            }`}
          >
            {cashEnabled ? "Ulangan" : "O'chirilgan"}
          </button>
        </div>

        {/* TERMINAL */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900">Karta orqali terminalda (Uzcard / Humo)</h2>
              <p className="text-[11px] text-slate-500">Kuryer terminali orqali qabul qilish</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTerminalEnabled(!terminalEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              terminalEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
            }`}
          >
            {terminalEnabled ? "Ulangan" : "O'chirilgan"}
          </button>
        </div>

        {/* PAYME */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center font-black text-xs">
                Payme
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">Payme to'lov tizimi</h2>
                <p className="text-[11px] text-slate-500">Payme ilovasi orqali onlayn to'lov</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymeEnabled(!paymeEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                paymeEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
              }`}
            >
              {paymeEnabled ? "Ulangan" : "O'chirilgan"}
            </button>
          </div>
          {paymeEnabled && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Payme Merchant ID
              </label>
              <input
                type="text"
                value={paymeMerchantId}
                onChange={(e) => setPaymeMerchantId(e.target.value)}
                placeholder="64a..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand"
              />
            </div>
          )}
        </div>

        {/* CLICK */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black text-xs">
                Click
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">Click Up tizimi</h2>
                <p className="text-[11px] text-slate-500">Click ilovasi yoki USSD orqali to'lov</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setClickEnabled(!clickEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                clickEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
              }`}
            >
              {clickEnabled ? "Ulangan" : "O'chirilgan"}
            </button>
          </div>
          {clickEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Click Service ID</label>
                <input
                  type="text"
                  value={clickServiceId}
                  onChange={(e) => setClickServiceId(e.target.value)}
                  placeholder="34567"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Click Merchant ID</label>
                <input
                  type="text"
                  value={clickMerchantId}
                  onChange={(e) => setClickMerchantId(e.target.value)}
                  placeholder="23456"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          )}
        </div>

        {/* UZUM PAY */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-black text-xs">
              Uzum
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-900">Uzum Bank / Uzum Pay</h2>
              <p className="text-[11px] text-slate-500">Uzum ilovasi orqali QR-kod va tezkor to'lov</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUzumEnabled(!uzumEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              uzumEnabled ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
            }`}
          >
            {uzumEnabled ? "Ulangan" : "O'chirilgan"}
          </button>
        </div>
      </div>
    </div>
  );
};
