import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertCircle,
  Search,
  Loader2,
  Maximize2,
  Copy,
  ChevronRight
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
    <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; background: rgba(200, 255, 106, 0.45); animation: pulse 1.8s infinite;"></div>
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

// Interactive Map Picker Component for Modal with fly-to zoom
const MapPickerEvents: React.FC<{
  position: [number, number];
  targetZoom?: number;
  onPositionChange: (lat: number, lng: number) => void;
}> = ({ position, targetZoom, onPositionChange }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(position, targetZoom || Math.max(map.getZoom(), 15), { animate: true });
  }, [position, targetZoom, map]);

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

interface SearchResultItem {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const BranchesPage: React.FC = () => {
  const { t } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [mapTarget, setMapTarget] = useState<[number, number] | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLat, setFormLat] = useState<string>("39.6843");
  const [formLng, setFormLng] = useState<string>("66.9272");
  const [mapPickerZoom, setMapPickerZoom] = useState<number>(14);
  const [formIsMain, setFormIsMain] = useState(false);
  const [formIsAcceptingOrders, setFormIsAcceptingOrders] = useState(true);
  const [formManagerUsername, setFormManagerUsername] = useState("");
  const [formManagerPassword, setFormManagerPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Address search and geocoding states
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState("");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Geocoding: search location by text (Photon API + Nominatim fallback)
  const searchLocation = async (query: string, autoSelectTop = false) => {
    const q = query.trim();
    if (!q || q.length < 2) return;
    setIsSearchingLocation(true);
    setSearchFeedback("");

    try {
      let items: SearchResultItem[] = [];

      // 1. First attempt: Photon API (Fast OSM search with POI support)
      try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=39.6542&lon=66.9597&limit=6`;
        const pRes = await fetch(photonUrl);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData?.features && pData.features.length > 0) {
            items = pData.features.map((f: any) => {
              const p = f.properties || {};
              const streetPart = p.street ? `${p.street}${p.housenumber ? ' ' + p.housenumber : ''}` : '';
              const fullAddress = [p.name, streetPart, p.city, p.country]
                .filter(Boolean)
                .filter((val, i, arr) => arr.indexOf(val) === i)
                .join(", ");
              return {
                name: p.name || streetPart || p.city || q,
                address: fullAddress || q,
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
              };
            });
          }
        }
      } catch (e) {
        console.warn("Photon search error:", e);
      }

      // 2. Fallback attempt: OpenStreetMap Nominatim
      if (items.length === 0) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=uz`;
          const nRes = await fetch(nomUrl);
          if (nRes.ok) {
            const nData = await nRes.json();
            if (Array.isArray(nData) && nData.length > 0) {
              items = nData.map((item: any) => ({
                name: item.name || item.display_name.split(",")[0],
                address: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              }));
            }
          }
        } catch (e) {
          console.warn("Nominatim search error:", e);
        }
      }

      setSearchResults(items);
      if (items.length > 0) {
        setShowResultsDropdown(true);
        if (autoSelectTop) {
          const top = items[0];
          setFormLat(top.lat.toFixed(6));
          setFormLng(top.lng.toFixed(6));
          setMapPickerZoom(16);
          setFormAddress(top.address || top.name);
          setShowResultsDropdown(false);
          setSearchFeedback(`📍 ${top.name}`);
        }
      } else {
        setShowResultsDropdown(false);
        setSearchFeedback(t("no_location_found") || "Bunday joy topilmadi. Nuqtani xaritadan tanlang");
      }
    } catch (err: any) {
      console.error("Geocoding failed:", err);
      setSearchFeedback("Qidirishda xatolik yuz berdi");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleAddressTyping = (val: string) => {
    setFormAddress(val);
    setSearchFeedback("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (val.trim().length >= 3) {
      typingTimeoutRef.current = setTimeout(() => {
        searchLocation(val, false);
      }, 500);
    } else {
      setSearchResults([]);
      setShowResultsDropdown(false);
    }
  };

  const selectSearchResult = (item: SearchResultItem) => {
    setFormLat(item.lat.toFixed(6));
    setFormLng(item.lng.toFixed(6));
    setMapPickerZoom(16);
    setFormAddress(item.address || item.name);
    setShowResultsDropdown(false);
    setSearchFeedback(`📍 ${item.name}`);
  };

  // Reverse Geocoding: get street name from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const parts = [
            data.address.amenity || data.address.shop || data.address.building || data.name,
            data.address.road ? `${data.address.road}${data.address.house_number ? ' ' + data.address.house_number : ''}` : '',
            data.address.city || data.address.town || data.address.county,
          ].filter(Boolean);
          const text = parts.join(", ") || data.display_name;
          if (text) {
            setDetectedAddress(text);
          }
        }
      }
    } catch (err) {
      console.warn("Reverse geocode error:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handlePickerPositionChange = (lat: number, lng: number) => {
    setFormLat(lat.toFixed(6));
    setFormLng(lng.toFixed(6));
    reverseGeocode(lat, lng);
  };

  const openCreateModal = () => {
    setEditingBranch(null);
    setFormName("");
    setFormAddress("");
    setFormPhone("");
    setFormLat("39.6843");
    setFormLng("66.9272");
    setMapPickerZoom(14);
    setFormIsMain(false);
    setFormIsAcceptingOrders(true);
    setFormManagerUsername("");
    setFormManagerPassword("");
    setFormError("");
    setSearchResults([]);
    setShowResultsDropdown(false);
    setDetectedAddress("");
    setSearchFeedback("");
    setModalOpen(true);
  };

  const openEditModal = (b: BranchItem) => {
    setEditingBranch(b);
    setFormName(b.name || "");
    setFormAddress(b.address || "");
    setFormPhone(b.phone || "");
    const latStr =
      b.latitude !== null && b.latitude !== undefined && !isNaN(Number(b.latitude))
        ? String(b.latitude)
        : "39.6843";
    const lngStr =
      b.longitude !== null && b.longitude !== undefined && !isNaN(Number(b.longitude))
        ? String(b.longitude)
        : "66.9272";
    setFormLat(latStr);
    setFormLng(lngStr);
    setMapPickerZoom(16);
    setFormIsMain(Boolean(b.is_main));
    setFormIsAcceptingOrders(b.is_accepting_orders !== false);
    setFormManagerUsername(b.manager_username || "");
    setFormManagerPassword("");
    setFormError("");
    setSearchResults([]);
    setShowResultsDropdown(false);
    setDetectedAddress("");
    setSearchFeedback("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBranch(null);
    setFormError("");
    setSearchResults([]);
    setShowResultsDropdown(false);
    setDetectedAddress("");
    setSearchFeedback("");
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
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormLat(lat.toFixed(6));
        setFormLng(lng.toFixed(6));
        setMapPickerZoom(16);
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        alert(err.message || "Geolokatsiyani aniqlab bo'lmadi");
      },
      { enableHighAccuracy: true }
    );
  };

  const branches = data?.branches || [];

  // Keep selected branch in sync with live data
  useEffect(() => {
    if (selectedBranch && data?.branches) {
      const updated = data.branches.find((b) => b.id === selectedBranch.id);
      if (updated) setSelectedBranch(updated);
    }
  }, [data?.branches]);

  const handleCopyCoords = (lat: string | number, lng: string | number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

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
                onClick={() => setSelectedBranch(b)}
                className="group relative bg-white dark:bg-[#151824] rounded-[28px] border border-slate-200/90 dark:border-white/10 p-5 space-y-4 transition-all duration-200 hover:shadow-xl hover:border-[#211b2e]/30 dark:hover:border-[#c8ff6a]/40 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Card Header: Title + Status Pill + Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAccepting
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAccepting ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{isAccepting ? (t("branch_open_status") || "Ochiq") : (t("branch_closed_status") || "Yopiq")}</span>
                        </span>

                        {b.is_main && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#211b2e] text-[#c8ff6a] border border-[#c8ff6a]/30 shadow-2xs">
                            ★ {t("is_main_branch") || "Asosiy"}
                          </span>
                        )}
                      </div>

                      <h2 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#211b2e] dark:group-hover:text-[#c8ff6a] transition-colors">
                        {b.name}
                      </h2>
                    </div>

                    {/* Top-Right Quick Action Icons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        title={t("branch_view_full") || "To'liq ko'rish"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBranch(b);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={t("edit_branch_btn") || "Tahrirlash"}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(b);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title={t("delete") || "O'chirish"}
                        onClick={(e) => {
                          e.stopPropagation();
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

                  {/* Status Toggle Row (Apple/Linear iOS Switch Style) */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{isAccepting ? (t("branch_open_status") || "Ochiq") : (t("branch_closed_status") || "Yopiq")}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {isAccepting
                          ? (t("branch_orders_accepting_hint") || "Buyurtmalar qabul qilinmoqda")
                          : (t("branch_orders_paused_hint") || "Buyurtmalar to'xtatilgan")}
                      </div>
                    </div>

                    {/* Interactive iOS / Linear Toggle Switch */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOrdersMutation.mutate({
                          id: b.id,
                          is_accepting_orders: !isAccepting,
                        });
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAccepting ? "bg-[#211b2e] dark:bg-[#c8ff6a]" : "bg-slate-300 dark:bg-zinc-700"
                      }`}
                      title={isAccepting ? (t("branch_action_close") || "Yopish") : (t("branch_action_open") || "Ochish")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#211b2e] shadow-md ring-0 transition duration-200 ease-in-out ${
                          isAccepting ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Location & Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{b.address}</span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <a
                          href={`tel:${b.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono font-bold hover:text-brand"
                        >
                          {b.phone}
                        </a>
                      </div>
                    )}
                    {b.latitude && b.longitude ? (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Compass className="w-3.5 h-3.5 text-emerald-500" />
                          <span>
                            {Number(b.latitude).toFixed(4)}, {Number(b.longitude).toFixed(4)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMapTarget([Number(b.latitude), Number(b.longitude)]);
                            setViewMode("map");
                          }}
                          className="text-[10px] text-[#211b2e] dark:text-[#c8ff6a] font-bold bg-[#211b2e]/5 dark:bg-white/10 hover:bg-[#211b2e]/10 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{t("branch_pick_on_map") || "Xaritada ko'rish"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-600 font-semibold bg-amber-50 p-1.5 rounded-lg flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Koordinata belgilanmagan</span>
                      </div>
                    )}
                  </div>

                  {/* Manager Login Info Box in StoreBox Brand Style */}
                  <div className="p-3.5 rounded-2xl bg-[#211b2e] text-white space-y-2 border border-white/10 shadow-xs text-xs">
                    <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-wider text-[#c8ff6a]">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#c8ff6a]" />
                        <span>{t("branch_login_title") || "Filial kirish hisobi"}</span>
                      </div>
                      {b.orders_count !== undefined && (
                        <span className="inline-flex items-center gap-1 font-bold text-[#211b2e] bg-[#c8ff6a] px-2 py-0.5 rounded-md text-[10px]">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>
                            {b.orders_count} {t("orders_count_label") || "buyurtma"}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-neutral-300 text-[11px]">{t("branch_login_label") || "Login"}:</span>
                      <span className="font-mono font-bold text-[#c8ff6a] bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 text-xs">
                        {b.manager_username || (b as any).manager_user?.username || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Clickable hint */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-500 group-hover:text-[#211b2e] dark:group-hover:text-[#c8ff6a] transition-colors">
                  <span>{t("branch_view_full") || "To'liq ko'rish"}</span>
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
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

      {/* FULL VIEW DETAIL MODAL */}
      {selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-[#12141a] rounded-[32px] max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8 border border-slate-200/80 dark:border-white/10">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#211b2e] text-[#c8ff6a] flex items-center justify-center shadow-md border border-white/10 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {selectedBranch.name}
                    </h3>
                    {selectedBranch.is_main && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#211b2e] text-[#c8ff6a] border border-[#c8ff6a]/30">
                        ★ {t("is_main_branch") || "Asosiy"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedBranch.is_accepting_orders !== false
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          selectedBranch.is_accepting_orders !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                        }`}
                      />
                      <span>
                        {selectedBranch.is_accepting_orders !== false
                          ? (t("branch_open_status") || "Ochiq")
                          : (t("branch_closed_status") || "Yopiq")}
                      </span>
                    </span>

                    {/* Toggle inside modal */}
                    <button
                      type="button"
                      onClick={() => {
                        const newStatus = selectedBranch.is_accepting_orders === false;
                        toggleOrdersMutation.mutate({ id: selectedBranch.id, is_accepting_orders: newStatus });
                        setSelectedBranch({ ...selectedBranch, is_accepting_orders: newStatus });
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      {selectedBranch.is_accepting_orders !== false
                        ? (t("branch_action_close") || "Yopish")
                        : (t("branch_action_open") || "Ochish")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBranch;
                    setSelectedBranch(null);
                    openEditModal(b);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title={t("edit_branch_btn") || "Tahrirlash"}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBranch(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Interactive Full Map View of Branch */}
            {selectedBranch.latitude && selectedBranch.longitude && (
              <div className="space-y-2">
                <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative shadow-inner z-0">
                  <MapContainer
                    center={[Number(selectedBranch.latitude), Number(selectedBranch.longitude)]}
                    zoom={16}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[Number(selectedBranch.latitude), Number(selectedBranch.longitude)]}
                      icon={createBranchMarkerIcon(
                        selectedBranch.is_accepting_orders !== false,
                        Boolean(selectedBranch.is_main)
                      )}
                    >
                      <Popup>
                        <div className="font-bold text-xs p-1">{selectedBranch.name}</div>
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>

                {/* Map Action Links */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                      {Number(selectedBranch.latitude).toFixed(5)}, {Number(selectedBranch.longitude).toFixed(5)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoords(selectedBranch.latitude!, selectedBranch.longitude!)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-1 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
                    >
                      {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCoords ? (t("copied") || "Nusxalandi!") : (t("copy_coords") || "Nusxalash")}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://yandex.uz/maps/?pt=${selectedBranch.longitude},${selectedBranch.latitude}&z=16&l=map`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 transition-colors"
                    >
                      <span>{t("open_in_yandex") || "Yandex Xarita"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedBranch.latitude},${selectedBranch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1 transition-colors"
                    >
                      <span>{t("open_in_google") || "Google Maps"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 4 Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Box 1: Address */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t("branch_address_label") || "Manzil"}</span>
                </div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-relaxed">
                  {selectedBranch.address}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold pt-0.5">
                  ⚡️ {t("branch_auto_routed_notice") || "Eng yaqin buyurtmalar shu yerga yo'naltiriladi"}
                </div>
              </div>

              {/* Box 2: Contacts */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-1">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t("branch_phone_label") || "Telefon"}</span>
                </div>
                {selectedBranch.phone ? (
                  <div className="flex items-center justify-between pt-0.5">
                    <a
                      href={`tel:${selectedBranch.phone}`}
                      className="text-xs font-mono font-black text-slate-900 dark:text-white hover:underline"
                    >
                      {selectedBranch.phone}
                    </a>
                    <a
                      href={`tel:${selectedBranch.phone}`}
                      className="px-2 py-0.5 rounded-md bg-[#211b2e] text-[#c8ff6a] text-[10px] font-bold"
                    >
                      {t("call_customer") || "Qo'ng'iroq"}
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Telefon kiritilmagan</div>
                )}
              </div>

              {/* Box 3: Manager Credentials */}
              <div className="p-4 rounded-2xl bg-[#211b2e] text-white space-y-1.5 border border-white/10 shadow-xs">
                <div className="text-[10px] uppercase font-black tracking-wider text-[#c8ff6a] flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#c8ff6a]" />
                  <span>{t("branch_login_title") || "Filial kirish hisobi"}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-neutral-300 text-[11px]">{t("branch_login_label") || "Login"}:</span>
                  <span className="font-mono font-bold text-[#c8ff6a] bg-white/10 px-2.5 py-0.5 rounded-md border border-white/10 text-xs">
                    {selectedBranch.manager_username || (selectedBranch as any).manager_user?.username || "—"}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400">
                  {t("branch_restricted_badge") || "Menejer faqat shu filial buyurtmalarini ko'radi"}
                </div>
              </div>

              {/* Box 4: Orders Statistics */}
              <div className="p-4 rounded-2xl bg-[#211b2e] text-white space-y-1.5 border border-white/10 shadow-xs">
                <div className="text-[10px] uppercase font-black tracking-wider text-[#c8ff6a] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#c8ff6a]" />
                    <span>{t("orders") || "Buyurtmalar"}</span>
                  </div>
                  <span className="bg-[#c8ff6a] text-[#211b2e] text-[10px] font-black px-2 py-0.5 rounded-md">
                    {selectedBranch.orders_count || 0} ta
                  </span>
                </div>
                <div className="text-xs text-neutral-300">
                  Ushbu filialga biriktirilgan jami buyurtmalar soni
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/orders?branch=${selectedBranch.id}`)}
                  className="w-full text-center py-1.5 mt-1 rounded-xl bg-white/10 hover:bg-white/20 text-[#c8ff6a] text-xs font-bold transition-colors cursor-pointer"
                >
                  {t("branch_orders_btn") || "Buyurtmalarni ko'rish →"}
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setSelectedBranch(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                {t("cancel") || "Yopish"}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBranch;
                    setSelectedBranch(null);
                    openEditModal(b);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-900 dark:text-white transition-colors cursor-pointer"
                >
                  {t("edit_branch_btn") || "Tahrirlash"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders?branch=${selectedBranch.id}`)}
                  className="px-5 py-2.5 bg-[#211b2e] text-[#c8ff6a] dark:bg-[#c8ff6a] dark:text-[#211b2e] border border-[#211b2e]/30 dark:border-[#c8ff6a]/30 rounded-xl text-xs font-black hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {t("branch_orders_btn") || "Buyurtmalar ro'yxati"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL (CREATE / EDIT) WITH INTERACTIVE ADDRESS SEARCH & MAP PICKER */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-8 border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#211b2e] text-[#c8ff6a] flex items-center justify-center shadow-xs border border-white/10">
                  <Building2 className="w-4 h-4" />
                </div>
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#211b2e]"
                  />
                </div>

                {/* ADDRESS WITH REAL-TIME MAP SEARCH & AUTOCOMPLETE */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {t("branch_address_label") || "Manzil"} *
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {t("location_search_hint") || "Manzil yoki joy nomini kiriting"}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => handleAddressTyping(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchLocation(formAddress, true);
                        }
                      }}
                      placeholder="Burger & Co., Samarqand v., Rudakiy ko'chasi 45"
                      className="w-full pl-3.5 pr-28 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#211b2e]"
                    />

                    {/* Quick Search and Clear Action Buttons inside input */}
                    <div className="absolute right-1.5 flex items-center gap-1">
                      {formAddress && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormAddress("");
                            setSearchResults([]);
                            setShowResultsDropdown(false);
                            setSearchFeedback("");
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => searchLocation(formAddress, true)}
                        disabled={isSearchingLocation}
                        className="px-2.5 py-1.5 rounded-lg bg-[#211b2e] text-[#c8ff6a] hover:bg-black text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title={t("search_on_map") || "Xaritadan qidirish"}
                      >
                        {isSearchingLocation ? (
                          <Loader2 className="w-3 h-3 text-[#c8ff6a] animate-spin" />
                        ) : (
                          <Search className="w-3 h-3 text-[#c8ff6a]" />
                        )}
                        <span>{t("search_on_map") || "Qidirish"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Feedback / Error */}
                  {searchFeedback && (
                    <div className="text-[10px] font-semibold text-emerald-600 mt-1">
                      {searchFeedback}
                    </div>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {showResultsDropdown && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Topilgan joylar ({searchResults.length})</span>
                        <button
                          type="button"
                          onClick={() => setShowResultsDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="max-h-52 overflow-y-auto">
                        {searchResults.map((res, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectSearchResult(res)}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[#211b2e]/5 flex items-start gap-2.5 transition-colors cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-xl bg-[#211b2e] text-[#c8ff6a] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#211b2e]">
                                {res.name}
                              </div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {res.address}
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                                {res.lat.toFixed(4)}, {res.lng.toFixed(4)}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold font-mono focus:outline-none focus:border-[#211b2e]"
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
                    className="px-2.5 py-1.5 rounded-xl bg-[#211b2e] text-[#c8ff6a] hover:bg-black text-[11px] font-bold border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>{t("locate_me") || "Joylashuvim"}</span>
                  </button>
                </div>

                {/* Leaflet interactive map */}
                <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner z-0">
                  <MapContainer
                    center={pickerPosition}
                    zoom={mapPickerZoom}
                    style={{ width: "100%", height: "100%" }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapPickerEvents
                      position={pickerPosition}
                      targetZoom={mapPickerZoom}
                      onPositionChange={handlePickerPositionChange}
                    />
                  </MapContainer>
                  <div className="absolute bottom-2 left-2 z-[400] bg-[#211b2e]/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#c8ff6a] shadow-xs border border-white/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#c8ff6a]" />
                    <span>
                      {parseFloat(formLat).toFixed(4)}, {parseFloat(formLng).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Detected reverse-geocoded address prompt */}
                {detectedAddress && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#211b2e]/[0.04] border border-[#211b2e]/10 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 min-w-0 pr-2">
                      <MapPin className="w-3.5 h-3.5 text-[#211b2e] shrink-0" />
                      <span className="truncate text-[11px] font-medium">{detectedAddress}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormAddress(detectedAddress);
                        setSearchFeedback(`📍 ${detectedAddress}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#211b2e] text-[#c8ff6a] hover:bg-black text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      {t("use_this_address") || "Manzilni qo'yish"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Latitude (Lat)</label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="39.6843"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:border-[#211b2e]"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold focus:outline-none focus:border-[#211b2e]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#211b2e]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#211b2e]"
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
                    className="w-4 h-4 rounded-md text-[#211b2e] focus:ring-[#211b2e]"
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
                    className="w-4 h-4 rounded-md text-[#211b2e] focus:ring-[#211b2e]"
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
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("cancel") || "Bekor qilish"}
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
