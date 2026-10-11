import React, { useEffect, useRef, useState } from "react";
import { Globe2, RotateCcw, ZoomIn, ZoomOut, Compass, Sparkles } from "lucide-react";

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

export const DEFAULT_MARKERS: MarkerLocation[] = [
  { name: "Ташкент", country: "Узбекистан", lat: 41.2995, lng: 69.2401, orders: 18, visitors: 42, revenue: "3 420 000 UZS", active: true },
  { name: "Самарканд", country: "Узбекистан", lat: 39.6542, lng: 66.9597, orders: 7, visitors: 19, revenue: "1 180 000 UZS", active: true },
  { name: "Бухара", country: "Узбекистан", lat: 39.7681, lng: 64.4556, orders: 5, visitors: 14, revenue: "890 000 UZS", active: true },
  { name: "Андижан", country: "Узбекистан", lat: 40.7821, lng: 72.3442, orders: 6, visitors: 16, revenue: "950 000 UZS", active: true },
  { name: "Фергана", country: "Узбекистан", lat: 40.3842, lng: 71.7843, orders: 4, visitors: 12, revenue: "640 000 UZS", active: true },
  { name: "Наманган", country: "Узбекистан", lat: 41.0011, lng: 71.6683, orders: 4, visitors: 13, revenue: "610 000 UZS", active: true },
  { name: "Нукус", country: "Узбекистан", lat: 42.4619, lng: 59.6166, orders: 2, visitors: 7, revenue: "320 000 UZS", active: true },
  { name: "Алматы", country: "Казахстан", lat: 43.2389, lng: 76.8897, orders: 3, visitors: 9, revenue: "540 000 UZS", active: false },
  { name: "Астана", country: "Казахстан", lat: 51.1694, lng: 71.4491, orders: 2, visitors: 6, revenue: "420 000 UZS", active: false },
  { name: "Москва", country: "Россия", lat: 55.7558, lng: 37.6173, orders: 4, visitors: 11, revenue: "780 000 UZS", active: false },
  { name: "Стамбул", country: "Турция", lat: 41.0082, lng: 28.9784, orders: 3, visitors: 8, revenue: "510 000 UZS", active: false },
  { name: "Дубай", country: "ОАЭ", lat: 25.2048, lng: 55.2708, orders: 2, visitors: 5, revenue: "690 000 UZS", active: false },
];

interface LandPolygon {
  name: string;
  biome: "continent" | "steppe" | "uzbekistan" | "island" | "water";
  coords: Array<[number, number]>;
}

// High-detail geographic polygons [lat, lng][] for realistic 3D Earth rendering
const LAND_POLYGONS: LandPolygon[] = [
  // 1. Eurasia (High-resolution coastline from Iberia -> Europe -> Russia -> East Asia -> India -> Arabia -> Mediterranean)
  {
    name: "Eurasia",
    biome: "continent",
    coords: [
      [36.1, -5.6], [37.0, -8.9], [41.2, -8.7], [43.4, -8.4], [43.3, -1.8],
      [47.2, -2.2], [48.4, -4.5], [49.6, -1.6], [51.0, 1.8], [53.5, 6.8],
      [57.7, 10.6], [54.4, 10.2], [54.0, 14.2], [54.7, 18.6], [57.8, 21.8],
      [60.0, 23.0], [60.2, 27.5], [60.0, 30.0], [64.0, 24.0], [65.8, 24.2],
      [60.5, 18.0], [56.0, 15.5], [55.4, 13.0], [58.9, 11.1], [59.9, 10.7],
      [58.0, 7.5], [62.0, 5.1], [65.0, 12.0], [68.5, 16.5], [70.9, 25.8],
      [70.0, 31.0], [68.9, 37.0], [66.5, 40.5], [68.5, 44.0], [69.2, 55.0],
      [72.5, 68.5], [73.5, 80.5], [76.5, 96.0], [77.5, 104.0], [74.0, 112.0],
      [73.2, 125.0], [71.5, 138.0], [70.0, 158.0], [68.8, 175.0], [66.0, 179.5],
      [62.5, 178.0], [60.0, 164.0], [56.0, 162.5], [51.2, 156.8], [54.5, 155.8],
      [59.5, 150.8], [59.0, 142.0], [54.0, 138.5], [48.0, 140.0], [43.0, 132.0],
      [40.0, 128.0], [35.1, 129.0], [34.8, 126.5], [37.5, 126.6], [39.8, 124.2],
      [40.8, 121.8], [38.9, 121.6], [38.0, 119.0], [36.0, 120.4], [34.5, 119.5],
      [31.2, 121.8], [28.0, 121.2], [24.5, 118.2], [22.2, 114.2], [21.5, 109.5],
      [20.8, 106.8], [16.5, 107.6], [12.2, 109.2], [10.3, 107.0], [8.6, 104.8],
      [10.5, 103.5], [13.5, 100.6], [8.0, 98.4], [3.1, 101.4], [1.3, 103.8],
      [6.5, 100.1], [12.5, 98.5], [16.8, 96.2], [16.0, 94.3], [21.5, 92.0],
      [22.2, 89.0], [19.8, 85.8], [16.2, 81.2], [13.1, 80.3], [8.1, 77.5],
      [10.0, 76.2], [15.4, 73.8], [19.0, 72.8], [21.6, 69.6], [23.8, 68.2],
      [24.9, 66.9], [25.2, 61.5], [25.8, 57.3], [27.1, 56.3], [29.8, 49.5],
      [29.3, 48.0], [26.2, 50.2], [24.4, 54.4], [26.1, 56.3], [22.5, 59.8],
      [17.0, 54.1], [14.5, 49.2], [12.7, 43.4], [16.9, 42.5], [21.5, 39.1],
      [27.8, 35.2], [29.5, 34.9], [31.2, 32.3], [32.8, 35.0], [35.5, 35.8],
      [36.8, 36.2], [36.2, 32.5], [36.8, 28.2], [38.4, 26.8], [40.1, 26.2],
      [41.0, 29.0], [41.2, 36.3], [41.0, 40.5], [43.3, 40.0], [44.6, 37.8],
      [46.5, 36.8], [46.2, 30.8], [44.2, 28.6], [42.0, 28.0], [40.6, 23.0],
      [38.0, 24.0], [36.8, 22.0], [39.5, 20.0], [42.2, 18.8], [45.4, 13.6],
      [44.4, 12.3], [41.2, 16.8], [38.2, 15.6], [41.8, 12.2], [44.4, 8.9],
      [43.3, 5.4], [42.5, 3.1], [39.5, -0.3], [36.7, -4.4], [36.1, -5.6],
    ],
  },
  // 2. Central Asia & Kazakhstan Steppe Layer
  {
    name: "CentralAsia",
    biome: "steppe",
    coords: [
      [54.2, 52.0], [54.8, 61.5], [53.8, 72.5], [50.8, 82.5], [47.2, 83.0],
      [44.5, 80.2], [42.2, 79.5], [40.2, 76.0], [37.0, 74.5], [36.2, 68.5],
      [35.2, 61.2], [37.5, 54.0], [40.2, 52.6], [44.5, 50.3], [47.1, 51.9],
      [50.5, 51.0], [54.2, 52.0],
    ],
  },
  // 3. Uzbekistan (Highlighted in vibrant Shopify Emerald / Cyan)
  {
    name: "Uzbekistan",
    biome: "uzbekistan",
    coords: [
      [45.5, 56.0], [45.1, 58.6], [43.7, 61.6], [43.2, 63.8], [42.6, 66.2],
      [41.9, 69.2], [41.5, 70.6], [41.3, 72.0], [40.8, 73.1], [40.2, 71.8],
      [40.1, 70.2], [40.3, 69.1], [39.5, 68.4], [38.2, 68.1], [37.2, 67.3],
      [38.4, 65.2], [39.1, 63.4], [40.2, 62.1], [41.2, 60.2], [41.4, 58.2],
      [41.9, 56.0], [45.5, 56.0],
    ],
  },
  // 4. Caspian Sea & Aral Sea (Water cutouts inside Eurasia)
  {
    name: "CaspianSea",
    biome: "water",
    coords: [
      [47.1, 51.9], [45.5, 53.2], [44.0, 50.3], [41.5, 52.5], [37.5, 53.9],
      [36.7, 52.2], [37.4, 49.2], [40.3, 50.0], [43.0, 47.6], [45.8, 47.5],
      [47.1, 49.5], [47.1, 51.9],
    ],
  },
  // 5. Africa
  {
    name: "Africa",
    biome: "continent",
    coords: [
      [35.8, -5.8], [36.9, 3.1], [37.2, 10.2], [33.8, 11.2], [32.2, 15.2],
      [32.8, 22.0], [31.5, 25.5], [31.5, 32.3], [28.0, 33.5], [22.0, 36.9],
      [15.6, 39.5], [11.8, 43.3], [10.5, 45.0], [11.9, 51.3], [6.0, 49.0],
      [2.0, 45.3], [-1.6, 41.6], [-4.0, 39.7], [-10.5, 40.4], [-15.0, 40.7],
      [-19.8, 34.9], [-25.9, 32.6], [-29.8, 31.0], [-33.9, 25.6], [-34.8, 20.0],
      [-34.3, 18.4], [-28.6, 16.5], [-22.9, 14.5], [-17.2, 11.8], [-12.3, 13.6],
      [-8.8, 13.2], [-4.8, 11.8], [-0.7, 8.8], [4.0, 9.7], [4.4, 7.0],
      [6.4, 3.4], [4.7, -2.0], [4.4, -7.7], [6.3, -10.8], [9.5, -13.7],
      [14.7, -17.5], [18.1, -16.0], [21.0, -17.0], [24.0, -15.6], [28.0, -12.9],
      [30.4, -9.6], [33.6, -7.6], [35.8, -5.8],
    ],
  },
  // 6. North America
  {
    name: "NorthAmerica",
    biome: "continent",
    coords: [
      [70.2, -161.0], [71.3, -156.5], [69.5, -138.0], [70.2, -124.0], [68.5, -106.0],
      [66.0, -86.0], [63.5, -78.0], [58.5, -63.0], [52.2, -55.6], [47.0, -60.5],
      [44.6, -63.6], [43.6, -70.2], [41.7, -70.0], [40.6, -74.0], [36.8, -76.0],
      [32.8, -79.9], [28.5, -80.6], [25.2, -80.2], [28.0, -82.8], [30.0, -85.5],
      [29.2, -89.2], [29.3, -94.8], [26.0, -97.2], [21.5, -97.4], [19.2, -96.1],
      [21.2, -89.6], [21.5, -87.1], [18.2, -87.8], [15.8, -88.6], [15.9, -85.0],
      [14.5, -83.2], [11.0, -83.8], [9.4, -79.9], [7.5, -78.0], [8.5, -83.0],
      [10.5, -85.8], [13.5, -89.8], [16.2, -95.2], [16.8, -99.9], [20.6, -105.2],
      [23.2, -106.4], [27.9, -110.9], [31.3, -113.5], [22.9, -109.9], [28.0, -114.2],
      [32.5, -117.1], [34.4, -120.4], [37.8, -122.5], [40.4, -124.4], [46.2, -124.0],
      [48.4, -124.7], [54.2, -130.3], [58.3, -136.6], [60.0, -142.0], [61.2, -150.0],
      [54.8, -163.5], [58.8, -161.8], [63.5, -162.0], [65.6, -168.1], [70.2, -161.0],
    ],
  },
  // 7. South America
  {
    name: "SouthAmerica",
    biome: "continent",
    coords: [
      [11.2, -74.2], [12.2, -71.2], [10.6, -66.9], [10.5, -62.0], [8.5, -59.8],
      [6.0, -55.2], [4.5, -51.6], [0.0, -50.0], [-2.5, -44.3], [-3.7, -38.5],
      [-5.8, -35.2], [-8.0, -34.9], [-13.0, -38.5], [-18.0, -39.5], [-23.0, -43.2],
      [-25.5, -48.5], [-30.0, -50.2], [-34.9, -54.9], [-38.0, -57.5], [-41.0, -63.0],
      [-45.8, -67.5], [-50.0, -68.5], [-52.4, -68.4], [-54.8, -65.2], [-55.2, -68.0],
      [-52.0, -75.0], [-46.5, -75.5], [-41.5, -73.8], [-33.0, -71.6], [-23.6, -70.4],
      [-18.5, -70.3], [-12.0, -77.1], [-8.1, -79.0], [-4.7, -81.3], [-2.2, -80.9],
      [1.0, -79.6], [4.0, -77.4], [7.8, -77.8], [9.5, -75.6], [11.2, -74.2],
    ],
  },
  // 8. Australia
  {
    name: "Australia",
    biome: "continent",
    coords: [
      [-12.4, 130.8], [-11.2, 136.7], [-14.5, 136.0], [-16.8, 139.2], [-10.7, 142.5],
      [-16.9, 145.8], [-20.0, 148.2], [-24.8, 152.4], [-28.2, 153.6], [-33.9, 151.2],
      [-37.5, 150.0], [-38.4, 145.0], [-38.1, 140.6], [-35.2, 138.5], [-34.7, 135.5],
      [-32.1, 132.5], [-31.8, 127.0], [-33.9, 121.9], [-35.0, 117.9], [-34.0, 115.0],
      [-32.0, 115.8], [-27.5, 114.1], [-21.9, 114.1], [-20.3, 118.6], [-17.9, 122.2],
      [-14.5, 125.5], [-14.8, 129.0], [-12.4, 130.8],
    ],
  },
  // 9. UK & Ireland
  {
    name: "UK",
    biome: "island",
    coords: [
      [50.1, -5.2], [51.5, -5.0], [53.4, -3.0], [55.0, -4.5], [57.5, -5.8],
      [58.6, -3.1], [57.1, -2.1], [55.9, -3.1], [54.6, -1.1], [52.9, 1.3],
      [51.4, 1.4], [50.7, -1.1], [50.1, -5.2],
    ],
  },
  // 10. Japan
  {
    name: "Japan",
    biome: "island",
    coords: [
      [31.2, 130.6], [33.6, 130.4], [34.4, 132.5], [35.6, 135.2], [37.5, 137.2],
      [39.7, 140.1], [41.5, 140.9], [43.3, 145.5], [42.0, 143.2], [39.6, 142.0],
      [35.7, 140.8], [34.7, 138.9], [33.5, 135.8], [32.8, 133.0], [31.2, 130.6],
    ],
  },
  // 11. Indonesia & Philippines & Sri Lanka & Madagascar & Greenland
  {
    name: "SumatraJava",
    biome: "island",
    coords: [
      [5.5, 95.3], [1.5, 101.5], [-3.0, 104.8], [-5.9, 105.8], [-6.8, 108.5],
      [-7.8, 114.4], [-8.4, 114.2], [-7.7, 109.0], [-6.2, 105.4], [-2.0, 100.5],
      [2.5, 96.8], [5.5, 95.3],
    ],
  },
  {
    name: "Borneo",
    biome: "island",
    coords: [
      [6.9, 116.8], [4.2, 117.9], [1.2, 118.8], [-3.3, 116.2], [-3.2, 112.5],
      [-0.8, 109.3], [2.0, 109.6], [4.9, 114.9], [6.9, 116.8],
    ],
  },
  {
    name: "Madagascar",
    biome: "island",
    coords: [
      [-12.0, 49.3], [-15.8, 50.2], [-20.0, 48.8], [-25.0, 47.0], [-25.2, 44.5],
      [-20.2, 44.3], [-16.0, 45.2], [-12.0, 49.3],
    ],
  },
  {
    name: "Greenland",
    biome: "island",
    coords: [
      [60.0, -44.0], [65.0, -52.5], [70.0, -54.0], [76.5, -69.0], [81.5, -52.0],
      [82.5, -30.0], [78.0, -18.5], [70.5, -22.0], [65.5, -37.5], [60.0, -44.0],
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
  selectedCityName?: string;
  onMarkerSelect?: (marker: MarkerLocation) => void;
}> = ({ size = 470, className = "", selectedCityName, onMarkerSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeMarker, setActiveMarker] = useState<MarkerLocation>(DEFAULT_MARKERS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState<number>(1.08);
  const [globeTheme, setGlobeTheme] = useState<"day" | "satellite">("day");

  // Camera centered on Uzbekistan / Central Asia (lat ~41°, lng ~69°) initially
  const rotationRef = useRef({ phi: 1.2, theta: 0.65 });
  const targetRotationRef = useRef<{ phi: number; theta: number } | null>(null);
  const mouseRef = useRef({ lastX: 0, lastY: 0, downX: 0, downY: 0 });
  const screenMarkersRef = useRef<Array<{ marker: MarkerLocation; x: number; y: number }>>([]);

  // Focus camera on a specific lat/lng
  const focusLocation = (lat: number, lng: number, targetZoom?: number) => {
    const phiM = ((180 - lng) * Math.PI) / 180;
    const desiredPhi = Math.PI - phiM;
    const desiredTheta = (lat * Math.PI) / 180;
    targetRotationRef.current = { phi: desiredPhi, theta: desiredTheta };
    setAutoRotate(false);
    if (targetZoom) setZoom(targetZoom);
  };

  // External city selection sync
  useEffect(() => {
    if (!selectedCityName) return;
    const found = DEFAULT_MARKERS.find(
      (m) => m.name.toLowerCase() === selectedCityName.toLowerCase()
    );
    if (found) {
      setActiveMarker(found);
      focusLocation(found.lat, found.lng, 1.18);
    }
  }, [selectedCityName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animId: number;
    let pulse = 0;

    const render = () => {
      pulse += 0.042;

      if (targetRotationRef.current && !isDragging) {
        const dPhi = targetRotationRef.current.phi - rotationRef.current.phi;
        const dTheta = targetRotationRef.current.theta - rotationRef.current.theta;
        rotationRef.current.phi += dPhi * 0.11;
        rotationRef.current.theta += dTheta * 0.11;
        if (Math.abs(dPhi) < 0.002 && Math.abs(dTheta) < 0.002) {
          targetRotationRef.current = null;
        }
      } else if (!isDragging && autoRotate) {
        rotationRef.current.phi += 0.002;
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

      // 1. Multi-layer atmospheric Rayleigh scattering halo (Shopify 3D Earth style)
      const outerHalo = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.85,
        centerX,
        centerY,
        radius * 1.22
      );
      if (globeTheme === "day") {
        outerHalo.addColorStop(0, "rgba(14, 165, 233, 0.28)");
        outerHalo.addColorStop(0.45, "rgba(56, 189, 248, 0.14)");
        outerHalo.addColorStop(0.75, "rgba(99, 102, 241, 0.05)");
        outerHalo.addColorStop(1, "rgba(14, 165, 233, 0)");
      } else {
        outerHalo.addColorStop(0, "rgba(56, 189, 248, 0.35)");
        outerHalo.addColorStop(0.5, "rgba(16, 185, 129, 0.15)");
        outerHalo.addColorStop(1, "rgba(15, 23, 42, 0)");
      }
      ctx.fillStyle = outerHalo;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.22, 0, Math.PI * 2);
      ctx.fill();

      // 2. Clip to 3D Sphere & Render Realistic Ocean with Specular Sunlight
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      const oceanGrad = ctx.createRadialGradient(
        centerX - radius * 0.32,
        centerY - radius * 0.32,
        radius * 0.05,
        centerX + radius * 0.1,
        centerY + radius * 0.1,
        radius * 1.08
      );
      if (globeTheme === "day") {
        oceanGrad.addColorStop(0, "#7dd3fc");
        oceanGrad.addColorStop(0.28, "#38bdf8");
        oceanGrad.addColorStop(0.65, "#0284c7");
        oceanGrad.addColorStop(0.9, "#0369a1");
        oceanGrad.addColorStop(1, "#1e3a8a");
      } else {
        oceanGrad.addColorStop(0, "#1e293b");
        oceanGrad.addColorStop(0.45, "#0f172a");
        oceanGrad.addColorStop(0.85, "#090d16");
        oceanGrad.addColorStop(1, "#020617");
      }
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      // 3. Subtle Spherical Graticule (Latitude & Longitude Lines)
      ctx.strokeStyle =
        globeTheme === "day"
          ? "rgba(255, 255, 255, 0.16)"
          : "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 0.7;

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

      // 4. Render Continents, Biomes, Inland Seas, and Uzbekistan Highlight
      LAND_POLYGONS.forEach((poly) => {
        const projected: Array<{ sx: number; sy: number; z: number }> = [];
        let visibleCount = 0;

        for (let i = 0; i < poly.coords.length; i++) {
          const [lat, lng] = poly.coords[i];
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > -0.18) visibleCount++;
          const clampedZ = Math.max(-0.12, v.z);
          const scale = clampedZ < 0 ? 1 / (1 - clampedZ * 0.22) : 1;
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

          if (poly.biome === "water") {
            ctx.fillStyle = globeTheme === "day" ? "#0284c7" : "#0f172a";
            ctx.strokeStyle =
              globeTheme === "day"
                ? "rgba(186, 230, 253, 0.5)"
                : "rgba(56, 189, 248, 0.3)";
            ctx.lineWidth = 0.8;
          } else if (poly.biome === "uzbekistan") {
            // Uzbekistan highlighted with glowing Shopify Emerald / Teal relief
            const uzbGrad = ctx.createLinearGradient(
              centerX - radius * 0.3,
              centerY - radius * 0.3,
              centerX + radius * 0.3,
              centerY + radius * 0.3
            );
            if (globeTheme === "day") {
              uzbGrad.addColorStop(0, "rgba(16, 185, 129, 0.88)");
              uzbGrad.addColorStop(1, "rgba(5, 150, 105, 0.92)");
              ctx.fillStyle = uzbGrad;
              ctx.strokeStyle = "#ffffff";
              ctx.lineWidth = 1.8;
            } else {
              uzbGrad.addColorStop(0, "rgba(16, 185, 129, 0.55)");
              uzbGrad.addColorStop(1, "rgba(6, 182, 212, 0.65)");
              ctx.fillStyle = uzbGrad;
              ctx.strokeStyle = "#34d399";
              ctx.lineWidth = 1.8;
            }
          } else if (poly.biome === "steppe") {
            // Central Asia & Steppe warm relief
            if (globeTheme === "day") {
              ctx.fillStyle = "rgba(217, 237, 196, 0.92)";
              ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
              ctx.lineWidth = 1.1;
            } else {
              ctx.fillStyle = "rgba(30, 41, 59, 0.92)";
              ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
              ctx.lineWidth = 1.0;
            }
          } else {
            // Natural Earth physical relief gradient (Lush green/ivory terrain in Day mode)
            const landGrad = ctx.createRadialGradient(
              centerX - radius * 0.25,
              centerY - radius * 0.25,
              radius * 0.1,
              centerX,
              centerY,
              radius
            );
            if (globeTheme === "day") {
              landGrad.addColorStop(0, "#ecfccb");
              landGrad.addColorStop(0.45, "#bbf7d0");
              landGrad.addColorStop(0.85, "#86efac");
              landGrad.addColorStop(1, "#4ade80");
              ctx.fillStyle = landGrad;
              ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
              ctx.lineWidth = 1.0;
            } else {
              landGrad.addColorStop(0, "#334155");
              landGrad.addColorStop(0.6, "#1e293b");
              landGrad.addColorStop(1, "#0f172a");
              ctx.fillStyle = landGrad;
              ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
              ctx.lineWidth = 1.0;
            }
          }
          ctx.fill();
          ctx.stroke();
        }
      });

      // 5. Render Animated 3D Order Arcs & Travelling Packets into Tashkent
      const tashkent = DEFAULT_MARKERS[0];
      DEFAULT_MARKERS.slice(1).forEach((dest, arcIdx) => {
        const steps = 32;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const lat = tashkent.lat + (dest.lat - tashkent.lat) * t;
          const lng = tashkent.lng + (dest.lng - tashkent.lng) * t;
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > 0.04) {
            const arcLift = 1 + Math.sin(t * Math.PI) * 0.075;
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
          ? globeTheme === "day"
            ? "rgba(255, 255, 255, 0.75)"
            : "rgba(16, 185, 129, 0.65)"
          : "rgba(139, 92, 246, 0.55)";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated glowing order packet flying along the 3D arc
        const packetT = (pulse * 0.32 + arcIdx * 0.19) % 1;
        const pLat = dest.lat + (tashkent.lat - dest.lat) * packetT;
        const pLng = dest.lng + (tashkent.lng - dest.lng) * packetT;
        const pv = rotateVec3(latLngToVec3(pLat, pLng), cosPhi, sinPhi, cosTheta, sinTheta);
        if (pv.z > 0.06) {
          const lift = 1 + Math.sin(packetT * Math.PI) * 0.075;
          const px = centerX + pv.x * radius * lift;
          const py = centerY + pv.y * radius * lift;
          ctx.beginPath();
          ctx.arc(px, py, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = dest.active ? "#ffffff" : "#c084fc";
          ctx.fill();
        }
      });

      // 6. Inner 3D Spherical Shadow & Atmospheric Limb Lighting
      const innerShadow = ctx.createRadialGradient(
        centerX - radius * 0.25,
        centerY - radius * 0.25,
        radius * 0.55,
        centerX,
        centerY,
        radius
      );
      innerShadow.addColorStop(0, "rgba(15, 23, 42, 0)");
      innerShadow.addColorStop(0.78, "rgba(15, 23, 42, 0.06)");
      innerShadow.addColorStop(1, "rgba(15, 23, 42, 0.36)");
      ctx.fillStyle = innerShadow;
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

      ctx.restore();

      // Crisp Atmospheric Rim Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle =
        globeTheme === "day"
          ? "rgba(56, 189, 248, 0.65)"
          : "rgba(56, 189, 248, 0.45)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 7. Render 3D Glowing City Beacons & Labels (Shopify Live View style)
      const currentScreenMarkers: Array<{ marker: MarkerLocation; x: number; y: number }> = [];

      DEFAULT_MARKERS.forEach((m) => {
        const v = rotateVec3(latLngToVec3(m.lat, m.lng), cosPhi, sinPhi, cosTheta, sinTheta);

        if (v.z > 0.08) {
          const screenX = centerX + v.x * radius;
          const screenY = centerY + v.y * radius;
          currentScreenMarkers.push({ marker: m, x: screenX, y: screenY });

          const isSelected = activeMarker.name === m.name;

          // 3D Vertical Spike / Beacon rising off the globe surface
          const spikeScale = 1 + (isSelected ? 0.065 : m.orders > 10 ? 0.05 : 0.032);
          const tipX = centerX + v.x * radius * spikeScale;
          const tipY = centerY + v.y * radius * spikeScale;

          ctx.beginPath();
          ctx.moveTo(screenX, screenY);
          ctx.lineTo(tipX, tipY);
          ctx.strokeStyle = isSelected
            ? "#10b981"
            : m.active
            ? "#6366f1"
            : "#a855f7";
          ctx.lineWidth = isSelected ? 2.5 : 2;
          ctx.stroke();

          // Pulsing surface ripple ring
          const ringRadius = (isSelected ? 7.5 : 4.5) + (Math.sin(pulse * 1.5) + 1) * 3.8;
          ctx.beginPath();
          ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? "rgba(16, 185, 129, 0.32)"
            : m.active
            ? "rgba(99, 102, 241, 0.28)"
            : "rgba(168, 85, 247, 0.24)";
          ctx.fill();

          // Outer marker dot at beacon tip
          ctx.beginPath();
          ctx.arc(tipX, tipY, isSelected ? 5.5 : 4.2, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? "#00a86b" : m.active ? "#4f46e5" : "#9333ea";
          ctx.fill();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = "#ffffff";
          ctx.stroke();

          // City label pill for selected city or major hubs
          if (isSelected || m.name === "Ташкент" || (v.z > 0.62 && zoom >= 1.04)) {
            ctx.font = isSelected
              ? "600 11px -apple-system, BlinkMacSystemFont, Inter, sans-serif"
              : "500 10px -apple-system, BlinkMacSystemFont, Inter, sans-serif";
            const label = isSelected ? `${m.name} • ${m.orders} зак.` : m.name;
            const textWidth = ctx.measureText(label).width;
            const bx = tipX + 9;
            const by = tipY - 8;

            ctx.fillStyle = isSelected ? "rgba(15, 23, 42, 0.94)" : "rgba(255, 255, 255, 0.94)";
            ctx.strokeStyle = isSelected ? "#00a86b" : "rgba(148, 163, 184, 0.85)";
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.roundRect(bx - 5, by - 10, textWidth + 10, 18, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isSelected ? "#ffffff" : "#0f172a";
            ctx.fillText(label, bx, by + 2);
          }
        }
      });

      screenMarkersRef.current = currentScreenMarkers;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [size, isDragging, activeMarker, autoRotate, zoom, globeTheme]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    targetRotationRef.current = null;
    mouseRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
      downX: e.clientX,
      downY: e.clientY,
    };
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
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const moved =
      Math.hypot(e.clientX - mouseRef.current.downX, e.clientY - mouseRef.current.downY) > 5;
    setIsDragging(false);

    // Direct click on a 3D city marker
    if (!moved && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = size / rect.width;
      const scaleY = size / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      let closest: MarkerLocation | null = null;
      let minDist = 22;
      for (const item of screenMarkersRef.current) {
        const d = Math.hypot(clickX - item.x, clickY - item.y);
        if (d < minDist) {
          minDist = d;
          closest = item.marker;
        }
      }
      if (closest) {
        setActiveMarker(closest);
        focusLocation(closest.lat, closest.lng, Math.max(zoom, 1.15));
        if (onMarkerSelect) onMarkerSelect(closest);
      }
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none w-full ${className}`}>
      {/* Interactive 3D Globe Stage */}
      <div
        className="cursor-grab active:cursor-grabbing relative flex items-center justify-center w-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      >
        <canvas
          ref={canvasRef}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="max-w-full h-auto"
        />

        {/* Top-left Active City Telemetry Overlay (Shopify Live View style) */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[#e3e5e7] dark:border-zinc-800 rounded-xl p-3 shadow-sm max-w-[220px]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#202223] dark:text-white">
            <span className="w-2 h-2 rounded-full bg-[#00a86b] animate-ping" />
            <span className="truncate">
              {activeMarker.name}, {activeMarker.country}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-[#f1f2f4] dark:border-zinc-800">
            <div>
              <div className="text-[10px] text-[#6d7175]">Активно сейчас</div>
              <div className="font-bold text-[#202223] dark:text-white">
                {activeMarker.visitors} сессий
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#6d7175]">Заказы</div>
              <div className="font-bold text-[#00a86b]">{activeMarker.orders} шт.</div>
            </div>
          </div>
          <div className="mt-1 text-[10px] font-semibold text-[#6d7175]">
            Оборот: <span className="text-[#202223] dark:text-white">{activeMarker.revenue}</span>
          </div>
        </div>

        {/* Top-right Theme Toggle (Earth Day / Night Satellite) */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 border border-[#e3e5e7] dark:border-zinc-800 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setGlobeTheme("day")}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              globeTheme === "day"
                ? "bg-[#005bd3] text-white"
                : "text-[#6d7175] hover:text-[#202223]"
            }`}
          >
            3D Земля
          </button>
          <button
            type="button"
            onClick={() => setGlobeTheme("satellite")}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
              globeTheme === "satellite"
                ? "bg-[#202223] text-white"
                : "text-[#6d7175] hover:text-[#202223]"
            }`}
          >
            Ночь
          </button>
        </div>

        {/* Bottom-right Shopify Globe Controls (+ / - / Focus Uzbekistan / Rotate) */}
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 border border-[#e3e5e7] dark:border-zinc-800 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => focusLocation(41.2995, 69.2401, 1.18)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#202223] dark:text-white hover:bg-[#f1f2f4] dark:hover:bg-zinc-800 transition cursor-pointer flex items-center gap-1"
            title="Сфокусировать на Узбекистане"
          >
            <Compass className="w-3.5 h-3.5 text-[#00a86b]" />
            <span>Узбекистан</span>
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.45, Number((z + 0.1).toFixed(2))))}
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
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 hidden sm:flex items-center gap-3 bg-white/95 dark:bg-zinc-900/95 border border-[#e3e5e7] dark:border-zinc-800 rounded-xl px-3 py-1.5 text-[11px] shadow-sm">
          <span className="flex items-center gap-1.5 text-[#202223] dark:text-zinc-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5]" />
            Заказы (РУз)
          </span>
          <span className="flex items-center gap-1.5 text-[#202223] dark:text-zinc-200 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00a86b]" />
            Активный центр
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
                focusLocation(m.lat, m.lng, 1.18);
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
                  isSelected ? "bg-[#00a86b]" : m.active ? "bg-[#4f46e5]" : "bg-purple-500"
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
