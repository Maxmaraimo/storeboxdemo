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
  const [multicardEnabled, setMulticardEnabled] = useState(false);
  const [multicardAppId, setMulticardAppId] = useState("rhmt_test");
  const [multicardSecret, setMulticardSecret] = useState("Pw18axeBFo8V7NamKHXX");
  const [multicardStoreId, setMulticardStoreId] = useState("6");
  const [multicardTestMode, setMulticardTestMode] = useState(true);
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
      setMulticardEnabled(data.multicard_enabled ?? false);
      setMulticardAppId(data.multicard_app_id || "rhmt_test");
      setMulticardSecret(data.multicard_secret || "Pw18axeBFo8V7NamKHXX");
      setMulticardStoreId(data.multicard_store_id || "6");
      setMulticardTestMode(data.multicard_test_mode ?? true);
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
        multicard_enabled: multicardEnabled,
        multicard_app_id: multicardAppId,
        multicard_secret: multicardSecret,
        multicard_store_id: multicardStoreId,
        multicard_test_mode: multicardTestMode,
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
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t("payment_methods") || "To'lov usullari"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">{t("payments_subtitle") || "Onlayn to'lov tizimlari va naqd pul / terminal sozlamalari"}</p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saveMutation.isPending ? (t("saving") || "Saqlanmoqda...") : (t("save_changes") || "O'zgarishlarni saqlash")}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CASH */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-medium shadow-2xs">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">{t("cash_label") || "Naqd pul"}</h2>
              <p className="text-[11px] text-slate-500">{t("cash_desc") || "Kuryerga yetkazilganda to'lash"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCashEnabled(!cashEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              cashEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {cashEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
          </button>
        </div>

        {/* TERMINAL */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-medium shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">{t("terminal_label") || "Karta orqali terminalda"}</h2>
              <p className="text-[11px] text-slate-500">{t("terminal_desc") || "Kuryer terminali orqali qabul qilish"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTerminalEnabled(!terminalEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              terminalEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {terminalEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
          </button>
        </div>

        {/* PAYME */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center font-semibold text-xs shadow-2xs">
                Payme
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-900">Payme</h2>
                <p className="text-[11px] text-slate-500">{t("payme_desc") || "Payme ilovasi orqali onlayn to'lov"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaymeEnabled(!paymeEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                paymeEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              {paymeEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>
          {paymeEnabled && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Payme Merchant ID
              </label>
              <input
                type="text"
                value={paymeMerchantId}
                onChange={(e) => setPaymeMerchantId(e.target.value)}
                placeholder="64a..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          )}
        </div>

        {/* CLICK */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-semibold text-xs shadow-2xs">
                Click
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-900">Click Up</h2>
                <p className="text-[11px] text-slate-500">{t("click_desc") || "Click ilovasi yoki USSD orqali to'lov"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setClickEnabled(!clickEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                clickEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              {clickEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>
          {clickEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Click Service ID</label>
                <input
                  type="text"
                  value={clickServiceId}
                  onChange={(e) => setClickServiceId(e.target.value)}
                  placeholder="34567"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Click Merchant ID</label>
                <input
                  type="text"
                  value={clickMerchantId}
                  onChange={(e) => setClickMerchantId(e.target.value)}
                  placeholder="23456"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* UZUM PAY */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between gap-4 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-semibold text-xs shadow-2xs">
              Uzum
            </div>
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Uzum Pay</h2>
              <p className="text-[11px] text-slate-500">{t("uzum_desc") || "Uzum ilovasi orqali QR-kod va tezkor to'lov"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setUzumEnabled(!uzumEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              uzumEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
            }`}
          >
            {uzumEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
          </button>
        </div>

        {/* MULTICARD */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-semibold text-xs shadow-2xs">
                MC
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-900">Multicard Payment Gateway</h2>
                <p className="text-[11px] text-slate-500">{t("multicard_desc") || "Uzcard, Humo, Visa, Mastercard, PaymeGo, ClickPass to'lovlari"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMulticardEnabled(!multicardEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                multicardEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              {multicardEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>
          {multicardEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Application ID</label>
                <input
                  type="text"
                  value={multicardAppId}
                  onChange={(e) => setMulticardAppId(e.target.value)}
                  placeholder="rhmt_test"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Secret Key</label>
                <input
                  type="password"
                  value={multicardSecret}
                  onChange={(e) => setMulticardSecret(e.target.value)}
                  placeholder="Pw18axeBFo8V7NamKHXX"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Store ID</label>
                <input
                  type="text"
                  value={multicardStoreId}
                  onChange={(e) => setMulticardStoreId(e.target.value)}
                  placeholder="6"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="mcTestMode"
                  checked={multicardTestMode}
                  onChange={(e) => setMulticardTestMode(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="mcTestMode" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Test / Dev rejimi (dev-mesh.multicard.uz)
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
