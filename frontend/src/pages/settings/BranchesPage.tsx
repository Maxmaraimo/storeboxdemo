import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Phone,
  Trash2,
  X,
  Check,
  Edit2,
  Building2,
  User,
  Key,
  Power,
  ExternalLink,
  Compass,
  ShoppingBag,
  Map as MapIcon,
  LayoutGrid,
  Crosshair,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { BranchItem } from "../../types";

// Custom modern SVG icons for Leaflet (No broken asset issues)
const createBranchMarkerIcon = (isAccepting: boolean, isMain: boolean) =>
  L.divIcon({
    className: "custom-branch-marker",
    html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${
        isAccepting
          ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>'
          : ''
      }
      <div style="width: 38px; height: 38px; border-radius: 14px; background: ${
        isAccepting ? '#10b981' : '#f43f5e'
      }; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px rgba(0,0,0,0.3); border: 2.5px solid white;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 18h12"></path>
          <path d="M3 22h18"></path>
          <path d="M19 10H5l1-5h12l1 5Z"></path>
          <path d="M5 10v8"></path>
          <path d="M19 10v8"></path>
          <path d="M9 14h6"></path>
        </svg>
      </div>
      ${
        isMain
          ? '<div style="position: absolute; top: -6px; right: -6px; background: #211b2e; color: #c8ff6a; border: 1.5px solid white; border-radius: 9999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900;">★</div>'
          : ''
      }
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });

const pickerPinIcon = L.divIcon({
  className: "custom-picker-pin",
  html: `<div style="position: relative; display: flex; align-items: center; justify-content: center;">
    <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); animation: pulse 1.8s infinite;"></div>
    <div style="width: 42px; height: 42px; border-radius: 50%; background: #211b2e; border: 3px solid #c8ff6a; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 22px rgba(0,0,0,0.4);">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c8ff6a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  </div>`,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
});

// Interactive Map Picker Component for Modal
const MapPickerEvents: React.FC<{
  position: [number, number];
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, onPositionChange }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      position={position}
      draggable={true}
      icon={pickerPinIcon}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        },
      }}
    />
  );
};

// Map Auto-Fitter for Overview
const MapAutoFitter: React.FC<{ branches: BranchItem[]; centerTarget?: [number, number] | null }> = ({
  branches,
  centerTarget,
}) => {
  const map = useMap();

  useEffect(() => {
    if (centerTarget) {
      map.setView(centerTarget, 15, { animate: true });
      return;
    }

    const validBranches = branches.filter(
      (b) => b.latitude !== null && b.latitude !== undefined && b.longitude !== null && b.longitude !== undefined
    );

    if (validBranches.length === 1) {
      map.setView([validBranches[0].latitude!, validBranches[0].longitude!], 14);
    } else if (validBranches.length > 1) {
      const bounds = L.latLngBounds(
        validBranches.map((b) => [Number(b.latitude), Number(b.longitude)] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [branches, centerTarget, map]);

  return null;
};

export const BranchesPage: React.FC = () => {
  const { t } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLat, setFormLat] = useState<string>("39.6843");
  const [formLng, setFormLng] = useState<string>("66.9272");
  const [formIsMain, setFormIsMain] = useState(false);
  const [formIsAcceptingOrders, setFormIsAcceptingOrders] = useState(true);
  const [formManagerUsername, setFormManagerUsername] = useState("");
  const [formManagerPassword, setFormManagerPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await api.get("/branches/");
      return res.data as { branches: BranchItem[]; total: number };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      if (!formName.trim()) throw new Error(t("branch_name_label") || "Filial nomini kiriting");
      if (!formAddress.trim()) throw new Error(t("branch_address_label") || "Manzilni kiriting");

      const latNum = formLat.trim() ? parseFloat(formLat.trim()) : null;
      const lngNum = formLng.trim() ? parseFloat(formLng.trim()) : null;

      const payload: any = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        latitude: latNum,
        longitude: lngNum,
        is_main: formIsMain,
        is_accepting_orders: formIsAcceptingOrders,
      };

      if (formManagerUsername.trim()) {
        payload.manager_username = formManagerUsername.trim();
      }
      if (formManagerPassword.trim()) {
        payload.manager_password = formManagerPassword.trim();
      }

      if (editingBranch) {
        return (await api.patch(`/branches/${editingBranch.id}/`, payload)).data;
      } else {
        return (await api.post("/branches/", payload)).data;
      }
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

  const toggleOrdersMutation = useMutation({
    mutationFn: async ({ id, is_accepting_orders }: { id: number; is_accepting_orders: boolean }) => {
      return (await api.patch(`/branches/${id}/`, { is_accepting_orders })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
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

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName("");
    setFormAddress("");
    setFormPhone("");
    setFormLat("39.6843");
    setFormLng("66.9272");
    setFormIsMain(false);
    setFormIsAcceptingOrders(true);
    setFormManagerUsername("");
    setFormManagerPassword("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (b: BranchItem) => {
    setEditingBranch(b);
    setFormName(b.name || "");
    setFormAddress(b.address || "");
    setFormPhone(b.phone || "");
    setFormLat(
      b.latitude !== null && b.latitude !== undefined && !isNaN(Number(b.latitude))
        ? String(b.latitude)
        : "39.6843"
    );
    setFormLng(
      b.longitude !== null && b.longitude !== undefined && !isNaN(Number(b.longitude))
        ? String(b.longitude)
        : "66.9272"
    );
    setFormIsMain(Boolean(b.is_main));
    setFormIsAcceptingOrders(b.is_accepting_orders !== false);
    setFormManagerUsername(b.manager_username || "");
    setFormManagerPassword("");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBranch(null);
    setFormError("");
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolokatsiya qo'llab-quvvatlanmaydi");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setFormLat(pos.coords.latitude.toFixed(6));
        setFormLng(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        setIsLocating(false);
        alert(err.message || "Geolokatsiyani aniqlab bo'lmadi");
      },
      { enableHighAccuracy: true }
    );
  };

  const branches = data?.branches || [];

  const pickerPosition = useMemo<[number, number]>(() => {
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
    return [39.6843, 66.9272];
  }, [formLat, formLng]);

  const defaultCenter = useMemo<[number, number]>(() => {
    const firstWithCoords = branches.find((b) => b.latitude && b.longitude);
    if (firstWithCoords) {
      return [Number(firstWithCoords.latitude), Number(firstWithCoords.longitude)];
    }
    return [39.6542, 66.9597]; // Samarkand
  }, [branches]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("branches") || "Filiallar"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {branches.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {t("branches_subtitle") || "Do'koningiz filiallari, xaritadagi lokatsiyalari va xodim hisoblari"}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setMapTarget(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t("view_list") || "Ro'yxat"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t("view_map") || "Xaritada"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 rounded-2xl text-xs font-black hover:opacity-90 transition-opacity flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t("add_branch_btn") || "Filial qo'shish"}</span>
          </button>
        </div>
      </div>

      {/* FULL INTERACTIVE LEAFLET MAP VIEW */}
      {viewMode === "map" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-2 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Compass className="w-4 h-4 text-brand" />
              <span>{t("branches_map_title") || "Shahar bo'ylab barcha filiallar lokatsiyasi"}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{t("branch_open") || "Ochiq"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>{t("branch_closed") || "Yopiq"}</span>
              </span>
            </div>
          </div>

          <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 relative z-0">
            <MapContainer
              center={defaultCenter}
              zoom={13}
              style={{ width: "100%", height: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapAutoFitter branches={branches} centerTarget={mapTarget} />

              {branches.map((b) => {
                if (!b.latitude || !b.longitude) return null;
                const isAccepting = b.is_accepting_orders !== false;
                const icon = createBranchMarkerIcon(isAccepting, Boolean(b.is_main));

                return (
                  <Marker
                    key={b.id}
                    position={[Number(b.latitude), Number(b.longitude)]}
                    icon={icon}
                  >
                    <Popup className="custom-branch-popup">
                      <div className="p-1 space-y-2 min-w-[200px]">
                        <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-1.5">
                          <div className="font-extrabold text-sm text-slate-900 leading-tight">
                            {b.name}
                          </div>
                          {b.is_main && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#211b2e] text-[#c8ff6a]">
                              ★ Asosiy
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-600 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>{b.address}</span>
                        </div>

                        {b.phone && (
                          <div className="text-xs text-slate-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a href={`tel:${b.phone}`} className="font-mono font-bold hover:underline">
                              {b.phone}
                            </a>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isAccepting
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isAccepting ? (t("branch_open") || "Ochiq") : (t("branch_closed") || "Yopiq")}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditModal(b)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-black transition-colors"
                          >
                            {t("edit_branch_btn") || "Tahrirlash"}
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}

      {/* BRANCHES GRID (CARDS VIEW) */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => {
            const isAccepting = b.is_accepting_orders !== false;
            return (
              <div
                key={b.id}
                className={`bg-white rounded-3xl border ${
                  isAccepting ? "border-slate-200/90 shadow-xs" : "border-slate-200/60 opacity-90"
                } p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isAccepting ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <h2 className="text-sm font-black text-slate-900 line-clamp-1">{b.name}</h2>
                      </div>
                      {b.is_main && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30">
                          {t("is_main_branch") || "Asosiy filial"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={t("edit_branch_btn") || "Tahrirlash"}
                        onClick={() => openEditModal(b)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={t("delete") || "O'chirish"}
                        onClick={() => {
                          if (confirm(`'${b.name}' filialini o'chirishni tasdiqlaysizmi?`)) {
                            deleteMutation.mutate(b.id);
                          }
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Toggle Banner */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isAccepting ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-700">
                        {isAccepting ? (t("branch_open") || "Ochiq (Buyurtma olinmoqda)") : (t("branch_closed") || "Yopiq")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        toggleOrdersMutation.mutate({
                          id: b.id,
                          is_accepting_orders: !isAccepting,
                        })
                      }
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                        isAccepting
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{isAccepting ? (t("branch_closed") || "Yopish") : (t("branch_open") || "Ochish")}</span>
                    </button>
                  </div>

                  {/* Location & Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{b.address}</span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <a href={`tel:${b.phone}`} className="font-mono hover:text-brand font-semibold">
                          {b.phone}
                        </a>
                      </div>
                    )}
                    {b.latitude && b.longitude ? (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Compass className="w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {Number(b.latitude).toFixed(4)}, {Number(b.longitude).toFixed(4)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMapTarget([Number(b.latitude), Number(b.longitude)]);
                            setViewMode("map");
                          }}
                          className="text-[10px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>{t("branch_pick_on_map") || "Xaritada ko'rish"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-600 font-semibold bg-amber-50 p-1.5 rounded-lg flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Koordinata belgilanmagan (avto-yo'naltirish ishlamaydi)</span>
                      </div>
                    )}
                  </div>

                  {/* Manager Login Info Box */}
                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-amber-800">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-600" />
                        <span>{t("branch_login_title") || "Filial kirish hisobi"}</span>
                      </div>
                      {b.orders_count !== undefined && (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded-md">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>{b.orders_count} buyurtma</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-slate-500 text-[11px]">{t("branch_login_label") || "Login"}:</span>
                      <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                        {b.manager_username || (b as any).manager_user?.username || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {branches.length === 0 && !isLoading && (
            <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
              {t("no_items") || "Hozircha filiallar mavjud emas. Yangi filial qo'shing."}
            </div>
          )}
        </div>
      )}

      {/* MODAL (CREATE / EDIT) WITH INTERACTIVE MAP PICKER */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">
                  {editingBranch
                    ? (t("edit_branch_btn") || "Filialni tahrirlash")
                    : (t("add_branch_btn") || "Yangi filial qo'shish")}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  {t("basic_info_title") || "Asosiy ma'lumotlar"}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("branch_name_label") || "Filial nomi"} *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Burger & Co. — Samarqand Vokzal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("branch_address_label") || "Manzil"} *
                  </label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Samarqand sh., Rudakiy ko'chasi 45"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("branch_phone_label") || "Telefon raqami"}
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Section 2: Interactive Map Picker & Coordinates */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t("branch_coordinates_label") || "Xaritadagi aniq nuqta (Koordinatalar)"}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {t("click_map_to_set_location") || "Markerni suring yoki xaritani bosing"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="px-2.5 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 text-brand text-[11px] font-bold border border-violet-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>{t("locate_me") || "Joylashuvim"}</span>
                  </button>
                </div>

                {/* Leaflet interactive map */}
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner z-0">
                  <MapContainer
                    center={pickerPosition}
                    zoom={14}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapPickerEvents
                      position={pickerPosition}
                      onPositionChange={(lat, lng) => {
                        setFormLat(lat.toFixed(6));
                        setFormLng(lng.toFixed(6));
                      }}
                    />
                  </MapContainer>
                  <div className="absolute bottom-2 left-2 z-[400] bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 shadow-xs border border-slate-200/80 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>
                      {parseFloat(formLat).toFixed(4)}, {parseFloat(formLng).toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Latitude (Lat)</label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="39.6843"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Longitude (Lng)</label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="66.9272"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  {t("coordinates_saved_hint") ||
                    "Ushbu koordinatalar mijoz buyurtmasini eng yaqin filialga avtomatik yo'naltirish uchun saqlanadi."}
                </div>
              </div>

              {/* Section 3: Manager Credentials */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("branch_login_title") || "Filial xodimi / Menejer hisobi"}</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("branch_login_label") || "Login (Foydalanuvchi nomi)"}
                  </label>
                  <input
                    type="text"
                    value={formManagerUsername}
                    onChange={(e) => setFormManagerUsername(e.target.value)}
                    placeholder="branch_vokzal yoki +998901234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t("branch_password_label") || "Parol"}
                  </label>
                  <input
                    type="password"
                    value={formManagerPassword}
                    onChange={(e) => setFormManagerPassword(e.target.value)}
                    placeholder={
                      editingBranch
                        ? t("branch_password_hint") || "O'zgartirmaslik uchun bo'sh qoldiring"
                        : "••••••••"
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand"
                  />
                  {editingBranch && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {t("branch_password_hint") || "O'zgartirmaslik uchun bo'sh qoldiring"}
                    </span>
                  )}
                </div>
              </div>

              {/* Section 4: Flags */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_accepting_orders"
                    checked={formIsAcceptingOrders}
                    onChange={(e) => setFormIsAcceptingOrders(e.target.checked)}
                    className="w-4 h-4 rounded-md text-brand focus:ring-brand"
                  />
                  <label htmlFor="is_accepting_orders" className="text-xs font-bold text-slate-700 cursor-pointer">
                    {t("branch_toggle_orders") || "Buyurtmalarni qabul qilish (Ochiq)"}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_main_branch"
                    checked={formIsMain}
                    onChange={(e) => setFormIsMain(e.target.checked)}
                    className="w-4 h-4 rounded-md text-brand focus:ring-brand"
                  />
                  <label htmlFor="is_main_branch" className="text-xs font-bold text-slate-700 cursor-pointer">
                    {t("is_main_branch") || "Asosiy filial sifatida belgilash"}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("btn_cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 rounded-xl text-xs font-black hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {saveMutation.isPending
                  ? t("saving") || "Saqlanmoqda..."
                  : editingBranch
                  ? t("save") || "Saqlash"
                  : t("create") || "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
