import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, Plus, Percent, Calendar, Trash2, X, Check } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export interface PromoCodeItem {
  id: number;
  code: string;
  discount_type: "PERCENT" | "FIXED";
  discount_value: number;
  min_order_amount: number;
  max_uses: number;
  times_used: number;
  is_active: boolean;
}

export const DiscountsPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [formValue, setFormValue] = useState("10");
  const [formMinOrder, setFormMinOrder] = useState("100000");
  const [formMaxUses, setFormMaxUses] = useState("100");
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["promocodes"],
    queryFn: async () => {
      const res = await api.get("/promocodes/");
      return res.data as { promocodes: PromoCodeItem[]; total: number };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formCode.trim()) throw new Error("Promokod kodini kiriting");
      if (!formValue || Number(formValue) <= 0) throw new Error("Chegirma miqdorini kiriting");

      const payload = {
        code: formCode.trim().toUpperCase(),
        discount_type: formType,
        discount_value: Number(formValue),
        min_order_amount: Number(formMinOrder) || 0,
        max_uses: Number(formMaxUses) || 100,
        is_active: true,
      };

      return (await api.post("/promocodes/", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocodes"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setFormError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      await api.patch(`/promocodes/${id}/`, { is_active: !is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocodes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/promocodes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocodes"] });
    },
  });

  const openModal = () => {
    setFormCode("");
    setFormType("PERCENT");
    setFormValue("10");
    setFormMinOrder("100000");
    setFormMaxUses("100");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const promos = data?.promocodes || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("discounts")} va Promokodlar</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mijozlarni jalb qilish uchun chegirmalar va aksiyalar</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi promokod</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promos.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" />
                <span className="font-mono font-black text-base text-slate-900">{p.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate({ id: p.id, is_active: p.is_active })}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  {p.is_active ? 'Faol' : 'O`chirilgan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`'${p.code}' promokodini o'chirishni tasdiqlaysizmi?`)) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-2xl font-black text-brand">
              {p.discount_type === 'PERCENT' ? `${p.discount_value}%` : `${Number(p.discount_value).toLocaleString()} UZS`}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Minimal buyurtma:</span>
              <span className="font-bold text-slate-700">{Number(p.min_order_amount).toLocaleString()} UZS</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Foydalanishlar:</span>
              <span className="font-bold text-slate-700">{p.times_used} / {p.max_uses} marta</span>
            </div>
          </div>
        ))}

        {promos.length === 0 && !isLoading && (
          <div className="md:col-span-3 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            Hozircha promokodlar yaratilmagan. Yuqoridagi "Yangi promokod" tugmasi orqali qo'shing.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Yangi promokod qo'shish
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Promokod kodi *
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Masalan: BAHOR2026, SALOM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black uppercase font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chegirma turi *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("PERCENT")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      formType === "PERCENT" ? "bg-brand text-white border-brand" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Foiz (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("FIXED")}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      formType === "FIXED" ? "bg-brand text-white border-brand" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Aniq summa (UZS)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chegirma qiymati ({formType === "PERCENT" ? "%" : "UZS"}) *
                </label>
                <input
                  type="number"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder={formType === "PERCENT" ? "15" : "25000"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Minimal buyurtma summasi (UZS)
                </label>
                <input
                  type="number"
                  value={formMinOrder}
                  onChange={(e) => setFormMinOrder(e.target.value)}
                  placeholder="100000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maksimal foydalanish soni
                </label>
                <input
                  type="number"
                  value={formMaxUses}
                  onChange={(e) => setFormMaxUses(e.target.value)}
                  placeholder="100"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-brand text-white rounded-xl text-xs font-black hover:bg-brand-dark transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Yaratilmoqda..." : "Yaratish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
