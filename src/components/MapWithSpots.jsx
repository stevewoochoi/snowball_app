  // Fix: Ensure MapContainer fills the entire visible viewport on mobile by forcing fixed positioning and full 100dvh height.
  // This resolves the issue where the map starts below the browser UI causing buttons (like the igloo button) to be partially hidden.

  import { useMapEvents } from 'react-leaflet';
  import L from 'leaflet';
  import { useEffect, useState, useRef } from 'react';
  import axios from 'axios';
  import 'leaflet/dist/leaflet.css';
  import SpotForm from '../SpotForm'; 
  import SearchModal from './SearchModal';
  import SpotMarker from './Map/SpotMarker';
  import SettingsModal from './SettingsModal';
  import SpotView from './SpotView';
  import MyLocationMarker from './Map/MyLocationMarker';
  import CenterTracker from './Map/CenterTracker';
  import MoveSpotOverlay from './Map/MoveSpotOverlay';
  import MapControls from './Map/MapControls';
  import LeafletMap from './Map/LeafletMap';
  import SpotList from './Map/SpotList';
  import { useSpots } from "../hooks/useSpots"; // 경로 맞게 조정



  // CenterTracker 컴포넌트는 지도 내 사용자 인터랙션(드래그, 줌)을 감지하고,
 
  function MapWithSpots({ user }) {
    const [spots, setSpots] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [mapCenter, setMapCenter] = useState([37.5665, 126.9780]);
    const [zoom, setZoom] = useState(17);
    const [showSearch, setShowSearch] = useState(false);
    // Search button pressed state
    const [searchBtnPressed, setSearchBtnPressed] = useState(false);

    const [myLocation, setMyLocation] = useState(null);

    // SpotView modal state
    const [selectedSpot, setSelectedSpot] = useState(null);
    // [추가] 이동 모드 상태값
    const [moveSpot, setMoveSpot] = useState(null);

    const MAX_ZOOM = 18; // (타일 벤더에 따라 20까지 가능)

    // Basemap state
    const [basemap, setBasemap] = useState("carto");

  useEffect(() => {
  if (moveSpot && moveSpot.lat && moveSpot.lng) {
    setZoom(MAX_ZOOM);
    moveToLocation([moveSpot.lat + 0.00013, moveSpot.lng], MAX_ZOOM);
  }
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

    
    // Helper: fetch my PRIVATE spots, OFFICIAL spots, (optionally FRIENDS/PUBLIC), and setSpots
    const fetchAllSpots = async () => {
      const userId = user?.id || localStorage.getItem("snowball_uid");
      if (!userId) {
        setSpots([]);
        return;
      }
      try {
        // 1. 내 PRIVATE
        const privateReq = axios.get(`/api/spots?ownerId=${userId}&scope=PRIVATE`);
        // 2. OFFICIAL
        const officialReq = axios.get(`/api/spots?scope=OFFICIAL`);
        // (옵션: FRIENDS, PUBLIC 스팟도 노출하려면 아래 주석 해제)
        // const friendsReq = axios.get(`/api/spots?scope=FRIENDS`);
        // const publicReq = axios.get(`/api/spots?scope=PUBLIC`);
        // await Promise.all 요청
        const [privateRes, officialRes] = await Promise.all([privateReq, officialReq]);
        const privateSpots = Array.isArray(privateRes.data) ? privateRes.data : privateRes.data.spots || [];
        const officialSpots = Array.isArray(officialRes.data) ? officialRes.data : officialRes.data.spots || [];
        // 옵션(주석 해제 시)
        // const friendsSpots = Array.isArray(friendsRes.data) ? friendsRes.data : friendsRes.data.spots || [];
        // const publicSpots = Array.isArray(publicRes.data) ? publicRes.data : publicRes.data.spots || [];
        // id 중복 없이 병합 (private > official 우선)
        const spotMap = {};
        officialSpots.forEach(s => { spotMap[s.id] = s; });
        privateSpots.forEach(s => { spotMap[s.id] = s; });
        // 옵션 병합
        // friendsSpots.forEach(s => { spotMap[s.id] = s; });
        // publicSpots.forEach(s => { spotMap[s.id] = s; });
        setSpots(Object.values(spotMap));
      } catch (e) {
        setSpots([]);
      }
    };

    useEffect(() => {
      fetchAllSpots();
      // eslint-disable-next-line
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
        console.log("[moveToLocation] called: latlng=", latlng, "zoomLevel=", zoomLevel, "retryCount=", retryCount);

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
      axios.post(
        `/api/spots?buildingId=${data.buildingId}&categoryId=${data.categoryId}&ownerId=${userId}&scope=${scope}`,
        {
          name: data.name,
          lat: mapCenter[0],
          lng: mapCenter[1],
          isPublic: true
        }
      ).then(() => {
        fetchAllSpots();
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
          <LeafletMap
            center={mapCenter}
            zoom={zoom}
            mapRef={mapRef}
            basemap={basemap}
          >
            <CenterTracker setMapCenter={setMapCenter} setZoom={setZoom} userMovingRef={userMovingRef} />
            <MyLocationMarker myLocation={myLocation} setMyLocation={setMyLocation} />
            {/* === 마커 렌더 부분 SpotList로 대체 === */}
            <SpotList
              spots={spots}
              zoom={zoom}
              selectedSpot={selectedSpot}
              moveSpot={moveSpot}
              onClickSpot={setSelectedSpot}
              onDragEndSpot={(spot, lat, lng) => {
                axios.patch(`/api/spots/${spot.id}`, { lat, lng }).then(() => {
                  setMoveSpot(null);
                  fetchAllSpots();
                });
              }}
            />
          </LeafletMap>


          // === 컨트롤 버튼: 모달/오버레이 없을 때만 노출 ===
          {(!showForm && !selectedSpot && !moveSpot && !showSearch && !showSettings) && (
            <MapControls
              onCurrentLocation={getCurrentLocation}
              onSeoulCityHall={() => moveToLocation([37.5665, 126.9780])}
              onMyeongdong={() => moveToLocation([37.5609, 126.9853])}
            />
          )}

          {/* Search button (bottom right, above build button) and SearchModal */}
          <img
  src={searchBtnPressed ? "/button/btn_searchbutton2on.png" : "/button/btn_searchbutton2.png"}
  alt="검색"
  style={{
    position: 'fixed',
    bottom: "calc(env(safe-area-inset-bottom, 16px) + 16px)",
    right: 16,
    width: 70,
    height: 70,
    zIndex: 2020,
    cursor: 'pointer'
  }}
  onTouchStart={() => {
    setSearchBtnPressed(true);
  }}
  onTouchEnd={() => {
    setSearchBtnPressed(false);
    setShowSearch(true);
  }}
  onMouseDown={() => {
    setSearchBtnPressed(true);
  }}
  onMouseUp={() => {
    setSearchBtnPressed(false);
    setShowSearch(true);
  }}
  onMouseLeave={() => {
    setSearchBtnPressed(false);
  }}
  draggable={false}
/>
          <SearchModal
            open={showSearch}
            onClose={() => {
              setShowSearch(false);
              setSearchBtnPressed(false);
            }}
            onSelectSpot={spot => {
              if (spot && spot.id && spot.lat && spot.lng) {
      moveToLocation([spot.lat, spot.lng], 18);
    }
    setShowSearch(false);
    setSearchBtnPressed(false);
  }}
/>

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
              basemap={basemap}
              onBasemapChange={(key) => {
                setBasemap(key);
              }}
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
                  user={user}

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
                  // 새로고침 after closing SpotView (e.g., after delete)
                  fetchAllSpots();
                }}
                onStartMove={spot => {
                  setSelectedSpot(null); // SpotView 닫기
                  setMoveSpot(spot);     // 이동 모드 진입
                }}
              />
            </div>
          )}

          {/* === 이동 모드 오버레이 분리 === */}
          <MoveSpotOverlay
            moveSpot={moveSpot}
            mapCenter={mapCenter}
            zoom={zoom}
            onMove={async (newLat, newLng) => {
              // 서버에 바로 PATCH, 좌표 이동 (방향 버튼)
              await axios.patch(
                `/api/spots/${moveSpot.id}`,
                { lat: newLat, lng: newLng },
                { headers: { Authorization: user?.token ? `Bearer ${user.token}` : undefined } }
              );
              setMoveSpot({ ...moveSpot, lat: newLat, lng: newLng });
            }}
            onCancel={() => setMoveSpot(null)}
            onComplete={async () => {
              // 지도 중앙 위치를 서버로 PATCH (이동 완료)
              await axios.patch(
                `/api/spots/${moveSpot.id}`,
                {
                  lat: mapCenter[0] - 0.00014, // 미세 조정값은 기존 로직 그대로 사용
                  lng: mapCenter[1]
                },
                { headers: { Authorization: user?.token ? `Bearer ${user.token}` : undefined } }
              );
              // spots 목록 새로고침
              await fetchAllSpots();
              setMoveSpot(null);
            }}
          />
        </div>
      </>
    );
  }

// TODO: SpotForm에도 maxHeight: '65dvh', overflowY: 'auto' 적용 필요

// [안내] SpotMarker에서 draggable, onDragend props가 동작하려면
// SpotMarker 내부에서 react-leaflet의 Marker에 해당 props를 전달해야 합니다.

  export default MapWithSpots;