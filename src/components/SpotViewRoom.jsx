import SpotGallery from "./SpotGallery";
import SpotBoard from "./SpotBoard";
import { useCallback, useState, useRef, useEffect } from "react";
import DeleteIcon from "./icons/DeleteIcon";
import DeleteCircleIcon from "./icons/DeleteCircleIcon";
import EditIcon from "./icons/EditIcon";
import MoveSpotIcon from "./icons/MoveSpotIcon";
import DragFingerIcon from "./icons/DragFingerIcon";
import SpotScopeToggle from "./SpotScopeToggle"; // <-- import 추가
import styles from './SpotViewRoom.module.css';
import FrostCard from "./ui/FrostCard";
import "./spotview.theme.css";



// 반드시 user prop 추가!
function SpotViewRoom({ spotId, spot, onClose, user, galleryDetailOpen, setGalleryDetailOpen, onStartMove }) {
  // === Scroll container & saved position (for restoring after modals) ===
  const scrollHostRef = useRef(null);
  const savedScrollRef = useRef(0);
  console.log("[SpotViewRoom] user:", user);
  // 삭제 핸들러: 오너만
  const handleDeleteSpot = useCallback(async () => {
  if (!window.confirm("정말 이 스팟을 삭제하시겠습니까? 복구할 수 없습니다.")) return;
  try {
    const token = user?.token || localStorage.getItem("snowball_token");
    await fetch(`/api/spots/${spotId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    alert("스팟이 삭제되었습니다.");
    if (onClose) onClose();
  } catch (err) {
    alert("삭제에 실패했습니다.");
  }
}, [spotId, onClose, user]);


  const isOwner = user && spot && String(user.id) === String(spot.ownerId);

  const [currentScope, setCurrentScope] = useState(spot?.scope || "PRIVATE");
  const [isChangingScope, setIsChangingScope] = useState(false);

  // Keep the user's place when opening/closing gallery detail (iOS Safari safe)
  useEffect(() => {
    const host = scrollHostRef.current;
    if (!host) return;

    if (galleryDetailOpen) {
      // Save current scroll and avoid rubber-band side effects while modal is open
      savedScrollRef.current = host.scrollTop;
      host.style.overscrollBehavior = 'contain';
    } else {
      // Restore after close (use rAF to wait for layout)
      requestAnimationFrame(() => {
        host.scrollTo({ top: savedScrollRef.current, left: 0, behavior: 'auto' });
      });
    }
  }, [galleryDetailOpen]);

  // refs for smooth scrolling between sections
  const boardRef = useRef(null);
  const galleryRef = useRef(null);

  const scrollToBoard = () => {
    boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // scope pill helper
  const scopeLabelMap = {
    PRIVATE: "private",
    FRIENDS: "friends",
    PUBLIC: "public",
    OFFICIAL: "official",
  };
  const scopeColorMap = {
    PRIVATE: "#96a1b3",
    FRIENDS: "#1fb6ff",
    PUBLIC: "#22c55e",
    OFFICIAL: "#f59e0b",
  };

  // 공유 범위 변경 핸들러
  const handleScopeChange = async (newScope) => {
    if (!isOwner || currentScope === newScope) return;
    if (!window.confirm("정말 공개 범위를 변경하시겠습니까?")) return;
    setIsChangingScope(true);
    try {
      const token = user?.token || localStorage.getItem("snowball_token");
      const response = await fetch(`/api/spots/${spotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ scope: newScope }),
      });
      if (!response.ok) {
        throw new Error("Failed to update scope");
      }
      setCurrentScope(newScope);
    } catch (err) {
      alert("공개 범위 변경에 실패했습니다.");
    } finally {
      setIsChangingScope(false);
    }
  };

  return (
    <div ref={scrollHostRef} className={styles['sv-root'] + ' ' + styles['sv-col']}> 
      {/* Summary (compact header) */}
      <FrostCard className={styles['sv-summary']}>
        <div className={styles['sv-summary-left']}>
  <div className={styles['sv-avatarBox']} aria-label="owner photo">
    <img
      className={styles['sv-summary-avatar']}
      src={spot?.profileImg || '/etc/default-avatar.png'}
      alt=""                               // ✅ 텍스트 노출 방지
      width={120} height={120}             // ✅ 레이아웃 공간 고정(보조)
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src.includes('/etc/default-avatar.png')) return;
        e.currentTarget.onerror = null;
        e.currentTarget.src = '/etc/default-avatar.png';
      }}
      onLoad={(e) => { e.currentTarget.style.visibility = 'visible'; }}
      style={{ visibility: 'hidden' }}     // ✅ 로드될 때만 보이게
      draggable={false}
    />
  </div>
</div>
        <div className={styles['sv-summary-main']}>
          <h1 className={styles['sv-summary-name']}>{spot?.name || 'Snowball'}</h1>
          <div className={styles['sv-summary-sub']}> 
            {spot?.ownerNickname && (
              <span className={styles['sv-owner']}>{spot.ownerNickname}</span>
            )}
            <span className={styles['sv-badge']} style={{background: ( {PRIVATE:'#96a1b3', FRIENDS:'#1fb6ff', PUBLIC:'#22c55e', OFFICIAL:'#f59e0b'} )[currentScope] || '#96a1b3', color:'#fff', textTransform:'uppercase'}}>
              {( {PRIVATE:'private', FRIENDS:'friends', PUBLIC:'public', OFFICIAL:'official'} )[currentScope] || currentScope}
            </span>
          </div>
        </div>
        {isOwner && (
          <div className={styles['sv-summary-actions']}>
            <button
              onClick={() => onStartMove && onStartMove(spot)}
              className={styles['sv-cta']}
              aria-label="스팟 위치 이동"
            >
              <MoveSpotIcon size={28} color="#1769e0" />
            </button>
            <button
              onClick={handleDeleteSpot}
              className={styles['sv-cta']}
              aria-label="스팟 삭제"
            >
              <DeleteCircleIcon size={28} />
            </button>
          </div>
        )}
      </FrostCard>

      {/* Optional short description + scope toggle (owner only) */}
      <FrostCard className={styles['sv-brief']}>
        <p className={styles['sv-desc']}>{spot?.desc || 'My personal space, invite your friends!'}</p>
        {isOwner && (
          <div className={styles['sv-brief-actions']}>
            <SpotScopeToggle scope={currentScope} onChange={(s)=>handleScopeChange(s)} disabled={isChangingScope} />
          </div>
        )}
      </FrostCard>

      {/* Guest Book */}
      <FrostCard className={styles['sv-panel']}> 
        <div className={styles['sv-title']}>GUEST BOOK</div>
        <div className={styles['sv-chip']}>Welcome ✳︎</div>
        <div ref={boardRef} className={styles['sv-gb-list']} style={{marginTop:8}}>
          <SpotBoard spotId={spotId} />
        </div>
        {/* <input className={styles['sv-input']} placeholder="Leave a comment" /> */}
      </FrostCard>

      {/* Album */}
      <FrostCard className={styles['sv-panel']}>
        <div className={styles['sv-title']}>ALBUM</div>
        <div className={styles['sv-chip']}>Photo • Video</div>
        <div ref={galleryRef} style={{marginTop:12}}>
          <SpotGallery
            spotId={spotId}
            user={user}
            spot={spot}
            setGalleryDetailOpen={setGalleryDetailOpen}
          />
        </div>
      </FrostCard>
    </div>
  );
}

export default SpotViewRoom;