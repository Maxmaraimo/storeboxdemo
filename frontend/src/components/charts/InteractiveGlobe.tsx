import React, { useEffect, useRef, useState } from "react";

interface MarkerLocation {
  name: string;
  lat: number;
  lng: number;
  orders: number;
  visitors: number;
  active: boolean;
}

const DEFAULT_MARKERS: MarkerLocation[] = [
  { name: "Toshkent, O'zbekiston", lat: 41.2995, lng: 69.2401, orders: 18, visitors: 42, active: true },
  { name: "Samarqand, O'zbekiston", lat: 39.6542, lng: 66.9597, orders: 7, visitors: 19, active: true },
  { name: "Buxoro, O'zbekiston", lat: 39.7681, lng: 64.4556, orders: 4, visitors: 11, active: true },
  { name: "Andijon, O'zbekiston", lat: 40.7821, lng: 72.3442, orders: 5, visitors: 15, active: true },
  { name: "Farg'ona, O'zbekiston", lat: 40.3842, lng: 71.7843, orders: 3, visitors: 12, active: true },
  { name: "Namangan, O'zbekiston", lat: 41.0011, lng: 71.6683, orders: 4, visitors: 14, active: true },
  { name: "Almaty, Qozog'iston", lat: 43.2389, lng: 76.8897, orders: 2, visitors: 8, active: false },
  { name: "Moskva, Rossiya", lat: 55.7558, lng: 37.6173, orders: 3, visitors: 9, active: false },
  { name: "Istanbul, Turkiya", lat: 41.0082, lng: 28.9784, orders: 2, visitors: 6, active: false },
  { name: "Dubai, BAA", lat: 25.2048, lng: 55.2708, orders: 1, visitors: 4, active: false },
];

export const InteractiveGlobe: React.FC<{
  size?: number;
  className?: string;
  onMarkerSelect?: (marker: MarkerLocation) => void;
}> = ({ size = 480, className = "", onMarkerSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeMarker, setActiveMarker] = useState<MarkerLocation>(DEFAULT_MARKERS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const rotationRef = useRef({ phi: -0.7, theta: 0.35 });
  const mouseRef = useRef({ lastX: 0, lastY: 0 });

  // Generate fibonacci lattice dots for the globe surface (continents simulated via land probability)
  const dotsRef = useRef<Array<{ x: number; y: number; z: number; isLand: boolean }>>([]);

  useEffect(() => {
    const dots: Array<{ x: number; y: number; z: number; isLand: boolean }> = [];
    const N = 1200;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < N; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / N);

      const x = Math.cos(theta) * Math.sin(phi);
      const y = Math.cos(phi);
      const z = Math.sin(theta) * Math.sin(phi);

      // Lat/Lng in degrees for rough land/ocean mask
      const lat = (Math.PI / 2 - phi) * (180 / Math.PI);
      let lng = (theta % (2 * Math.PI)) * (180 / Math.PI);
      if (lng > 180) lng -= 360;

      // Approximate land masses (Eurasia, Africa, Americas, etc.)
      const isEurasia = lat > 10 && lat < 75 && lng > -10 && lng < 145;
      const isAfrica = lat > -35 && lat < 37 && lng > -20 && lng < 52;
      const isAmericas = (lat > -55 && lat < 70 && lng > -130 && lng < -35);
      const isAustralia = lat > -45 && lat < -10 && lng > 110 && lng < 155;
      const isLand = isEurasia || isAfrica || isAmericas || isAustralia;

      dots.push({ x, y, z, isLand });
    }
    dotsRef.current = dots;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let pulse = 0;

    const render = () => {
      pulse += 0.05;
      if (!isDragging) {
        rotationRef.current.phi += 0.0035; // smooth auto rotation
      }

      ctx.clearRect(0, 0, size, size);

      const radius = size * 0.4;
      const centerX = size / 2;
      const centerY = size / 2;

      const { phi, theta } = rotationRef.current;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      // 1. Globe background sphere shadow / aura
      const aura = ctx.createRadialGradient(
        centerX - radius * 0.2,
        centerY - radius * 0.2,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      aura.addColorStop(0, "rgba(37, 99, 235, 0.08)");
      aura.addColorStop(0.7, "rgba(37, 99, 235, 0.04)");
      aura.addColorStop(1, "rgba(37, 99, 235, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 24, 0, Math.PI * 2);
      ctx.fill();

      // Globe sphere base outline
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(203, 213, 225, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Atmospheric rim gradient
      const rim = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.85,
        centerX,
        centerY,
        radius
      );
      rim.addColorStop(0, "rgba(37, 99, 235, 0)");
      rim.addColorStop(1, "rgba(59, 130, 246, 0.15)");
      ctx.fillStyle = rim;
      ctx.fill();
      ctx.restore();

      // 2. Render surface dots
      const dots = dotsRef.current;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // 3D rotation matrix
        // Rotate around Y axis (phi), then X axis (theta)
        const x1 = d.x * cosPhi - d.z * sinPhi;
        const z1 = d.x * sinPhi + d.z * cosPhi;
        const y1 = d.y * cosTheta - z1 * sinTheta;
        const z2 = d.y * sinTheta + z1 * cosTheta;

        // Front facing check
        if (z2 > -0.05) {
          const screenX = centerX + x1 * radius;
          const screenY = centerY + y1 * radius;
          const depthAlpha = Math.max(0.12, (z2 + 0.1) / 1.1);

          ctx.beginPath();
          const dotRadius = d.isLand ? 1.8 * depthAlpha + 0.6 : 0.9 * depthAlpha;
          ctx.arc(screenX, screenY, Math.max(0.5, dotRadius), 0, Math.PI * 2);

          if (d.isLand) {
            ctx.fillStyle = `rgba(37, 99, 235, ${0.45 * depthAlpha + 0.25})`;
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${0.2 * depthAlpha})`;
          }
          ctx.fill();
        }
      }

      // 3. Render markers
      DEFAULT_MARKERS.forEach((m) => {
        // Convert lat/lng to 3D unit sphere coords
        const phiM = ((180 - m.lng) * Math.PI) / 180;
        const thetaM = (m.lat * Math.PI) / 180;

        const x = -Math.cos(thetaM) * Math.sin(phiM);
        const y = -Math.sin(thetaM);
        const z = -Math.cos(thetaM) * Math.cos(phiM);

        const x1 = x * cosPhi - z * sinPhi;
        const z1 = x * sinPhi + z * cosPhi;
        const y1 = y * cosTheta - z1 * sinTheta;
        const z2 = y * sinTheta + z1 * cosTheta;

        // Only draw if marker is facing the camera
        if (z2 > 0.05) {
          const screenX = centerX + x1 * radius;
          const screenY = centerY + y1 * radius;
          const isSelected = activeMarker.name === m.name;

          // Pulsing halo ring
          const ringRadius = 4 + (Math.sin(pulse) + 1) * 3;
          ctx.beginPath();
          ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected
            ? "rgba(37, 99, 235, 0.85)"
            : "rgba(16, 185, 129, 0.65)";
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Central glowing dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "#2563EB" : "#10B981";
          ctx.fill();

          ctx.beginPath();
          ctx.arc(screenX, screenY, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.fill();

          // Marker tooltips for primary city (Tashkent)
          if (m.name.includes("Toshkent") || isSelected) {
            ctx.font = "bold 10px sans-serif";
            const text = `${m.name.split(",")[0]}: ${m.orders} zakaz`;
            const textWidth = ctx.measureText(text).width;
            const bubbleX = screenX + 8;
            const bubbleY = screenY - 14;

            ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
            ctx.beginPath();
            ctx.roundRect(bubbleX - 4, bubbleY - 10, textWidth + 8, 16, 4);
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(text, bubbleX, bubbleY + 2);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [size, isDragging, activeMarker]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    mouseRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - mouseRef.current.lastX;
    const deltaY = e.clientY - mouseRef.current.lastY;
    rotationRef.current.phi += deltaX * 0.008;
    rotationRef.current.theta = Math.max(
      -1.2,
      Math.min(1.2, rotationRef.current.theta - deltaY * 0.008)
    );
    mouseRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <div
        className="cursor-grab active:cursor-grabbing relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="max-w-full h-auto drop-shadow-sm"
        />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 backdrop-blur-xs pointer-events-none">
          Aylantirish uchun sichqonchani suring
        </div>
      </div>

      {/* Quick location chips underneath */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-lg">
        {DEFAULT_MARKERS.slice(0, 5).map((m) => (
          <button
            key={m.name}
            type="button"
            onClick={() => {
              setActiveMarker(m);
              if (onMarkerSelect) onMarkerSelect(m);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeMarker.name === m.name
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {m.name.split(",")[0]} ({m.orders})
          </button>
        ))}
      </div>
    </div>
  );
};
