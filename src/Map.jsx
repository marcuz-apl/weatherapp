import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  ZoomControl,
  AttributionControl,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

const icon = L.divIcon({
  html: '<div style="font-size:1.7rem;filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))">📍</div>',
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

// On phones, map gestures fight page scrolling. Start locked and let the
// user opt in, so a single swipe always scrolls the page.
function Gestures({ enabled }) {
  const map = useMap();
  useEffect(() => {
    for (const h of ["dragging", "touchZoom", "doubleClickZoom", "boxZoom"]) {
      if (enabled) map[h].enable();
      else map[h].disable();
    }
  }, [map, enabled]);
  return null;
}

function Recenter({ lat, lon }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    map.flyTo([lat, lon], 10, { duration: 1.2 });
  }, [lat, lon, map]);
  return null;
}

export default function Map({ lat, lon, name, onPick, interactive }) {
  return (
    <MapContainer
      center={[lat, lon]}
      zoom={10}
      className="h-full w-full"
      scrollWheelZoom={interactive}
      attributionControl={false}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={18}
      />
      <ZoomControl position="bottomright" />
      <AttributionControl position="bottomleft" prefix={false} />
      <Gestures enabled={interactive} />
      <Recenter lat={lat} lon={lon} />
      <Marker position={[lat, lon]} icon={icon}>
        <Popup>{name}</Popup>
      </Marker>
      <MapClick onPick={onPick} />
    </MapContainer>
  );
}

function MapClick({ onPick }) {
  const map = useMap();
  useEffect(() => {
    if (!onPick) return;
    const handler = (e) => onPick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => map.off("click", handler);
  }, [map, onPick]);
  return null;
}
