import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, Check, Save, ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { SettingsLayout } from "./SettingsLayout";

export const PaymentsPage: React.FC = () => {
  const { t, lang } = useAuth();
  const queryClient = useQueryClient();

  const [cashEnabled, setCashEnabled] = useState(true);
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
        terminal_enabled: false,
        payme_enabled: false,
        payme_merchant_id: "",
        click_enabled: false,
        click_service_id: "",
        click_merchant_id: "",
        uzum_enabled: false,
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
      setSuccessMsg(lang === "ru" ? "Настройки оплаты успешно сохранены!" : "To'lov sozlamalari muvaffaqiyatli saqlandi!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              {lang === "ru" ? "Способы оплаты" : "To'lov usullari"}
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {lang === "ru"
                ? "Настройка способов оплаты: наличные и Multicard (Uzcard, Humo, Visa, Mastercard)"
                : "Mijozlar buyurtmalari uchun naqd pul va Multicard shlyuzi sozlamalari"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-[#18181B] text-white rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saveMutation.isPending ? (lang === "ru" ? "Сохранение..." : "Saqlanmoqda...") : (lang === "ru" ? "Сохранить" : "Saqlash")}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/80 flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* 1. NAQD PUL (CASH) */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200 flex items-center justify-center shrink-0">
                <Banknote className="w-5 h-5 text-zinc-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    {lang === "ru" ? "Наличные (при получении)" : "Naqd pul"}
                  </h2>
                  {cashEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      {lang === "ru" ? "Активен" : "Faol"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                      {lang === "ru" ? "Отключен" : "O'chirilgan"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {lang === "ru" ? "Оплата курьеру наличными при доставке заказа" : "Kuryer buyurtmani yetkazib berganida qabul qilish"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCashEnabled(!cashEnabled)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cashEnabled
                  ? "bg-[#18181B] text-white hover:bg-zinc-800 shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200"
              }`}
            >
              {cashEnabled
                ? (lang === "ru" ? "Отключить" : "O'chirish")
                : (lang === "ru" ? "Включить" : "Yoqish")}
            </button>
          </div>
        </div>

        {/* 2. MULTICARD PAYMENT GATEWAY */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs transition-all hover:border-zinc-300 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shrink-0 font-bold text-xs tracking-tight">
                MC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-zinc-900">Multicard Payment Gateway</h2>
                  {multicardEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      {lang === "ru" ? "Активен" : "Faol"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-500 border border-zinc-200">
                      {lang === "ru" ? "Отключен" : "O'chirilgan"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {lang === "ru"
                    ? "Прием карт Uzcard, Humo, Visa, Mastercard через единый платежный шлюз"
                    : "Uzcard, Humo, Visa, Mastercard va boshqa barcha kartalarni bitta shlyuz orqali qabul qilish"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMulticardEnabled(!multicardEnabled)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                multicardEnabled
                  ? "bg-[#18181B] text-white hover:bg-zinc-800 shadow-2xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border border-zinc-200"
              }`}
            >
              {multicardEnabled
                ? (lang === "ru" ? "Отключить" : "O'chirish")
                : (lang === "ru" ? "Включить" : "Yoqish")}
            </button>
          </div>

          {multicardEnabled && (
            <div className="pt-4 border-t border-zinc-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1.5">Application ID</label>
                  <input
                    type="text"
                    value={multicardAppId}
                    onChange={(e) => setMulticardAppId(e.target.value)}
                    placeholder="rhmt_test"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1.5">Secret Key</label>
                  <input
                    type="password"
                    value={multicardSecret}
                    onChange={(e) => setMulticardSecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1.5">Store ID</label>
                  <input
                    type="text"
                    value={multicardStoreId}
                    onChange={(e) => setMulticardStoreId(e.target.value)}
                    placeholder="6"
                    className="w-full px-3.5 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-200/60">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-700">
                    Test / Sandbox rejimi (dev-mesh.multicard.uz)
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={multicardTestMode}
                    onChange={(e) => setMulticardTestMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-zinc-900"></div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </SettingsLayout>
  );
};
