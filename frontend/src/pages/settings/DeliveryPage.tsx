import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, MapPin, Check, Save } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export const DeliveryPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [deliveryPrice, setDeliveryPrice] = useState("20000");
  const [freeThreshold, setFreeThreshold] = useState("150000");
  const [timeEstimate, setTimeEstimate] = useState("30-45 daqiqa");
  const [courierEnabled, setCourierEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [address, setAddress] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-settings"],
    queryFn: async () => {
      const res = await api.get("/settings/delivery/");
      return res.data;
    },
  });

  useEffect(() => {
    if (data) {
      setDeliveryPrice(String(data.delivery_price ?? "20000"));
      setFreeThreshold(String(data.free_delivery_threshold ?? "150000"));
      setTimeEstimate(data.delivery_time_estimate || "30-45 daqiqa");
      setCourierEnabled(data.courier_enabled ?? true);
      setPickupEnabled(data.pickup_enabled ?? true);
      setAddress(data.address || "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setSuccessMsg("");
      const payload = {
        delivery_price: Number(deliveryPrice),
        free_delivery_threshold: Number(freeThreshold),
        delivery_time_estimate: timeEstimate,
        courier_enabled: courierEnabled,
        pickup_enabled: pickupEnabled,
        address: address,
      };
      return (await api.post("/settings/delivery/", payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-settings"] });
      setSuccessMsg("Yetkazib berish sozlamalari saqlandi!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t("delivery") || "Yetkazib berish"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{t("delivery_subtitle") || "Yetkazib berish narxlari, shartlari va olib ketish zonalari"}</p>
        </div>
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="px-5 py-2.5 bg-brand text-white rounded-2xl text-xs font-black hover:bg-brand-dark transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saveMutation.isPending ? (t("saving") || "Saqlanmoqda...") : (t("save_changes") || "O'zgarishlarni saqlash")}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-[#211b2e] text-[#c8ff6a] text-xs font-bold border border-[#211b2e]/30 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KURYER DOSTAVKA */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 flex items-center justify-center font-bold shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">{t("courier_service") || "Kuryer orqali yetkazish"}</h2>
                <p className="text-[11px] text-slate-400">{t("courier_service_desc") || "Eshikkacha yetkazib berish xizmati"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCourierEnabled(!courierEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                courierEnabled ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border-[#211b2e]/30 dark:border-[#c8ff6a]/30" : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {courierEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("delivery_price_label") || "Yetkazib berish narxi (UZS)"}
              </label>
              <input
                type="number"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(e.target.value)}
                disabled={!courierEnabled}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-brand disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("free_threshold_label") || "Bepul yetkazib berish chegarasi (UZS)"}
              </label>
              <input
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                disabled={!courierEnabled}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold font-mono focus:outline-none focus:border-brand disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("time_estimate_label") || "Taxminiy yetkazish vaqti"}
              </label>
              <input
                type="text"
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
                disabled={!courierEnabled}
                placeholder="Masalan: 30-45 daqiqa, 2 soat"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* SAMOVIVOZ / OLIB KETISH */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 flex items-center justify-center font-bold shadow-xs">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">{t("pickup_service") || "Olib ketish (Samovivoz)"}</h2>
                <p className="text-[11px] text-slate-400">{t("pickup_service_desc") || "Mijoz o'zi do'kondan olib ketadi"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickupEnabled(!pickupEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                pickupEnabled ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border-[#211b2e]/30 dark:border-[#c8ff6a]/30" : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {pickupEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("pickup_address_label") || "Olib ketish manzili (Do'kon joylashuvi)"}
              </label>
              <textarea
                rows={4}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!pickupEnabled}
                placeholder="Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15-uy"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
