import { useState } from "react";
import SpotViewRoom from "./SpotViewRoom";
import SpotViewCafe from "./SpotViewCafe";
import CloseCircleIcon from "./icons/CloseCircleIcon";

// ... 향후 프리셋 추가 SpotViewLibrary 등

const PRESET_LIST = [
  { name: "Room", component: SpotViewRoom },
  { name: "Cafe", component: SpotViewCafe },
];

// ★ user 추가!
// onStartMove prop을 SpotView에 추가
function SpotView({ spotId, spot, user, onClose, onStartMove }) {
  const [preset, setPreset] = useState(PRESET_LIST[0]);
  const [galleryDetailOpen, setGalleryDetailOpen] = useState(false);
  console.log("[SpotView] user:", user);

  const TemplateComponent = preset.component;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "#ededf5",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 4000,
    }}>
      {/* 프리셋(템플릿) 선택 버튼 */}
      <div style={{ position: "absolute", top: 18, left: 28, display: "flex", gap: 10 }}>
        {PRESET_LIST.map(t => (
          <button
            key={t.name}
            style={{
              padding: "8px 18px", borderRadius: 20,
              border: t.name === preset.name ? "2px solid #1a9ad6" : "1px solid #ccc",
              background: t.name === preset.name ? "#e8f5ff" : "#fff",
              fontWeight: 600, color: "#197ad6", fontSize: 15, cursor: "pointer"
            }}
            onClick={() => setPreset(t)}
          >
            {t.name}
          </button>
        ))}
      </div>
      {/* 닫기 */}
      {!galleryDetailOpen && (
        <button
          onClick={onClose}
          style={{
            position: "fixed",
            right: 18,
            top: 18,
            zIndex: 99999,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            boxShadow: "none"
          }}
        >
          <CloseCircleIcon size={44} />
        </button>
      )}
      {/* 프리셋 적용 */}
      {/* user를 반드시 넘기세요! onStartMove는 "스팟 이동" 모드용 */}
      <TemplateComponent
        spotId={spotId}
        spot={spot}
        user={user}
        onClose={onClose}
        setGalleryDetailOpen={setGalleryDetailOpen}
        onStartMove={onStartMove}
      />
    </div>
  );
}
export default SpotView;