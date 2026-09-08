import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Database, CheckCircle2, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export const YesPosPage: React.FC = () => {
  const { t } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSync = async () => {
    setSyncing(true);
    setMsg("");
    try {
      const res = await api.post("/yespos/sync/");
      setMsg(res.data?.message || "YES POS bilan sinxronizatsiya yakunlandi!");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Sinxronizatsiya xatosi");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">YES POS Integratsiyasi</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kassangizdagi tovarlar, qoldiqlar va narxlarni bir zumda do`koningizga yuklang</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-xl">
            YES
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base text-slate-900">YES POS Smart Sync</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                FAOL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Avtomatik so`rov cheklovchisi (Rate-limiter) bilan himoyalangan</p>
          </div>
        </div>

        {msg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Katalogdagi tovarlar soni avtomatik tekshirib turiladi
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Sinxronlanmoqda..." : "Hozir sinxronlash"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
