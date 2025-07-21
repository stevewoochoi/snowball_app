import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
// import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import SpotForm from '../SpotForm'; 
import CenterTracker from './CenterTracker';
import SpotMarker from './SpotMarker';
import SettingsModal from './SettingsModal';

function MapWithSpots() {
  const [spots, setSpots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(17);
  const mapRef = useRef();

  // --- 아래 코드 추가 ---
  const [buildBtnPressed, setBuildBtnPressed] = useState(false);
  const [mainBtnPressed, setMainBtnPressed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

useEffect(() => {
  const userId = localStorage.getItem("snowball_uid");
  const url = `/api/spots?owner_id=${userId}&scope=PRIVATE`;
  axios.get(url).then(res => {
    setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []);
  });
}, []);

  // mapCenter가 변할 때마다 최신 중심좌표 로그 출력
  useEffect(() => {
  }, [mapCenter]);

const handleAddSpot = (data) => {
  const userId = localStorage.getItem("snowball_uid");
  const scope = data.scope || "PRIVATE";
  axios.post(
    `/api/spots?buildingId=${data.buildingId}&categoryId=${data.categoryId}&owner_id=${userId}&scope=${scope}`,
    {
      name: data.name,
      lat: mapCenter[0],
      lng: mapCenter[1],
      isPublic: true
    }
  ).then(() => {
    // *** "전체 스팟"이 아니라 "내 개인맵"만 다시 불러오기! ***
    axios.get(`/api/spots?owner_id=${userId}&scope=PRIVATE`)
      .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
    setShowForm(false);
  });
};

  return (
    <div>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ width: "100vw", height: "100vh" }}
        whenCreated={mapInstance => (mapRef.current = mapInstance)}
        whenReady={() => {
          if (mapRef.current) {
            const c = mapRef.current.getCenter();
            setMapCenter([c.lat, c.lng]);
            console.log("실시간 지도 중심(lat, lng):", c.lat, c.lng);
          }
        }}
        onzoomend={e => setZoom(e.target.getZoom())}
      >
        <CenterTracker setMapCenter={setMapCenter} setZoom={setZoom} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {spots.map(spot => <SpotMarker key={spot.id} spot={spot} zoom={zoom} />)}
      </MapContainer>

      {/* 좌측 상단 메인(설정) 버튼 */}
      <img
        src={mainBtnPressed ? "/button/btn_mainicon1on.png" : "/button/btn_mainicon.png"}
        alt="설정"
        style={{
          position: 'fixed', top: 18, left: 16, width: 70, height: 70, zIndex: 2101, cursor: 'pointer'
        }}
        onClick={() => {
          setMainBtnPressed(true);
          setShowSettings(true);
          setTimeout(() => setMainBtnPressed(false), 160);
        }}
        draggable={false}
      />
      {/* 세팅 모달 */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onLogout={handleLogout}
        />
      )}

      {/* 하단 좌측에 hammer(건축) 버튼 */}
      <img
        src={buildBtnPressed ? "/btn_buildbuttonon.png" : "/btn_buildbutton.png"}
        alt="건축"
        style={{
          position: 'fixed', bottom: 16, left: 16, width: 70, height: 70, zIndex: 2001, cursor: 'pointer'
        }}
        onClick={() => {
          setBuildBtnPressed(true);
          setShowForm(true);
          setTimeout(() => setBuildBtnPressed(false), 180);
        }}
        draggable={false}
      />

      {/* SpotForm 모달 */}
      {showForm && (
        <SpotForm
          center={mapCenter}
          onSubmit={handleAddSpot}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}


export default MapWithSpots;