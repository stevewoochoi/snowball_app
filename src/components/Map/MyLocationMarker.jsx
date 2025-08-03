// components/Map/MyLocationMarker.jsx
import { Marker } from "react-leaflet";
import L from "leaflet";

const myLocationIcon = L.icon({
  iconUrl: '/etc/my_location_marker.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MyLocationMarker({ myLocation, setMyLocation }) {
  if (!myLocation) return null;
  return (
    <Marker
      position={myLocation}
      icon={myLocationIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setMyLocation([lat, lng]);
          console.log("[내 위치 마커] 이동됨:", lat, lng);
          // 서버로 전송하려면 아래 코드 참고 (디바운스 추천)
          // axios.post('/api/user/location', { lat, lng });
        }
      }}
    />
  );
}

export default MyLocationMarker;