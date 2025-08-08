import SpotGallery from "./SpotGallery";
import SpotBoard from "./SpotBoard";
import { useCallback, useState } from "react";
import DeleteIcon from "./icons/DeleteIcon";
import DeleteCircleIcon from "./icons/DeleteCircleIcon";
import EditIcon from "./icons/EditIcon";
import MoveSpotIcon from "./icons/MoveSpotIcon";
import DragFingerIcon from "./icons/DragFingerIcon";
import SpotScopeToggle from "./SpotScopeToggle"; // <-- import 추가
import styles from './SpotViewRoom.module.css';



// 반드시 user prop 추가!
function SpotViewRoom({ spotId, spot, onClose, user, galleryDetailOpen, setGalleryDetailOpen, onStartMove }) {
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
    <div className={styles.root}>
      {/* 좌측 벽: GUEST BOOK + 스티커 */}
      <div className={styles.leftWall}>
        <div style={{ width: "100%", marginBottom: 18 }}>
          <span style={{
            fontWeight: 900, fontSize: 25, letterSpacing: 1.5, color: "#1a9ad6",
            textShadow: "0 2px 10px #b9d8ee"
          }}>GUEST BOOK</span>
          {/* 스티커 */}
          <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
            {["#f3eb87", "#f7d5da", "#a7ceea"].map((color, i) => (
              <div key={i} style={{
                width: 26, height: 26, background: color,
                borderRadius: 7, transform: `rotate(${7 - 3.5 * i}deg)`,
                boxShadow: "0 2px 7px #bbc5db"
              }} />
            ))}
          </div>
        </div>
        <div style={{
          width: "96%",
          maxWidth: 380,
          background: "#fff",
          borderRadius: 13,
          boxShadow: "0 1px 14px #b1c5da50",
          margin: "10px 0 0 0",
          padding: "18px 15px 10px 15px"
        }}>
          {/* 게시판 */}
          <SpotBoard spotId={spotId} />
        </div>
      </div>

     {/* 중앙: 주인공(프로필/메뉴) */}
<div className={styles.centerPanel}>
  <img src={spot?.profileImg || "/etc/default-avatar.png"} alt=""
    style={{ width: 100, height: 100, borderRadius: "50%", margin: "38px auto 14px", boxShadow: "0 4px 18px #1a9ad622" }} />
  
  {/* 이름+버튼 라인 */}
  <div style={{
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 10,
    minHeight: 36
  }}>
    {/* 이름 중앙 정렬, flex-grow로 남는 공간 채움 */}
    <div style={{
      flex: 1,
      fontSize: 26,
      fontWeight: 900,
      color: "#283040",
      textAlign: "center",
      wordBreak: "break-all",
      lineHeight: 1.2,
      overflowWrap: "break-word",
      paddingRight: 0 // 버튼 영역만큼 오른쪽 여백, 버튼 침범 방지
    }}>
      {spot?.name || "스팟 이름"}
    </div>
    {/* 버튼 그룹: 오른쪽 정렬 */}
    {isOwner && (
      <div className={styles.buttonGroup}>
        <button
          onClick={() => {
            console.log("[SpotViewRoom] 스팟 수정 버튼 클릭:", spotId);
            onStartMove && onStartMove(spot);
            // 추후 위치 이동 모드 진입 로직
          }}
          style={{
            background: "#f7fafd",
            border: "2px solid #197ad6",
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            boxShadow: "0 1px 6px #bfe3ff33",
            transition: "background 0.18s, border 0.18s"
          }}
          aria-label="스팟 수정"
          onMouseOver={e => {
            e.currentTarget.style.background = "#e3f1ff";
            e.currentTarget.style.border = "2px solid #55b6ff";
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = "#f7fafd";
            e.currentTarget.style.border = "2px solid #197ad6";
          }}
        >
        <MoveSpotIcon size={22} color="#197ad6" />
        {/* <DragFingerIcon size={22} color="#197ad6" /> */}
        </button>
        <button
          onClick={handleDeleteSpot}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            outline: "none"
          }}
          aria-label="스팟 삭제"
        >
          <DeleteCircleIcon size={32} />
        </button>
      </div>
    )}
  </div>
  {/* ========== ⬇️ 공유 범위 토글 추가 (이동/삭제 아래) ========== */}
  {isOwner && (
    <div className={styles.scopeToggleRow}>
      <SpotScopeToggle
        scope={currentScope}
        onChange={handleScopeChange}
        disabled={isChangingScope}
      />
    </div>
  )}

  {/* ...나머지 코드 동일... */}
  <div style={{ fontSize: 17, color: "#637081", marginBottom: 32 }}>{spot?.desc || "나만의 공간, 친구를 초대하세요!"}</div>
  <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: 2, color: "#626262" }}>MENU</div>
  <div style={{
    width: "78%", margin: "14px auto 0 auto", height: 44,
    background: "#fffde6", borderRadius: 11, boxShadow: "0 1px 10px #e8dfbc"
  }} />
</div>

      {/* 우측 벽: 앨범(갤러리) */}
      <div className={styles.albumWall}>
        <div
          style={{
            width: "96%",
            maxWidth: 420,
            marginBottom: 0,
            paddingBottom: 12,
            borderBottom: "2px solid #ffe599",
            display: "flex",
            alignItems: "center",
            fontWeight: 900,
            fontSize: 24,
            letterSpacing: 1.5,
            color: "#ffc42d",
            textShadow: "0 2px 10px #fff7bf",
            background: "transparent",
            // visually separate the title
          }}
        >
          ALBUM
        </div>
        <div style={{
          width: "96%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 2px 16px #b1c5da33",
          margin: "0 0 0 0",
          padding: "18px 13px 10px 13px",
          flex: 1,
          marginTop: 0,
          overflow: "auto",
          minHeight: 0,
        }}>
          {/* ★ 반드시 user={user} 전달 */}
          <SpotGallery spotId={spotId} user={user} spot={spot} setGalleryDetailOpen={setGalleryDetailOpen} />
        </div>
      </div>
    </div>
  );
}

export default SpotViewRoom;