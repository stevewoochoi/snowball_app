// Fix: Ensure MapContainer fills the entire visible viewport on mobile by forcing fixed positioning and full 100dvh height.
// This resolves the issue where the map starts below the browser UI causing buttons (like the igloo button) to be partially hidden.

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import SpotForm from '../SpotForm'; 
import SpotMarker from './SpotMarker';
import SettingsModal from './SettingsModal';

// CenterTracker 컴포넌트는 지도 내 사용자 인터랙션(드래그, 줌)을 감지하고,
// 그에 따라 부모 컴포넌트 상태(mapCenter, zoom)를 동기화하는 역할을 수행합니다.
// userMovingRef는 사용자가 지도를 움직이는 중임을 추적하는 ref입니다.
function CenterTracker({ setMapCenter, setZoom, userMovingRef }) {
  useMapEvents({
    dragstart() {
      // 사용자가 지도를 드래그 시작했음을 표시
      userMovingRef.current = true;
    },
    dragend(e) {
      // 드래그 종료 시점에 사용자가 더 이상 움직이지 않음을 표시하고,
      // 지도의 중심 좌표를 부모 컴포넌트 상태에 반영
      userMovingRef.current = false;
      const center = e.target.getCenter();
      setMapCenter([center.lat, center.lng]);
      console.log('[지도 이동] 위도:', center.lat, '경도:', center.lng);
    },
    zoomend(e) {
      // 줌 레벨 변경이 끝났을 때 상태 갱신
      setZoom(e.target.getZoom());
    }
  });
  return null;
}

function MapWithSpots() {
  const [spots, setSpots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(17);

  // mapRef는 react-leaflet의 MapContainer 인스턴스에 대한 참조를 저장합니다.
  // 이를 통해 외부 함수에서 지도를 직접 제어(flyTo 등)할 수 있습니다.
  const mapRef = useRef();

  const zoomRef = useRef(zoom);
  const userMovingRef = useRef(false);

  // --- 선택 미리보기 상태 ---
  const [previewBuilding, setPreviewBuilding] = useState(null);
  const [previewCategory, setPreviewCategory] = useState(null);

  const [buildBtnPressed, setBuildBtnPressed] = useState(false);
  const [mainBtnPressed, setMainBtnPressed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [splashShown, setSplashShown] = useState(true);

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

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setSplashShown(false);
    }, 1000); // Show splash for 1 second
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!splashShown) {
      getCurrentLocation();
    }
  }, [splashShown]);

  // moveToLocation 함수는 지정된 좌표와 줌 레벨로 지도를 이동시키는 역할을 합니다.
  // mapRef가 아직 초기화되지 않은 경우 재귀적으로 최대 30회까지 재시도합니다.
  // flyTo 메서드를 사용하여 부드럽게 지도 이동 애니메이션을 수행합니다.
  const moveToLocation = (latlng, zoomLevel = 16, retryCount = 0) => {
    // 지도 인스턴스가 준비되지 않았을 때 재시도 로직
    if (!mapRef.current) {
      if (retryCount > 30) {
        // 30회 이상 재시도 후에도 준비되지 않으면 에러 로그 출력 후 종료
        console.error("Map instance not ready after multiple retries, aborting moveToLocation.");
        return;
      }
      // 아직 준비되지 않았으니 100ms 후 재시도
      setTimeout(() => moveToLocation(latlng, zoomLevel, retryCount + 1), 100);
      return;
    }
    // 지도 이동 시작 시 사용자 움직임 상태 false로 설정
    userMovingRef.current = false;
    // flyTo를 통해 애니메이션과 함께 지정 위치 및 줌으로 이동
    mapRef.current.flyTo(latlng, zoomLevel, { animate: true, duration: 1.2 });
    // flyTo 직후 mapCenter 상태를 이동 위치로 동기화
    setMapCenter([latlng[0], latlng[1]]);
    // flyTo 직후 이동 좌표 콘솔 출력
    console.log('[이동 버튼] 위도:', latlng[0], '경도:', latlng[1]);
    // 이동 완료 후 현재 중심 좌표 로그 출력 (디버깅 목적)
    setTimeout(() => {
      if (mapRef.current) {
        const c = mapRef.current.getCenter();
      }
    }, 1300);
  };

  // getCurrentLocation 함수는 브라우저의 Geolocation API를 사용하여
  // 현재 위치를 얻고, 성공 시 moveToLocation으로 지도 이동을 수행합니다.
  // 실패하거나 지원하지 않는 경우 서울시청 좌표로 기본 이동합니다.
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          moveToLocation([latitude, longitude]);
        },
        (error) => {
          // 위치 정보 획득 실패 시 기본 위치로 이동
          moveToLocation([37.5665, 126.9780]);
        }
      );
    } else {
      // Geolocation 미지원 시 기본 위치로 이동
      moveToLocation([37.5665, 126.9780]);
    }
  };

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
          touch-action: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
        }
      `}</style>
      {/* Splash screen overlay, always rendered if splashShown */}
      {splashShown && (
        <div className="splash-screen" style={{
          position: 'fixed',
          zIndex: 99999,
          left: 0,
          top: 0,
          width: '100vw',
          height: '100dvh',
          pointerEvents: 'auto'
        }}>
          <img
            src="/etc/Default_3.jpg"
            alt="Splash"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}
      <div style={showForm ? {overflow: 'hidden'} : {}}>
        {/* 
          MapContainer는 react-leaflet의 지도 컴포넌트입니다.
          ref={mapRef}를 통해 내부 Leaflet 지도 인스턴스에 접근할 수 있게 하며,
          style에서 position: fixed와 height: 100dvh를 지정해 모바일에서 화면 전체를 채우도록 강제합니다.
          center와 zoom은 상태값으로 관리되어 지도 중심 및 확대 레벨을 제어합니다.
        */}
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          ref={mapRef} // 지도 인스턴스 참조 저장
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', margin: 0, padding: 0, zIndex: 0 }}
        >
          {/* 
            CenterTracker는 지도 이동 및 줌 변경 이벤트를 감지하여
            mapCenter와 zoom 상태를 동기화하는 역할을 합니다.
            이를 통해 사용자가 지도를 드래그하거나 확대/축소할 때 상태가 업데이트됩니다.
          */}
          <CenterTracker setMapCenter={setMapCenter} setZoom={setZoom} userMovingRef={userMovingRef} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {spots.map(spot => <SpotMarker key={spot.id} spot={spot} zoom={zoom} />)}
        </MapContainer>

        {/* 
          지도 이동 테스트 버튼들: 
          각각 현재 위치, 서울시청, 명동역 좌표로 지도를 이동시키는 버튼입니다.
          moveToLocation과 getCurrentLocation 함수를 호출하여 지도 중심을 변경합니다.
        */}
        <div style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <button
            onClick={() => {
              getCurrentLocation();
            }}
            style={{
              padding: '6px 10px',
              background: '#000',
              color: '#fff',
              border: '1px solid #fff',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}
          >
            내 위치
          </button>
          <button
            onClick={() => {
              moveToLocation([37.5665, 126.9780]);
            }}
            style={{
              padding: '6px 10px',
              background: '#000',
              color: '#fff',
              border: '1px solid #fff',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}
          >
            서울시청
          </button>
          <button
            onClick={() => {
              moveToLocation([37.5609, 126.9853]);
            }}
            style={{
              padding: '6px 10px',
              background: '#000',
              color: '#fff',
              border: '1px solid #fff',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}
          >
            명동역
          </button>
        </div>

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