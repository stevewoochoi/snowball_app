import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import SpotForm from './SpotForm'; 

function SettingsModal({ onClose, onLogout }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.17)', zIndex: 2100, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start'
    }}>
      <div style={{
        margin: '32px 0 0 20px', padding: 24, background: '#fff', borderRadius: 18,
        minWidth: 220, minHeight: 120, boxShadow: '0 4px 30px #0002', position: 'relative'
      }}>
        <div style={{fontSize: 20, fontWeight: 'bold', marginBottom: 12}}>설정</div>
        {/* 앞으로 공지사항 등 메뉴도 여기에 추가 */}
        <button
          onClick={onLogout}
          style={{background:'#eee', color:'#333', border:'none', borderRadius:8, padding:'8px 20px', margin:'10px 0', width:'100%', fontWeight:'bold', fontSize:16}}
        >로그아웃</button>
        <button
          onClick={onClose}
          style={{
            position:'absolute', top:12, right:18, background:'none', border:'none', fontSize:20, color:'#666', cursor:'pointer'
          }}
        >×</button>
      </div>
    </div>
  );
}

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
      setZoom(z);
      const c = map.getCenter();
      setMapCenter([c.lat, c.lng]);
      console.log("[useMapEvents] 지도 zoom 변경 감지 | zoom:", z, "| center:", c.lat, c.lng);
    }
  });
  return null;
}

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
        {spots.map(spot => {
          let markerSize = Math.max(20, Math.min(80, Math.floor(6 * zoom - 44)));
          let categorySize = Math.round(markerSize * 0.85);
          // HTML for building + category overlay
          let iconHtml = `
            <div style="position:relative;width:${markerSize}px;height:${markerSize}px;">
              <img src="${spot.building?.iconUrl || ''}" 
                   style="width:${markerSize}px;height:${markerSize}px;display:block;" />
              ${spot.category?.iconUrl ? `
                <img src="${spot.category.iconUrl}" 
  style="
    width:${categorySize}px;
    height:${categorySize}px;
    position:absolute;
    left:55%;
    transform:translateX(-50%);
    top:-${Math.round(categorySize * 0.5)}px;
    z-index:2;
  " />
              ` : ''}
            </div>
          `;
          console.log("[마커]", spot.name, "| zoom:", zoom, "| markerSize:", markerSize, "| categorySize:", categorySize);
          return (
            <Marker
              key={spot.id}
              position={[spot.lat, spot.lng]}
              icon={new L.DivIcon({
                html: iconHtml,
                className: '',
                iconSize: [markerSize, markerSize],
                iconAnchor: [markerSize / 2, markerSize],
                popupAnchor: [0, -markerSize]
              })}
            >
              <Popup>
                <b>{spot.name}</b><br />
                건물: {spot.building && spot.building.name}<br />
                카테고리: {spot.category && spot.category.name}
              </Popup>
            </Marker>
          );
        })}
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