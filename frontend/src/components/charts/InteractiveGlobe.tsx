import React, { useEffect, useRef, useState } from "react";
import { RotateCcw, ZoomIn, ZoomOut, Compass } from "lucide-react";

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

// Detailed Uzbekistan border coordinates [lat, lng] for subtle highlight on the 3D globe
const UZBEKISTAN_BORDER: Array<[number, number]> = [
  [45.58, 55.99], [45.00, 58.50], [43.65, 61.50], [43.15, 63.80], [42.55, 66.15],
  [41.95, 69.05], [41.55, 70.55], [41.35, 71.95], [40.82, 73.12], [40.25, 71.80],
  [40.12, 70.25], [40.32, 69.10], [39.50, 68.35], [38.20, 68.10], [37.18, 67.30],
  [38.40, 65.20], [39.10, 63.40], [40.18, 62.10], [41.20, 60.15], [41.38, 58.15],
  [41.90, 55.99], [45.58, 55.99],
];

// Convert [lat, lng] (degrees) to 3D unit sphere vector
function latLngToVec3(lat: number, lng: number) {
  const phi = ((180 - lng) * Math.PI) / 180;
  const theta = (lat * Math.PI) / 180;
  return {
    x: -Math.cos(theta) * Math.sin(phi),
    y: -Math.sin(theta),
    z: -Math.cos(theta) * Math.cos(phi),
  };
}

// Rotate 3D unit vector by camera angles (phi around Y, theta around X)
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

const VERTEX_SHADER_SRC = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = a_pos;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

// Real-time 3D Raycasted Sphere Fragment Shader (NASA Blue Marble + Black Marble + Rayleigh Atmosphere)
const FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_dayTex;
  uniform sampler2D u_nightTex;
  uniform sampler2D u_bumpTex;
  uniform float u_phi;
  uniform float u_theta;
  uniform float u_radius;
  uniform float u_nightMode;

  const float PI = 3.141592653589793;

  void main() {
    // v_uv is in [-1, 1], with Y pointing up. Match screen Y-down convention:
    vec2 p = vec2(v_uv.x, -v_uv.y);
    float dist = length(p);
    float R = u_radius;

    // Outside sphere: render realistic Rayleigh atmospheric glow halo
    if (dist > R) {
      float haloDist = (dist - R) / (R * 0.24);
      if (haloDist > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
      }
      float falloff = pow(1.0 - haloDist, 2.6);
      vec3 dayHalo = vec3(0.18, 0.62, 0.96);
      vec3 nightHalo = vec3(0.12, 0.52, 0.88);
      vec3 haloCol = mix(dayHalo, nightHalo, u_nightMode);
      gl_FragColor = vec4(haloCol * falloff, falloff * 0.52);
      return;
    }

    // Inside sphere: compute exact 3D surface normal n = (nx, ny, nz) in view space
    vec2 nxy = p / R;
    float nz = sqrt(max(0.0, 1.0 - dot(nxy, nxy)));
    vec3 n = vec3(nxy.x, nxy.y, nz);

    // Inverse rotate from view space back to world sphere coordinates (v.x, v.y, v.z)
    float cosTheta = cos(u_theta);
    float sinTheta = sin(u_theta);
    float cosPhi = cos(u_phi);
    float sinPhi = sin(u_phi);

    // Inverse of:
    // y1 = v.y * cosTheta - z1 * sinTheta
    // z2 = v.y * sinTheta + z1 * cosTheta
    float vy = n.y * cosTheta + n.z * sinTheta;
    float z1 = -n.y * sinTheta + n.z * cosTheta;

    // Inverse of:
    // x1 = v.x * cosPhi - v.z * sinPhi
    // z1 = v.x * sinPhi + v.z * cosPhi
    float vx = n.x * cosPhi + z1 * sinPhi;
    float vz = -n.x * sinPhi + z1 * cosPhi;

    // Convert 3D unit vector (vx, vy, vz) back to spherical [lat, lng] and equirectangular UV
    float lat = asin(clamp(-vy, -1.0, 1.0));
    float phiLon = atan(-vx, -vz); // in [-PI, PI], where phiLon = (180 - lng) * PI / 180
    // lng = 180 - phiLon * 180 / PI => u = (lng + 180) / 360 = 1.0 - phiLon / (2*PI)
    float u = fract(1.0 - phiLon / (2.0 * PI));
    float v = clamp(0.5 - lat / PI, 0.001, 0.999);

    vec2 uv = vec2(u, v);
    vec3 dayCol = texture2D(u_dayTex, uv).rgb;
    vec3 nightCol = texture2D(u_nightTex, uv).rgb;
    float topo = texture2D(u_bumpTex, uv).r;

    // Pseudo-normal perturbation from topography for crisp mountain relief
    vec3 lightDir = normalize(vec3(-0.38, -0.35, 0.86));
    float ndotl = max(0.18, dot(n, lightDir));

    // Detect ocean vs land from blue dominance in Blue Marble texture
    float isOcean = smoothstep(0.02, 0.14, dayCol.b - max(dayCol.r, dayCol.g));

    // Enhance Day colors (rich vibrant ocean + crisp relief continents like Shopify Live View)
    vec3 vibrantDay = pow(dayCol, vec3(0.88)) * 1.18;
    vibrantDay += vec3(0.02, 0.06, 0.12) * isOcean;
    vibrantDay *= (0.88 + 0.22 * topo * (1.0 - isOcean));

    // Specular ocean reflection
    vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(0.0, dot(n, halfVec)), 28.0) * isOcean * 0.38;

    vec3 shadedDay = vibrantDay * (0.35 + 0.72 * ndotl) + vec3(0.75, 0.90, 1.0) * spec;

    // Enhance Night mode (NASA Black Marble with glowing golden city lights + deep sapphire oceans)
    vec3 cityGlow = pow(nightCol, vec3(0.85)) * vec3(1.55, 1.35, 0.95);
    vec3 nightBase = dayCol * vec3(0.12, 0.20, 0.34) * (0.45 + 0.55 * ndotl);
    vec3 shadedNight = nightBase + cityGlow * 1.35 + vec3(0.04, 0.12, 0.24) * spec * 0.5;

    vec3 surfaceCol = mix(shadedDay, shadedNight, u_nightMode);

    // 3D Fresnel atmospheric scattering rim on the sphere limb
    float fresnel = pow(1.0 - nz, 2.8);
    vec3 rimCol = mix(vec3(0.28, 0.74, 0.98), vec3(0.16, 0.62, 0.95), u_nightMode);
    surfaceCol = mix(surfaceCol, rimCol, fresnel * 0.58);

    // Anti-aliased sphere edge
    float edgeAlpha = smoothstep(R, R - 0.008, dist);
    gl_FragColor = vec4(surfaceCol, edgeAlpha);
  }
`;

export const InteractiveGlobe: React.FC<{
  size?: number;
  className?: string;
  selectedCityName?: string;
  onMarkerSelect?: (marker: MarkerLocation) => void;
}> = ({ size = 470, className = "", selectedCityName, onMarkerSelect }) => {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeMarker, setActiveMarker] = useState<MarkerLocation>(DEFAULT_MARKERS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoom, setZoom] = useState<number>(1.08);
  const [globeTheme, setGlobeTheme] = useState<"day" | "satellite">("day");

  // Camera centered on Uzbekistan / Central Asia (lat ~41°, lng ~69°) initially
  const rotationRef = useRef({ phi: 1.21, theta: 0.68 });
  const velocityRef = useRef({ dPhi: 0, dTheta: 0 });
  const targetRotationRef = useRef<{ phi: number; theta: number } | null>(null);
  const mouseRef = useRef({ lastX: 0, lastY: 0, downX: 0, downY: 0 });
  const screenMarkersRef = useRef<Array<{ marker: MarkerLocation; x: number; y: number }>>([]);
  const themeBlendRef = useRef<number>(0);

  // WebGL resources ref
  const glStateRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    uPhi: WebGLUniformLocation | null;
    uTheta: WebGLUniformLocation | null;
    uRadius: WebGLUniformLocation | null;
    uNightMode: WebGLUniformLocation | null;
  } | null>(null);

  // Focus camera on a specific lat/lng
  const focusLocation = (lat: number, lng: number, targetZoom?: number) => {
    const phiM = ((180 - lng) * Math.PI) / 180;
    const desiredPhi = Math.PI - phiM;
    const desiredTheta = (lat * Math.PI) / 180;
    targetRotationRef.current = { phi: desiredPhi, theta: desiredTheta };
    velocityRef.current = { dPhi: 0, dTheta: 0 };
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

  // Initialize WebGL 3D Sphere Renderer & Load NASA Earth Textures
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    glCanvas.width = size * dpr;
    glCanvas.height = size * dpr;

    const gl = (glCanvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }) ||
      glCanvas.getContext("experimental-webgl", { alpha: true, antialias: true })) as WebGLRenderingContext | null;
    if (!gl) return;

    const compileShader = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("Globe shader error:", gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    // Fullscreen quad [-1, 1]
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Helper to create a texture with an immediate fallback pixel, then load high-res image
    const loadGlobeTexture = (unit: number, uniformName: string, url: string, fallbackRgb: [number, number, number]) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([fallbackRgb[0], fallbackRgb[1], fallbackRgb[2], 255])
      );

      const uLoc = gl.getUniformLocation(program, uniformName);
      gl.uniform1i(uLoc, unit);

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      };
      img.src = url;
    };

    loadGlobeTexture(0, "u_dayTex", "/static/images/globe/earth-day.jpg", [14, 116, 184]);
    loadGlobeTexture(1, "u_nightTex", "/static/images/globe/earth-night.jpg", [10, 18, 36]);
    loadGlobeTexture(2, "u_bumpTex", "/static/images/globe/earth-topology.png", [128, 128, 128]);

    glStateRef.current = {
      gl,
      program,
      uPhi: gl.getUniformLocation(program, "u_phi"),
      uTheta: gl.getUniformLocation(program, "u_theta"),
      uRadius: gl.getUniformLocation(program, "u_radius"),
      uNightMode: gl.getUniformLocation(program, "u_nightMode"),
    };
  }, [size]);

  // Main 60 FPS Render Loop (WebGL 3D Sphere + 2D Vector Overlay for Arcs, Uzbekistan Border & City Pins)
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas) return;
    const ctx = overlayCanvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    overlayCanvas.width = size * dpr;
    overlayCanvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let animId: number;
    let pulse = 0;

    const render = () => {
      pulse += 0.038;

      // Smooth Day <-> Night transition
      const targetNight = globeTheme === "satellite" ? 1.0 : 0.0;
      themeBlendRef.current += (targetNight - themeBlendRef.current) * 0.14;

      if (targetRotationRef.current && !isDragging) {
        const dPhi = targetRotationRef.current.phi - rotationRef.current.phi;
        const dTheta = targetRotationRef.current.theta - rotationRef.current.theta;
        rotationRef.current.phi += dPhi * 0.11;
        rotationRef.current.theta += dTheta * 0.11;
        if (Math.abs(dPhi) < 0.002 && Math.abs(dTheta) < 0.002) {
          targetRotationRef.current = null;
        }
      } else if (!isDragging) {
        if (Math.abs(velocityRef.current.dPhi) > 0.0002 || Math.abs(velocityRef.current.dTheta) > 0.0002) {
          rotationRef.current.phi += velocityRef.current.dPhi;
          rotationRef.current.theta = Math.max(
            -1.25,
            Math.min(1.25, rotationRef.current.theta + velocityRef.current.dTheta)
          );
          velocityRef.current.dPhi *= 0.92;
          velocityRef.current.dTheta *= 0.92;
        } else if (autoRotate) {
          rotationRef.current.phi += 0.0022;
        }
      }

      const radius = size * 0.39 * zoom;
      const normalizedRadius = (radius / (size * 0.5));
      const centerX = size / 2;
      const centerY = size / 2;

      const { phi, theta } = rotationRef.current;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);

      // 1. Render 3D Photorealistic Earth Sphere via WebGL
      const glState = glStateRef.current;
      if (glState) {
        const { gl, program, uPhi, uTheta, uRadius, uNightMode } = glState;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform1f(uPhi, phi);
        gl.uniform1f(uTheta, theta);
        gl.uniform1f(uRadius, normalizedRadius);
        gl.uniform1f(uNightMode, themeBlendRef.current);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      // 2. Clear 2D Overlay & Draw Uzbekistan Highlight, 3D Flight Arcs, and City Beacons
      ctx.clearRect(0, 0, size, size);

      // Subtle Uzbekistan Territory Highlight (strictly front-hemisphere v.z > 0.05)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      const uzbProjected: Array<{ sx: number; sy: number }> = [];
      let uzbVisible = true;
      for (let i = 0; i < UZBEKISTAN_BORDER.length; i++) {
        const [lat, lng] = UZBEKISTAN_BORDER[i];
        const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
        if (v.z <= 0.04) {
          uzbVisible = false;
          break;
        }
        uzbProjected.push({
          sx: centerX + v.x * radius,
          sy: centerY + v.y * radius,
        });
      }

      if (uzbVisible && uzbProjected.length > 3) {
        ctx.beginPath();
        uzbProjected.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.sx, pt.sy);
          else ctx.lineTo(pt.sx, pt.sy);
        });
        ctx.closePath();
        ctx.fillStyle =
          globeTheme === "day"
            ? "rgba(16, 185, 129, 0.28)"
            : "rgba(16, 185, 129, 0.34)";
        ctx.strokeStyle =
          globeTheme === "day"
            ? "rgba(255, 255, 255, 0.92)"
            : "rgba(52, 211, 153, 0.95)";
        ctx.lineWidth = 1.6;
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();

      // 3. Render Animated 3D Order Arcs & Travelling Packets into Tashkent
      const tashkent = DEFAULT_MARKERS[0];
      DEFAULT_MARKERS.slice(1).forEach((dest, arcIdx) => {
        const steps = 36;
        ctx.beginPath();
        let started = false;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const lat = tashkent.lat + (dest.lat - tashkent.lat) * t;
          const lng = tashkent.lng + (dest.lng - tashkent.lng) * t;
          const v = rotateVec3(latLngToVec3(lat, lng), cosPhi, sinPhi, cosTheta, sinTheta);
          if (v.z > 0.05) {
            const arcLift = 1 + Math.sin(t * Math.PI) * 0.072;
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
            ? "rgba(255, 255, 255, 0.82)"
            : "rgba(52, 211, 153, 0.78)"
          : "rgba(168, 85, 247, 0.68)";
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
          const lift = 1 + Math.sin(packetT * Math.PI) * 0.072;
          const px = centerX + pv.x * radius * lift;
          const py = centerY + pv.y * radius * lift;
          ctx.beginPath();
          ctx.arc(px, py, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = dest.active ? "#ffffff" : "#e879f9";
          ctx.fill();
        }
      });

      // 4. Render 3D Glowing City Beacons & Labels (Shopify Live View style)
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
            ? "rgba(16, 185, 129, 0.36)"
            : m.active
            ? "rgba(99, 102, 241, 0.30)"
            : "rgba(168, 85, 247, 0.28)";
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
              ? '600 11px Inter, "Segoe UI", Arial, sans-serif'
              : '500 10px Inter, "Segoe UI", Arial, sans-serif';
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
    velocityRef.current = { dPhi: 0, dTheta: 0 };
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
    const dPhi = deltaX * 0.0072;
    const dTheta = -deltaY * 0.0072;
    rotationRef.current.phi += dPhi;
    rotationRef.current.theta = Math.max(
      -1.25,
      Math.min(1.25, rotationRef.current.theta + dTheta)
    );
    velocityRef.current = { dPhi: dPhi * 0.45, dTheta: dTheta * 0.45 };
    mouseRef.current.lastX = e.clientX;
    mouseRef.current.lastY = e.clientY;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const moved =
      Math.hypot(e.clientX - mouseRef.current.downX, e.clientY - mouseRef.current.downY) > 5;
    setIsDragging(false);

    // Direct click on a 3D city marker
    if (!moved && overlayCanvasRef.current) {
      const rect = overlayCanvasRef.current.getBoundingClientRect();
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
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className="relative max-w-full aspect-square flex items-center justify-center"
        >
          {/* Layer 1: WebGL 3D Raycasted NASA Earth Sphere */}
          <canvas
            ref={glCanvasRef}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          {/* Layer 2: 2D Vector Overlay for 3D Arcs, Uzbekistan Highlight & City Beacons */}
          <canvas
            ref={overlayCanvasRef}
            style={{ width: `${size}px`, height: `${size}px` }}
            className="relative w-full h-full"
          />
        </div>

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
