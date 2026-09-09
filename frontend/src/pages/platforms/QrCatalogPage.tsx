import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  QrCode,
  Download,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  File,
  Sparkles,
  ExternalLink,
  Store,
  Upload,
  Trash2,
  Camera,
  Layers,
  Check,
  Palette
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface QrSettings {
  store_name: string;
  subdomain: string;
  store_url: string;
  logo_url: string;
  qr_paper_size: string;
  qr_bg_color: string;
  qr_code_color: string;
  qr_main_text: string;
  qr_main_text_size: number;
  qr_main_text_color: string;
  qr_sub_text: string;
  qr_sub_text_size: number;
  qr_sub_text_color: string;
}

export const QrCatalogPage: React.FC = () => {
  const { store } = useAuth();
  const queryClient = useQueryClient();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Settings State
  const [paperSize, setPaperSize] = useState("A5");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrColor, setQrColor] = useState("#0F172A");
  const [isCustomBg, setIsCustomBg] = useState(false);
  const [isCustomQr, setIsCustomQr] = useState(false);

  const [mainText, setMainText] = useState("Online buyurtma");
  const [mainTextSize, setMainTextSize] = useState(24);
  const [mainTextColor, setMainTextColor] = useState("#0F172A");

  const [subText, setSubText] = useState("Menyuni ko'rish uchun QR kodni skanerlang");
  const [subTextSize, setSubTextSize] = useState(13);
  const [subTextColor, setSubTextColor] = useState("#64748B");

  // Logo state
  const [logoUrl, setLogoUrl] = useState("");
  const [showLogo, setShowLogo] = useState(true);
  const [logoPlacement, setLogoPlacement] = useState<"top" | "center">("top");
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [qriousReady, setQriousReady] = useState(false);

  // Color palettes matching robosell.uz
  const bgPalette = [
    "#FFFFFF", // White
    "#F8FAFC", // Slate
    "#FEF9C3", // Cream/Yellow
    "#FEE2E2", // Soft Pink/Red
    "#991B1B", // Deep Red
    "#2563EB", // Blue
    "#7C3AED", // Violet
    "#0F172A", // Dark Slate
  ];

  const qrPalette = [
    "#0F172A", // Black/Dark
    "#EA580C", // Orange
    "#06B6D4", // Cyan
    "#16A34A", // Green
    "#9333EA", // Purple
    "#D97706", // Amber
    "#DC2626", // Red
  ];

  // 1. Fetch QR Settings
  const { data: qrData, isLoading } = useQuery<QrSettings>({
    queryKey: ["qr-catalog-settings"],
    queryFn: async () => {
      const res = await api.get("/platforms/qr/");
      return res.data;
    },
  });

  useEffect(() => {
    if (qrData) {
      setPaperSize(qrData.qr_paper_size || "A5");
      setBgColor(qrData.qr_bg_color || "#FFFFFF");
      setQrColor(qrData.qr_code_color || "#0F172A");
      setMainText(qrData.qr_main_text || "Online buyurtma");
      setMainTextSize(qrData.qr_main_text_size || 24);
      setMainTextColor(qrData.qr_main_text_color || "#0F172A");
      setSubText(qrData.qr_sub_text || "Menyuni ko'rish uchun QR kodni skanerlang");
      setSubTextSize(qrData.qr_sub_text_size || 13);
      setSubTextColor(qrData.qr_sub_text_color || "#64748B");
      if (qrData.logo_url) {
        setLogoUrl(qrData.logo_url);
      }
    }
  }, [qrData]);

  // 2. Load QRious library from CDN dynamically
  useEffect(() => {
    if ((window as any).QRious) {
      setQriousReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
    script.async = true;
    script.onload = () => setQriousReady(true);
    document.head.appendChild(script);
  }, []);

  // 3. Draw QR on canvas
  const drawQR = () => {
    if (!canvasRef.current || !qriousReady) return;
    const QRious = (window as any).QRious;
    if (!QRious) return;

    const targetUrl = qrData?.store_url || `https://${store?.subdomain || "demo"}.storebox.uz`;
    new QRious({
      element: canvasRef.current,
      value: targetUrl,
      size: 440,
      background: "#FFFFFF",
      foreground: qrColor,
      level: "H"
    });
  };

  useEffect(() => {
    drawQR();
  }, [qriousReady, bgColor, qrColor, qrData?.store_url]);

  // 4. Logo File Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMsg({ type: "error", text: "Fayl hajmi 10 MB dan oshmasligi kerak." });
      return;
    }

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
        setShowLogo(true);
        setMsg({ type: "success", text: "Logotip muvaffaqiyatli yuklandi!" });
        queryClient.invalidateQueries({ queryKey: ["qr-catalog-settings"] });
        queryClient.invalidateQueries({ queryKey: ["design-theme"] });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Logotip yuklashda xatolik." });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // 5. Save Settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await api.post("/platforms/qr/", {
        qr_paper_size: paperSize,
        qr_bg_color: bgColor,
        qr_code_color: qrColor,
        qr_main_text: mainText,
        qr_main_text_size: mainTextSize,
        qr_main_text_color: mainTextColor,
        qr_sub_text: subText,
        qr_sub_text_size: subTextSize,
        qr_sub_text_color: subTextColor
      });
      if (res.data?.success) {
        setMsg({ type: "success", text: "QR katalog sozlamalari muvaffaqiyatli saqlandi!" });
        queryClient.invalidateQueries({ queryKey: ["qr-catalog-settings"] });
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Saqlashda xatolik." });
    } finally {
      setSaving(false);
    }
  };

  // 6. Download PNG
  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-katalog-${store?.subdomain || "storebox"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // 7. Print Document
  const handlePrint = () => {
    window.print();
  };

  // 8. PDF Download / Print
  const handleDownloadPDF = () => {
    window.print();
  };

  const storeUrl = qrData?.store_url || `https://${store?.subdomain || "demo"}.storebox.uz`;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* HIDDEN LOGO FILE INPUT */}
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* HEADER WITH ACTIONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <QrCode className="w-6 h-6 text-brand" />
            <span>Stollar uchun QR Katalog Generator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Restoran, kafe yoki do'kon stollari uchun bosma dizaynerlik QR-teykertlari (A5 / A6) yarating va chop eting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>PNG yuklash</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish (Print)</span>
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

      {/* TWO COLUMNS: CONTROLS + LIVE PRINTABLE PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONTROLS (matching robosell.uz) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Paper Size */}
            <div>
              <label className="block text-xs font-black text-slate-800 mb-2">Banner hajmi:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaperSize("A5")}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paperSize === "A5"
                      ? "border-brand bg-emerald-50 text-brand font-black ring-2 ring-brand/30 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>A5 qog'oz (148 × 210 mm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize("A6")}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paperSize === "A6"
                      ? "border-brand bg-emerald-50 text-brand font-black ring-2 ring-brand/30 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <File className="w-4 h-4" />
                  <span>A6 qog'oz (105 × 148 mm)</span>
                </button>
              </div>
            </div>

            {/* 2. Background Color (matching robosell.uz) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-800">Fon rangi:</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomBg}
                      onChange={(e) => setIsCustomBg(e.target.checked)}
                      className="rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span>Maxsus</span>
                  </label>
                  {isCustomBg && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-[11px] font-mono font-bold text-slate-500">{bgColor}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                {bgPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setBgColor(c);
                      setIsCustomBg(false);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                      bgColor.toUpperCase() === c.toUpperCase()
                        ? "ring-2 ring-brand ring-offset-2 scale-110 border-transparent shadow-xs"
                        : "border-slate-300 hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3. QR Code Color (matching robosell.uz) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-slate-800">QR kod rangi:</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomQr}
                      onChange={(e) => setIsCustomQr(e.target.checked)}
                      className="rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <span>Maxsus</span>
                  </label>
                  {isCustomQr && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={qrColor}
                        onChange={(e) => setQrColor(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-[11px] font-mono font-bold text-slate-500">{qrColor}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                {qrPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setQrColor(c);
                      setIsCustomQr(false);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                      qrColor.toUpperCase() === c.toUpperCase()
                        ? "ring-2 ring-brand ring-offset-2 scale-110 border-transparent shadow-xs"
                        : "border-slate-300 hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4. Main Text & Size */}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8">
                <label className="block text-xs font-black text-slate-800 mb-1">Asosiy matn:</label>
                <input
                  type="text"
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  placeholder="Masalan: Online buyurtma"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-black text-slate-800 mb-1">Matn hajmi:</label>
                <input
                  type="number"
                  value={mainTextSize}
                  onChange={(e) => setMainTextSize(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-center text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* 5. Sub Text & Size */}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8">
                <label className="block text-xs font-black text-slate-800 mb-1">Qo'shimcha tavsif:</label>
                <input
                  type="text"
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  placeholder="Masalan: Menyuni ko'rish uchun QR kodni skanerlang"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-black text-slate-800 mb-1">Matn hajmi:</label>
                <input
                  type="number"
                  value={subTextSize}
                  onChange={(e) => setSubTextSize(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center text-slate-900 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* 6. Logo Section (matching robosell.uz) */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-800">Logotip:</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded border-slate-300 text-brand focus:ring-brand"
                  />
                  <span>Teykertda ko'rsatish</span>
                </label>
              </div>

              {showLogo && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <Camera className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {logoUrl ? "Logotip yuklangan" : "Logotip yuklanmagan"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        JPEG, PNG yoki WEBP formatidagi rasmni yuklang. Maks: 10 MB
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors shrink-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand" />
                    <span>{uploadingLogo ? "Yuklanmoqda..." : "Rasm yuklash"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 7. Save Settings Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-dark text-white font-black text-xs shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saqlanmoqda..." : "Saqlash"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: REALISTIC STAND PREVIEW (Jonli ko'rish) */}
        <div className="lg:col-span-6 space-y-4 sticky top-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-xs">
            <span className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Jonli ko'rish (Table Tent Mockup):</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
              {paperSize} format
            </span>
          </div>

          {/* Printable Tent Card Mockup */}
          <div className="flex justify-center p-4 bg-slate-100/80 rounded-3xl border border-slate-200">
            <div
              id="printable-qr-stand"
              className="w-full max-w-sm rounded-3xl shadow-2xl p-7 text-center flex flex-col justify-between items-center transition-all duration-300 relative border border-black/5"
              style={{
                backgroundColor: bgColor,
                color: bgColor === "#0F172A" || bgColor === "#991B1B" ? "#FFFFFF" : "#0F172A",
                minHeight: paperSize === "A5" ? "520px" : "440px"
              }}
            >
              {/* Top Logo */}
              {showLogo && (
                <div className="w-full flex justify-center mb-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="h-10 max-w-[140px] object-contain rounded-lg p-0.5 bg-white/40 shadow-2xs"
                    />
                  ) : (
                    <div className="px-3 py-1 rounded-xl bg-slate-900/10 text-xs font-black tracking-wider">
                      {store?.name || "STOREBOX"}
                    </div>
                  )}
                </div>
              )}

              {/* Main Headline */}
              <div className="space-y-1 my-2">
                <h2
                  className="font-black tracking-tight leading-tight"
                  style={{
                    fontSize: `${mainTextSize}px`,
                    color: bgColor === "#0F172A" || bgColor === "#991B1B" ? "#FFFFFF" : mainTextColor
                  }}
                >
                  {mainText}
                </h2>
                <p
                  className="leading-snug"
                  style={{
                    fontSize: `${subTextSize}px`,
                    color: bgColor === "#0F172A" || bgColor === "#991B1B" ? "#CBD5E1" : subTextColor
                  }}
                >
                  {subText}
                </p>
              </div>

              {/* QR Code Canvas */}
              <div className="p-4 bg-white rounded-3xl shadow-md border border-slate-100 my-3 flex items-center justify-center relative">
                <canvas ref={canvasRef} className="w-48 h-48 sm:w-56 sm:h-56 block rounded-xl" />
              </div>

              {/* Footer Domain & Badge */}
              <div className="space-y-1 mt-2">
                <div className="font-mono text-xs font-bold tracking-tight opacity-80">
                  {storeUrl}
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-60">
                  STOREBOX BILAN JIXOZLANGAN
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="py-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>PDF yuklab olish</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
