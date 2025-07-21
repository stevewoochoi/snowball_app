// Fix: Ensure MapContainer fills the entire visible viewport on mobile by forcing fixed positioning and full 100dvh height.
// This resolves the issue where the map starts below the browser UI causing buttons (like the igloo button) to be partially hidden.

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
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

  // --- 선택 미리보기 상태 ---
  const [previewBuilding, setPreviewBuilding] = useState(null);
  const [previewCategory, setPreviewCategory] = useState(null);

  const [buildBtnPressed, setBuildBtnPressed] = useState(false);
  const [mainBtnPressed, setMainBtnPressed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

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

  useEffect(() => {
    let initialHeight = window.innerHeight;
    const onResize = () => {
      const heightDiff = initialHeight - window.innerHeight;
      setKeyboardOpen(heightDiff > 150);
      initialHeight = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
      axios.get(`/api/spots?owner_id=${userId}&scope=PRIVATE`)
        .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
      setShowForm(false);
      setPreviewBuilding(null);
      setPreviewCategory(null);
    });
  };

  return (
    <>
      <style>{`
        body, #root {
          margin: 0; 
          padding: 0;
          height: 100dvh;
          overflow: hidden;
        }
        .leaflet-container {
          top: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          position: fixed !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          background: #ddd;
          z-index: 0 !important;
        }
      `}</style>
      <div style={showForm ? {overflow: 'hidden'} : {}}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', margin: 0, padding: 0, zIndex: 0 }}
          whenCreated={mapInstance => (mapRef.current = mapInstance)}
          whenReady={() => {
            if (mapRef.current) {
              const c = mapRef.current.getCenter();
              setMapCenter([c.lat, c.lng]);
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

        {/* 지도 중앙 미리보기: 손가락+건물+카테고리 (SpotMarker 구조와 동일) */}
        {showForm && (
          <div style={{
            position: 'fixed',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -55%)',
            zIndex: 3100, pointerEvents: 'none', textAlign: 'center'
          }}>
            <img src="/etc/finger.png" alt="finger" style={{
              width: 54, height: 54, filter: 'drop-shadow(0 2px 8px #0002)', marginBottom: 0
            }} />
            {/* 건물/카테고리 미리보기는 손가락 위쪽에 겹치게 */}
            {previewBuilding && (
              <div style={{
                position: 'absolute', left: '50%', bottom: '52px', transform: 'translate(-50%, 0)', width: 62, height: 62, zIndex: 3110, pointerEvents: 'none'
              }}>
                <img
                  src={previewBuilding.iconUrl}
                  alt={previewBuilding.name}
                  style={{
                    width: 62, height: 62, borderRadius: 13, boxShadow: '0 0 10px #0002',
                    position: 'absolute', left: 0, top: 0, zIndex: 1
                  }}
                />
                {previewCategory && (
                  <img
                    src={previewCategory.iconUrl}
                    alt={previewCategory.name}
                    style={{
                      width: 52, height: 52, borderRadius: 11, boxShadow: '0 0 6px #2222',
                      position: 'absolute', left: '54%', top: '-26px', transform: 'translateX(-50%)', zIndex: 2
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

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
        {showSettings && (
          <SettingsModal
            onClose={() => setShowSettings(false)}
            onLogout={handleLogout}
          />
        )}

        {/* 하단 좌측에 hammer(건축) 버튼 */}
        {!keyboardOpen && (
          <img
            src={buildBtnPressed ? "/btn_buildbuttonon.png" : "/btn_buildbutton.png"}
            alt="건축"
            style={{
              position: 'fixed', bottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)", left: 16, width: 70, height: 70, zIndex: 2001, cursor: 'pointer'
            }}
            onClick={() => {
              setBuildBtnPressed(true);
              setShowForm(true);
              setTimeout(() => setBuildBtnPressed(false), 180);
            }}
            draggable={false}
          />
        )}

        {/* SpotForm 모달 */}
        {showForm && (
          <div
            style={{
              position: 'fixed',
              zIndex: 3200,
              left: 0,
              top: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none', // 팝업 바깥(지도)은 항상 터치 이벤트 허용
              background: 'rgba(0,0,0,0.00)'
            }}
          >
            <div style={{
              // pointerEvents: 'auto',
              margin: '0 auto',
              maxWidth: 370,
              width: '96vw',
              minWidth: 220,
              // (팝업의 상단 고정 위치. 아래는 예시)
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <SpotForm
                center={mapCenter}
                onSubmit={handleAddSpot}
                onClose={() => {
                  setShowForm(false);
                  setPreviewBuilding(null);
                  setPreviewCategory(null);
                }}
                onBuildingSelect={setPreviewBuilding}
                onCategorySelect={setPreviewCategory}
                selectedBuilding={previewBuilding}
                selectedCategory={previewCategory}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// TODO: SpotForm에도 maxHeight: '65dvh', overflowY: 'auto' 적용 필요

export default MapWithSpots;