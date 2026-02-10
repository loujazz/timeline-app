import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix default marker icon (Leaflet + bundlers issue)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/**
 * Global map showing markers for all geotagged events.
 * @param {{ events: Array, onSelectEvent?: (id)=>void, height?: number|string }} props
 */
export default function GlobalMap({ events, onSelectEvent, height = 400 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const geoEvents = events.filter(
    (e) => e.showMap && e.location?.lat != null && e.location?.lng != null
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [41.9028, 12.4964],
      zoom: 4,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add markers
    const markers = [];
    geoEvents.forEach((ev) => {
      const marker = L.marker([ev.location.lat, ev.location.lng]).addTo(map);
      marker.bindPopup(
        `<strong style="font-size:13px">${ev.title.replace(/</g, "&lt;")}</strong>`
      );
      if (onSelectEvent) {
        marker.on("click", () => onSelectEvent(ev.id));
      }
      markers.push(marker);
    });

    // Fit bounds to show all markers
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    } else if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 10);
    }

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [geoEvents.map((e) => `${e.id}:${e.location.lat}:${e.location.lng}`).join(",")]);

  if (geoEvents.length === 0) {
    return (
      <div
        style={{
          height: typeof height === "number" ? height : undefined,
          minHeight: 200,
          borderRadius: 12,
          border: "1px solid var(--md-outline-variant)",
          background: "var(--md-surface-container-lowest)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--md-on-surface-variant)",
          fontSize: 13,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Nessun evento con posizione
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--md-outline-variant)",
      }}
    />
  );
}
