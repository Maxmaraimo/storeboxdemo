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
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">{t("delivery") || "Yetkazib berish"}</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">{t("delivery_subtitle") || "Yetkazib berish narxlari, shartlari va olib ketish zonalari"}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* KURYER DOSTAVKA */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-medium shadow-2xs">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-900">{t("courier_service") || "Kuryer orqali yetkazish"}</h2>
                <p className="text-[11px] text-slate-500">{t("courier_service_desc") || "Eshikkacha yetkazib berish xizmati"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCourierEnabled(!courierEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                courierEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              {courierEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("delivery_price_label") || "Yetkazib berish narxi (UZS)"}
              </label>
              <input
                type="number"
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(e.target.value)}
                disabled={!courierEnabled}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal font-mono focus:outline-none focus:border-blue-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("free_threshold_label") || "Bepul yetkazib berish chegarasi (UZS)"}
              </label>
              <input
                type="number"
                value={freeThreshold}
                onChange={(e) => setFreeThreshold(e.target.value)}
                disabled={!courierEnabled}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal font-mono focus:outline-none focus:border-blue-600 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("time_estimate_label") || "Taxminiy yetkazish vaqti"}
              </label>
              <input
                type="text"
                value={timeEstimate}
                onChange={(e) => setTimeEstimate(e.target.value)}
                disabled={!courierEnabled}
                placeholder="Masalan: 30-45 daqiqa, 2 soat"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal focus:outline-none focus:border-blue-600 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* SAMOVIVOZ / OLIB KETISH */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60 flex items-center justify-center font-medium shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold text-slate-900">{t("pickup_service") || "Olib ketish (Samovivoz)"}</h2>
                <p className="text-[11px] text-slate-500">{t("pickup_service_desc") || "Mijoz o'zi do'kondan olib ketadi"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPickupEnabled(!pickupEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                pickupEnabled ? "bg-slate-900 text-white shadow-2xs" : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
            >
              {pickupEnabled ? (t("status_active") || "Faol") : (t("status_disabled") || "O'chirilgan")}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {t("pickup_address_label") || "Olib ketish manzili (Do'kon joylashuvi)"}
              </label>
              <textarea
                rows={4}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!pickupEnabled}
                placeholder="Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 15-uy"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal focus:outline-none focus:border-blue-600 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
