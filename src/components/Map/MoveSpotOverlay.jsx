// src/components/Map/MoveSpotOverlay.jsx

import React from 'react';

function MoveSpotOverlay({
  moveSpot,
  mapCenter,
  zoom,
  onMove,        // (lat, lng) => void
  onCancel,      // () => void
  onComplete     // () => void
}) {
  if (!moveSpot) return null;
  // 마커/카테고리 크기 계산
  const markerSize = Math.max(20, Math.min(80, Math.floor(6 * zoom - 44)));
  const categorySize = Math.round(markerSize * 0.85);

  // 이동 버튼 핸들러
  const handleMove = (dLat, dLng) => {
    const newLat = moveSpot.lat + dLat;
    const newLng = moveSpot.lng + dLng;
    onMove(newLat, newLng);
  };

  return (
    <>
      {/* 이동 버튼과 미리보기 마커 */}
      <div style={{
        position: "fixed", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)", width: 140, height: 140,
        pointerEvents: "none", zIndex: 5002
      }}>
        {/* ↑ */}
        <img
          src="/button/btn_move_up.png"
          alt="위로 이동"
          style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: 44, height: 34, cursor: "pointer", pointerEvents: "auto" }}
          onClick={() => handleMove(0.00025, 0)}
        />
        {/* ← */}
        <img
          src="/button/btn_move_left.png"
          alt="왼쪽 이동"
          style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 34, height: 44, cursor: "pointer", pointerEvents: "auto" }}
          onClick={() => handleMove(0, -0.0003)}
        />
        {/* → */}
        <img
          src="/button/btn_move_right.png"
          alt="오른쪽 이동"
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 34, height: 44, cursor: "pointer", pointerEvents: "auto" }}
          onClick={() => handleMove(0, 0.0003)}
        />
        {/* ↓ */}
        <img
          src="/button/btn_move_down.png"
          alt="아래 이동"
          style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: 44, height: 34, cursor: "pointer", pointerEvents: "auto" }}
          onClick={() => handleMove(-0.00025, 0)}
        />

        {/* 마커 미리보기 (건물+카테고리) */}
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
          }}>
          <img
            src={moveSpot.building?.iconUrl || "/etc/default-avatar.png"}
            alt=""
            style={{
              width: markerSize,
              height: markerSize,
              borderRadius: 13,
              boxShadow: '0 0 10px #0002',
              position: 'absolute', left: 0, top: 0, zIndex: 1,
              background: "transparent",
            }}
          />
          {moveSpot.category?.iconUrl && (
            <img
              src={moveSpot.category.iconUrl}
              alt=""
              style={{
                width: categorySize, height: categorySize, borderRadius: 10,
                boxShadow: '0 0 6px #2222',
                position: 'absolute', left: '55%',
                top: -Math.round(categorySize * 0.5),
                transform: 'translateX(-50%)',
                zIndex: 2, background: 'transparent'
              }}
            />
          )}
        </div>
      </div>
      {/* 취소/완료 버튼 */}
      <div style={{
        position: "fixed", top: 46, left: "50%",
        transform: "translateX(-50%)", zIndex: 5003,
        display: "flex", gap: 22
      }}>
        <button
          onClick={onCancel}
          style={{ background: "#eee", borderRadius: 8, border: "1.4px solid #aaa", padding: "8px 24px", fontSize: 15, color: "#197ad6", cursor: "pointer" }}
        >이동 취소</button>
        <button
          onClick={onComplete}
          style={{ background: "#1a9ad6", borderRadius: 8, border: "1.4px solid #1a9ad6", padding: "8px 24px", fontSize: 15, color: "#fff", fontWeight: 700, cursor: "pointer" }}
        >이동 완료</button>
      </div>
    </>
  );
}

export default MoveSpotOverlay;