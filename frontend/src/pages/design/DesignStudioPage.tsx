import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Palette,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ExternalLink,
  Monitor,
  Smartphone,
  LayoutGrid,
  Menu,
  Square,
  CheckSquare,
  Image as ImageIcon,
  Check,
  Save,
  Upload,
  Trash2,
  Camera,
  Store,
  Layers,
  ShoppingBag,
  SlidersHorizontal
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface NicheItem {
  id: string;
  name: string;
  name_ru?: string;
  emoji: string;
  primary_color?: string;
  bg_color?: string;
  card_style?: string;
  banner_images?: string[];
  titles?: Record<string, string>;
  subtitles?: Record<string, string>;
}

interface BannerData {
  title: string;
  subtitle: string;
  image_url: string;
}

interface ThemeSettings {
  primary_color: string;
  theme_bg_color: string;
  theme_card_style: string;
  theme_card_radius: string;
  theme_image_aspect: string;
  theme_button_style: string;
  theme_business_niche: string;
  logo_url?: string;
  banner: BannerData;
  store_name: string;
  subdomain: string;
  storefront_url: string;
  niches: NicheItem[];
}

export const DesignStudioPage: React.FC = () => {
  const { store } = useAuth();
  const queryClient = useQueryClient();

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Active settings state
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("flowers");
  const [customPrompt, setCustomPrompt] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#10B981");
  const [themeBgColor, setThemeBgColor] = useState("#F8FAFC");
  const [cardStyle, setCardStyle] = useState("modern");
  const [cardRadius, setCardRadius] = useState("3xl");
  const [imageAspect, setImageAspect] = useState("portrait");
  const [buttonStyle, setButtonStyle] = useState("solid");
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [generateCatalog, setGenerateCatalog] = useState(false);

  // UI state
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [applyingNiche, setApplyingNiche] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick palettes
  const quickColors = [
    "#10B981", // Emerald
    "#2563EB", // Royal Blue
    "#EC4899", // Pink
    "#8B5CF6", // Purple
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#0F172A", // Dark Slate
  ];

  const bgColors = [
    { name: "Slate", value: "#F8FAFC" },
    { name: "Oq", value: "#FFFFFF" },
    { name: "Krem", value: "#FEF9C3" },
    { name: "Pushti", value: "#FDF8F9" },
    { name: "Qorong'i", value: "#0F172A" },
  ];

  // 1. Fetch current theme settings
  const { data: themeData, isLoading } = useQuery<ThemeSettings>({
    queryKey: ["design-theme"],
    queryFn: async () => {
      const res = await api.get("/design/theme/");
      return res.data;
    },
  });

  // Sync state once data loads
  useEffect(() => {
    if (themeData) {
      setStoreName(themeData.store_name || store?.name || "");
      setLogoUrl(themeData.logo_url || "");
      setPrimaryColor(themeData.primary_color || "#10B981");
      setThemeBgColor(themeData.theme_bg_color || "#F8FAFC");
      setCardStyle(themeData.theme_card_style || "modern");
      setCardRadius(themeData.theme_card_radius || "3xl");
      setImageAspect(themeData.theme_image_aspect || "portrait");
      setButtonStyle(themeData.theme_button_style || "solid");
      setSelectedNiche(themeData.theme_business_niche || "flowers");
      if (themeData.banner) {
        setBannerTitle(themeData.banner.title || "");
        setBannerSubtitle(themeData.banner.subtitle || "");
        setBannerImageUrl(themeData.banner.image_url || "");
      }
    }
  }, [themeData, store]);

  // Current active niche object
  const nichesList = themeData?.niches || [
    { id: "flowers", name: "Gullar va sovg'alar", emoji: "🌸" },
    { id: "restaurant", name: "Restoran va Kafe", emoji: "🍽️" },
    { id: "cosmetics", name: "Kosmetika va Parfyum", emoji: "💄" },
    { id: "clothes", name: "Kiyim va Moda", emoji: "👗" },
    { id: "electronics", name: "Elektronika va Gadjet", emoji: "📱" },
    { id: "sweets", name: "Shirinliklar va Tortlar", emoji: "🧁" },
    { id: "books", name: "Kitoblar va Kanselyariya", emoji: "📚" },
    { id: "auto", name: "Avtomobil jihozlari", emoji: "🚗" },
  ];

  const currentNicheObj = nichesList.find((n) => n.id === selectedNiche) || nichesList[0];

  // 2. Select niche & ask AI for suggestion
  const handleSelectNiche = async (nicheId: string, promptText = "") => {
    setSelectedNiche(nicheId);
    setMsg(null);
    try {
      const res = await api.post("/design/ai-suggest/", {
        niche: nicheId,
        custom_prompt: promptText
      });
      const ai = res.data;
      if (ai) {
        if (ai.primary_color) setPrimaryColor(ai.primary_color);
        if (ai.bg_color) setThemeBgColor(ai.bg_color);
        if (ai.card_style) setCardStyle(ai.card_style);
        if (ai.image_aspect) setImageAspect(ai.image_aspect);
        if (ai.button_style) setButtonStyle(ai.button_style);
        if (ai.banner_images && ai.banner_images.length > 0) {
          setBannerImageUrl(ai.banner_images[0]);
        }
        if (ai.titles && ai.titles.uz) {
          setBannerTitle(ai.titles.uz.replace("{store_name}", storeName || store?.name || "Do'kon"));
        }
        if (ai.subtitles && ai.subtitles.uz) {
          setBannerSubtitle(ai.subtitles.uz);
        }
      }
      setPreviewKey(Date.now());
    } catch (e) {
      console.error("AI Suggestion error:", e);
    }
  };

  // 3. Logo Upload Handler
  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMsg(null);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await api.post("/design/logo/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setLogoUrl(res.data.logo_url);
        setMsg({ type: "success", text: "Logotip muvaffaqiyatli yuklandi!" });
        queryClient.invalidateQueries({ queryKey: ["design-theme"] });
        setPreviewKey(Date.now());
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Logotip yuklashda xatolik yuz berdi." });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // 4. Logo Delete Handler
  const handleLogoDelete = async () => {
    if (!window.confirm("Rostdan ham logotipni o'chirmoqchimisiz?")) return;
    try {
      await api.post("/design/logo/delete/");
      setLogoUrl("");
      setMsg({ type: "success", text: "Logotip olib tashlandi." });
      queryClient.invalidateQueries({ queryKey: ["design-theme"] });
      setPreviewKey(Date.now());
    } catch (err: any) {
      setMsg({ type: "error", text: "Logotipni o'chirishda xatolik." });
    }
  };

  // 5. Custom Banner File Upload Handler
  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setMsg(null);
    const formData = new FormData();
    formData.append("banner_file", file);

    try {
      const res = await api.post("/design/banner/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data?.success) {
        setBannerImageUrl(res.data.image_url);
        setMsg({ type: "success", text: "Yangi banner muvaffaqiyatli yuklandi!" });
        queryClient.invalidateQueries({ queryKey: ["design-theme"] });
        setPreviewKey(Date.now());
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Banner yuklashda xatolik yuz berdi." });
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  // 6. Apply full niche catalog to store
  const handleApplyNicheCatalog = async () => {
    if (!window.confirm("Tanlangan nishaga mos barcha tovarlar va fotosuratlar do'konga yuklansinmi?")) return;
    setApplyingNiche(true);
    setMsg(null);
    try {
      const res = await api.post("/design/apply-niche/", {
        niche: selectedNiche,
        custom_prompt: customPrompt
      });
      if (res.data?.status === "ok") {
        setMsg({
          type: "success",
          text: `Muvaffaqiyatli! ${res.data.products_count} ta tovar va banner do'konga o'rnatildi.`
        });
        queryClient.invalidateQueries({ queryKey: ["design-theme"] });
        queryClient.invalidateQueries({ queryKey: ["products-list"] });
        queryClient.invalidateQueries({ queryKey: ["categories-list"] });
        setPreviewKey(Date.now());
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Katalogni o'rnatishda xatolik yuz berdi." });
    } finally {
      setApplyingNiche(false);
    }
  };

  // 7. Save Theme Settings
  const handleSaveTheme = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.post("/design/theme/save/", {
        store_name: storeName,
        primary_color: primaryColor,
        theme_bg_color: themeBgColor,
        theme_card_style: cardStyle,
        theme_card_radius: cardRadius,
        theme_image_aspect: imageAspect,
        theme_button_style: buttonStyle,
        theme_business_niche: selectedNiche,
        banner_title: bannerTitle,
        banner_subtitle: bannerSubtitle,
        banner_image_url: bannerImageUrl,
        generate_catalog: generateCatalog
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: "Dizayn va ranglar muvaffaqiyatli saqlandi va saytga qo'llandi!" });
        queryClient.invalidateQueries({ queryKey: ["design-theme"] });
        setPreviewKey(Date.now());
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Saqlashda xatolik yuz berdi." });
    } finally {
      setSaving(false);
    }
  };

  // Build live preview URL
  const subdomain = store?.subdomain || themeData?.subdomain || "demo";
  const previewParams = new URLSearchParams({
    preview: "1",
    primary_color: primaryColor,
    card_style: cardStyle,
    card_radius: cardRadius,
    bg_color: themeBgColor,
    image_aspect: imageAspect,
    button_style: buttonStyle,
    preview_niche: selectedNiche,
    preview_banner_title: bannerTitle,
    preview_banner_subtitle: bannerSubtitle,
    preview_banner_image: bannerImageUrl,
    force_preview: "1",
    _t: String(previewKey)
  });
  const previewUrl = `/store/${subdomain}/?${previewParams.toString()}`;

  return (
    <div className="space-y-6">
      {/* HIDDEN FILE INPUTS */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoFileChange}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />
      <input
        type="file"
        ref={bannerInputRef}
        onChange={handleBannerFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* HEADER WITH ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-brand" />
            <span>Dizayn & Sun'iy Intellekt Studio</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
              AI 2.0
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Do'koningiz brendi, logotipi, ranglar palitrasi va bannerlarini sozlang. Barcha o'zgarishlar real vaqtda yangilanadi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/store/${subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Jonli saytni ochish</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <button
            type="button"
            onClick={() => handleSaveTheme()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-black flex items-center gap-2 shadow-md shadow-brand/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saqlanmoqda..." : "Saqlash va qo'llash"}</span>
          </button>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-2xs ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTROLS & SECTIONS */}
        <div className="xl:col-span-6 space-y-6">

          {/* 1. BRAND IDENTITY & LOGO SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-brand" />
                <h3 className="font-black text-sm text-slate-900">Do'kon nomi va Logotipi</h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">https://{subdomain}.storebox.uz</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Logo Preview & Uploader */}
              <div className="sm:col-span-4 flex flex-col items-center text-center">
                <div className="relative group w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand bg-slate-50 flex items-center justify-center overflow-hidden transition-all shadow-inner">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-slate-400">
                      <Camera className="w-6 h-6" />
                      <span className="text-[9px] font-bold">Logotip yo'q</span>
                    </div>
                  )}

                  {/* Hover overlay button */}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute inset-0 bg-slate-900/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                  >
                    <Upload className="w-4 h-4 mb-0.5" />
                    <span>{uploadingLogo ? "Yuklanmoqda..." : "O'zgartirish"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Yuklash</span>
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={handleLogoDelete}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Logotipni o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Store Name Input */}
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Do'kon nomi:</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Do'koningiz nomini kiriting..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Bu nom витрина xederida, brauzer sarlavhasida va cheklarda ko'rsatiladi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. AI THEME & NICHE GENERATOR */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl space-y-5 border border-indigo-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight">Sun'iy intellekt (AI) Dizayn Studio</h3>
                  <p className="text-[11px] text-slate-300">Biznes yo'nalishingizni tanlang</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                AI Pro
              </span>
            </div>

            {/* Niche Chips */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-300">Do'koningiz yo'nalishi (Nisha):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {nichesList.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleSelectNiche(n.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                      selectedNiche === n.id
                        ? "bg-white text-slate-900 border-white shadow-md scale-[1.02]"
                        : "bg-white/10 text-white border-white/10 hover:bg-white/15"
                    }`}
                  >
                    <span className="text-base">{n.emoji}</span>
                    <span className="truncate text-[11px]">{n.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Niche Prompt */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300">Yoki o'z yo'nalishingizni yozing:</label>
                <span className="text-[10px] text-slate-400">Masalan: Parfyumeriya, Kitoblar, Avto</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSelectNiche("custom", customPrompt);
                    }
                  }}
                  placeholder="Sohangizni kiriting..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => handleSelectNiche("custom", customPrompt)}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shrink-0 transition-all cursor-pointer"
                >
                  Qo'llash
                </button>
              </div>
            </div>

            {/* Apply catalog button */}
            <button
              type="button"
              onClick={handleApplyNicheCatalog}
              disabled={applyingNiche}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${applyingNiche ? "animate-spin" : ""}`} />
              <span>
                {applyingNiche
                  ? "Generatsiya qilinmoqda (banner va tovarlar yuklanmoqda)..."
                  : "⚡ AI orqali tovarlar va rasmlarni do'konga yuklash"}
              </span>
            </button>
          </div>

          {/* 3. PROMOTIONAL BANNER SECTION WITH RICH PRESETS GALLERY & FILE UPLOAD */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <ImageIcon className="w-4 h-4 text-brand" />
                <span>Aksiya va Reklama Banneri</span>
              </div>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>{uploadingBanner ? "Yuklanmoqda..." : "Fayl yuklash (Kompyuterdan)"}</span>
              </button>
            </div>

            {/* Active Banner Display */}
            {bannerImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 h-36 relative group shadow-inner">
                <img src={bannerImageUrl} alt="Active Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-5 flex flex-col justify-center text-white">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider w-fit mb-1">
                    Aksiya
                  </span>
                  <div className="font-black text-sm sm:text-base line-clamp-1 drop-shadow-sm">
                    {bannerTitle || "Aksiya sarlavhasi"}
                  </div>
                  {bannerSubtitle && (
                    <div className="text-[11px] text-slate-200 line-clamp-1 mt-0.5 drop-shadow-sm">
                      {bannerSubtitle}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preset Banner Thumbnails Gallery for Current Niche */}
            {currentNicheObj.banner_images && currentNicheObj.banner_images.length > 0 && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600">
                  Tanlangan nishaga mos tayyor bannerlar (1-bosishda tanlang):
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {currentNicheObj.banner_images.map((imgUrl, idx) => {
                    const isSelected = bannerImageUrl === imgUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setBannerImageUrl(imgUrl);
                          setPreviewKey(Date.now());
                        }}
                        className={`group relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-brand ring-2 ring-brand/40 scale-[1.03] shadow-md"
                            : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img src={imgUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand/30 flex items-center justify-center">
                            <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Banner Titles Text Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Banner sarlavhasi:</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="Masalan: Yangi to'plam — 20% chegirma"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Qo'shimcha tavsif:</label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="Masalan: 60 daqiqada bepul yetkazib berish"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>

          {/* 4. VISUAL USLUB VA RANGLAR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-brand" />
              <span>Vizual uslub va ranglar sozlamasi</span>
            </div>

            {/* A. Card Layout Style */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Tovarlar kartochkasi uslubi (Card Style):</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: "modern", title: "Zamonaviy", desc: "Rounded 3XL, soya", icon: LayoutGrid },
                  { id: "compact", title: "Menyu", desc: "Gorizontal ixcham", icon: Menu },
                  { id: "minimal", title: "Minimal", desc: "Ramsiz, toza", icon: Square },
                  { id: "bold", title: "Kontrast", desc: "Aniq hoshiyalar", icon: CheckSquare },
                ].map((s) => {
                  const Icon = s.icon;
                  const active = cardStyle === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCardStyle(s.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        active
                          ? "border-brand bg-emerald-50/50 ring-2 ring-brand ring-offset-1 text-slate-900 shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-full h-7 rounded-lg bg-slate-100 mb-2 flex items-center justify-center text-slate-500">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="font-extrabold text-[11px]">{s.title}</div>
                      <div className="text-[9px] text-slate-400">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. Image Aspect & Button Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rasm proporsiyasi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "square", label: "1:1 Kvadrat" },
                    { id: "portrait", label: "3:4 Portret" },
                    { id: "landscape", label: "4:3 Keng" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setImageAspect(a.id)}
                      className={`py-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        imageAspect === a.id
                          ? "border-brand bg-emerald-50 text-brand font-black ring-1 ring-brand"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tugma uslubi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "solid", label: "To'liq" },
                    { id: "outline", label: "Konturli" },
                    { id: "soft", label: "Yumshoq" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setButtonStyle(b.id)}
                      className={`py-2 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        buttonStyle === b.id
                          ? "border-brand bg-emerald-50 text-brand font-black ring-1 ring-brand"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* C. Primary Brand Color & Background Color */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Brend asosiy rangi (Primary Color):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{primaryColor}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {quickColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                        primaryColor.toUpperCase() === c.toUpperCase()
                          ? "ring-2 ring-brand ring-offset-2 scale-110 border-transparent shadow-xs"
                          : "border-slate-300 hover:scale-105"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">Sayt foni rangi (Background):</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={themeBgColor}
                      onChange={(e) => setThemeBgColor(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{themeBgColor}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {bgColors.map((bg) => (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() => setThemeBgColor(bg.value)}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        themeBgColor.toUpperCase() === bg.value.toUpperCase()
                          ? "border-brand ring-2 ring-brand ring-offset-1 text-slate-900 font-black shadow-xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: bg.value }} />
                      <span className="truncate text-[11px]">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveTheme()}
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-dark text-white font-black text-xs shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saqlanmoqda..." : "Saqlash va saytga qo'llash"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW */}
        <div className="xl:col-span-6 space-y-4 sticky top-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-extrabold text-xs text-slate-900">Jonli ko'rinish (Real-time Preview):</span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === "desktop"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === "mobile"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobil (iPhone)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPreviewKey(Date.now())}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
              title="Yangilash"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* DESKTOP PREVIEW */}
          {previewDevice === "desktop" ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="flex-1 max-w-sm mx-auto bg-white border border-slate-200 rounded-lg px-3 py-0.5 text-[11px] font-mono text-slate-500 truncate text-center">
                  https://{subdomain}.storebox.uz
                </div>
              </div>
              <iframe
                key={`desktop-${previewKey}`}
                src={previewUrl}
                title="Storefront Desktop Preview"
                className="w-full h-[650px] bg-white border-0"
              />
            </div>
          ) : (
            /* MOBILE PREVIEW (iPhone Frame) */
            <div className="flex justify-center py-2">
              <div className="w-[375px] h-[720px] bg-slate-900 rounded-[52px] p-3.5 shadow-2xl ring-4 ring-slate-800 relative flex flex-col">
                {/* Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-end px-3">
                  <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                </div>
                {/* Phone screen container */}
                <div className="w-full h-full rounded-[42px] overflow-hidden bg-white relative">
                  <iframe
                    key={`mobile-${previewKey}`}
                    src={previewUrl}
                    title="Storefront Mobile Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
