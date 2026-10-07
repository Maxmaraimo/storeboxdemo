import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Navigation,
  Phone,
  CheckCircle2,
  Lock,
  ArrowRight,
  MapPin,
  Compass,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CourierOrder, NavigationStage, Language } from './types';
import {
  calculateBearing,
  interpolateAngle,
  calculateDistanceMeters,
  formatDistance,
  formatDuration,
  formatMoney,
} from './geoUtils';
import { loadYandexMaps } from './yandexMapsLoader';
import { completeOrder, updateCourierLocation, fetchFallbackRoute } from './courierApi';

interface YandexNavigatorModalProps {
  order: CourierOrder;
  courierId?: number | null;
  courierInitialPos?: [number, number] | null;
  lang: Language;
  onClose: () => void;
  onOrderCompleted: (orderId: number) => void;
}

const UI_TEXT: Record<Language, Record<string, string>> = {
  uz: {
    preview_title: "Yo'nalish tayyor",
    start_nav: "В путь (Поехали)",
    driving_title: "Harakatlanmoqda",
    arrived_btn: "Я на месте (Yetib keldim)",
    arrived_locked: "Mijozga yaqinlashing (qoldi",
    arrived_title: "Yetib kelindi",
    complete_btn: "Заказ доставлен & Оплата",
    call_customer: "Qo'ng'iroq",
    payment_label: "To'lov",
    cash: "Naqd pul",
    paid: "To'langan",
    meters: "m",
    km: "km",
    test_approach: "100m yaqinlashish (Test)",
    order_delivered_success: "Buyurtma yetkazildi! 🎉",
    straight_ahead: "To'g'riga harakatlaning",
    turn_soon: "Manzilga yaqinlashyapsiz",
  },
  ru: {
    preview_title: "Маршрут готов",
    start_nav: "В путь (Поехали)",
    driving_title: "В пути к клиенту",
    arrived_btn: "Я на месте (Прибыл)",
    arrived_locked: "Приблизьтесь к точке (ещё",
    arrived_title: "Вы на месте",
    complete_btn: "Заказ доставлен & Оплата",
    call_customer: "Позвонить",
    payment_label: "Оплата",
    cash: "Наличными",
    paid: "Оплачено",
    meters: "м",
    km: "км",
    test_approach: "Подъехать к точке (Тест)",
    order_delivered_success: "Заказ успешно доставлен! 🎉",
    straight_ahead: "Двигайтесь прямо",
    turn_soon: "Вы приближаетесь к адресу",
  },
  en: {
    preview_title: "Route Ready",
    start_nav: "Start Navigation",
    driving_title: "En Route to Customer",
    arrived_btn: "I Have Arrived",
    arrived_locked: "Approach customer location (remaining",
    arrived_title: "Arrived at Destination",
    complete_btn: "Order Delivered & Paid",
    call_customer: "Call",
    payment_label: "Payment",
    cash: "Cash",
    paid: "Paid",
    meters: "m",
    km: "km",
    test_approach: "Approach Target (Test)",
    order_delivered_success: "Order delivered successfully! 🎉",
    straight_ahead: "Continue straight",
    turn_soon: "Approaching destination",
  },
};

export const YandexNavigatorModal: React.FC<YandexNavigatorModalProps> = ({
  order,
  courierId,
  courierInitialPos,
  lang,
  onClose,
  onOrderCompleted,
}) => {
  const t = UI_TEXT[lang] || UI_TEXT.ru;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const vehiclePlacemarkRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const destPlacemarkRef = useRef<any>(null);

  // Fallback anchor: Tashkent center or Samarkand
  const defaultCourierPos: [number, number] = courierInitialPos || [39.6542, 66.9597];
  const destPos: [number, number] = [
    order.dest_lat || order.delivery_lat || defaultCourierPos[0] + 0.009,
    order.dest_lng || order.delivery_lng || defaultCourierPos[1] + 0.008,
  ];

  const [stage, setStage] = useState<NavigationStage>('PREVIEW');
  const [courierPos, setCourierPos] = useState<[number, number]>(defaultCourierPos);
  const [bearing, setBearing] = useState<number>(0);
  const [distanceRemaining, setDistanceRemaining] = useState<number>(0);
  const [durationRemaining, setDurationRemaining] = useState<number>(0);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Animation and simulation refs
  const currentPathIndexRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);
  const currentBearingRef = useRef<number>(0);
  const currentPosRef = useRef<[number, number]>(defaultCourierPos);
  const isNavigatingRef = useRef<boolean>(false);

  // Initialize distance
  useEffect(() => {
    const initialDist = calculateDistanceMeters(
      defaultCourierPos[0],
      defaultCourierPos[1],
      destPos[0],
      destPos[1]
    );
    setDistanceRemaining(initialDist);
    setDurationRemaining(Math.round((initialDist / 8.33))); // ~30 km/h average
  }, []);

  // Update real courier location to backend periodically during driving
  const syncLocationToBackend = useCallback((lat: number, lng: number) => {
    try {
      updateCourierLocation(lat, lng, courierId).catch(() => {});
    } catch {
      // ignore network errors
    }
  }, [courierId]);

  // Build Road Route via official Yandex Maps JavaScript API
  const buildRoadRoute = useCallback(async (ymaps: any, map: any, start: [number, number], dest: [number, number]) => {
    let roadCoords: [number, number][] = [];
    let lengthMeters = 0;
    let timeSeconds = 0;

    try {
      const route = await ymaps.route([start, dest], {
        mapStateAutoApply: false,
      });

      const paths = route.getPaths();
      if (paths && paths.getLength() > 0) {
        const path = paths.get(0);
        if (path.geometry && path.geometry.getCoordinates) {
          roadCoords = path.geometry.getCoordinates();
        }
        if (!roadCoords || roadCoords.length === 0) {
          const segments = path.getSegments();
          for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const segCoords = (seg.geometry && seg.geometry.getCoordinates) ? seg.geometry.getCoordinates() : seg.getCoordinates();
            if (segCoords && segCoords.length > 0) {
              for (let j = 0; j < segCoords.length; j++) {
                roadCoords.push([segCoords[j][0], segCoords[j][1]]);
              }
            }
          }
        }
        lengthMeters = route.getLength();
        timeSeconds = route.getTime();
      }
    } catch (err) {
      console.warn('Yandex Maps route API error, falling back to real road OSRM:', err);
    }

    // High reliability direct client-side OSRM fallback (real road network)
    if (roadCoords.length === 0) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
        const res = await fetch(osrmUrl);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          roadCoords = data.routes[0].geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
          lengthMeters = data.routes[0].distance;
          timeSeconds = data.routes[0].duration;
        }
      } catch (fErr) {
        console.warn('Client-side OSRM failed, falling back to server corridor:', fErr);
        try {
          const fallback = await fetchFallbackRoute(start[0], start[1], dest[0], dest[1]);
          if (fallback.coordinates && fallback.coordinates.length > 0) {
            roadCoords = fallback.coordinates;
            lengthMeters = fallback.distance;
            timeSeconds = fallback.duration;
          }
        } catch {
          // ignore
        }
      }
    }

    // Guarantee minimum points
    if (roadCoords.length === 0) {
      roadCoords = [start, [(start[0] + dest[0]) / 2, (start[1] + dest[1]) / 2], dest];
      lengthMeters = calculateDistanceMeters(start[0], start[1], dest[0], dest[1]);
      timeSeconds = Math.round(lengthMeters / 8.33);
    }

    setRouteCoordinates(roadCoords);
    setDistanceRemaining(lengthMeters);
    setDurationRemaining(timeSeconds);

    // Initial heading calculation
    if (roadCoords.length >= 2) {
      const initBearing = calculateBearing(
        roadCoords[0][0],
        roadCoords[0][1],
        roadCoords[1][0],
        roadCoords[1][1]
      );
      currentBearingRef.current = initBearing;
      setBearing(initBearing);
    }

    // Remove old polylines if any
    if (routePolylineRef.current) {
      map.geoObjects.remove(routePolylineRef.current);
    }

    // Render Clean Road Polyline (Yandex Pro Vibrant Emerald)
    const polyline = new ymaps.Polyline(
      roadCoords,
      {},
      {
        strokeColor: '#10b981',
        strokeWidth: 5.5,
        strokeOpacity: 0.95,
        outlineColor: '#064e3b',
        outlineWidth: 2,
        lineCap: 'round',
        lineJoin: 'round',
      }
    );

    routePolylineRef.current = polyline;
    map.geoObjects.add(polyline);

    // Fit map bounds to show route nicely
    map.setBounds(polyline.geometry.getBounds(), {
      checkZoomRange: true,
      zoomMargin: [120, 40, 240, 40],
      duration: 300,
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    let isSubscribed = true;

    loadYandexMaps().then((ymaps) => {
      if (!isSubscribed || !mapContainerRef.current) return;

      // Create Yandex Map instance
      const map = new ymaps.Map(
        mapContainerRef.current,
        {
          center: defaultCourierPos,
          zoom: 16,
          controls: [],
          type: 'yandex#map',
        },
        {
          suppressMapOpenBlock: true,
        }
      );

      mapInstanceRef.current = map;

      // 1. Destination Marker (Clean Storebox Pin)
      const DestLayout = ymaps.templateLayoutFactory.createClass(
        `<div style="
            display: flex;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -100%);
            cursor: pointer;
            filter: drop-shadow(0 4px 12px rgba(225, 29, 72, 0.45));
          ">
            <div style="
              background: #e11d48;
              color: white;
              padding: 5px 9px;
              border-radius: 12px;
              font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
              font-size: 11px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 4px;
              border: 1.5px solid white;
              white-space: nowrap;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${order.delivery_address ? order.delivery_address.slice(0, 20) : 'Mijoz'}</span>
            </div>
        </div>`
      );

      const destPlacemark = new ymaps.Placemark(
        destPos,
        {},
        {
          iconLayout: DestLayout,
          iconPane: 'overlaps',
        }
      );
      destPlacemarkRef.current = destPlacemark;
      map.geoObjects.add(destPlacemark);

      // 2. Courier Vehicle Delta Marker (Aerodynamic Forward Triangle)
      const DeltaLayout = ymaps.templateLayoutFactory.createClass(
        `<div id="courier-vehicle-wrapper" style="
            width: 44px;
            height: 44px;
            margin-left: -22px;
            margin-top: -22px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35));
          ">
            <div id="courier-delta-arrow" style="
              width: 38px;
              height: 38px;
              transform: rotate($[properties.bearing]deg);
              transform-origin: 50% 50%;
              transition: transform 0.1s linear;
            ">
              <svg viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <circle cx="19" cy="19" r="17" fill="rgba(37, 99, 235, 0.2)" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="3 3"/>
                <path d="M19 4L31 31L19 25L7 31L19 4Z" fill="#1e40af" stroke="#60a5fa" stroke-width="2.2" stroke-linejoin="round"/>
                <circle cx="19" cy="19" r="3.2" fill="#60a5fa"/>
              </svg>
            </div>
        </div>`
      );

      const vehiclePlacemark = new ymaps.Placemark(
        defaultCourierPos,
        { bearing: 0 },
        {
          iconLayout: DeltaLayout,
          iconPane: 'overlaps',
          zIndex: 9999,
        }
      );
      vehiclePlacemarkRef.current = vehiclePlacemark;
      map.geoObjects.add(vehiclePlacemark);

      // Build Route
      buildRoadRoute(ymaps, map, defaultCourierPos, destPos);
      setIsMapReady(true);
    }).catch((err) => {
      console.error('Failed to initialize Yandex Maps:', err);
    });

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [buildRoadRoute]);

  // Update vehicle rotation in DOM directly for 60fps responsiveness without DOM rebuilding
  const updateVehicleInDom = (lat: number, lng: number, angle: number) => {
    if (vehiclePlacemarkRef.current) {
      vehiclePlacemarkRef.current.geometry.setCoordinates([lat, lng]);
    }
    const arrowEl = document.getElementById('courier-delta-arrow');
    if (arrowEl) {
      arrowEl.style.transform = `rotate(${angle}deg)`;
    }
  };

  // Start Navigation Action («В путь»)
  const handleStartNavigation = () => {
    setStage('DRIVING');
    isNavigatingRef.current = true;

    if (mapInstanceRef.current) {
      // Zoom in to driving mode
      mapInstanceRef.current.setCenter(currentPosRef.current, 17, {
        duration: 300,
      });
    }

    // Start 60 FPS animation/simulation loop along route coordinates
    startNavigationLoop();
  };

  // 60 FPS Smooth Navigation Loop
  const startNavigationLoop = () => {
    if (routeCoordinates.length === 0) return;

    let coordIndex = 0;
    let tProgress = 0; // 0 to 1 between points
    const speed = 0.025; // smooth step size

    const step = () => {
      if (!isNavigatingRef.current) return;

      if (coordIndex < routeCoordinates.length - 1) {
        const p1 = routeCoordinates[coordIndex];
        const p2 = routeCoordinates[coordIndex + 1];

        tProgress += speed;

        if (tProgress >= 1) {
          tProgress = 0;
          coordIndex += 1;
          currentPathIndexRef.current = coordIndex;
        }

        // Interpolate current position
        const curLat = p1[0] + (p2[0] - p1[0]) * tProgress;
        const curLng = p1[1] + (p2[1] - p1[1]) * tProgress;
        currentPosRef.current = [curLat, curLng];
        setCourierPos([curLat, curLng]);

        // Lookahead bearing (look ahead to next segments for smooth road orientation)
        const lookaheadIndex = Math.min(coordIndex + 2, routeCoordinates.length - 1);
        const lookaheadP = routeCoordinates[lookaheadIndex];
        const targetAngle = calculateBearing(curLat, curLng, lookaheadP[0], lookaheadP[1]);

        // Smooth circular angle interpolation
        const smoothAngle = interpolateAngle(currentBearingRef.current, targetAngle, 0.15);
        currentBearingRef.current = smoothAngle;
        setBearing(smoothAngle);

        // Update DOM Marker
        updateVehicleInDom(curLat, curLng, smoothAngle);

        // Keep map centered on courier with dynamic approach zoom
        if (mapInstanceRef.current && coordIndex % 3 === 0) {
          mapInstanceRef.current.panTo([curLat, curLng], {
            flying: false,
            duration: 80,
            timingFunction: 'linear',
            delay: 0,
          });
        }

        // Calculate remaining distance to destination
        const remainingDist = calculateDistanceMeters(curLat, curLng, destPos[0], destPos[1]);
        setDistanceRemaining(remainingDist);
        setDurationRemaining(Math.round(remainingDist / 8.33));

        // Periodic location sync to backend
        if (coordIndex % 15 === 0) {
          syncLocationToBackend(curLat, curLng);
        }

        animFrameIdRef.current = requestAnimationFrame(step);
      } else {
        // Reached destination!
        setDistanceRemaining(0);
        setDurationRemaining(0);
        setStage('ARRIVED');
        isNavigatingRef.current = false;
      }
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  };

  // Instant test approach: Jump to 80m from customer so courier can immediately test "Я на месте"
  const handleTestApproach = () => {
    isNavigatingRef.current = false;
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    // Point exactly 80 meters from destination
    const closeLat = destPos[0] - 0.0006;
    const closeLng = destPos[1] - 0.0005;
    currentPosRef.current = [closeLat, closeLng];
    setCourierPos([closeLat, closeLng]);

    const targetAngle = calculateBearing(closeLat, closeLng, destPos[0], destPos[1]);
    currentBearingRef.current = targetAngle;
    setBearing(targetAngle);

    updateVehicleInDom(closeLat, closeLng, targetAngle);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter([closeLat, closeLng], 18, { duration: 200 });
    }

    const dist = calculateDistanceMeters(closeLat, closeLng, destPos[0], destPos[1]);
    setDistanceRemaining(dist);
    setDurationRemaining(15);
    setStage('DRIVING');
    syncLocationToBackend(closeLat, closeLng);
  };

  // Stage 2 -> Stage 3: Courier clicks "Я на месте (Прибыл)"
  const handleArrivedAtDestination = () => {
    setStage('ARRIVED');
    isNavigatingRef.current = false;
    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(destPos, 18, { duration: 300 });
    }
  };

  // Stage 3: Courier clicks "Заказ доставлен & Оплата"
  const handleCompleteOrder = async () => {
    if (isCompleting) return;
    setIsCompleting(true);

    try {
      await completeOrder(order.id, courierId);
      setShowSuccessToast(true);

      setTimeout(() => {
        onOrderCompleted(order.id);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to complete order:', err);
      alert('Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
      setIsCompleting(false);
    }
  };

  // Can the courier click "Я на месте"? (Allowed if <= 150m or in arrived state)
  const isArriveButtonUnlocked = distanceRemaining <= 150;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden font-sans">
      {/* 1. TOP HUD GLASS CAPSULE (Yandex Pro Minimalist Design) */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 pt-safe flex items-center justify-between pointer-events-none">
        {/* Left: Turn / Guidance Glass Capsule */}
        <div className="pointer-events-auto flex items-center gap-2.5 bg-slate-900/90 dark:bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl px-3.5 py-2 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            {stage === 'ARRIVED' ? (
              <MapPin className="w-4 h-4" />
            ) : (
              <Navigation className="w-4 h-4 transform rotate-45" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white leading-tight">
              {stage === 'ARRIVED'
                ? t.arrived_title
                : distanceRemaining <= 150
                ? t.turn_soon
                : t.straight_ahead}
            </span>
            <span className="text-[11px] font-medium text-emerald-400">
              {formatDistance(distanceRemaining)} • {formatDuration(durationRemaining)}
            </span>
          </div>
        </div>

        {/* Right: Exit / Minimize Button */}
        <button
          onClick={onClose}
          className="pointer-events-auto w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
          title="Yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. LIVE YANDEX MAP CONTAINER */}
      <div className="relative flex-1 w-full h-full">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Recenter / Heading compass icon floating right */}
        {stage === 'DRIVING' && (
          <div className="absolute right-3 bottom-80 z-20 flex flex-col gap-2">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setCenter(currentPosRef.current, 18, { duration: 200 });
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/95 dark:bg-slate-900/90 text-slate-900 dark:text-white backdrop-blur-md border border-slate-200/60 dark:border-white/10 shadow-md flex items-center justify-center active:scale-95"
              title="Mening joylashuvim"
            >
              <Compass className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        )}
      </div>

      {/* 3. BOTTOM CONTROL CARD (Yandex Pro Ergonomic Minimalist Standard) */}
      <div className="relative z-30 p-3 pb-safe bg-white/95 dark:bg-[#141417]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-neutral-800 rounded-t-3xl shadow-2xl transition-all duration-200">
        <div className="max-w-md mx-auto space-y-3">
          {/* Subtle Top Handle */}
          <div className="w-10 h-1 bg-slate-300 dark:bg-neutral-700 rounded-full mx-auto" />

          {/* Order Header & Metrics */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400">
                <span className="font-semibold text-slate-800 dark:text-white">
                  #{order.order_number}
                </span>
                <span>•</span>
                <span className="truncate">{order.customer_name}</span>
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{order.delivery_address || 'Manzil ko\'rsatilmagan'}</span>
              </h2>
            </div>

            {/* Quick Call Button */}
            {order.customer_phone && (
              <a
                href={`tel:${order.customer_phone}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 text-slate-800 dark:text-neutral-200 text-xs font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t.call_customer}</span>
              </a>
            )}
          </div>

          {/* Payment & Distance Capsule */}
          <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-neutral-850 border border-slate-200/60 dark:border-neutral-800 text-slate-600 dark:text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                {t.payment_label}:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {order.payment_method === 'CASH' ? t.cash : t.paid} • {formatMoney(order.total_amount)}
              </span>
            </div>
            <div className="font-medium text-emerald-600 dark:text-emerald-400">
              {formatDistance(distanceRemaining)}
            </div>
          </div>

          {/* 4. STRICT 3-STAGE ACTION BUTTON PROGRESSION */}
          <div>
            {/* STAGE 1: PREVIEW -> «В путь (Поехали)» */}
            {stage === 'PREVIEW' && (
              <button
                onClick={handleStartNavigation}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-all active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4 transform rotate-45" />
                <span>{t.start_nav}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}

            {/* STAGE 2: DRIVING -> Locked / Unlocked «Я на месте (Прибыл)» */}
            {stage === 'DRIVING' && (
              <div className="space-y-2">
                {isArriveButtonUnlocked ? (
                  // Unlocked: In close proximity (<= 150m)
                  <button
                    onClick={handleArrivedAtDestination}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 animate-pulse transition-all active:scale-[0.98]"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{t.arrived_btn}</span>
                  </button>
                ) : (
                  // Locked: Distance > 150m
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 font-medium text-xs cursor-not-allowed border border-slate-200/60 dark:border-neutral-700/60"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {t.arrived_locked} {formatDistance(distanceRemaining)})
                    </span>
                  </button>
                )}

                {/* Development / Testing Quick Approach button */}
                <button
                  type="button"
                  onClick={handleTestApproach}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>{t.test_approach}</span>
                </button>
              </div>
            )}

            {/* STAGE 3: ARRIVED -> «Заказ доставлен & Оплата» */}
            {stage === 'ARRIVED' && (
              <button
                onClick={handleCompleteOrder}
                disabled={isCompleting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-75"
              >
                {isCompleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{t.complete_btn}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. SUCCESS CELEBRATION TOAST */}
      {showSuccessToast && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 border border-emerald-500/30 rounded-3xl p-6 text-center shadow-2xl max-w-xs w-full space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.order_delivered_success}
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                +{formatMoney(order.total_amount)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
