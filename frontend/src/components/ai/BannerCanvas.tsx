import React, { useEffect, useRef, useState } from "react";
import { Download, Sparkles, RefreshCw, Palette, Layers, Check } from "lucide-react";

export interface BannerData {
  headline: string;
  subheadline?: string;
  badge?: string;
  product_name?: string;
  price?: number;
  old_price?: number;
  theme?: "dark_luxury" | "emerald_fresh" | "sunset_gradient" | "clean_white";
  store_name?: string;
  image_url?: string;
}

interface BannerCanvasProps {
  data: BannerData;
  onRemoveBg?: () => void;
}

export const BannerCanvas: React.FC<BannerCanvasProps> = ({ data, onRemoveBg }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTheme, setCurrentTheme] = useState<
    "dark_luxury" | "emerald_fresh" | "sunset_gradient" | "clean_white"
  >(data.theme || "dark_luxury");
  const [aspectRatio, setAspectRatio] = useState<"banner" | "square">("banner");
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = aspectRatio === "banner" ? 1200 : 1080;
    const height = aspectRatio === "banner" ? 630 : 1080;
    canvas.width = width;
    canvas.height = height;

    // Theme pallette configuration
    const themes = {
      dark_luxury: {
        bgStart: "#262A36",
        bgEnd: "#0C0D10",
        accent: "#8B5CF6", // violet
        badgeBg: "#7C3AED",
        textPrimary: "#FFFFFF",
        textSecondary: "#94A3B8",
        cardBg: "rgba(24, 26, 32, 0.9)",
        mockupColor: "#2A2D3A",
      },
      emerald_fresh: {
        bgStart: "#0F4C3A",
        bgEnd: "#051A14",
        accent: "#10B981", // emerald
        badgeBg: "#059669",
        textPrimary: "#FFFFFF",
        textSecondary: "#A7F3D0",
        cardBg: "rgba(6, 44, 32, 0.9)",
        mockupColor: "#144838",
      },
      sunset_gradient: {
        bgStart: "#7C2D12",
        bgEnd: "#180A1E",
        accent: "#F97316", // orange
        badgeBg: "#EA580C",
        textPrimary: "#FFFFFF",
        textSecondary: "#FED7AA",
        cardBg: "rgba(43, 20, 24, 0.9)",
        mockupColor: "#3D2224",
      },
      clean_white: {
        bgStart: "#FFFFFF",
        bgEnd: "#E2E8F0",
        accent: "#6366F1", // indigo
        badgeBg: "#4F46E5",
        textPrimary: "#0F172A",
        textSecondary: "#64748B",
        cardBg: "rgba(248, 250, 252, 0.95)",
        mockupColor: "#E2E8F0",
      },
    };

    const t = themes[currentTheme];

    // 1. Draw smooth Radial Gradient Background
    const cx = width * 0.5;
    const cy = height * 0.45;
    const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.75);
    grad.addColorStop(0, t.bgStart);
    grad.addColorStop(1, t.bgEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Geometric Ambient Light Rings
    ctx.save();
    ctx.strokeStyle = t.accent;
    ctx.globalAlpha = 0.12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-40, -40, 240, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width + 60, height + 60, 280, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Store Watermark Pill
    const storeText = `STOREBOX • ${(data.store_name || "MY STORE").toUpperCase()}`;
    ctx.save();
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.2;
    roundRect(ctx, 60, 50, 280, 36, 10);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = t.textSecondary;
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillText(storeText, 76, 73);

    // 4. Promo Badge Pill
    const badgeText = (data.badge || "-20% СКИДКА").toUpperCase();
    ctx.save();
    ctx.fillStyle = t.badgeBg;
    roundRect(ctx, 60, 110, 240, 44, 12);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
    ctx.fillText(badgeText, 80, 138);

    // 5. Main Headline
    ctx.fillStyle = t.textPrimary;
    ctx.font = "900 42px system-ui, -apple-system, sans-serif";
    const headline = data.headline || "ПРЕМИУМ КОЛЛЕКЦИЯ 2026";
    ctx.fillText(headline.slice(0, 28), 60, 205);

    // 6. Subheadline
    ctx.fillStyle = t.textSecondary;
    ctx.font = "normal 18px system-ui, -apple-system, sans-serif";
    const subheadline =
      data.subheadline || "Эксклюзивные предложения ограниченного тиража со скидкой";
    ctx.fillText(subheadline.slice(0, 48), 60, 248);

    // 7. Price Badge Card
    if (data.price) {
      const cardY = aspectRatio === "banner" ? 310 : 380;
      ctx.save();
      ctx.fillStyle = t.cardBg;
      ctx.strokeStyle = t.accent;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 60, cardY, 360, 85, 16);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = t.textSecondary;
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.fillText("СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ:", 85, cardY + 28);

      ctx.fillStyle = t.textPrimary;
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(`${Number(data.price).toLocaleString()} UZS`, 85, cardY + 62);

      if (data.old_price && data.old_price > data.price) {
        ctx.fillStyle = "#94A3B8";
        ctx.font = "normal 16px system-ui, -apple-system, sans-serif";
        const oldStr = `${Number(data.old_price).toLocaleString()} UZS`;
        const oldX = 260;
        const oldY = cardY + 60;
        ctx.fillText(oldStr, oldX, oldY);
        // Strikethrough line
        const w = ctx.measureText(oldStr).width;
        ctx.strokeStyle = "#94A3B8";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(oldX - 2, oldY - 5);
        ctx.lineTo(oldX + w + 2, oldY - 5);
        ctx.stroke();
      }
    }

    // 8. CTA Button
    const ctaY = aspectRatio === "banner" ? 440 : 510;
    ctx.save();
    ctx.fillStyle = t.accent;
    roundRect(ctx, 60, ctaY, 220, 56, 14);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
    ctx.fillText("ЗАКАЗАТЬ СЕЙЧАС", 92, ctaY + 35);

    // 9. Right-side Studio Pedestal & Product Artwork
    const prodCx = aspectRatio === "banner" ? width * 0.76 : width * 0.5;
    const prodCy = aspectRatio === "banner" ? height * 0.54 : height * 0.74;

    // Pedestal Shadow
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.ellipse(prodCx, prodCy + 150, 180, 45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Pedestal Disc
    ctx.save();
    ctx.fillStyle = t.mockupColor;
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(prodCx, prodCy + 130, 160, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // If an image URL is supplied, draw loaded image
    if (data.image_url) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = data.image_url;
      img.onload = () => {
        const iw = 280;
        const ih = (img.height / img.width) * iw;
        ctx.drawImage(img, prodCx - iw / 2, prodCy + 100 - ih, iw, ih);
      };
      img.onerror = () => {
        drawVectorSilhouette(ctx, prodCx, prodCy - 10, t.accent);
      };
    } else {
      drawVectorSilhouette(ctx, prodCx, prodCy - 10, t.accent);
    }
  }, [data, currentTheme, aspectRatio]);

  // Helper: Vector Silhouette on Canvas
  const drawVectorSilhouette = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    accent: string
  ) => {
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.85;

    // Stylish Hoodie Silhouette
    roundRect(ctx, cx - 110, cy - 60, 220, 180, 25);
    ctx.fill();

    // Hood
    ctx.beginPath();
    ctx.ellipse(cx, cy - 110, 70, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner collar cut
    ctx.fillStyle = "#1E2028";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 65, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pocket
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    roundRect(ctx, cx - 65, cy + 40, 130, 60, 12);
    ctx.fill();
    ctx.restore();
  };

  // Helper: Rounded Rectangle
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Download high-resolution PNG from Canvas
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png", 1.0);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storebox_banner_${(data.headline || "promo").toLowerCase().replace(/\s+/g, "_")}.png`;
    a.click();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181B] border border-violet-200/80 dark:border-violet-800/40 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400">
          <Sparkles className="w-4 h-4" />
          <span>HTML5 Canvas Promo Visualizer</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60">
          {aspectRatio === "banner" ? "1200x630 HD Banner" : "1080x1080 Post"}
        </span>
      </div>

      {/* HTML5 Canvas Preview Frame */}
      <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner flex justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-auto max-h-[300px] object-contain cursor-pointer transition-all"
          title="Живой рекламный баннер StoreBox (HTML5 Canvas)"
        />
      </div>

      {/* Theme and Format Switcher Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px]">
        {/* Themes Selector */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-medium mr-1">Тема:</span>
          {(
            [
              { id: "dark_luxury", label: "Dark", color: "bg-slate-900 border-slate-700" },
              { id: "emerald_fresh", label: "Emerald", color: "bg-emerald-700 border-emerald-500" },
              { id: "sunset_gradient", label: "Sunset", color: "bg-orange-700 border-orange-500" },
              { id: "clean_white", label: "White", color: "bg-slate-100 border-slate-300" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setCurrentTheme(t.id)}
              className={`w-5 h-5 rounded-full border-2 ${t.color} transition-all cursor-pointer ${
                currentTheme === t.id ? "scale-110 ring-2 ring-violet-500 ring-offset-1" : "opacity-70"
              }`}
              title={t.label}
            />
          ))}
        </div>

        {/* Format Selector */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 font-medium">
          <button
            type="button"
            onClick={() => setAspectRatio("banner")}
            className={`px-2 py-0.5 rounded-md text-[10px] cursor-pointer ${
              aspectRatio === "banner"
                ? "bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 font-bold shadow-2xs"
                : "text-slate-500"
            }`}
          >
            16:9
          </button>
          <button
            type="button"
            onClick={() => setAspectRatio("square")}
            className={`px-2 py-0.5 rounded-md text-[10px] cursor-pointer ${
              aspectRatio === "square"
                ? "bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 font-bold shadow-2xs"
                : "text-slate-500"
            }`}
          >
            1:1
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleDownload}
          className="p-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
        >
          {downloadSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-300" />
              <span>Баннер сохранен!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Скачать баннер (PNG)</span>
            </>
          )}
        </button>

        {onRemoveBg ? (
          <button
            type="button"
            onClick={onRemoveBg}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Удалить фон (rembg)</span>
          </button>
        ) : (
          <a
            href={data.image_url || "#"}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition text-center"
          >
            <span>Оригинал HD</span>
          </a>
        )}
      </div>
    </div>
  );
};
