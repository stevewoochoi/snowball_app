// src/components/CenterTracker.jsx
import { useMapEvents } from 'react-leaflet';

function CenterTracker({ setMapCenter, setZoom }) {
  useMapEvents({
    moveend(e) {
      const map = e.target;
      const c = map.getCenter();
      setMapCenter([c.lat, c.lng]);
      console.log("[useMapEvents] 지도 이동감지 center:", c.lat, c.lng);
    },
    zoomend(e) {
      const map = e.target;
      const z = map.getZoom();
      const c = map.getCenter();
      setZoom(z);
      setMapCenter([c.lat, c.lng]);
      console.log("[useMapEvents] 지도 zoom 변경 감지 | zoom:", z, "| center:", c.lat, c.lng);
    }
  });
  return null;
}

export default CenterTracker;