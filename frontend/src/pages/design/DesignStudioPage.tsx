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
  X,
  Layers
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
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  // ResizeObserver for realistic Desktop Scaling
  const [containerWidth, setContainerWidth] = useState(650);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Focused Active Tab for Settings (Prevents infinite scrolling confusion)
  const [activeTab, setActiveTab] = useState<"template" | "style" | "banners" | "store">("template");

  // Initial loaded settings for dirty checking
  const [initialSettings, setInitialSettings] = useState<any>(null);

  // Active settings state
  const [storeName, setStoreName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [themeTemplate, setThemeTemplate] = useState<string>("universal");
  const [selectedNiche, setSelectedNiche] = useState("flowers");
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
  const [previewKey, setPreviewKey] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Quick brand color palettes (StoreBox signature violet first)
  const quickColors = [
    { name: "StoreBox Fiolet", value: "#7C3AED" },
    { name: "Qirollik Moviy", value: "#2563EB" },
    { name: "Zumrad Yashil", value: "#10B981" },
    { name: "Tengiz Moviy", value: "#0EA5E9" },
    { name: "Qahrabo To'q sariq", value: "#F59E0B" },
    { name: "Yoqut Qizil", value: "#EF4444" },
    { name: "Pushti Nilufar", value: "#EC4899" },
    { name: "To'q Qora (Noir)", value: "#0F172A" },
  ];

  const bgColors = [
    { name: "Klassik Slate", value: "#F8FAFC" },
    { name: "Sof Oq", value: "#FFFFFF" },
    { name: "Yumshoq Krem", value: "#FEF9C3" },
    { name: "Pushti Pastel", value: "#FDF8F9" },
    { name: "Premium Qorong'i", value: "#0F172A" },
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

  // Real-time instant preview message to iframe (NO HTTP requests, ZERO reload lag)
  const sendThemeMessage = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      const activePrimaryBanner = banners.find(b => b.is_active) || banners[0];
      iframeRef.current.contentWindow.postMessage(
        {
          type: "STOREBOX_THEME_PREVIEW",
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
  }, [primaryColor, themeBgColor, banners, logoUrl]);

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
    setMsg(null);
  };

  // Templates list
  const templatesList: ThemeTemplateItem[] = themeData?.templates || [
    {
      id: "restaurant",
      name: "Restoran & Yetkazib berish",
      name_ru: "Ресторан и Доставка",
      name_en: "Restaurant & Delivery",
      description: "Taomlar, issiq ovqatlar va kafe uchun maxsus menyu formati",
      description_ru: "Специальный формат меню для еды, кафе и быстрой доставки",
      badge: "Food & Delivery",
      icon: "utensils"
    },
    {
      id: "universal",
      name: "Universal do'kon",
      name_ru: "Универсальный магазин",
      name_en: "Universal Store",
      description: "Klassik e-commerce vitrina, promo-slayder, chegirmalar va qidiruv",
      description_ru: "Классическая витрина с промо-слайдером, категориями и фильтрами",
      badge: "E-Commerce",
      icon: "shopping-bag"
    },
    {
      id: "boutique",
      name: "Vizual Butik & Moda",
      name_ru: "Визуальный бутик и мода",
      name_en: "Visual Boutique & Fashion",
      description: "Kiyim-kechak, kosmetika va aksessuarlar uchun estetik lookbook",
      description_ru: "Эстетичный лукбук с портретными карточками 3:4 для моды и красоты",
      badge: "Fashion & Visual",
      icon: "sparkles"
    }
  ];

  // Template switch handler with clean iframe update
  const handleSelectTemplate = (tplId: string) => {
    setThemeTemplate(tplId);
    setMsg(null);
  };

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
    } catch (err: any) {
      setMsg({ type: "error", text: "Logotipni o'chirishda xatolik." });
    }
  };

  // MULTI-BANNER MANAGEMENT
  const handleOpenAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: `«${storeName || "StoreBox"}»`,
      subtitle: "Maxsus takliflar va yangi aksiyalar",
      image_url: "",
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
        const res = await api.put(`/design/banners/${editingBanner.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data?.success) {
          setBanners(prev => prev.map(b => (b.id === editingBanner.id ? res.data.banner : b)));
          setMsg({ type: "success", text: "Banner muvaffaqiyatli yangilandi!" });
        }
      } else {
        const res = await api.post("/design/banners/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data?.success) {
          setBanners(prev => [...prev, res.data.banner]);
          setMsg({ type: "success", text: "Yangi banner muvaffaqiyatli qo'shildi!" });
        }
      }
      setShowAddBannerModal(false);
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
    } catch (err) {
      console.error("Reorder banners error:", err);
    }
  };

  // Save Theme Settings & Apply to Public Storefront
  const handleSaveTheme = async () => {
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
        setMsg({ type: "success", text: "Dizayn sozlamalari muvaffaqiyatli saqlandi va saytga qo'llandi!" });
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
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Saqlashda xatolik yuz berdi." });
    } finally {
      setSaving(false);
    }
  };

  // Subdomain & Preview URL
  const subdomain = store?.subdomain || themeData?.subdomain || "shop-655";
  const activePrimaryBanner = banners.find(b => b.is_active) || banners[0];
  const previewParams = new URLSearchParams({
    preview: "1",
    template: themeTemplate,
    primary_color: primaryColor,
    bg_color: themeBgColor,
    card_style: cardStyle,
    preview_banner_title: activePrimaryBanner?.title || "",
    preview_banner_subtitle: activePrimaryBanner?.subtitle || "",
    preview_banner_image: activePrimaryBanner?.image_url || "",
  });
  const previewUrl = `/store/${subdomain}/?${previewParams.toString()}`;

  // Calculate realistic desktop scale
  const desktopCanvasWidth = 1200;
  const desktopScale = Math.min(1, Math.max(0.42, (containerWidth - 32) / desktopCanvasWidth));

  return (
    <div className="space-y-5">
      {/* HIDDEN FILE INPUT FOR LOGO */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoFileChange}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* TOP HEADER BAR: Intuitive, Clean & Pro */}
      <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Vitrina Dizayni
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Jonli
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Shablon, brend ranglari va bannerlarni real vaqt rejimida sozlang.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={`/store/${subdomain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Saytni ko'rish</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saqlanmoqda..." : "Saqlash va qo'llash"}</span>
          </button>
        </div>
      </div>

      {/* ALERT MESSAGE / TOAST */}
      {msg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2.5 shadow-2xs animate-in fade-in duration-200 ${
            msg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* UNSAVED CHANGES NOTICE */}
      {hasUnsavedChanges && (
        <div className="bg-amber-500 text-white px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between gap-4 text-xs font-bold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Saqlanmagan o'zgarishlar mavjud. O'zgarishlar saytga tushishi uchun saqlang.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetChanges}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSaveTheme}
              disabled={saving}
              className="px-3 py-1 rounded-lg bg-white text-amber-900 hover:bg-slate-100 text-[11px] font-black shadow-2xs transition-all cursor-pointer"
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SWITCHER: SETTINGS VS PREVIEW */}
      <div className="xl:hidden flex items-center bg-slate-200/80 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "settings" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Sozlamalar</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "preview" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Jonli vitrina</span>
        </button>
      </div>

      {/* MAIN 2-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CLEAR TABBED SETTINGS (NO ENDLESS MESSY SCROLL!) */}
        <div className={`xl:col-span-5 space-y-4 ${mobileTab === "preview" ? "hidden xl:block" : "block"}`}>
          
          {/* STEPPED SEGMENTED TABS */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("template")}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "template"
                  ? "bg-brand text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>1. Shablon</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("style")}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "style"
                  ? "bg-brand text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>2. Ranglar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("banners")}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "banners"
                  ? "bg-brand text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>3. Bannerlar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("store")}
              className={`py-2 px-1 rounded-xl text-[11px] font-extrabold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                activeTab === "store"
                  ? "bg-brand text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Store className="w-4 h-4" />
              <span>4. Logo & Nom</span>
            </button>
          </div>

          {/* TAB 1: TEMPLATE SELECTION */}
          {activeTab === "template" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Vitrina Shablonini Tanlang</h3>
                  <p className="text-[11px] text-slate-500">Do'koningiz faoliyat turiga mos dizaynni tanlang</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
                  {templatesList.length} ta shablon
                </span>
              </div>

              <div className="space-y-3">
                {templatesList.map((tpl) => {
                  const isSelected = themeTemplate === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative flex items-start justify-between gap-3 cursor-pointer group ${
                        isSelected
                          ? "border-brand bg-brand/5 ring-2 ring-brand/20 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-brand text-white" : "bg-slate-100 text-slate-600 group-hover:text-brand"
                        }`}>
                          {tpl.id === "restaurant" ? (
                            <Utensils className="w-5 h-5" />
                          ) : tpl.id === "boutique" ? (
                            <Sparkles className="w-5 h-5" />
                          ) : (
                            <ShoppingBag className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-xs sm:text-sm text-slate-900">{tpl.name}</h4>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isSelected ? "bg-brand text-white" : "bg-slate-100 text-slate-500"
                            }`}>
                              {tpl.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">{tpl.description}</p>
                        </div>
                      </div>

                      <div className="shrink-0 mt-1">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? "border-brand bg-brand text-white" : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COLORS & STYLE */}
          {activeTab === "style" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Brend Ranglari va Uslub</h3>
                <p className="text-[11px] text-slate-500">Tugmalar, aksentlar va fon ranglarini moslashtiring</p>
              </div>

              {/* Primary Color Palette */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Asosiy brend rangi:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-6 h-6 rounded-md cursor-pointer border border-slate-200"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{primaryColor}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {quickColors.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setPrimaryColor(c.value)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        primaryColor.toUpperCase() === c.value.toUpperCase()
                          ? "border-brand ring-2 ring-brand/20 bg-brand/5 shadow-2xs"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg shadow-2xs" style={{ backgroundColor: c.value }} />
                      <span className="text-[10px] font-bold text-slate-700 truncate max-w-full">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Sayt foni rangi:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={themeBgColor}
                      onChange={(e) => setThemeBgColor(e.target.value)}
                      className="w-6 h-6 rounded-md cursor-pointer border border-slate-200"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">{themeBgColor}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {bgColors.map((bg) => (
                    <button
                      key={bg.value}
                      type="button"
                      onClick={() => setThemeBgColor(bg.value)}
                      className={`p-2 rounded-xl border text-center text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        themeBgColor.toUpperCase() === bg.value.toUpperCase()
                          ? "border-brand ring-2 ring-brand/20 bg-brand/5 shadow-2xs text-slate-900"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: bg.value }} />
                      <span className="truncate text-[10px]">{bg.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Style */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">Tovarlar kartochkasi uslubi:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "modern", title: "Zamonaviy", desc: "Rounded 3XL, soya", icon: LayoutGrid },
                    { id: "compact", title: "Menyu", desc: "Gorizontal ixcham", icon: Menu },
                    { id: "minimal", title: "Minimal", desc: "Ramsiz, toza", icon: Square },
                  ].map((s) => {
                    const active = cardStyle === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setCardStyle(s.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          active
                            ? "border-brand bg-brand/5 ring-1 ring-brand text-slate-900 font-black shadow-2xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-extrabold text-[11px]">{s.title}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{s.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROMOTIONAL BANNERS */}
          {activeTab === "banners" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Reklama Bannerlari</h3>
                  <p className="text-[11px] text-slate-500">Vitrina yuqorisidagi aksiyali slayder rasmlari</p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddBanner}
                  className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Qo'shish</span>
                </button>
              </div>

              {banners.length === 0 ? (
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Hozircha bannerlar yo'q</p>
                  <button
                    type="button"
                    onClick={handleOpenAddBanner}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                  >
                    + Birinchi bannerni qo'shish
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {banners.map((b, idx) => (
                    <div
                      key={b.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        b.is_active ? "border-slate-200 bg-white shadow-2xs" : "border-slate-200/60 bg-slate-50/70 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-11 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {b.image_url ? (
                            <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate">{b.title}</h4>
                          {b.subtitle && <p className="text-[10px] text-slate-400 truncate mt-0.5">{b.subtitle}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(b)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                            b.is_active ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-400"
                          }`}
                          title={b.is_active ? "O'chirish" : "Yoqish"}
                        >
                          {b.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditBanner(b)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(b.id)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
          )}

          {/* TAB 4: STORE IDENTITY & LOGO */}
          {activeTab === "store" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900">Do'kon Nomi va Logotipi</h3>
                <p className="text-[11px] text-slate-500">Brending va do'kon identifikatsiyasi</p>
              </div>

              {/* Logo Uploader */}
              <div className="flex items-center gap-4">
                <div className="relative group w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand bg-slate-50 flex items-center justify-center overflow-hidden transition-all shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Store Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-400" />
                  )}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingLogo ? "Yuklanmoqda..." : "Logotip yuklash"}</span>
                    </button>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleLogoDelete}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Logotipni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">PNG, JPG yoki SVG. Tavsiya: 512x512 px.</p>
                </div>
              </div>

              {/* Store Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Do'kon nomi:</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Masalan: StoreBox Burger & Restoran"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                <span className="text-slate-400 font-bold">Vitrina havolasi:</span>
                <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">https://{subdomain}.storebox.uz</span>
              </div>
            </div>
          )}



        </div>

        {/* RIGHT COLUMN: REALISTIC RESPONSIVE PREVIEW (DESKTOP & MOBILE) */}
        <div className={`xl:col-span-7 space-y-3 sticky top-4 ${mobileTab === "settings" ? "hidden xl:block" : "block"}`}>
          
          {/* DEVICE SWITCHER & CONTROLS */}
          <div className="bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-black text-xs text-slate-800">Jonli vitrina:</span>
            </div>

            {/* Switcher Buttons */}
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
                <span>Kompyuter (Desktop)</span>
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
                <span>Telefon (Mobil)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPreviewKey(k => k + 1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors"
              title="Yangilash"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* PREVIEW CONTAINER */}
          <div ref={previewContainerRef} className="w-full">
            {previewDevice === "desktop" ? (
              /* REALISTIC DESKTOP PREVIEW WITH RETINA LAPTOP SCALING */
              <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
                {/* Browser top chrome */}
                <div className="bg-slate-800/90 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="flex-1 max-w-sm mx-auto bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-0.5 text-[11px] font-mono text-slate-400 truncate text-center">
                    https://{subdomain}.storebox.uz
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">1200px HD</span>
                </div>

                {/* Scaled desktop viewport container */}
                <div className="w-full h-[620px] bg-slate-100 overflow-hidden flex justify-center items-start relative">
                  <div
                    style={{
                      width: `${desktopCanvasWidth}px`,
                      height: `${620 / desktopScale}px`,
                      transform: `scale(${desktopScale})`,
                      transformOrigin: "top center"
                    }}
                    className="bg-white shadow-2xl overflow-hidden shrink-0"
                  >
                    <iframe
                      ref={iframeRef}
                      key={`desktop-${previewKey}-${themeTemplate}`}
                      src={previewUrl}
                      onLoad={sendThemeMessage}
                      title="Storefront Desktop Preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* REALISTIC IPHONE FRAME */
              <div className="flex justify-center py-2 bg-slate-100/60 rounded-2xl border border-slate-200">
                <div className="w-[360px] h-[640px] bg-slate-950 rounded-[48px] p-3 shadow-2xl ring-4 ring-slate-800 relative flex flex-col">
                  {/* Dynamic Island */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                  </div>
                  {/* Phone screen */}
                  <div className="w-full h-full rounded-[38px] overflow-hidden bg-white relative">
                    <iframe
                      ref={iframeRef}
                      key={`mobile-${previewKey}-${themeTemplate}`}
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

      </div>

      {/* ADD / EDIT BANNER MODAL */}
      {showAddBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand" />
                <span>{editingBanner ? "Bannerni tahrirlash" : "Yangi banner qo'shish"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBannerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBannerModal} className="space-y-3.5">
              {/* Image selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner rasmi:</label>
                <div className="rounded-xl border-2 border-dashed border-slate-200 p-3 text-center bg-slate-50 space-y-2">
                  {bannerFile ? (
                    <div className="h-24 rounded-lg overflow-hidden border border-slate-200 relative">
                      <img src={URL.createObjectURL(bannerFile)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerFile(null)}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : bannerForm.image_url ? (
                    <div className="h-24 rounded-lg overflow-hidden border border-slate-200 relative">
                      <img src={bannerForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setBannerForm(f => ({ ...f, image_url: "" }))}
                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 text-slate-400 text-xs">
                      <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      <span>Rasm yuklang yoki havolasini kiriting</span>
                    </div>
                  )}

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
                    className="px-3 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold cursor-pointer"
                  >
                    Fayl tanlash
                  </button>
                </div>
              </div>

              {!bannerFile && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Yoki rasm URL havolasi:</label>
                  <input
                    type="url"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Banner sarlavhasi:</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Masalan: Yozgi chegirmalar"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tavsif (Subtitle):</label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="Masalan: Barcha yangi mahsulotlarga 20% gacha aksiya"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bannerActiveCheckbox"
                  checked={bannerForm.is_active}
                  onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
                />
                <label htmlFor="bannerActiveCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Faol banner (vitrinada ko'rsatilsin)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBannerModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={uploadingBanner}
                  className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
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
