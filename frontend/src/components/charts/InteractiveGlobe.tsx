import React, { useEffect, useRef, useState } from "react";
import { Globe2, RotateCcw, ZoomIn, ZoomOut, Sparkles } from "lucide-react";

export interface MarkerLocation {
  name: string;
  country: string;
  lat: number;
  lng: number;
  orders: number;
  visitors: number;
  revenue: string;
  active: boolean;
}

const DEFAULT_MARKERS: MarkerLocation[] = [
  { name: "Ташкент", country: "Узбекистан", lat: 41.2995, lng: 69.2401, orders: 18, visitors: 42, revenue: "3 420 000 UZS", active: true },
  { name: "Самарканд", country: "Узбекистан", lat: 39.6542, lng: 66.9597, orders: 7, visitors: 19, revenue: "1 180 000 UZS", active: true },
  { name: "Бухара", country: "Узбекистан", lat: 39.7681, lng: 64.4556, orders: 5, visitors: 14, revenue: "890 000 UZS", active: true },
  { name: "Андижан", country: "Узбекистан", lat: 40.7821, lng: 72.3442, orders: 6, visitors: 16, revenue: "950 000 UZS", active: true },
  { name: "Фергана", country: "Узбекистан", lat: 40.3842, lng: 71.7843, orders: 4, visitors: 12, revenue: "640 000 UZS", active: true },
  { name: "Наманган", country: "Узбекистан", lat: 41.0011, lng: 71.6683, orders: 4, visitors: 13, revenue: "610 000 UZS", active: true },
  { name: "Нукус", country: "Узбекистан", lat: 42.4619, lng: 59.6166, orders: 2, visitors: 7, revenue: "320 000 UZS", active: true },
  { name: "Алматы", country: "Казахстан", lat: 43.2389, lng: 76.8897, orders: 3, visitors: 9, revenue: "540 000 UZS", active: false },
  { name: "Москва", country: "Россия", lat: 55.7558, lng: 37.6173, orders: 4, visitors: 11, revenue: "780 000 UZS", active: false },
  { name: "Стамбул", country: "Турция", lat: 41.0082, lng: 28.9784, orders: 2, visitors: 6, revenue: "410 000 UZS", active: false },
  { name: "Дубай", country: "ОАЭ", lat: 25.2048, lng: 55.2708, orders: 2, visitors: 5, revenue: "690 000 UZS", active: false },
];

// Detailed continent & country polygons [lat, lng][] for realistic 3D Earth rendering
const LAND_POLYGONS: Array<{ name: string; highlight?: boolean; coords: Array<[number, number]> }> = [
  // Uzbekistan (Highlighted in Emerald/Teal)
  {
    name: "Uzbekistan",
    highlight: true,
    coords: [
      [45.5, 56.0], [45.0, 58.5], [43.6, 61.5], [42.5, 65.5], [41.9, 69.2],
      [41.4, 71.8], [40.8, 73.1], [40.1, 71.5], [40.2, 69.3], [37.2, 67.8],
      [38.5, 64.2], [40.1, 62.2], [41.3, 60.1], [41.8, 56.0], [45.5, 56.0],
    ],
  },
  // Kazakhstan & Central Asia
  {
    name: "CentralAsia",
    coords: [
      [54.5, 50.0], [55.2, 61.0], [54.0, 73.0], [50.5, 83.0], [46.5, 82.0],
      [43.0, 80.0], [42.0, 75.0], [40.5, 74.0], [37.0, 71.5], [36.5, 61.0],
      [38.0, 54.0], [42.5, 52.5], [47.0, 51.5], [51.0, 50.0], [54.5, 50.0],
    ],
  },
  // Eurasia (Mainland Europe + Asia)
  {
    name: "Eurasia",
    coords: [
      [36.0, -9.0], [43.5, -9.0], [48.5, -4.5], [51.0, 2.0], [54.0, 8.5],
      [58.0, 10.0], [63.0, 10.0], [70.0, 20.0], [71.0, 28.0], [69.0, 40.0],
      [70.0, 60.0], [73.0, 80.0], [76.0, 105.0], [72.0, 130.0], [66.0, 170.0],
      [60.0, 162.0], [52.0, 141.0], [43.0, 132.0], [38.0, 121.0], [31.0, 122.0],
      [22.5, 114.0], [18.0, 106.0], [9.5, 105.0], [1.3, 103.8], [14.0, 98.0],
      [22.0, 91.0], [16.0, 81.0], [8.0, 77.5], [19.0, 72.8], [25.0, 67.0],
      [25.5, 57.0], [29.5, 48.5], [24.0, 55.0], [17.0, 54.0], [13.0, 45.0],
      [20.0, 40.0], [29.5, 34.5], [31.5, 34.5], [36.5, 36.0], [36.8, 28.0],
      [41.0, 29.0], [45.0, 36.0], [44.0, 28.5], [38.0, 24.0], [40.0, 20.0],
      [45.5, 13.5], [40.0, 18.0], [38.0, 15.5], [44.0, 8.5], [43.0, 3.0],
      [36.5, -5.5], [36.0, -9.0],
    ],
  },
  // Scandinavia & UK
  {
    name: "UK",
    coords: [
      [50.2, -5.2], [58.5, -3.1], [57.5, -1.8], [51.4, 1.3], [50.2, -5.2],
    ],
  },
  // Africa
  {
    name: "Africa",
    coords: [
      [35.8, -5.8], [37.2, 10.0], [32.5, 15.5], [31.5, 25.0], [31.5, 32.5],
      [22.0, 37.0], [12.0, 43.5], [11.8, 51.2], [2.0, 45.5], [-4.0, 39.8],
      [-15.0, 40.5], [-26.0, 33.0], [-34.2, 25.5], [-34.8, 18.5], [-28.0, 15.5],
      [-17.0, 11.8], [-6.0, 12.2], [4.0, 9.5], [4.5, -7.5], [10.0, -14.0],
      [14.8, -17.5], [21.0, -17.0], [28.0, -13.0], [35.8, -5.8],
    ],
  },
  // Madagascar
  {
    name: "Madagascar",
    coords: [
      [-12.2, 49.3], [-16.0, 50.2], [-25.0, 47.0], [-24.5, 43.8], [-16.0, 45.0], [-12.2, 49.3],
    ],
  },
  // North America
  {
    name: "NorthAmerica",
    coords: [
      [70.0, -160.0], [71.0, -130.0], [68.0, -105.0], [62.0, -75.0], [53.0, -56.0],
      [45.0, -61.0], [41.0, -70.0], [35.0, -75.5], [25.2, -80.2], [29.0, -83.0],
      [29.5, -94.0], [22.0, -97.5], [21.0, -87.0], [15.0, -83.5], [9.0, -79.5],
      [15.0, -93.0], [19.0, -104.5], [23.0, -106.5], [32.5, -117.2], [40.0, -124.2],
      [48.5, -124.8], [58.0, -137.0], [61.0, -150.0], [55.0, -163.0], [64.0, -166.0],
      [70.0, -160.0],
    ],
  },
  // Greenland
  {
    name: "Greenland",
    coords: [
      [60.0, -44.0], [68.0, -53.0], [76.0, -68.0], [82.0, -35.0], [76.0, -19.0], [68.0, -28.0], [60.0, -44.0],
    ],
  },
  // South America
  {
    name: "SouthAmerica",
    coords: [
      [11.0, -74.5], [10.5, -62.0], [5.0, -52.0], [-1.5, -48.0], [-6.0, -35.0],
      [-13.0, -38.5], [-23.0, -43.2], [-34.5, -54.0], [-42.0, -64.0], [-52.0, -69.0],
      [-55.0, -67.0], [-50.0, -75.0], [-38.0, -73.5], [-23.5, -70.5], [-12.0, -77.2],
      [-4.5, -81.2], [2.0, -79.0], [8.5, -78.0], [11.0, -74.5],
    ],
  },
  // Australia
  {
    name: "Australia",
    coords: [
      [-12.5, 131.0], [-12.0, 142.0], [-19.0, 146.5], [-28.0, 153.5], [-37.5, 150.0],
      [-38.5, 141.0], [-35.0, 136.0], [-32.0, 128.0], [-34.5, 115.0], [-26.0, 113.5],
      [-20.0, 119.0], [-15.0, 124.5], [-12.5, 131.0],
    ],
  },
  // Japan
  {
    name: "Japan",
    coords: [
      [31.5, 130.5], [35.0, 136.5], [35.7, 140.8], [41.5, 141.2], [39.5, 139.8], [35.5, 133.5], [31.5, 130.5],
    ],
  },
  // Indonesia / SE Asia Islands
  {
    name: "Indonesia",
    coords: [
      [5.5, 95.3], [-5.8, 105.5], [-8.2, 114.5], [-6.5, 106.8], [1.0, 102.0], [5.5, 95.3],
    ],
  },
];

// Helper: convert lat, lng (degrees) to 3D unit vector
function latLngToVec3(lat: number, lng: number) {
  const phi = ((180 - lng) * Math.PI) / 180;
  const theta = (lat * Math.PI) / 180;
  return {
    x: -Math.cos(theta) * Math.sin(phi),
    y: -Math.sin(theta),
    z: -Math.cos(theta) * Math.cos(phi),
  };
}

// Helper: rotate 3D vector by camera angles (phi around Y, theta around X)
function rotateVec3(
  v: { x: number; y: number; z: number },
  cosPhi: number,
  sinPhi: number,
  cosTheta: number,
  sinTheta: number
) {
  const x1 = v.x * cosPhi - v.z * sinPhi;
  const z1 = v.x * sinPhi + v.z * cosPhi;
  const y1 = v.y * cosTheta - z1 * sinTheta;
  const z2 = v.y * sinTheta + z1 * cosTheta;
  return { x: x1, y: y1, z: z2 };
}

export const InteractiveGlobe: React.FC<{
  size?: number;
  className?: string;
  onMarkerSelect?: (marker: MarkerLocation) => void;
}> = ({ size = 460, className = "", onMarkerSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeMarker, setActiveMarker] = useState<MarkerLocation>(DEFAULT_MARKERS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState<number>(1.08);

  // Camera centered on Uzbekistan (lat ~41°, lng ~69°) initially!
  // For lng=69°, phiM = (180-69)*pi/180 = 111° = 1.937 rad. Camera phi ~ -0.37 centers Uzbekistan!
  const rotationRef = useRef({ phi: -0.38, theta: 0.52 });
  const targetRotationRef = useRef<{ phi: number; theta: number } | null>(null);
  const mouseRef = useRef({ lastX: 0, lastY: 0 });

  // Focus camera on a specific lat/lng
  const focusLocation = (lat: number, lng: number, targetZoom?: number) => {
    const phiM = ((180 - lng) * Math.PI) / 180;
    // To bring point (lat, lng) to front (x1=0, z1>0):
    const desiredPhi = Math.PI - phiM;
    const desiredTheta = (lat * Math.PI) / 180;
    targetRotationRef.current = { phi: desiredPhi, theta: desiredTheta };
    setAutoRotate(false);
    if (targetZoom) setZoom(targetZoom);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let pulse = 0;

    const render = () => {
      pulse += 0.045;

      if (targetRotationRef.current && !isDragging) {
        const dPhi = targetRotationRef.current.phi - rotationRef.current.phi;
        const dTheta = targetRotationRef.current.theta - rotationRef.current.theta;
        rotationRef.current.phi += dPhi * 0.1;
        rotationRef.current.theta += dTheta * 0.1;
        if (Math.abs(dPhi) < 0.003 && Math.abs(dTheta) < 0.003) {
          targetRotationRef.current = null;
        }
      } else if (!isDragging && autoRotate) {
        rotationRef.current.phi += 0.0022;
      }

      ctx.clearRect(0, 0, size, size);

      const radius = size * 0.39 * zoom;
      const centerX = size / 2;
      const centerY = size / 2;

      const { phi, theta } = rotationRef.current;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      // 1. Soft atmospheric outer glow (Shopify Live View style)
      const outerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.82,
        centerX,
        centerY,
        radius * 1.18
      );
      outerGlow.addColorStop(0, "rgba(56, 189, 248, 0.18)");
      outerGlow.addColorStop(0.6, "rgba(99, 102, 241, 0.08)");
      outerGlow.addColorStop(1, "rgba(56, 189, 248, 0)");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // 2. Ocean Sphere Base with 3D lighting gradient
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      const oceanGrad = ctx.createRadialGradient(
        centerX - radius * 0.32,
        centerY - radius * 0.32,
        radius * 0.08,
        centerX,
        centerY,
        radius * 1.05
      );
      oceanGrad.addColorStop(0, "#eef6ff");
      oceanGrad.addColorStop(0.45, "#dbeafe");
      oceanGrad.addColorStop(0.82, "#bfdbfe");
      oceanGrad.addColorStop(1, "#93c5fd");
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      // 3. Graticule (Latitude & Longitude Grid Lines)
      ctx.strokeStyle = "rgba(100, 116, 139, 0.16)";
      ctx.lineWidth = 0.75;

      // Latitude parallels every 20 deg
      for (let lat = -60; lat <= 60; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lng = -180; lng <= 180; lng += 5) {
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > 0) {
            const sx = centerX + v.x * radius;
            const sy = centerY + v.y * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // Longitude meridians every 20 deg
      for (let lng = -180; lng < 180; lng += 20) {
        ctx.beginPath();
        let started = false;
        for (let lat = -80; lat <= 80; lat += 4) {
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > 0) {
            const sx = centerX + v.x * radius;
            const sy = centerY + v.y * radius;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // 4. Render Continents & Country Polygons
      LAND_POLYGONS.forEach((poly) => {
        const projected: Array<{ sx: number; sy: number; z: number }> = [];
        let visibleCount = 0;

        for (let i = 0; i < poly.coords.length; i++) {
          const [lat, lng] = poly.coords[i];
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > -0.15) visibleCount++;
          const clampedZ = Math.max(-0.1, v.z);
          const scale = clampedZ < 0 ? 1 / (1 - clampedZ * 0.2) : 1;
          projected.push({
            sx: centerX + v.x * radius * scale,
            sy: centerY + v.y * radius * scale,
            z: v.z,
          });
        }

        if (visibleCount >= 3) {
          ctx.beginPath();
          projected.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.sx, pt.sy);
            else ctx.lineTo(pt.sx, pt.sy);
          });
          ctx.closePath();

          if (poly.highlight) {
            // Uzbekistan highlighted in vibrant emerald green
            ctx.fillStyle = "rgba(16, 185, 129, 0.35)";
            ctx.strokeStyle = "rgba(5, 150, 105, 0.9)";
            ctx.lineWidth = 1.6;
          } else if (poly.name === "CentralAsia") {
            ctx.fillStyle = "rgba(241, 245, 249, 0.92)";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.7)";
            ctx.lineWidth = 1.1;
          } else {
            ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
            ctx.strokeStyle = "rgba(148, 163, 184, 0.65)";
            ctx.lineWidth = 1.0;
          }
          ctx.fill();
          ctx.stroke();
        }
      });

      // 5. Render Animated Order Arcs into Tashkent
      const tashkent = DEFAULT_MARKERS[0];
      DEFAULT_MARKERS.slice(1).forEach((dest, arcIdx) => {
        const steps = 28;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const lat = tashkent.lat + (dest.lat - tashkent.lat) * t;
          const lng = tashkent.lng + (dest.lng - tashkent.lng) * t;
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > 0.05) {
            // Elevate arc slightly off sphere surface
            const arcLift = 1 + Math.sin(t * Math.PI) * 0.06;
            const sx = centerX + v.x * radius * arcLift;
            const sy = centerY + v.y * radius * arcLift;
            if (!started) {
              ctx.moveTo(sx, sy);
              started = true;
            } else {
              ctx.lineTo(sx, sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = dest.active
          ? "rgba(16, 185, 129, 0.45)"
          : "rgba(99, 102, 241, 0.35)";
        ctx.lineWidth = 1.25;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated travelling packet along the arc
        const packetT = ((pulse * 0.35 + arcIdx * 0.21) % 1);
        const pLat = dest.lat + (tashkent.lat - dest.lat) * packetT;
        const pLng = dest.lng + (tashkent.lng - dest.lng) * packetT;
        const pv = rotateVec3(latLngToVec3(pLat, pLng), cosPhi, sinPhi, cosTheta, sinTheta);
        if (pv.z > 0.08) {
          const lift = 1 + Math.sin(packetT * Math.PI) * 0.06;
          ctx.beginPath();
          ctx.arc(centerX + pv.x * radius * lift, centerY + pv.y * radius * lift, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = "#10b981";
          ctx.fill();
        }
      });

      // Inner atmospheric shadow around sphere edge
      const innerRim = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.78,
        centerX,
        centerY,
        radius
      );
      innerRim.addColorStop(0, "rgba(15, 23, 42, 0)");
      innerRim.addColorStop(1, "rgba(30, 58, 138, 0.18)");
      ctx.fillStyle = innerRim;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      ctx.restore();

      // Crisp outer sphere border
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // 6. Render City Markers & Labels (Tashkent, Samarkand, Bukhara, etc.)
      DEFAULT_MARKERS.forEach((m) => {
        const v = rotateVec3(latLngToVec3(m.lat, m.lng), cosPhi, sinPhi, cosTheta, sinTheta);

        if (v.z > 0.08) {
          const screenX = centerX + v.x * radius;
          const screenY = centerY + v.y * radius;
          const isSelected = activeMarker.name === m.name;

          // Pulsing ripple ring
          const ringRadius = (isSelected ? 7 : 4.5) + (Math.sin(pulse * 1.4) + 1) * 3.5;
          ctx.beginPath();
          ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? "rgba(16, 185, 129, 0.25)"
            : m.active
            ? "rgba(59, 130, 246, 0.18)"
            : "rgba(139, 92, 246, 0.16)";
          ctx.fill();

          // Outer marker dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, isSelected ? 5.5 : 4, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "#10b981" : m.active ? "#2563eb" : "#7c3aed";
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // City label pill for selected city or major hubs when zoomed/front-facing
          if (isSelected || m.name === "Ташкент" || (v.z > 0.65 && zoom >= 1.05)) {
            ctx.font = isSelected ? "600 11px Inter, system-ui, sans-serif" : "500 10px Inter, system-ui, sans-serif";
            const label = isSelected ? `${m.name} • ${m.orders} зак.` : m.name;
            const textWidth = ctx.measureText(label).width;
            const bx = screenX + 8;
            const by = screenY - 10;

            ctx.fillStyle = isSelected ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.92)";
            ctx.strokeStyle = isSelected ? "rgba(16, 185, 129, 0.8)" : "rgba(203, 213, 225, 0.9)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(bx - 5, by - 10, textWidth + 10, 17, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isSelected ? "#ffffff" : "#1e293b";
            ctx.fillText(label, bx, by + 2);
          }
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [size, isDragging, activeMarker, autoRotate, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    targetRotationRef.current = null;
    mouseRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - mouseRef.current.lastX;
    const deltaY = e.clientY - mouseRef.current.lastY;
    rotationRef.current.phi += deltaX * 0.0075;
    rotationRef.current.theta = Math.max(
      -1.25,
      Math.min(1.25, rotationRef.current.theta - deltaY * 0.0075)
    );
    mouseRef.current = { lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className={`relative flex flex-col items-center select-none w-full ${className}`}>
      {/* Interactive 3D Globe Stage */}
      <div
        className="cursor-grab active:cursor-grabbing relative flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="max-w-full h-auto"
        />

        {/* Top-left Active City Telemetry Overlay (Shopify Live View style) */}
        <div className="absolute top-3 left-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[#e3e5e7] dark:border-zinc-800 rounded-xl p-3 shadow-sm max-w-[215px]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#202223] dark:text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{activeMarker.name}, {activeMarker.country}</span>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#f1f2f4] dark:border-zinc-800">
            <div>
              <div className="text-[10px] text-[#6d7175]">Активно сейчас</div>
              <div className="font-bold text-[#202223] dark:text-white">{activeMarker.visitors} сессий</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6d7175]">Заказы</div>
              <div className="font-bold text-emerald-600">{activeMarker.orders} шт.</div>
            </div>
          </div>
          <div className="mt-1 text-[10px] font-semibold text-[#6d7175]">
            Оборот: <span className="text-[#202223] dark:text-white">{activeMarker.revenue}</span>
          </div>
        </div>

        {/* Bottom-right Shopify Globe Controls (+ / - / Focus Uzbekistan / Rotate) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 border border-[#e3e5e7] dark:border-zinc-800 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => focusLocation(41.2995, 69.2401, 1.18)}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-[#202223] dark:text-white hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1"
            title="Сфокусировать на Узбекистане"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Узбекистан</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg text-[#6d7175] hover:text-[#202223] hover:bg-[#f1f2f4] transition cursor-pointer"
            title="Приблизить"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg text-[#6d7175] hover:text-[#202223] hover:bg-[#f1f2f4] transition cursor-pointer"
            title="Отдалить"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAutoRotate((r) => !r)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              autoRotate ? "bg-[#202223] text-white" : "text-[#6d7175] hover:bg-[#f1f2f4]"
            }`}
            title="Авто-вращение глобуса"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom-left Legend */}
        <div className="absolute bottom-3 left-3 hidden sm:flex items-center gap-3 bg-white/95 dark:bg-zinc-900/95 border border-[#e3e5e7] dark:border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] shadow-sm">
          <span className="flex items-center gap-1.5 text-[#202223] dark:text-zinc-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
            Активные города РУз
          </span>
          <span className="flex items-center gap-1.5 text-[#202223] dark:text-zinc-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            Выбранный регион
          </span>
        </div>
      </div>

      {/* Interactive City Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 max-w-2xl">
        {DEFAULT_MARKERS.map((m) => {
          const isSelected = activeMarker.name === m.name;
          return (
            <button
              key={m.name}
              type="button"
              onClick={() => {
                setActiveMarker(m);
                focusLocation(m.lat, m.lng, 1.16);
                if (onMarkerSelect) onMarkerSelect(m);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-[#202223] text-white shadow-xs font-semibold"
                  : "bg-[#f6f6f7] dark:bg-zinc-800 text-[#202223] dark:text-zinc-300 hover:bg-[#ebebed] border border-[#e3e5e7] dark:border-zinc-700"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? "bg-[#c8ff6a]" : m.active ? "bg-emerald-500" : "bg-violet-500"
                }`}
              />
              <span>{m.name}</span>
              <span className="opacity-70 text-[11px]">({m.orders})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
