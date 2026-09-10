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
  SlidersHorizontal,
  Utensils,
  ShoppingBag,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Eye,
  EyeOff,
  Link as LinkIcon,
  X
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

interface BannerItem {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  link: string;
  is_active: boolean;
  sort_order: number;
}

interface ThemeTemplateItem {
  id: string;
  name: string;
  name_ru: string;
  name_en: string;
  description: string;
  description_ru: string;
  badge: string;
  icon: string;
}

interface ThemeSettings {
  primary_color: string;
  theme_bg_color: string;
  theme_card_style: string;
  theme_card_radius: string;
  theme_image_aspect: string;
  theme_button_style: string;
  theme_template: string;
  theme_business_niche: string;
  logo_url?: string;
  banner: {
    title: string;
    subtitle: string;
    image_url: string;
  };
  banners?: BannerItem[];
  templates?: ThemeTemplateItem[];
  store_name: string;
  subdomain: string;
  storefront_url: string;
  niches: NicheItem[];
}

export const DesignStudioPage: React.FC = () => {
  const { store } = useAuth();
  const queryClient = useQueryClient();

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const newBannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Initial loaded settings for dirty checking
  const [initialSettings, setInitialSettings] = useState<any>(null);

  // Active settings state
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeTemplate, setThemeTemplate] = useState<string>("universal");
  const [selectedNiche, setSelectedNiche] = useState("flowers");
  const [customPrompt, setCustomPrompt] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [themeBgColor, setThemeBgColor] = useState("#F8FAFC");
  const [cardStyle, setCardStyle] = useState("modern");
  const [cardRadius, setCardRadius] = useState("3xl");
  const [imageAspect, setImageAspect] = useState("portrait");
  const [buttonStyle, setButtonStyle] = useState("solid");
  const [generateCatalog, setGenerateCatalog] = useState(false);

  // Multi-Banner state
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link: "/",
    is_active: true
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // UI view mode
  const [mobileTab, setMobileTab] = useState<"settings" | "preview">("settings");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [applyingNiche, setApplyingNiche] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick brand color palettes (StoreBox brand purple #7C3AED first)
  const quickColors = [
    "#7C3AED", // StoreBox Signature Violet
    "#4F46E5", // Royal Indigo
    "#2563EB", // Blue
    "#0D9488", // Teal
    "#10B981", // Emerald Green
    "#E11D48", // Crimson Rose
    "#EA580C", // Vibrant Orange
    "#0F172A", // Midnight Navy
  ];

  const bgColors = [
    { name: "Slate", value: "#F8FAFC" },
    { name: "Oq", value: "#FFFFFF" },
    { name: "Krem", value: "#FEF9C3" },
    { name: "Pushti", value: "#FDF8F9" },
    { name: "Qorong'i", value: "#0F172A" },
  ];

  // 1. Fetch current theme settings
  const { data: themeData } = useQuery<ThemeSettings>({
    queryKey: ["design-theme"],
    queryFn: async () => {
      const res = await api.get("/design/theme/");
      return res.data;
    },
  });

  // Sync state once data loads
  useEffect(() => {
    if (themeData) {
      const initObj = {
        storeName: themeData.store_name || store?.name || "",
        logoUrl: themeData.logo_url || "",
        primaryColor: themeData.primary_color || "#7C3AED",
        themeBgColor: themeData.theme_bg_color || "#F8FAFC",
        cardStyle: themeData.theme_card_style || "modern",
        cardRadius: themeData.theme_card_radius || "3xl",
        imageAspect: themeData.theme_image_aspect || "portrait",
        buttonStyle: themeData.theme_button_style || "solid",
        themeTemplate: themeData.theme_template || "universal",
        selectedNiche: themeData.theme_business_niche || "flowers",
      };
      setInitialSettings(initObj);

      setStoreName(initObj.storeName);
      setLogoUrl(initObj.logoUrl);
      setPrimaryColor(initObj.primaryColor);
      setThemeBgColor(initObj.themeBgColor);
      setCardStyle(initObj.cardStyle);
      setCardRadius(initObj.cardRadius);
      setImageAspect(initObj.imageAspect);
      setButtonStyle(initObj.buttonStyle);
      setThemeTemplate(initObj.themeTemplate);
      setSelectedNiche(initObj.selectedNiche);

      if (themeData.banners) {
        setBanners(themeData.banners);
      }
    }
  }, [themeData, store]);

  // Check if user has unsaved modifications
  const hasUnsavedChanges = initialSettings && (
    storeName !== initialSettings.storeName ||
    primaryColor !== initialSettings.primaryColor ||
    themeBgColor !== initialSettings.themeBgColor ||
    cardStyle !== initialSettings.cardStyle ||
    cardRadius !== initialSettings.cardRadius ||
    imageAspect !== initialSettings.imageAspect ||
    buttonStyle !== initialSettings.buttonStyle ||
    themeTemplate !== initialSettings.themeTemplate ||
    selectedNiche !== initialSettings.selectedNiche
  );

  // Warn before closing tab if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Real-time instant preview message to iframe
  const sendThemeMessage = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const activePrimaryBanner = banners.find(b => b.is_active) || banners[0];
      iframeRef.current.contentWindow.postMessage(
        {
          type: "STOREBOX_THEME_PREVIEW",
          template: themeTemplate,
          primaryColor,
          bgColor: themeBgColor,
          bannerTitle: activePrimaryBanner?.title || "",
          bannerSubtitle: activePrimaryBanner?.subtitle || "",
          bannerImageUrl: activePrimaryBanner?.image_url || "",
          logoUrl,
        },
        "*"
      );
    }
  };

  useEffect(() => {
    sendThemeMessage();
  }, [themeTemplate, primaryColor, themeBgColor, banners, logoUrl]);

  // Revert unsaved changes back to initial state
  const handleResetChanges = () => {
    if (!initialSettings) return;
    setStoreName(initialSettings.storeName);
    setPrimaryColor(initialSettings.primaryColor);
    setThemeBgColor(initialSettings.themeBgColor);
    setCardStyle(initialSettings.cardStyle);
    setCardRadius(initialSettings.cardRadius);
    setImageAspect(initialSettings.imageAspect);
    setButtonStyle(initialSettings.buttonStyle);
    setThemeTemplate(initialSettings.themeTemplate);
    setSelectedNiche(initialSettings.selectedNiche);
    setPreviewKey(Date.now());
  };

  // Templates list
  const templatesList: ThemeTemplateItem[] = themeData?.templates || [
    {
      id: "restaurant",
      name: "Restoran & Yetkazib berish",
      name_ru: "Ресторан и Доставка",
      name_en: "Restaurant & Delivery",
      description: "Taomlar, yetkazib berish va kafe uchun maxsus menyu formati",
      description_ru: "Формат меню для еды, кафе и быстрой доставки",
      badge: "Food & Delivery",
      icon: "utensils"
    },
    {
      id: "universal",
      name: "Universal do'kon",
      name_ru: "Универсальный магазин",
      name_en: "Universal Store",
      description: "Klassik e-commerce vitrina, bannerlar, chegirmalar va qidiruv",
      description_ru: "Классическая витрина с промо-слайдером и категориями",
      badge: "E-Commerce",
      icon: "shopping-bag"
    },
    {
      id: "boutique",
      name: "Vizual Butik & Moda",
      name_ru: "Визуальный бутик и мода",
      name_en: "Visual Boutique & Fashion",
      description: "Kiyim-kechak, kosmetika va aksessuarlar uchun estetik lookbook",
      description_ru: "Эстетичный лукбук с портретными карточками 3:4",
      badge: "Fashion & Visual",
      icon: "sparkles"
    }
  ];

  // Niches list
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

  // Select niche & ask AI for suggestion
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
      }
      setPreviewKey(Date.now());
    } catch (e) {
      console.error("AI Suggestion error:", e);
    }
  };

  // Logo Upload Handler
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

  // Logo Delete Handler
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

  // MULTI-BANNER MANAGEMENT
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: `«${storeName || "StoreBox"}»`,
      subtitle: "Yangi maxsus takliflar va aksiyalar",
      image_url: currentNicheObj.banner_images?.[0] || "",
      link: "/",
      is_active: true
    });
    setBannerFile(null);
    setShowAddBannerModal(true);
  };

  const handleOpenEditBanner = (b: BannerItem) => {
    setEditingBanner(b);
    setBannerForm({
      title: b.title,
      subtitle: b.subtitle,
      image_url: b.image_url,
      link: b.link || "/",
      is_active: b.is_active
    });
    setBannerFile(null);
    setShowAddBannerModal(true);
  };

  const handleSaveBannerModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingBanner(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("title", bannerForm.title);
    formData.append("subtitle", bannerForm.subtitle);
    formData.append("link", bannerForm.link || "/");
    formData.append("is_active", String(bannerForm.is_active));

    if (bannerFile) {
      formData.append("image", bannerFile);
    } else if (bannerForm.image_url) {
      formData.append("image_url", bannerForm.image_url);
    }

    try {
      if (editingBanner) {
        // Update existing banner
        const res = await api.put(`/design/banners/${editingBanner.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data?.success) {
          setBanners(prev => prev.map(b => (b.id === editingBanner.id ? res.data.banner : b)));
          setMsg({ type: "success", text: "Banner muvaffaqiyatli yangilandi!" });
        }
      } else {
        // Create new banner
        const res = await api.post("/design/banners/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data?.success) {
          setBanners(prev => [...prev, res.data.banner]);
          setMsg({ type: "success", text: "Yangi banner muvaffaqiyatli qo'shildi!" });
        }
      }
      setShowAddBannerModal(false);
      setPreviewKey(Date.now());
      queryClient.invalidateQueries({ queryKey: ["design-theme"] });
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Bannerni saqlashda xatolik yuz berdi." });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDeleteBanner = async (id: number) => {
    if (!window.confirm("Rostdan ham ushbu bannerni o'chirmoqchimisiz?")) return;
    try {
      await api.delete(`/design/banners/${id}/`);
      setBanners(prev => prev.filter(b => b.id !== id));
      setMsg({ type: "success", text: "Banner o'chirildi." });
      setPreviewKey(Date.now());
      queryClient.invalidateQueries({ queryKey: ["design-theme"] });
    } catch (err: any) {
      setMsg({ type: "error", text: "Bannerni o'chirishda xatolik yuz berdi." });
    }
  };

  const handleToggleBannerActive = async (b: BannerItem) => {
    try {
      const nextActive = !b.is_active;
      await api.patch(`/design/banners/${b.id}/`, { is_active: nextActive });
      setBanners(prev => prev.map(item => (item.id === b.id ? { ...item, is_active: nextActive } : item)));
      setPreviewKey(Date.now());
    } catch (err: any) {
      console.error("Toggle banner active error:", err);
    }
  };

  const handleMoveBanner = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;
    setBanners(newBanners);

    try {
      await api.post("/design/banners/reorder/", {
        banner_ids: newBanners.map(b => b.id)
      });
      setPreviewKey(Date.now());
    } catch (err) {
      console.error("Reorder banners error:", err);
    }
  };

  // Save Theme Settings & Apply to Public Storefront
  const handleSaveTheme = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.post("/design/theme/save/", {
        store_name: storeName,
        theme_template: themeTemplate,
        primary_color: primaryColor,
        theme_bg_color: themeBgColor,
        theme_card_style: cardStyle,
        theme_card_radius: cardRadius,
        theme_image_aspect: imageAspect,
        theme_button_style: buttonStyle,
        theme_business_niche: selectedNiche,
        generate_catalog: generateCatalog
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: "Dizayn va shablon sozlamalari muvaffaqiyatli saqlandi va saytga qo'llandi!" });
        setInitialSettings({
          storeName,
          logoUrl,
          primaryColor,
          themeBgColor,
          cardStyle,
          cardRadius,
          imageAspect,
          buttonStyle,
          themeTemplate,
          selectedNiche,
        });
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
  const subdomain = store?.subdomain || themeData?.subdomain || "shop-655";
  const activePrimaryBanner = banners.find(b => b.is_active) || banners[0];
  const previewParams = new URLSearchParams({
    preview: "1",
    template: themeTemplate,
    primary_color: primaryColor,
    card_style: cardStyle,
    card_radius: cardRadius,
    bg_color: themeBgColor,
    image_aspect: imageAspect,
    button_style: buttonStyle,
    preview_niche: selectedNiche,
    preview_banner_title: activePrimaryBanner?.title || "",
    preview_banner_subtitle: activePrimaryBanner?.subtitle || "",
    preview_banner_image: activePrimaryBanner?.image_url || "",
    force_preview: "1",
    _t: String(previewKey)
  });
  const previewUrl = `/store/${subdomain}/?${previewParams.toString()}`;

  return (
    <div className="space-y-6">
      {/* HIDDEN FILE INPUT FOR LOGO */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoFileChange}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* HEADER WITH ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Palette className="w-6 h-6 text-brand" />
            <span>StoreBox Dizayn & Shablonlar Konstruktori</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-violet-500/10 text-violet-700 border border-violet-500/20">
              v2.0
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Do'koningiz shablonini, brend ranglarini, reklamalarni va vitrina ko'rinishini sozlang.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/store/${subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Do'konni ochish</span>
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

      {/* STICKY UNSAVED CHANGES BANNER */}
      {hasUnsavedChanges && (
        <div className="sticky top-4 z-40 bg-amber-500 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Sizda saqlanmagan o'zgarishlar mavjud. O'zgarishlarni saytga qo'llash uchun saqlang.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetChanges}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={() => handleSaveTheme()}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-white text-amber-900 hover:bg-slate-100 text-xs font-black shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}

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

      {/* MOBILE TAB TOGGLER (SETTINGS VS PREVIEW) */}
      <div className="xl:hidden flex items-center bg-slate-200/80 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mobileTab === "settings" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Sozlamalar</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            mobileTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Jonli ko'rinish</span>
        </button>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTROLS & SECTIONS */}
        <div className={`xl:col-span-6 space-y-6 ${mobileTab === "preview" ? "hidden xl:block" : "block"}`}>

          {/* 1. STOREFRONT TEMPLATE SELECTION (3 DISTINCT TEMPLATES AS PER TZ) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <LayoutGrid className="w-4 h-4 text-brand" />
                <span>1. Vitrina Shablonini Tanlang (3 xil dizayn)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand/10 text-brand">
                {templatesList.length} ta shablon
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {templatesList.map((tpl) => {
                const isSelected = themeTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setThemeTemplate(tpl.id);
                      setPreviewKey(Date.now());
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? "border-brand bg-brand/5 ring-2 ring-brand/20 shadow-md scale-[1.02]"
                        : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? "bg-brand text-white" : "bg-slate-100 text-slate-600 group-hover:text-brand"
                        }`}>
                          {tpl.id === "restaurant" ? (
                            <Utensils className="w-4 h-4" />
                          ) : tpl.id === "boutique" ? (
                            <Sparkles className="w-4 h-4" />
                          ) : (
                            <ShoppingBag className="w-4 h-4" />
                          )}
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-brand text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {tpl.badge}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900">{tpl.name}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{tpl.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
                      <span className={isSelected ? "text-brand font-black" : "text-slate-400"}>
                        {isSelected ? "Faol shablon" : "Tanlash"}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. BRAND IDENTITY & LOGO SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Store className="w-4 h-4 text-brand" />
                <span>2. Do'kon Nomi va Logotipi</span>
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
                    Vitrina sarlavhasida, brauzer yorlig'ida va cheklarda ko'rsatiladi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MULTIPLE PROMOTIONAL BANNERS MANAGER (AS PER SECTION 8 OF TZ) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <ImageIcon className="w-4 h-4 text-brand" />
                <span>3. Reklama Bannerlari Boshqaruvi</span>
              </div>
              <button
                type="button"
                onClick={handleOpenAddBanner}
                className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi banner qo'shish</span>
              </button>
            </div>

            {/* Banners List */}
            {banners.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-3">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Hozircha faol bannerlar mavjud emas</p>
                  <p className="text-[11px] text-slate-400">Do'koningiz yuqori qismida aksiyalarni ko'rsatish uchun banner qo'shing.</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddBanner}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  + Birinchi bannerni yaratish
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((b, idx) => (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      b.is_active ? "border-slate-200 bg-white shadow-2xs" : "border-slate-200/60 bg-slate-50/70 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                        {b.image_url ? (
                          <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        {!b.is_active && (
                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                            <EyeOff className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">{b.title}</h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase ${
                            b.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-200 text-slate-600"
                          }`}>
                            {b.is_active ? "Faol" : "O'chirilgan"}
                          </span>
                        </div>
                        {b.subtitle && <p className="text-[11px] text-slate-400 truncate mt-0.5">{b.subtitle}</p>}
                        {b.link && b.link !== "/" && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <LinkIcon className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[200px]">{b.link}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up / Down */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveBanner(idx, "up")}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Yuqoriga surish"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === banners.length - 1}
                          onClick={() => handleMoveBanner(idx, "down")}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Pastga surish"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleBannerActive(b)}
                        className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          b.is_active ? "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" : "border-slate-200 text-slate-400 hover:bg-slate-100"
                        }`}
                        title={b.is_active ? "Bannerni o'chirish" : "Bannerni yoqish"}
                      >
                        {b.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditBanner(b)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(b.id)}
                        className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. VISUAL USLUB VA RANGLAR */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 font-black text-sm text-slate-900 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="w-4 h-4 text-brand" />
              <span>4. Vizual Uslub va Ranglar Sozlamasi</span>
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
                          ? "border-brand bg-brand/5 ring-2 ring-brand ring-offset-1 text-slate-900 shadow-xs"
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
                          ? "border-brand bg-brand/10 text-brand font-black ring-1 ring-brand"
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
                          ? "border-brand bg-brand/10 text-brand font-black ring-1 ring-brand"
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

          {/* 5. AI THEME & NICHE GENERATOR (Dark Violet Studio) */}
          <div className="bg-gradient-to-br from-[#0F0E26] via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-violet-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-violet-500/20 text-violet-300 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white tracking-tight">AI Dizayn & Nishalar Yordamchisi</h3>
                  <p className="text-[11px] text-slate-300">Biznes sohangizga mos palitra va bannerlar tavsiyasi</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-black uppercase tracking-wider border border-violet-500/30">
                AI Pro
              </span>
            </div>

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
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LIVE PREVIEW */}
        <div className={`xl:col-span-6 space-y-4 sticky top-6 ${mobileTab === "settings" ? "hidden xl:block" : "block"}`}>
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
                  https://{subdomain}.storebox.uz/?template={themeTemplate}
                </div>
              </div>
              <iframe
                ref={iframeRef}
                key={`desktop-${previewKey}`}
                src={previewUrl}
                onLoad={sendThemeMessage}
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
                    ref={iframeRef}
                    key={`mobile-${previewKey}`}
                    src={previewUrl}
                    onLoad={sendThemeMessage}
                    title="Storefront Mobile Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT BANNER MODAL */}
      {showAddBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand" />
                <span>{editingBanner ? "Bannerni tahrirlash" : "Yangi aksiya banneri qo'shish"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBannerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBannerModal} className="space-y-4">
              {/* Image Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner rasmi:</label>
                <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4 text-center bg-slate-50 space-y-3">
                  {bannerFile ? (
                    <div className="h-28 rounded-xl overflow-hidden border border-slate-200 relative">
                      <img src={URL.createObjectURL(bannerFile)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerFile(null)}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : bannerForm.image_url ? (
                    <div className="h-28 rounded-xl overflow-hidden border border-slate-200 relative">
                      <img src={bannerForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerForm(f => ({ ...f, image_url: "" }))}
                        className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 text-slate-400 text-xs">
                      <Upload className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                      <p className="font-semibold">Rasm faylini yuklang yoki havolasini kiriting</p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="file"
                      ref={newBannerFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setBannerFile(file);
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => newBannerFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Fayl tanlash</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Or image URL */}
              {!bannerFile && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Yoki rasm URL havolasi:</label>
                  <input
                    type="url"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banner sarlavhasi (Title):</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    placeholder="Masalan: Yozgi chegirmalar boshlandi"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Qo'shimcha tavsif (Subtitle):</label>
                  <input
                    type="text"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    placeholder="Masalan: Barcha yangi mahsulotlarga 20% gacha keshbek"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">O'tish havolasi (Link):</label>
                  <input
                    type="text"
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                    placeholder="Masalan: / yoki ?cat=ichimliklar"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="bannerActiveSwitch"
                    checked={bannerForm.is_active}
                    onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                  />
                  <label htmlFor="bannerActiveSwitch" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Bannerni faol qilish (vitrinada ko'rsatilsin)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBannerModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={uploadingBanner}
                  className="px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-black shadow-md shadow-brand/20 cursor-pointer disabled:opacity-50"
                >
                  {uploadingBanner ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
