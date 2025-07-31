  // Fix: Ensure MapContainer fills the entire visible viewport on mobile by forcing fixed positioning and full 100dvh height.
  // This resolves the issue where the map starts below the browser UI causing buttons (like the igloo button) to be partially hidden.

  import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
  import L from 'leaflet';
  import { useEffect, useState, useRef } from 'react';
  import axios from 'axios';
  import 'leaflet/dist/leaflet.css';
  import SpotForm from '../SpotForm'; 
  import SpotMarker from './SpotMarker';
  import SettingsModal from './SettingsModal';
  import SpotView from './SpotView';

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
      },
      zoomend(e) {
        // 줌 레벨 변경이 끝났을 때 상태 갱신
        setZoom(e.target.getZoom());
      }
    });
    return null;
  }

  function MapWithSpots({ user }) {
    const [spots, setSpots] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [mapCenter, setMapCenter] = useState([37.5665, 126.9780]);
    const [zoom, setZoom] = useState(17);

    const [myLocation, setMyLocation] = useState(null);

    // SpotView modal state
    const [selectedSpot, setSelectedSpot] = useState(null);
    // [추가] 이동 모드 상태값
    const [moveSpot, setMoveSpot] = useState(null);

    useEffect(() => {
    // === 이동모드 진입 시 지도 중앙으로 ===
    if (moveSpot && moveSpot.lat && moveSpot.lng) {
      moveToLocation(
        [moveSpot.lat + 0.00013, 
        moveSpot.lng], zoom);
    }
    // eslint-disable-next-line
  }, [moveSpot]);

    // 지도 이동 중 moveSpot의 위치 트래킹 로그
    useEffect(() => {
      if (!moveSpot) return;
      // moveSpot 모드에서만 트래킹 (지도 이동 시마다 호출됨)
      console.log("[이동중] spotId=" + moveSpot.id + ", lat=" + mapCenter[0] + ", lng=" + mapCenter[1]);
    }, [moveSpot, mapCenter]);
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
      const userId = user?.id || localStorage.getItem("snowball_uid");
      if (!userId) return;
        const url = `/api/spots?ownerId=${userId}&scope=PRIVATE`; // ← 언더스코어!
      axios.get(url).then(res => {
        setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []);
      });
    }, [user]);

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
      if (!mapRef.current) {
        if (retryCount > 30) {
          console.error("Map instance not ready after multiple retries, aborting moveToLocation.");
          return;
        }
        setTimeout(() => moveToLocation(latlng, zoomLevel, retryCount + 1), 100);
        return;
      }
      userMovingRef.current = false;
      mapRef.current.flyTo(latlng, zoomLevel, { animate: true, duration: 1.2 });
      // 지도 flyTo 후 mapCenter를 latlng으로 강제 동기화
      setTimeout(() => {
        setMapCenter([latlng[0], latlng[1]]);
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
            setMyLocation([latitude, longitude]);
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

    const myLocationIcon = L.icon({
      iconUrl: '/etc/my_location_marker.png',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    const handleAddSpot = (data) => {
  const userId = localStorage.getItem("snowball_uid");
  const scope = data.scope || "PRIVATE";
  // owner_id로 통일
  axios.post(
    `/api/spots?buildingId=${data.buildingId}&categoryId=${data.categoryId}&ownerId=${userId}&scope=${scope}`,
    {
      name: data.name,
      lat: mapCenter[0],   // 항상 최신 mapCenter 사용!
      lng: mapCenter[1],
      isPublic: true
    }
  ).then(() => {
    axios.get(`/api/spots?ownerId=${userId}&scope=PRIVATE`)
      .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
    setShowForm(false);
    setPreviewBuilding(null);
    setPreviewCategory(null);
  });
};
    // [지도 클릭시 이동 처리] (더 이상 사용하지 않음)
    // const handleMapClickForMove = (e) => {
    //   if (!moveSpot) return;
    //   const { lat, lng } = e.latlng;
    //   // 서버 PATCH 호출 (예시)
    //   axios.patch(`/api/spots/${moveSpot.id}`, { lat, lng }).then(() => {
    //     setMoveSpot(null);
    //     const userId = user?.id || localStorage.getItem("snowball_uid");
    //     if (userId) {
    //       axios.get(`/api/spots?ownerId=${userId}&scope=PRIVATE`)
    //         .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
    //     }
    //   });
    // };

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
            // 지도 클릭 이동 방식 제거: whenCreated에서 map.on('click', ...) 제거
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
            {myLocation && <Marker position={myLocation} icon={myLocationIcon} />}
            {spots.map(spot => {
  const isMovable = moveSpot && moveSpot.id === spot.id;
  // 👉 이동 모드 중 해당 spot이면 지도에 마커 그리지 않음!
  if (isMovable) return null;

  // 기존 그대로
  return (
    <SpotMarker
      key={spot.id}
      spot={spot}
      zoom={zoom}
      draggable={!!isMovable}
      onClick={isMovable ? undefined : () => setSelectedSpot(spot)}
      onDragend={e => {
        if (isMovable) {
          const { lat, lng } = e.target.getLatLng();
          axios.patch(`/api/spots/${spot.id}`, { lat, lng }).then(() => {
            setMoveSpot(null);
            const userId = user?.id || localStorage.getItem("snowball_uid");
            if (userId) {
              axios.get(`/api/spots?ownerId=${userId}&scope=PRIVATE`)
                .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
            }
          });
        }
      }}
    />
  );
})}
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
          {/* SpotView 모달 */}
          {selectedSpot && !moveSpot && (
            <div style={{
              position: 'fixed', zIndex: 4000, top: 0, left: 0,
              width: '100vw', height: '100dvh', background: 'rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <SpotView
                spotId={selectedSpot.id}
                spot={selectedSpot}
                user={user}
                onClose={() => {
                  setSelectedSpot(null);
                  // 삭제 등으로 SpotView 닫힐 때 spots 새로고침
                  const userId = user?.id || localStorage.getItem("snowball_uid");
                  if (userId) {
                    axios.get(`/api/spots?ownerId=${userId}&scope=PRIVATE`)
                      .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
                  }
                }}
                onStartMove={spot => {
                  setSelectedSpot(null); // SpotView 닫기
                  setMoveSpot(spot);     // 이동 모드 진입
                }}
              />
            </div>
          )}
          {/* 이동 모드 안내 UI 및 이동 버튼 */}
          {moveSpot && (
  <>
    {/* 지도 중심에 이동 버튼만 배치 */}
    <div style={{
      position: "fixed",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      width: 140,
      height: 140,
      pointerEvents: "none",
      zIndex: 5002
    }}>
      {/* 위쪽 */}
      <img
        src="/button/btn_move_up.png"
        alt="위로 이동"
        style={{
          position: "absolute",
          left: "50%", top: 0, transform: "translateX(-50%)",
          width: 44, height: 34, cursor: "pointer", pointerEvents: "auto"
        }}
        onClick={async () => {
          const newLat = moveSpot.lat + 0.00025;
          await axios.patch(`/api/spots/${moveSpot.id}`, { lat: newLat, lng: moveSpot.lng });
          setMoveSpot({ ...moveSpot, lat: newLat });
          console.log("[이동] spotId=" + moveSpot.id + ", lat=" + newLat + ", lng=" + moveSpot.lng);
        }}
      />
      {/* 왼쪽 */}
      <img
        src="/button/btn_move_left.png"
        alt="왼쪽 이동"
        style={{
          position: "absolute",
          left: 0, top: "50%", transform: "translateY(-50%)",
          width: 34, height: 44, cursor: "pointer", pointerEvents: "auto"
        }}
        onClick={async () => {
          const newLng = moveSpot.lng - 0.0003;
          await axios.patch(`/api/spots/${moveSpot.id}`, { lat: moveSpot.lat, lng: newLng });
          setMoveSpot({ ...moveSpot, lng: newLng });
          console.log("[이동] spotId=" + moveSpot.id + ", lat=" + moveSpot.lat + ", lng=" + newLng);
        }}
      />
      {/* 오른쪽 */}
      <img
        src="/button/btn_move_right.png"
        alt="오른쪽 이동"
        style={{
          position: "absolute",
          right: 0, top: "50%", transform: "translateY(-50%)",
          width: 34, height: 44, cursor: "pointer", pointerEvents: "auto"
        }}
        onClick={async () => {
          const newLng = moveSpot.lng + 0.0003;
          await axios.patch(`/api/spots/${moveSpot.id}`, { lat: moveSpot.lat, lng: newLng });
          setMoveSpot({ ...moveSpot, lng: newLng });
          console.log("[이동] spotId=" + moveSpot.id + ", lat=" + moveSpot.lat + ", lng=" + newLng);
        }}
      />
      {/* 아래쪽 */}
      <img
        src="/button/btn_move_down.png"
        alt="아래 이동"
        style={{
          position: "absolute",
          left: "50%", bottom: 0, transform: "translateX(-50%)",
          width: 44, height: 34, cursor: "pointer", pointerEvents: "auto"
        }}
        onClick={async () => {
          const newLat = moveSpot.lat - 0.00025;
          await axios.patch(`/api/spots/${moveSpot.id}`, { lat: newLat, lng: moveSpot.lng });
          setMoveSpot({ ...moveSpot, lat: newLat });
          console.log("[이동] spotId=" + moveSpot.id + ", lat=" + newLat + ", lng=" + moveSpot.lng);
        }}
      />
      {/* 중앙 마커: 건물 + 카테고리 아이콘 (SpotMarker와 동일 크기/위치) */}
      {(() => {
        // 지도 zoom에 따라 동적으로 크기 계산
        const markerSize = Math.max(20, Math.min(80, Math.floor(6 * zoom - 44)));
        const categorySize = Math.round(markerSize * 0.85);
        return (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: markerSize,
              height: markerSize,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {/* 건물 아이콘 */}
            <img
              src={moveSpot.building?.iconUrl || "/etc/default-avatar.png"}
              alt=""
              style={{
                width: markerSize,
                height: markerSize,
                borderRadius: 13,
                boxShadow: '0 0 10px #0002',
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 1,
                background: "#fff",
              }}
            />
            {/* 카테고리 아이콘 (있을 때만) */}
            {moveSpot.category?.iconUrl && (
              <img
                src={moveSpot.category.iconUrl}
                alt=""
                style={{
                  width: categorySize,
                  height: categorySize,
                  borderRadius: 10,
                  boxShadow: '0 0 6px #2222',
                  position: 'absolute',
                  left: '55%',
                  top: -Math.round(categorySize * 0.5),
                  transform: 'translateX(-50%)',
                  zIndex: 2,
                  background: 'transparent',
                }}
              />
            )}
          </div>
        );
      })()}
    </div>

    {/* 상단에 이동 취소/완료 버튼만 배치 */}
    <div style={{
      position: "fixed",
      top: 46,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 5003,
      display: "flex",
      gap: 22
    }}>
      <button
        onClick={() => setMoveSpot(null)}
        style={{
          background: "#eee", borderRadius: 8, border: "1.4px solid #aaa",
          padding: "8px 24px", fontSize: 15, color: "#197ad6", cursor: "pointer"
        }}
      >이동 취소</button>
      <button
        onClick={async () => {
          // 위치 업데이트(백엔드)
          await axios.patch(
            `/api/spots/${moveSpot.id}`,
            {
              lat: mapCenter[0] - 0.00014, // ← 위도에서 미세하게 보정
              lng: mapCenter[1]
            },
            { headers: { Authorization: user?.token ? `Bearer ${user.token}` : undefined } }
          );
          // spots 목록 새로고침
          const userId = user?.id || localStorage.getItem("snowball_uid");
          if (userId) {
            axios.get(`/api/spots?ownerId=${userId}&scope=PRIVATE`)
              .then(res => setSpots(Array.isArray(res.data) ? res.data : res.data.spots || []));
          }
          // 모드 종료
          setMoveSpot(null);
        }}
        style={{
          background: "#1a9ad6", borderRadius: 8, border: "1.4px solid #1a9ad6",
          padding: "8px 24px", fontSize: 15, color: "#fff", fontWeight: 700, cursor: "pointer"
        }}
      >
        이동 완료
      </button>
    </div>
  </>
)}
        </div>
      </>
    );
  }

// TODO: SpotForm에도 maxHeight: '65dvh', overflowY: 'auto' 적용 필요

// [안내] SpotMarker에서 draggable, onDragend props가 동작하려면
// SpotMarker 내부에서 react-leaflet의 Marker에 해당 props를 전달해야 합니다.

  export default MapWithSpots;