"use client";

// Leaflet outbreak map.
// Why: geospatial clustering helps quickly identify where alerts/cases are concentrated.

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});

function derivePoints(rows = []) {
  return rows
    .map((row, index) => {
      const lat = Number(row?.lat || row?.latitude || row?.Lat || row?.geo_lat || 0);
      const lng = Number(row?.lng || row?.lon || row?.longitude || row?.Long || row?.geo_lon || 0);
      const hasLocation = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
      if (!hasLocation) return null;

      return {
        id: row?.id || `${lat}-${lng}-${index}`,
        lat,
        lng,
        label:
          row?.title ||
          row?.countriesAndTerritories ||
          row?.country ||
          row?.location ||
          row?.region ||
          "Outbreak marker",
      };
    })
    .filter(Boolean)
    .slice(0, 80);
}

export default function OutbreakMap({ data = [], loading = false, forcedMarker = null }) {
  const [mapReady, setMapReady] = useState(false);
  const points = useMemo(() => {
    if (forcedMarker?.lat != null && forcedMarker?.lng != null) {
      return [
        {
          id: "forced-india-marker",
          lat: Number(forcedMarker.lat),
          lng: Number(forcedMarker.lng),
          label: forcedMarker.label || "Outbreak marker",
        },
      ];
    }
    return derivePoints(data);
  }, [data, forcedMarker]);

  useEffect(() => {
    let mounted = true;

    // Configure default marker icons only in the browser.
    import("leaflet")
      .then((leaflet) => {
        if (!mounted) return;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        setMapReady(true);
      })
      .catch(() => {
        if (mounted) setMapReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading || !mapReady) {
    return <div className="h-80 animate-pulse rounded-2xl bg-slate-800/70" />;
  }

  if (!points.length) {
    return <div className="rounded-2xl border border-slate-800 p-4 text-slate-300">Map data unavailable.</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <MapContainer center={[20, 77]} zoom={2} scrollWheelZoom className="h-80 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point) => (
          <Marker key={point.id} position={[point.lat, point.lng]}>
            <Popup>{point.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
