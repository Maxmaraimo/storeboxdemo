import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { loadYandexMaps } from "../courier/yandexMapsLoader";

export interface DashboardMapOrder {
  num: string;
  client: string;
  lat: number;
  lng: number;
  total: number;
  status: string;
}

export interface DashboardMapBranch {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface DashboardOrderMapProps {
  orders: DashboardMapOrder[];
  branches: DashboardMapBranch[];
  showBranches: boolean;
  currency: "UZS" | "USD";
}

const orderMarker = '<span class="storebox-map-pin storebox-map-pin--order" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4M12 11v10"/></svg></span>';
const branchMarker = '<span class="storebox-map-pin storebox-map-pin--branch" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5V21h16V10.5M3 3h18l1 7a3 3 0 0 1-5.5 1.5A3 3 0 0 1 12 12a3 3 0 0 1-4.5-.5A3 3 0 0 1 2 10l1-7Z"/><path d="M9 21v-6h6v6"/></svg></span>';

const leafletOrderIcon = L.divIcon({
  className: "storebox-leaflet-marker",
  html: orderMarker,
  iconSize: [42, 48],
  iconAnchor: [21, 48],
});
const leafletBranchIcon = L.divIcon({
  className: "storebox-leaflet-marker",
  html: branchMarker,
  iconSize: [42, 48],
  iconAnchor: [21, 48],
});

function formatOrderTotal(total: number, currency: "UZS" | "USD") {
  if (currency === "USD") {
    return `$${(total / 12800).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${Math.round(total).toLocaleString("uz-UZ")} UZS`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function MapViewport({ points }: { points: [number, number][] }) {
  const map = useMap();
  const pointsKey = points.map(([lat, lng]) => `${lat},${lng}`).join(";");

  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13, animate: true });
    } else if (points.length === 1) {
      map.setView(points[0], 11, { animate: true });
    }
    // Only move the map when the visible locations change.
  }, [map, pointsKey]);

  return null;
}

function OpenStreetMapFallback({ orders, branches, showBranches, currency }: DashboardOrderMapProps) {
  const points: [number, number][] = [
    ...orders.map((order): [number, number] => [order.lat, order.lng]),
    ...(showBranches ? branches.map((branch): [number, number] => [branch.latitude, branch.longitude]) : []),
  ];

  return (
    <MapContainer center={points[0] || [41.3111, 69.2797]} zoom={points.length ? 11 : 6} scrollWheelZoom={false} className="h-full w-full">
      <MapViewport points={points} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {orders.map((order, index) => (
        <Marker key={`${order.num}-${index}`} position={[order.lat, order.lng]} icon={leafletOrderIcon}>
          <Popup>
            <div className="space-y-1 text-xs">
              <strong>#{order.num} · {order.client}</strong>
              <div>{order.status}</div>
              <div>{formatOrderTotal(order.total, currency)}</div>
            </div>
          </Popup>
        </Marker>
      ))}
      {showBranches && branches.map((branch) => (
        <Marker key={`branch-${branch.id}`} position={[branch.latitude, branch.longitude]} icon={leafletBranchIcon}>
          <Popup>
            <div className="space-y-1 text-xs">
              <strong>{branch.name}</strong>
              {branch.address && <div>{branch.address}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function DashboardOrderMap(props: DashboardOrderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ymaps, setYmaps] = useState<any>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const { orders, branches, showBranches, currency } = props;

  useEffect(() => {
    let active = true;
    let map: any = null;

    loadYandexMaps().then((api) => {
      if (!active || !containerRef.current) return;
      map = new api.Map(containerRef.current, {
        center: [41.3111, 69.2797],
        zoom: 6,
        controls: ["zoomControl"],
      }, { suppressMapOpenBlock: true });
      map.behaviors.disable("scrollZoom");
      mapRef.current = map;
      setYmaps(api);
    }).catch(() => {
      if (active) setLoadFailed(true);
    });

    return () => {
      active = false;
      mapRef.current = null;
      map?.destroy();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ymaps || !map) return;

    map.geoObjects.removeAll();
    const orderLayout = ymaps.templateLayoutFactory.createClass(`<div class="storebox-yandex-marker">${orderMarker}</div>`);
    const branchLayout = ymaps.templateLayoutFactory.createClass(`<div class="storebox-yandex-marker">${branchMarker}</div>`);
    const markerOptions = {
      iconShape: { type: "Rectangle", coordinates: [[-21, -48], [21, 0]] },
      hideIconOnBalloonOpen: false,
    };
    const points: [number, number][] = [];

    orders.forEach((order) => {
      points.push([order.lat, order.lng]);
      map.geoObjects.add(new ymaps.Placemark([order.lat, order.lng], {
        balloonContentHeader: `#${escapeHtml(order.num)} · ${escapeHtml(order.client)}`,
        balloonContentBody: `${escapeHtml(order.status)}<br>${escapeHtml(formatOrderTotal(order.total, currency))}`,
      }, { ...markerOptions, iconLayout: orderLayout }));
    });
    if (showBranches) {
      branches.forEach((branch) => {
        points.push([branch.latitude, branch.longitude]);
        map.geoObjects.add(new ymaps.Placemark([branch.latitude, branch.longitude], {
          balloonContentHeader: escapeHtml(branch.name),
          balloonContentBody: escapeHtml(branch.address || ""),
        }, { ...markerOptions, iconLayout: branchLayout }));
      });
    }

    if (points.length > 1) {
      const latitudes = points.map(([lat]) => lat);
      const longitudes = points.map(([, lng]) => lng);
      const bounds: [number, number][] = [
        [Math.min(...latitudes), Math.min(...longitudes)],
        [Math.max(...latitudes), Math.max(...longitudes)],
      ];
      if (bounds[0][0] !== bounds[1][0] || bounds[0][1] !== bounds[1][1]) {
        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 48 }).then(() => {
          if (mapRef.current === map && map.getZoom() > 13) map.setZoom(13);
        });
      } else {
        map.setCenter(points[0], 11);
      }
    } else if (points.length === 1) {
      map.setCenter(points[0], 11);
    } else {
      map.setCenter([41.3111, 69.2797], 6);
    }
  }, [ymaps, orders, branches, showBranches, currency]);

  if (loadFailed) return <OpenStreetMapFallback {...props} />;

  return <div ref={containerRef} className="h-full w-full" aria-label="Yandex Maps" />;
}
