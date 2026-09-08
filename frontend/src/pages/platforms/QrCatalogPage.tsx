import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  RefreshCw
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Settings State
  const [paperSize, setPaperSize] = useState("A5");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [qrColor, setQrColor] = useState("#0F172A");
  const [mainText, setMainText] = useState("Online menyu va buyurtma");
  const [mainTextSize, setMainTextSize] = useState(24);
  const [mainTextColor, setMainTextColor] = useState("#0F172A");
  const [subText, setSubText] = useState("Menyuni ko'rish uchun QR kodni skanerlang");
  const [subTextSize, setSubTextSize] = useState(13);
  const [subTextColor, setSubTextColor] = useState("#64748B");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [qriousReady, setQriousReady] = useState(false);

  // Palettes
  const bgPalette = ["#FFFFFF", "#F8FAFC", "#F1F5F9", "#FEF3C7", "#DCFCE7", "#E0E7FF", "#FCE7F3", "#0F172A"];
  const qrPalette = ["#0F172A", "#10B981", "#2563EB", "#7C3AED", "#D97706", "#DC2626", "#000000"];

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
      setMainText(qrData.qr_main_text || qrData.store_name || "Online buyurtma");
      setMainTextSize(qrData.qr_main_text_size || 24);
      setMainTextColor(qrData.qr_main_text_color || "#0F172A");
      setSubText(qrData.qr_sub_text || "Menyuni ko'rish uchun QR kodni skanerlang");
      setSubTextSize(qrData.qr_sub_text_size || 13);
      setSubTextColor(qrData.qr_sub_text_color || "#64748B");
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
      size: 400,
      background: bgColor === "#0F172A" ? "#0F172A" : "#FFFFFF",
      foreground: qrColor,
      level: "H"
    });
  };

  useEffect(() => {
    drawQR();
  }, [qriousReady, bgColor, qrColor, qrData?.store_url]);

  // 4. Save Settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err?.response?.data?.error || "Saqlashda xatolik." });
    } finally {
      setSaving(false);
    }
  };

  // 5. Download PNG
  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-katalog-${store?.subdomain || "storebox"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // 6. Print
  const handlePrint = () => {
    window.print();
  };

  const storeUrl = qrData?.store_url || `https://${store?.subdomain || "demo"}.storebox.uz`;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            onClick={handleDownload}
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
        {/* LEFT COLUMN: CONTROLS */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Paper Size */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Qog'oz o'lchami:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaperSize("A5")}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paperSize === "A5"
                      ? "border-brand bg-emerald-50 text-brand font-black ring-1 ring-brand"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>A5 qog'oz (148 x 210 mm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperSize("A6")}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    paperSize === "A6"
                      ? "border-brand bg-emerald-50 text-brand font-black ring-1 ring-brand"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <File className="w-4 h-4" />
                  <span>A6 qog'oz (105 x 148 mm)</span>
                </button>
              </div>
            </div>

            {/* 2. Background Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700">Fon rangi:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-500">{bgColor}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                {bgPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBgColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                      bgColor.toUpperCase() === c.toUpperCase()
                        ? "ring-2 ring-brand ring-offset-2 scale-110 border-transparent"
                        : "border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 3. QR Code Color */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700">QR kod rangi:</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-500">{qrColor}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 items-center">
                {qrPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setQrColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-8 h-8 rounded-xl border transition-all cursor-pointer ${
                      qrColor.toUpperCase() === c.toUpperCase()
                        ? "ring-2 ring-brand ring-offset-2 scale-110 border-transparent"
                        : "border-slate-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* 4. Main Text */}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1">Asosiy matn:</label>
                <input
                  type="text"
                  value={mainText}
                  onChange={(e) => setMainText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Hajmi (px):</label>
                <input
                  type="number"
                  value={mainTextSize}
                  onChange={(e) => setMainTextSize(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-center text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* 5. Sub Text */}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-8">
                <label className="block text-xs font-bold text-slate-700 mb-1">Qo'shimcha tavsif:</label>
                <input
                  type="text"
                  value={subText}
                  onChange={(e) => setSubText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-brand"
                />
              </div>
              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Hajmi (px):</label>
                <input
                  type="number"
                  value={subTextSize}
                  onChange={(e) => setSubTextSize(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center text-slate-800 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-2xl bg-brand hover:bg-brand-dark text-white font-extrabold text-xs shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: LIVE PRINTABLE TEIKERT PREVIEW */}
        <div className="lg:col-span-6 flex flex-col items-center sticky top-6">
          <div className="w-full max-w-sm">
            <div className="text-center text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              Jonli Bosma Maket ({paperSize})
            </div>

            {/* THE PRINTABLE TABLE TENT CARD */}
            <div
              id="printableCard"
              style={{ backgroundColor: bgColor }}
              className={`w-full rounded-3xl border-2 border-slate-300 shadow-2xl p-8 flex flex-col items-center justify-between text-center transition-all ${
                paperSize === "A5" ? "min-h-[520px]" : "min-h-[420px]"
              }`}
            >
              {/* Top: Store Branding */}
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto text-base font-black shadow-md">
                  {store?.name ? store.name.charAt(0).toUpperCase() : "S"}
                </div>
                <div
                  style={{
                    fontSize: `${mainTextSize}px`,
                    color: bgColor === "#0F172A" ? "#FFFFFF" : mainTextColor
                  }}
                  className="font-black tracking-tight leading-tight"
                >
                  {mainText}
                </div>
                <div
                  style={{
                    fontSize: `${subTextSize}px`,
                    color: bgColor === "#0F172A" ? "#94A3B8" : subTextColor
                  }}
                  className="font-medium max-w-xs mx-auto leading-normal"
                >
                  {subText}
                </div>
              </div>

              {/* Middle: Crisp Canvas QR Code */}
              <div className="my-6 p-4 rounded-3xl bg-white shadow-md border border-slate-200/80 inline-block">
                <canvas ref={canvasRef} className="w-48 h-48 block mx-auto rounded-xl" />
              </div>

              {/* Bottom: URL Link & Power tag */}
              <div className="space-y-1">
                <div
                  style={{ color: bgColor === "#0F172A" ? "#E2E8F0" : "#1E293B" }}
                  className="text-xs font-mono font-black"
                >
                  {storeUrl}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  StoreBox bilan jihozlangan
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
