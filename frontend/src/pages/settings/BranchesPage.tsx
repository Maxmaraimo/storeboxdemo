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
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  Calendar
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
          ? '<div style="position: absolute; top: -6px; right: -6px; background: #2563eb; color: #ffffff; border: 1.5px solid white; border-radius: 9999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">★</div>'
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
    <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(37, 99, 235, 0.25); animation: pulse 1.8s infinite;"></div>
    <div style="width: 38px; height: 38px; border-radius: 50%; background: #2563eb; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
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

// Uzbekistan phone formatter: strictly numbers only, formats as +998 (XX) XXX-XX-XX
export const formatUzPhone = (value: string): string => {
  if (!value) return "";
  const digitsOnly = value.replace(/\D/g, "");
  let digits = digitsOnly;
  if (digits.startsWith("998")) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (!digits) return "";

  let res = "+998";
  if (digits.length > 0) {
    res += ` (${digits.slice(0, 2)}`;
  }
  if (digits.length >= 2) {
    res += `) ${digits.slice(2, 5)}`;
  }
  if (digits.length >= 5) {
    res += `-${digits.slice(5, 7)}`;
  }
  if (digits.length >= 7) {
    res += `-${digits.slice(7, 9)}`;
  }
  return res;
};

export const DAYS_OF_WEEK = [
  { key: "mon", labelKey: "day_mon", shortUz: "Dush", shortRu: "Пн", shortEn: "Mon" },
  { key: "tue", labelKey: "day_tue", shortUz: "Sesh", shortRu: "Вт", shortEn: "Tue" },
  { key: "wed", labelKey: "day_wed", shortUz: "Chor", shortRu: "Ср", shortEn: "Wed" },
  { key: "thu", labelKey: "day_thu", shortUz: "Pay", shortRu: "Чт", shortEn: "Thu" },
  { key: "fri", labelKey: "day_fri", shortUz: "Jum", shortRu: "Пт", shortEn: "Fri" },
  { key: "sat", labelKey: "day_sat", shortUz: "Shan", shortRu: "Сб", shortEn: "Sat" },
  { key: "sun", labelKey: "day_sun", shortUz: "Yak", shortRu: "Вс", shortEn: "Sun" },
];

export const DEFAULT_WEEKLY_SCHEDULE: Record<string, { open: string; close: string; closed: boolean }> = {
  mon: { open: "09:00", close: "23:00", closed: false },
  tue: { open: "09:00", close: "23:00", closed: false },
  wed: { open: "09:00", close: "23:00", closed: false },
  thu: { open: "09:00", close: "23:00", closed: false },
  fri: { open: "09:00", close: "23:00", closed: false },
  sat: { open: "09:00", close: "23:00", closed: false },
  sun: { open: "09:00", close: "23:00", closed: false },
};

export const getTodayScheduleSummary = (
  b: BranchItem,
  t: (key: string) => string
): { text: string; isOpenNow: boolean; isDayOff: boolean } => {
  const weekdayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const todayKey = weekdayKeys[new Date().getDay()];
  const sched = b.working_schedule;

  if (b.is_accepting_orders === false) {
    return { text: t("branch_closed_status") || "Yopiq", isOpenNow: false, isDayOff: false };
  }

  if (sched && sched[todayKey]) {
    const day = sched[todayKey];
    if (day.closed) {
      return { text: t("day_off") || "Dam olish kuni", isOpenNow: false, isDayOff: true };
    }
    const now = new Date();
    const [openH, openM] = (day.open || "09:00").split(":").map(Number);
    const [closeH, closeM] = (day.close || "23:00").split(":").map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const openMin = openH * 60 + (openM || 0);
    const closeMin = closeH * 60 + (closeM || 0);
    const isOpenNow = nowMin >= openMin && nowMin <= closeMin;

    return {
      text: `${day.open} — ${day.close}`,
      isOpenNow,
      isDayOff: false,
    };
  }

  return {
    text: b.working_hours || "09:00 — 23:00",
    isOpenNow: true,
    isDayOff: false,
  };
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [usePhoneAsLogin, setUsePhoneAsLogin] = useState(true);
  const [scheduleMode, setScheduleMode] = useState<"daily" | "247" | "custom">("daily");
  const [dailyOpenTime, setDailyOpenTime] = useState("09:00");
  const [dailyCloseTime, setDailyCloseTime] = useState("23:00");
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, { open: string; close: string; closed: boolean }>>({ ...DEFAULT_WEEKLY_SCHEDULE });
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

      let finalLogin = formManagerUsername.trim();
      if (usePhoneAsLogin) {
        finalLogin = formPhone.trim();
      }

      if (!editingBranch && finalLogin && (!formManagerPassword || formManagerPassword.length < 4)) {
        throw new Error(t("branch_password_error") || "Filial akkaunti uchun parol kamida 4 belgidan iborat bo'lishi kerak");
      }

      let workingHoursStr = "";
      let workingSchedObj: Record<string, { open: string; close: string; closed: boolean }> = {};

      if (scheduleMode === "247") {
        workingHoursStr = "24/7";
        DAYS_OF_WEEK.forEach((d) => {
          workingSchedObj[d.key] = { open: "00:00", close: "23:59", closed: false };
        });
      } else if (scheduleMode === "daily") {
        workingHoursStr = `${dailyOpenTime} — ${dailyCloseTime}`;
        DAYS_OF_WEEK.forEach((d) => {
          workingSchedObj[d.key] = { open: dailyOpenTime, close: dailyCloseTime, closed: false };
        });
      } else {
        workingSchedObj = { ...weeklySchedule };
        const openDays = DAYS_OF_WEEK.filter((d) => !weeklySchedule[d.key]?.closed);
        if (openDays.length === 0) {
          workingHoursStr = t("day_off") || "Dam olish";
        } else if (openDays.length === 7) {
          const first = weeklySchedule.mon;
          const allSame = DAYS_OF_WEEK.every(
            (d) => weeklySchedule[d.key]?.open === first.open && weeklySchedule[d.key]?.close === first.close
          );
          workingHoursStr = allSame ? `${first.open} — ${first.close}` : "Har xil vaqtda";
        } else {
          workingHoursStr = openDays.map((d) => d.shortUz).join(", ");
        }
      }

      const payload: any = {
        name: formName.trim(),
        address: formAddress.trim(),
        phone: formPhone.trim(),
        latitude: latNum,
        longitude: lngNum,
        working_hours: workingHoursStr,
        working_schedule: workingSchedObj,
        is_main: formIsMain,
        is_accepting_orders: formIsAcceptingOrders,
      };

      if (finalLogin) {
        payload.manager_username = finalLogin;
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
    setUsePhoneAsLogin(true);
    setShowPassword(false);
    setScheduleMode("daily");
    setDailyOpenTime("09:00");
    setDailyCloseTime("23:00");
    setWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
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
    const formattedPhone = b.phone ? formatUzPhone(b.phone) : "";
    setFormPhone(formattedPhone);
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

    // Populate Working Schedule
    if (b.working_schedule && Object.keys(b.working_schedule).length > 0) {
      const sched = { ...DEFAULT_WEEKLY_SCHEDULE, ...b.working_schedule };
      setWeeklySchedule(sched);
      const is247 = DAYS_OF_WEEK.every((d) => {
        const s = sched[d.key];
        return s && !s.closed && s.open === "00:00" && (s.close === "23:59" || s.close === "24:00");
      });
      if (is247 || b.working_hours === "24/7") {
        setScheduleMode("247");
      } else {
        const first = sched.mon;
        const allSame = first && !first.closed && DAYS_OF_WEEK.every((d) => {
          const s = sched[d.key];
          return s && !s.closed && s.open === first.open && s.close === first.close;
        });
        if (allSame) {
          setScheduleMode("daily");
          setDailyOpenTime(first.open || "09:00");
          setDailyCloseTime(first.close || "23:00");
        } else {
          setScheduleMode("custom");
        }
      }
    } else if (b.working_hours) {
      if (b.working_hours === "24/7") {
        setScheduleMode("247");
      } else {
        const parts = b.working_hours.split(/[—\-–]/);
        if (parts.length === 2 && parts[0].trim().includes(":") && parts[1].trim().includes(":")) {
          const op = parts[0].trim();
          const cl = parts[1].trim();
          setScheduleMode("daily");
          setDailyOpenTime(op);
          setDailyCloseTime(cl);
          const newSched: Record<string, { open: string; close: string; closed: boolean }> = {};
          DAYS_OF_WEEK.forEach((d) => {
            newSched[d.key] = { open: op, close: cl, closed: false };
          });
          setWeeklySchedule(newSched);
        } else {
          setScheduleMode("daily");
          setDailyOpenTime("09:00");
          setDailyCloseTime("23:00");
          setWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
        }
      }
    } else {
      setScheduleMode("daily");
      setDailyOpenTime("09:00");
      setDailyCloseTime("23:00");
      setWeeklySchedule(DEFAULT_WEEKLY_SCHEDULE);
    }

    const uname = b.manager_username || "";
    setFormManagerUsername(uname);
    const cleanPhoneDigits = (b.phone || "").replace(/\D/g, "");
    const cleanUnameDigits = uname.replace(/\D/g, "");
    const isSamePhone = Boolean(uname && (uname === b.phone || (cleanPhoneDigits && cleanUnameDigits === cleanPhoneDigits)));
    setUsePhoneAsLogin(isSamePhone || !uname);
    setFormManagerPassword("");
    setShowPassword(false);
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{t("view_map") || "Xaritada"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
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
                          <div className="font-semibold text-sm text-slate-900 leading-tight">
                            {b.name}
                          </div>
                          {b.is_main && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
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
            const todaySched = getTodayScheduleSummary(b, t);
            const isCurrentlyOpen = b.is_currently_open !== false && todaySched.isOpenNow;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBranch(b)}
                className="group relative bg-white rounded-xl border border-slate-200/80 p-5 space-y-3.5 transition-all duration-150 hover:shadow-xs hover:border-slate-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Top: Status Pill + Actions & Switch */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight ${
                          !isAccepting
                            ? "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10"
                            : !isCurrentlyOpen
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            !isAccepting
                              ? "bg-slate-400"
                              : !isCurrentlyOpen
                              ? "bg-amber-500"
                              : "bg-emerald-500 animate-pulse"
                          }`}
                        />
                        <span>
                          {!isAccepting
                            ? (t("branch_closed_status") || "Yopiq")
                            : !isCurrentlyOpen
                            ? (t("branch_now_closed") || "Hozir yopiq")
                            : (t("branch_open_status") || "Ochiq")}
                        </span>
                      </span>

                      {b.is_main && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
                          ★ {t("is_main_branch") || "Asosiy"}
                        </span>
                      )}
                    </div>

                    {/* Top-Right: iOS Toggle Switch + Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Interactive iOS Switch */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOrdersMutation.mutate({
                            id: b.id,
                            is_accepting_orders: !isAccepting,
                          });
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isAccepting ? "bg-blue-600" : "bg-slate-300 dark:bg-zinc-700"
                        }`}
                        title={isAccepting ? (t("branch_action_close") || "Yopish") : (t("branch_action_open") || "Ochish")}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isAccepting ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>

                      <div className="h-4 w-[1px] bg-slate-200 dark:bg-white/10 mx-0.5" />

                      <button
                        type="button"
                        title={t("branch_view_full") || "To'liq ko'rish"}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBranch(b);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title={t("edit_branch_btn") || "Tahrirlash"}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(b);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Branch Name */}
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {b.name}
                    </h2>
                  </div>

                  {/* Working Hours Badge */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-xs">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 line-clamp-1">
                      {t("today_schedule") || "Bugun"}: {todaySched.text}
                    </span>
                  </div>

                  {/* Location & Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-relaxed">{b.address}</span>
                    </div>
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <a
                          href={`tel:${b.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono font-bold hover:text-brand"
                        >
                          {formatUzPhone(b.phone) || b.phone}
                        </a>
                      </div>
                    )}
                    {b.latitude && b.longitude ? (
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                          <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
                          className="text-[10px] text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{t("branch_pick_on_map") || "Xaritada"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Koordinata belgilanmagan</span>
                      </div>
                    )}
                  </div>

                  {/* Manager Login Info Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t("branch_login_title") || "Filial hisobi"}</span>
                      </div>
                      {b.orders_count !== undefined && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md text-[10px]">
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>
                            {b.orders_count} {t("orders_count_label") || "buyurtma"}
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-slate-500 text-[11px]">{t("branch_login_label") || "Login"}:</span>
                      <span className="font-mono font-medium text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-xs">
                        {b.manager_username ? (formatUzPhone(b.manager_username) || b.manager_username) : (b as any).manager_user?.username ? (formatUzPhone((b as any).manager_user?.username) || (b as any).manager_user?.username) : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Clickable hint */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
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
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
                      {selectedBranch.name}
                    </h3>
                    {selectedBranch.is_main && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
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
                      {formatUzPhone(selectedBranch.phone) || selectedBranch.phone}
                    </a>
                    <a
                      href={`tel:${selectedBranch.phone}`}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-medium transition-colors"
                    >
                      {t("call_customer") || "Qo'ng'iroq"}
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Telefon kiritilmagan</div>
                )}
              </div>

              {/* Box 3: Manager Credentials */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t("branch_login_title") || "Filial kirish hisobi"}</span>
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-600 text-xs">{t("branch_login_label") || "Login"}:</span>
                  <span className="font-mono font-medium text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-xs">
                    {selectedBranch.manager_username ? (formatUzPhone(selectedBranch.manager_username) || selectedBranch.manager_username) : (selectedBranch as any).manager_user?.username ? (formatUzPhone((selectedBranch as any).manager_user?.username) || (selectedBranch as any).manager_user?.username) : "—"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {t("branch_restricted_badge") || "Menejer faqat shu filial buyurtmalarini ko'radi"}
                </div>
              </div>

              {/* Box 4: Orders Statistics */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t("orders") || "Buyurtmalar"}</span>
                  </div>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium px-2 py-0.5 rounded-md">
                    {selectedBranch.orders_count || 0} {t("orders_count_label") || "buyurtma"}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Ushbu filialga biriktirilgan jami buyurtmalar soni
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/orders?branch=${selectedBranch.id}`)}
                  className="w-full text-center py-1.5 mt-1 rounded-lg bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  {t("branch_orders_btn") || "Buyurtmalarni ko'rish →"}
                </button>
              </div>
            </div>

            {/* Box 5: Full 7-Day Working Schedule */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase font-semibold text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t("branch_schedule_title") || "Haftalik ish jadvali (Dush — Yak)"}</span>
                </div>
                <div className="text-[11px] font-medium text-slate-900">
                  {selectedBranch.working_hours || "09:00 — 23:00"}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-1">
                {DAYS_OF_WEEK.map((d) => {
                  const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                  const todayKey = dayNames[new Date().getDay()];
                  const isToday = d.key === todayKey;
                  const daySched = selectedBranch.working_schedule?.[d.key];
                  const isClosed = daySched ? daySched.closed : false;
                  const timeText = daySched
                    ? isClosed
                      ? (t("day_off") || "Dam olish")
                      : `${daySched.open} - ${daySched.close}`
                    : selectedBranch.working_hours || "09:00 - 23:00";

                  return (
                    <div
                      key={d.key}
                      className={`p-2 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                        isToday
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                          : "bg-white text-slate-700 border border-slate-200/60"
                      }`}
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-wider">
                        {t(d.labelKey) || d.shortUz}
                      </div>
                      <div
                        className={`text-[10px] font-medium mt-1 ${
                          isClosed
                            ? isToday ? "text-rose-600" : "text-rose-500"
                            : isToday ? "text-blue-700" : "text-slate-900"
                        }`}
                      >
                        {timeText}
                      </div>
                      {isToday && (
                        <span className="text-[8px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">
                          {t("today_schedule") || "Bugun"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBranch(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                  className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                >
                  {t("edit_branch_btn") || "Tahrirlash"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders?branch=${selectedBranch.id}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
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
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingBranch
                    ? (t("edit_branch_btn") || "Filialni tahrirlash")
                    : (t("add_branch_btn") || "Yangi filial qo'shish")}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              {/* Section 1: Basic Info */}
              <div className="space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {t("basic_info_title") || "Asosiy ma'lumotlar"}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {t("branch_name_label") || "Filial nomi"} *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Burger & Co. — Samarqand Vokzal"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                {/* ADDRESS WITH REAL-TIME MAP SEARCH & AUTOCOMPLETE */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
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
                      className="w-full pl-3.5 pr-28 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-normal focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
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
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => searchLocation(formAddress, true)}
                        disabled={isSearchingLocation}
                        className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title={t("search_on_map") || "Xaritadan qidirish"}
                      >
                        {isSearchingLocation ? (
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <Search className="w-3 h-3 text-white" />
                        )}
                        <span>{t("search_on_map") || "Qidirish"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Feedback / Error */}
                  {searchFeedback && (
                    <div className="text-[10px] font-medium text-emerald-600 mt-1">
                      {searchFeedback}
                    </div>
                  )}

                  {/* Autocomplete Suggestions Dropdown */}
                  {showResultsDropdown && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
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
                            className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 transition-colors cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                              <MapPin className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-slate-900 line-clamp-1 group-hover:text-blue-600">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      {t("branch_phone_label") || "Telefon raqami"}
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      +998 (XX) XXX-XX-XX
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formPhone}
                      onChange={(e) => {
                        const formatted = formatUzPhone(e.target.value);
                        setFormPhone(formatted);
                        if (usePhoneAsLogin) {
                          setFormManagerUsername(formatted);
                        }
                      }}
                      placeholder="+998 (90) 123-45-67"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium font-mono text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t("branch_phone_hint") || "Faqat raqamlar kiritiladi, mijozlar va buyurtmalar uchun aloqa raqami"}
                  </p>
                </div>
              </div>

              {/* Section: Working Schedule (Ish vaqti / График работы) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("working_hours_label") || "Ish vaqti (Dush — Yak)"}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Faqat shu vaqtlarda filial ochiq bo'ladi va yangi buyurtmalarni qabul qiladi
                    </p>
                  </div>
                </div>

                {/* 3 Preset Mode Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("daily")}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      scheduleMode === "daily"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="truncate">{t("working_hours_preset_daily") || "Har kuni"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("247")}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      scheduleMode === "247"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="truncate">{t("working_hours_preset_247") || "24/7"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("custom")}
                    className={`py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      scheduleMode === "custom"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span className="truncate">{t("working_hours_custom_days") || "Kunlar bo'yicha"}</span>
                  </button>
                </div>

                {/* Mode 1: Daily */}
                {scheduleMode === "daily" && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          {t("open_time") || "Ochilish vaqti"}
                        </label>
                        <input
                          type="time"
                          value={dailyOpenTime}
                          onChange={(e) => setDailyOpenTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {t("close_time") || "Yopilish vaqti"}
                        </label>
                        <input
                          type="time"
                          value={dailyCloseTime}
                          onChange={(e) => setDailyCloseTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium mr-1">Shablonlar:</span>
                      {[
                        { label: "08:00 — 22:00", open: "08:00", close: "22:00" },
                        { label: "09:00 — 23:00", open: "09:00", close: "23:00" },
                        { label: "10:00 — 00:00", open: "10:00", close: "00:00" },
                        { label: "10:00 — 02:00", open: "10:00", close: "02:00" },
                      ].map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setDailyOpenTime(p.open);
                            setDailyCloseTime(p.close);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                            dailyOpenTime === p.open && dailyCloseTime === p.close
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 2: 24/7 */}
                {scheduleMode === "247" && (
                  <div className="p-3.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/60 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-blue-900">24/7 Kechayu-kunduz rejim</div>
                      <div className="text-[11px] text-blue-700/80 mt-0.5">
                        Filial haftaning barcha 7 kunida to'xtovsiz ishlaydi va har qanday vaqtda buyurtmalarni qabul qiladi
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: Custom by Day */}
                {scheduleMode === "custom" && (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 max-h-60 overflow-y-auto">
                    {DAYS_OF_WEEK.map((d) => {
                      const cur = weeklySchedule[d.key] || { open: "09:00", close: "23:00", closed: false };
                      return (
                        <div
                          key={d.key}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <input
                              type="checkbox"
                              id={`day_check_${d.key}`}
                              checked={!cur.closed}
                              onChange={(e) => {
                                const isClosed = !e.target.checked;
                                setWeeklySchedule((prev) => ({
                                  ...prev,
                                  [d.key]: { ...prev[d.key], closed: isClosed },
                                }));
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                            />
                            <label
                              htmlFor={`day_check_${d.key}`}
                              className="font-medium text-slate-800 cursor-pointer select-none"
                            >
                              {t(d.labelKey) || d.shortUz}
                            </label>
                          </div>

                          {!cur.closed ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="time"
                                value={cur.open}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWeeklySchedule((prev) => ({
                                    ...prev,
                                    [d.key]: { ...prev[d.key], open: val },
                                  }));
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                              />
                              <span className="text-slate-400 font-medium text-[10px]">—</span>
                              <input
                                type="time"
                                value={cur.close}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWeeklySchedule((prev) => ({
                                    ...prev,
                                    [d.key]: { ...prev[d.key], close: val },
                                  }));
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                              />
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-medium text-[10px] border border-rose-200/80">
                              {t("day_off") || "Dam olish kuni"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Interactive Map Picker & Coordinates */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
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
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>{t("locate_me") || "Joylashuvim"}</span>
                  </button>
                </div>

                {/* Leaflet interactive map */}
                <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 relative shadow-inner z-0">
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
                  <div className="absolute bottom-2 left-2 z-[400] bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-medium text-white shadow-xs border border-white/10 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>
                      {parseFloat(formLat).toFixed(4)}, {parseFloat(formLng).toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Detected reverse-geocoded address prompt */}
                {detectedAddress && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 min-w-0 pr-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate text-[11px] font-medium">{detectedAddress}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormAddress(detectedAddress);
                        setSearchFeedback(`📍 ${detectedAddress}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-medium shrink-0 transition-colors cursor-pointer"
                    >
                      {t("use_this_address") || "Manzilni qo'yish"}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Latitude (Lat)</label>
                    <input
                      type="number"
                      step="any"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      placeholder="39.6843"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Longitude (Lng)</label>
                    <input
                      type="number"
                      step="any"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      placeholder="66.9272"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 italic">
                  {t("coordinates_saved_hint") ||
                    "Ushbu koordinatalar mijoz buyurtmasini eng yaqin filialga avtomatik yo'naltirish uchun saqlanadi."}
                </div>
              </div>

              {/* Section 3: Manager Credentials */}
              <div className="pt-3 border-t border-slate-100">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t("branch_login_title") || "Filial kirish hisobi (Dashboard)"}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {t("branch_login_desc") ||
                          "Menejer ushbu login va parol bilan tizimga kirib, faqat o'z filialining buyurtmalarini ko'radi"}
                      </p>
                    </div>
                  </div>

                  {/* Option: Use branch phone as login */}
                  <div className="flex items-center gap-2 pt-0.5 pb-0.5">
                    <input
                      type="checkbox"
                      id="use_phone_as_login"
                      checked={usePhoneAsLogin}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setUsePhoneAsLogin(checked);
                        if (checked && formPhone) {
                          setFormManagerUsername(formPhone);
                        }
                      }}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                    <label
                      htmlFor="use_phone_as_login"
                      className="text-xs font-medium text-slate-700 cursor-pointer select-none"
                    >
                      {t("use_phone_as_login_label") || "Filial telefonini login sifatida ishlatish"}
                    </label>
                  </div>

                  {/* Login input */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      {t("branch_login_label") || "Login (Foydalanuvchi nomi)"} *
                    </label>
                    <input
                      type="text"
                      disabled={usePhoneAsLogin}
                      value={usePhoneAsLogin ? (formPhone || t("branch_phone_label") || "Filial telefoni") : formManagerUsername}
                      onChange={(e) => setFormManagerUsername(e.target.value.trim())}
                      placeholder={usePhoneAsLogin ? "+998 (90) 123-45-67" : "filial_vokzal"}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium transition-all focus:outline-none ${
                        usePhoneAsLogin
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                      }`}
                    />
                    {usePhoneAsLogin && (
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        💡 {t("login_synced_with_phone_hint") || "Login yuqoridagi filial telefoni bilan avtomatik bog'langan"}
                      </span>
                    )}
                  </div>

                  {/* Password input with show/hide and generator */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-slate-700">
                        {t("branch_password_label") || "Parol"} *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const randPin = String(Math.floor(100000 + Math.random() * 900000));
                          setFormManagerPassword(randPin);
                          setShowPassword(true);
                        }}
                        className="text-[10px] font-medium text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>{t("generate_pin") || "PIN generatsiya"}</span>
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formManagerPassword}
                        onChange={(e) => setFormManagerPassword(e.target.value)}
                        placeholder={
                          editingBranch
                            ? (t("branch_password_hint") || "O'zgartirmaslik uchun bo'sh qoldiring")
                            : "Masalan: 123456 yoki yangi parol"
                        }
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title={showPassword ? "Yashirish" : "Ko'rsatish"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {editingBranch && (
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {t("branch_password_hint") || "O'zgartirmaslik uchun bo'sh qoldiring"}
                      </span>
                    )}
                  </div>
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
                    className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="is_accepting_orders" className="text-xs font-medium text-slate-700 cursor-pointer">
                    {t("branch_toggle_orders") || "Buyurtmalarni qabul qilish (Ochiq)"}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_main_branch"
                    checked={formIsMain}
                    onChange={(e) => setFormIsMain(e.target.checked)}
                    className="w-4 h-4 rounded-md text-blue-600 focus:ring-blue-600"
                  />
                  <label htmlFor="is_main_branch" className="text-xs font-medium text-slate-700 cursor-pointer">
                    {t("is_main_branch") || "Asosiy filial sifatida belgilash"}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                {t("cancel") || "Bekor qilish"}
              </button>
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
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
