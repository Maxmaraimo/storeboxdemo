import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Plus, Shield, Trash2, X, Check } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export interface StaffItem {
  id: number;
  name: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const StaffPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("MANAGER");
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.get("/staff/");
      return res.data as { staff: StaffItem[]; total: number };
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formName.trim()) throw new Error("Xodim ismini kiriting");
      if (!formPhone.trim()) throw new Error("Telefon raqamini kiriting");

      const payload = {
        name: formName.trim(),
        phone: formPhone.trim(),
        role: formRole,
        is_active: true,
      };

      return (await api.post("/staff/", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error || err.message || "Xatolik yuz berdi";
      setFormError(typeof msg === "object" ? JSON.stringify(msg) : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/staff/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  const openModal = () => {
    setFormName("");
    setFormPhone("+998 ");
    setFormRole("MANAGER");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormError("");
  };

  const staff = data?.staff || [];

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    MANAGER: "Menejer",
    COURIER: "Kuryer",
    CASHIER: "Kassir / Operator",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("staff") || "Xodimlar"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Xodimlar huquqlari va kirish nazorati</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="px-4 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Xodim qo'shish</span>
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
                <th className="p-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-bold text-slate-900">{s.name}</td>
                  <td className="p-4 text-slate-600 font-semibold">{roleLabels[s.role] || s.role}</td>
                  <td className="p-4 font-mono text-slate-500">{s.phone}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Faol
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`'${s.name}' xodimini o'chirishni tasdiqlaysizmi?`)) {
                          deleteMutation.mutate(s.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                    Hozircha xodimlar qo'shilmagan. Yuqoridagi "Xodim qo'shish" tugmasi orqali qo'shing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Yangi xodim qo'shish
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
                  Xodimning to'liq ismi (F.I.O) *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Masalan: Sardor Aliyev"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefon raqami *
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lavozimi / Vazifasi *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                >
                  <option value="MANAGER">Menejer (Buyurtmalarni boshqarish)</option>
                  <option value="CASHIER">Kassir / Operator</option>
                  <option value="COURIER">Kuryer (Yetkazib berish)</option>
                  <option value="ADMIN">Administrator</option>
                </select>
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
