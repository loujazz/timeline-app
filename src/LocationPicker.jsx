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

const DEFAULT_CENTER = [41.9028, 12.4964]; // Rome
const DEFAULT_ZOOM = 4;

/**
 * Interactive map for picking or displaying a location.
 * @param {{ lat?: number, lng?: number, onChange?: (lat,lng)=>void, readOnly?: boolean, height?: number }} props
 */
export default function LocationPicker({ lat, lng, onChange, readOnly = false, height = 200 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const hasCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create map
    const center = hasCoords ? [lat, lng] : DEFAULT_CENTER;
    const zoom = hasCoords ? 12 : DEFAULT_ZOOM;
    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: !readOnly,
      dragging: !readOnly || true, // always allow drag for exploration
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Place marker if coords exist
    if (hasCoords) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    // Click to place marker (editor mode)
    if (!readOnly && onChange) {
      map.on("click", (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          markerRef.current = L.marker([newLat, newLng]).addTo(map);
        }
        onChange(parseFloat(newLat.toFixed(6)), parseFloat(newLng.toFixed(6)));
      });
    }

    // Fix tile rendering in dynamic containers
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [readOnly]); // re-create only when mode changes

  // Update marker position when coords change from outside (EXIF)
  useEffect(() => {
    if (!mapRef.current) return;
    if (hasCoords) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
      }
      mapRef.current.setView([lat, lng], 12);
    }
  }, [lat, lng]);

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
