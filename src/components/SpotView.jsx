import { useState } from "react";
import SpotViewRoom from "./SpotViewRoom";
import SpotViewCafe from "./SpotViewCafe";
// ... 향후 프리셋 추가 SpotViewLibrary 등

const PRESET_LIST = [
  { name: "Room", component: SpotViewRoom },
  { name: "Cafe", component: SpotViewCafe },
];

function SpotView({ spotId, spot, onClose }) {
  const [preset, setPreset] = useState(PRESET_LIST[0]);

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
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          right: 18,
          top: 18,
          zIndex: 99999,
          background: "#222",
          color: "#fff",
          border: "3px solid #fff",
          borderRadius: "50%",
          width: 44,
          height: 44,
          fontSize: 28,
          fontWeight: 900,
          lineHeight: "44px",
          boxShadow: "0 1px 8px #0004",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "box-shadow .18s"
        }}
      >
        ×
      </button>
      {/* 프리셋 적용 */}
      <TemplateComponent spotId={spotId} spot={spot} />
    </div>
  );
}
export default SpotView;