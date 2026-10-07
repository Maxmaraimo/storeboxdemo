import React, { useEffect, useRef } from "react";

interface FluidOrbProps {
  size?: number;
  className?: string;
  hueShift?: number;
  interactive?: boolean;
}

export const FluidOrb: React.FC<FluidOrbProps> = ({
  size = 280,
  className = "",
  hueShift = 0,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;
    let mouseX = size / 2;
    let mouseY = size / 2;
    let targetMouseX = size / 2;
    let targetMouseY = size / 2;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      t += 0.02;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.42;

      // Base background gradient inside circular clip
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Deep vibrant layered radial gradients simulating liquid fluid
      const grad1X = centerX + Math.sin(t * 0.7) * (radius * 0.35) + (mouseX - centerX) * 0.15;
      const grad1Y = centerY + Math.cos(t * 0.8) * (radius * 0.35) + (mouseY - centerY) * 0.15;
      const g1 = ctx.createRadialGradient(grad1X, grad1Y, 0, centerX, centerY, radius * 1.1);
      g1.addColorStop(0, `hsla(${220 + hueShift}, 95%, 68%, 1)`); // Vibrant sky blue
      g1.addColorStop(0.45, `hsla(${245 + hueShift}, 85%, 60%, 0.85)`); // Deep indigo
      g1.addColorStop(0.8, `hsla(${275 + hueShift}, 75%, 45%, 0.9)`); // Royal violet
      g1.addColorStop(1, `hsla(${230 + hueShift}, 90%, 25%, 1)`);

      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, size, size);

      // Layer 2: Secondary organic floating wave blob
      const grad2X = centerX - Math.cos(t * 0.9) * (radius * 0.4);
      const grad2Y = centerY + Math.sin(t * 0.6) * (radius * 0.3);
      const g2 = ctx.createRadialGradient(grad2X, grad2Y, 0, grad2X, grad2Y, radius * 0.7);
      g2.addColorStop(0, `hsla(${195 + hueShift}, 100%, 72%, 0.75)`); // Cyan highlight
      g2.addColorStop(0.5, `hsla(${225 + hueShift}, 90%, 65%, 0.3)`);
      g2.addColorStop(1, "transparent");

      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, size, size);

      // Layer 3: Warm luminous interior core (sunset/coral refraction)
      const grad3X = centerX + Math.cos(t * 1.1) * (radius * 0.25);
      const grad3Y = centerY - Math.sin(t * 1.2) * (radius * 0.25);
      const g3 = ctx.createRadialGradient(grad3X, grad3Y, 0, grad3X, grad3Y, radius * 0.55);
      g3.addColorStop(0, `hsla(${330 + hueShift}, 90%, 75%, 0.6)`); // Soft rose reflection
      g3.addColorStop(0.6, `hsla(${280 + hueShift}, 80%, 60%, 0.2)`);
      g3.addColorStop(1, "transparent");

      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, size, size);

      // Layer 4: Glass specular rim reflection
      const rim = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      rim.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      rim.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
      rim.addColorStop(0.85, "rgba(255, 255, 255, 0.0)");
      rim.addColorStop(1, "rgba(255, 255, 255, 0.25)");

      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, size, size);

      ctx.restore();

      // Outer soft glow aura
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [size, hueShift, interactive]);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer ambient blur glow */}
      <div
        className="absolute inset-4 rounded-full blur-2xl opacity-60 dark:opacity-40 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, hsla(${225 + hueShift}, 85%, 60%, 0.8) 0%, hsla(${280 + hueShift}, 75%, 50%, 0.4) 60%, transparent 100%)`,
        }}
      />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="relative z-10 w-full h-full drop-shadow-[0_12px_32px_rgba(37,99,235,0.25)]"
      />
    </div>
  );
};
