// src/components/MapWithSpots.jsx
// Fix: Ensure MapContainer fills the entire visible viewport on mobile by forcing fixed positioning and full 100dvh height.

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
import styles from './MapWithSpots.module.css';

function MapWithSpots({ user }) {
  // Debug log helper
  const debugLog = (...args) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[MapWithSpots]", ...args);
    }
  };
  const [spots, setSpots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState([37.5665, 126.9780]);
  const [zoom, setZoom] = useState(17);
  const [showSearch, setShowSearch] = useState(false);
  const [searchBtnPressed, setSearchBtnPressed] = useState(false);

  const [myLocation, setMyLocation] = useState(null);

  // SpotView modal state
  const [selectedSpot, setSelectedSpot] = useState(null);
  // 이동 모드 상태값
  const [moveSpot, setMoveSpot] = useState(null);

  const MAX_ZOOM = 18;

  // Basemap
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
    console.log("[이동중] spotId=" + moveSpot.id + ", lat=" + mapCenter[0] + ", lng=" + mapCenter[1]);
  }, [moveSpot, mapCenter]);

  const mapRef = useRef();
  const zoomRef = useRef(zoom);
  const userMovingRef = useRef(false);

  // 선택 미리보기 상태
  const [previewBuilding, setPreviewBuilding] = useState(null);
  const [previewCategory, setPreviewCategory] = useState(null);

  const [buildBtnPressed, setBuildBtnPressed] = useState(false);
  const [mainBtnPressed, setMainBtnPressed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [splashShown, setSplashShown] = useState(true);

  // --- map ownership / mode ---
  const currentUserId = (user?.id ?? Number(localStorage.getItem("snowball_uid"))) || null;
  const [mapOwnerId, setMapOwnerId] = useState(currentUserId);  // whose map is being viewed
  const [foreignMode, setForeignMode] = useState(false);        // viewing someone else's map?
  const [mapOwnerNickname, setMapOwnerNickname] = useState(""); // map owner's nickname
  const [isMapOwnerFriend, setIsMapOwnerFriend] = useState(false); // 친구 여부 -> 배너 문구

  // Helper: fetch map owner's nickname
  const fetchOwnerNickname = async (ownerId) => {
    if (!ownerId) {
      setMapOwnerNickname("");
      return;
    }
    try {
      const res = await axios.get(`/api/users/${ownerId}`);
      const nickname = res?.data?.nickname || "";
      setMapOwnerNickname(nickname);
    } catch (e) {
      setMapOwnerNickname("");
    }
  };

  // viewer(나)와 owner가 친구인지 확인 (hintScope가 FRIENDS면 바로 true)
  const checkIsFriend = async (ownerId, hintScope = null) => {
    debugLog("[checkIsFriend] called with ownerId:", ownerId, "hintScope:", hintScope);
    if (hintScope === 'FRIENDS') {
      debugLog("[checkIsFriend] hintScope is FRIENDS, immediately setting as friend.");
      setIsMapOwnerFriend(true);
      return true;
    }
    try {
      debugLog("[checkIsFriend] making API call to /api/friends/check with", { userId: currentUserId, friendId: ownerId });
      const res = await axios.get(`/api/friends/check`, {
        params: { userId: currentUserId, friendId: ownerId }
      });
      const ok = !!(res?.data?.isFriend || res?.data === true);
      debugLog("[checkIsFriend] API result:", res?.data, "parsed ok:", ok);
      setIsMapOwnerFriend(ok);
      return ok;
    } catch (err) {
      debugLog("[checkIsFriend] API error:", err);
      setIsMapOwnerFriend(false);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Helper: fetch spots for a given owner
  const fetchSpotsForOwner = async (ownerId) => {
    if (!ownerId) {
      setSpots([]);
      return;
    }
    try {
      if (currentUserId && Number(ownerId) === Number(currentUserId)) {
        // === 내 지도 ===
        const privateReq = axios.get(`/api/spots?ownerId=${ownerId}`);
        const officialReq = axios.get(`/api/spots?scope=OFFICIAL`);
        const [privateRes, officialRes] = await Promise.all([privateReq, officialReq]);
        const privateSpots = Array.isArray(privateRes.data) ? privateRes.data : privateRes.data.spots || [];
        const officialSpots = Array.isArray(officialRes.data) ? officialRes.data : officialRes.data.spots || [];
        const spotMap = {};
        officialSpots.forEach(s => { if (s?.id) spotMap[s.id] = s; });
        privateSpots.forEach(s => { if (s?.id) spotMap[s.id] = s; });
        setSpots(Object.values(spotMap));
        setForeignMode(false); // 내 지도
        console.log("[MapWithSpots] loaded spots for owner:", ownerId, "foreignMode:", false);
      } else {
        // === 타인 지도 ===
        const res = await axios.get(`/api/spots?ownerId=${ownerId}&viewerId=${currentUserId || ""}`);
        const data = Array.isArray(res.data) ? res.data : res.data.spots || [];
        setSpots(data);
        setForeignMode(true); // 타인 지도
        console.log("[MapWithSpots] loaded spots for owner:", ownerId, "foreignMode:", true);
      }
    } catch (e) {
      console.warn("[MapWithSpots] fetchSpotsForOwner error:", e);
      setSpots([]);
    }
  };

  // 소유자 변경될 때 스팟/닉네임 로드 + 친구 여부 결정
  useEffect(() => {
    fetchSpotsForOwner(mapOwnerId);
    fetchOwnerNickname(mapOwnerId);
    if (Number(mapOwnerId) === Number(currentUserId)) {
      setIsMapOwnerFriend(false);
    } else {
      checkIsFriend(mapOwnerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOwnerId]);

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
    }, 1000);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!splashShown) {
      getCurrentLocation();
    }
  }, [splashShown]);

  // 지도 이동
  const moveToLocation = (latlng, zoomLevel = 16, retryCount = 0) => {
    console.log("[moveToLocation] called:", latlng, zoomLevel, retryCount);

    if (!mapRef.current) {
      if (retryCount > 30) return console.error("Map instance not ready after multiple retries.");
      setTimeout(() => moveToLocation(latlng, zoomLevel, retryCount + 1), 100);
      return;
    }
    userMovingRef.current = false;
    mapRef.current.flyTo(latlng, zoomLevel, { animate: true, duration: 1.2 });
    setTimeout(() => {
      setMapCenter([latlng[0], latlng[1]]);
    }, 1300);
  };

  // SearchModal -> 지도 중심 이동 콜백 어댑터
  const handleCenterMapFromSearch = ({ lat, lng }) => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      moveToLocation([lat, lng], 16);
    }
  };

  // 현재 위치
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          moveToLocation([latitude, longitude]);
          setMyLocation([latitude, longitude]);
        },
        () => {
          moveToLocation([37.5665, 126.9780]);
        }
      );
    } else {
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
      // 새 스팟은 내 지도에 생성 → 내 지도 갱신
      fetchSpotsForOwner(currentUserId);
      setShowForm(false);
      setPreviewBuilding(null);
      setPreviewCategory(null);
    });
  };

  const handleBackToMyMap = async () => {
    if (!currentUserId) return;
    setForeignMode(false);
    setMapOwnerId(currentUserId);
    await fetchSpotsForOwner(currentUserId);
    if (myLocation) {
      moveToLocation(myLocation, 16);
    }
  };

  // Track last selected scope for foreign map banner
  const [lastSelectedScope, setLastSelectedScope] = useState(null);

  return (
    <>
      {/* 전역성격 스타일 (리프렛 컨테이너 전용) */}
      <style>{`
        body, #root { margin:0; padding:0; height:100dvh; overflow:auto; }
        .leaflet-container {
          top:0 !important; margin:0 !important; padding:0 !important;
          position:fixed !important; left:0 !important;
          width:100vw !important; height:100dvh !important;
          background:#ddd; z-index:0 !important;
          touch-action:none !important; -webkit-user-select:none !important; user-select:none !important;
        }
      `}</style>

      {/* Splash screen */}
      {splashShown && (
        <div className={styles.splashScreen}>
          <img src="/etc/Default_3.jpg" alt="Splash" className={styles.splashImage} />
        </div>
      )}

      <div style={showForm ? { overflow: 'hidden' } : {}}>
        <LeafletMap center={mapCenter} zoom={zoom} mapRef={mapRef} basemap={basemap}>
          <CenterTracker setMapCenter={setMapCenter} setZoom={setZoom} userMovingRef={userMovingRef} />
          <MyLocationMarker myLocation={myLocation} setMyLocation={setMyLocation} />
          <SpotList
            spots={spots}
            zoom={zoom}
            selectedSpot={selectedSpot}
            moveSpot={moveSpot}
            onClickSpot={setSelectedSpot}
            onDragEndSpot={(spot, lat, lng) => {
              axios.patch(`/api/spots/${spot.id}`, { lat, lng }).then(() => {
                setMoveSpot(null);
                // 현재 보고 있는 지도 소유자 기준으로 리로드
                fetchSpotsForOwner(mapOwnerId);
              });
            }}
          />
        </LeafletMap>

        {/* 컨트롤 버튼 (모달/오버레이 없을 때만) */}
        {(!showForm && !selectedSpot && !moveSpot && !showSearch && !showSettings) && (
          <MapControls
            onCurrentLocation={getCurrentLocation}
            onSeoulCityHall={() => moveToLocation([37.5665, 126.9780])}
            onMyeongdong={() => moveToLocation([37.5609, 126.9853])}
          />
        )}

        {/* Search FAB */}
        <img
          src={searchBtnPressed ? "/button/btn_searchbutton2on.png" : "/button/btn_searchbutton2.png"}
          alt="검색"
          className={styles.searchFab}
          onTouchStart={() => setSearchBtnPressed(true)}
          onTouchEnd={() => { setSearchBtnPressed(false); setShowSearch(true); }}
          onMouseDown={() => setSearchBtnPressed(true)}
          onMouseUp={() => { setSearchBtnPressed(false); setShowSearch(true); }}
          onMouseLeave={() => setSearchBtnPressed(false)}
          draggable={false}
        />

        <SearchModal
          open={showSearch}
          onClose={() => {
            setShowSearch(false);
            setSearchBtnPressed(false);
          }}
          userId={currentUserId}
          onSelectSpot={async (spot) => {
            debugLog("[onSelectSpot] spot selected:", spot);
            try {
              if (spot && spot.lat && spot.lng) {
                setLastSelectedScope(spot.scope || null);
                if (spot.scope === 'OFFICIAL') {
                  // OFFICIAL: 내 지도 유지
                  setForeignMode(false);
                  setMapOwnerId(currentUserId);
                  await fetchSpotsForOwner(currentUserId);
                  debugLog("[onSelectSpot] OFFICIAL scope, my map");
                } else if (spot.ownerId && Number(spot.ownerId) !== Number(currentUserId)) {
                  // 타인 스팟: 친구 여부 반영 (배너 문구)
                  debugLog("[onSelectSpot] Foreign spot, checking friend status...");
                  const friendResult = await checkIsFriend(spot.ownerId, spot.scope);
                  debugLog("[onSelectSpot] Friend check result:", friendResult);
                  setForeignMode(true);
                  setMapOwnerId(spot.ownerId);
                  await fetchSpotsForOwner(spot.ownerId);
                } else {
                  // 내 스팟
                  setForeignMode(false);
                  setMapOwnerId(currentUserId);
                  await fetchSpotsForOwner(currentUserId);
                  debugLog("[onSelectSpot] My spot");
                }
                moveToLocation([spot.lat, spot.lng], 18);
              }
            } finally {
              setShowSearch(false);
              setSearchBtnPressed(false);
            }
          }}
          onCenterMap={handleCenterMapFromSearch}
        />

        {/* 지도 중앙 미리보기 (손가락+건물+카테고리) */}
        {showForm && (
          <div className={styles.previewWrap}>
            <img src="/etc/finger.png" alt="finger" className={styles.previewFinger} />
            {previewBuilding && (
              <div className={styles.previewStack}>
                <img src={previewBuilding.iconUrl} alt={previewBuilding.name} className={styles.previewBuilding} />
                {previewCategory && (
                  <img src={previewCategory.iconUrl} alt={previewCategory.name} className={styles.previewCategory} />
                )}
              </div>
            )}
          </div>
        )}

        {/* 좌측 상단 메인(설정) 버튼 */}
        <img
          src={mainBtnPressed ? "/button/btn_mainicon1on.png" : "/button/btn_mainicon.png"}
          alt="설정"
          className={styles.mainBtn}
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
            onBasemapChange={(key) => setBasemap(key)}
          />
        )}

        {/* 건축 버튼: 외부 지도(foreignMode)에서는 숨김 */}
        {!keyboardOpen && !foreignMode && (
          <img
            src={buildBtnPressed ? "/btn_buildbuttonon.png" : "/btn_buildbutton.png"}
            alt="건축"
            className={styles.buildBtn}
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
          <div className={styles.formOverlay}>
            <div className={styles.formDock}>
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
          <div className={styles.modalOverlay}>
            <SpotView
              spotId={selectedSpot.id}
              spot={selectedSpot}
              user={user}
              onClose={() => {
                setSelectedSpot(null);
                fetchSpotsForOwner(mapOwnerId);
              }}
              onStartMove={spot => {
                setSelectedSpot(null);
                setMoveSpot(spot);
              }}
            />
          </div>
        )}

        {/* Foreign map banner */}
        {foreignMode && (
          <div className={styles.foreignBanner}>
            <span>
              {
                // Show "친구 맵" immediately if lastSelectedScope is FRIENDS, otherwise fallback to isMapOwnerFriend
                lastSelectedScope === 'FRIENDS'
                  ? '친구 맵'
                  : (isMapOwnerFriend ? '친구 맵' : '유저 맵')
              }
              {' '}({mapOwnerNickname || mapOwnerId})
            </span>
            <button className={styles.backToMyMapBtn} onClick={handleBackToMyMap}>
              내 맵으로
            </button>
          </div>
        )}

        {/* 이동 모드 오버레이 */}
        <MoveSpotOverlay
          moveSpot={moveSpot}
          mapCenter={mapCenter}
          zoom={zoom}
          onMove={async (newLat, newLng) => {
            await axios.patch(
              `/api/spots/${moveSpot.id}`,
              { lat: newLat, lng: newLng },
              { headers: { Authorization: user?.token ? `Bearer ${user.token}` : undefined } }
            );
            setMoveSpot({ ...moveSpot, lat: newLat, lng: newLng });
          }}
          onCancel={() => setMoveSpot(null)}
          onComplete={async () => {
            await axios.patch(
              `/api/spots/${moveSpot.id}`,
              { lat: mapCenter[0] - 0.00014, lng: mapCenter[1] },
              { headers: { Authorization: user?.token ? `Bearer ${user.token}` : undefined } }
            );
            await fetchSpotsForOwner(mapOwnerId);
            setMoveSpot(null);
          }}
        />
      </div>
    </>
  );
}

export default MapWithSpots;