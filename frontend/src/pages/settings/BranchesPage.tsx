import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Phone, Trash2, X, Check } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export interface BranchItem {
  id: number;
  name: string;
  address: string;
  phone: string;
  is_main: boolean;
  is_active: boolean;
}

export const BranchesPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formIsMain, setFormIsMain] = useState(false);
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches/");
      return res.data as { branches: BranchItem[]; total: number };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formName.trim()) throw new Error("Filial nomini kiriting");
      if (!formAddress.trim()) throw new Error("Manzilni kiriting");

      const payload = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        is_main: formIsMain,
        is_active: true,
      };

      return (await api.post("/branches/", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setFormError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/branches/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const openModal = () => {
    setFormName("");
    setFormAddress("");
    setFormPhone("");
    setFormIsMain(false);
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const branches = data?.branches || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("branches") || "Filiallar"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Do'koningiz filiallari va qabul punktlari</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Filial qo'shish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900">{b.name}</h2>
              <div className="flex items-center gap-2">
                {b.is_main && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Asosiy</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`'${b.name}' filialini o'chirishni tasdiqlaysizmi?`)) {
                      deleteMutation.mutate(b.id);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{b.address}</span>
            </div>
            {b.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-mono">{b.phone}</span>
              </div>
            )}
          </div>
        ))}

        {branches.length === 0 && !isLoading && (
          <div className="md:col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
            Hozircha filiallar qo'shilmagan. Yuqoridagi "Filial qo'shish" tugmasi orqali qo'shing.
          </div>
        )}
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Yangi filial qo'shish
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
                  Filial nomi *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Chilonzor filiali"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  To'liq manzil *
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Masalan: Toshkent sh., Chilonzor 9-mavze, 21-uy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aloqa telefoni
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 71 200 00 00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_main_branch"
                  checked={formIsMain}
                  onChange={(e) => setFormIsMain(e.target.checked)}
                  className="w-4 h-4 rounded-md text-brand focus:ring-brand"
                />
                <label htmlFor="is_main_branch" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Asosiy filial sifatida belgilash
                </label>
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
                {createMutation.isPending ? "Qo'shilmoqda..." : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
