import { useMapEvents } from 'react-leaflet';

function CenterTracker({ setMapCenter, setZoom, userMovingRef }) {
  useMapEvents({
    dragstart() {
      userMovingRef.current = true;
    },
    dragend(e) {
      userMovingRef.current = false;
      const center = e.target.getCenter();
      setMapCenter([center.lat, center.lng]);
    },
    zoomend(e) {
      setZoom(e.target.getZoom());
    }
  });
  return null;
}

export default CenterTracker;