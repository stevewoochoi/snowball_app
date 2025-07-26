import { useState } from "react";
import SpotGallery from "./SpotGallery";
import SpotBoard from "./SpotBoard";

function SpotView({ spotId, onClose }) {
  const [tab, setTab] = useState("gallery");

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #0002", padding: 16, position: "relative" }}>
      <button
        style={{
          position: "absolute", right: 18, top: 16,
          background: "#222", color: "#fff",
          border: "none", borderRadius: "50%",
          width: 34, height: 34, fontSize: 20, fontWeight: 700,
          boxShadow: "0 1px 4px #0002",
          zIndex: 10, cursor: "pointer"
        }}
        onClick={onClose}
      >×</button>
      {/* 상단 탭 */}
      <div style={{ display: "flex", borderBottom: "1.5px solid #e8e8ef", marginBottom: 12 }}>
        <button
          onClick={() => setTab("gallery")}
          style={{
            flex: 1, padding: "10px 0",
            background: tab === "gallery" ? "#1a9ad6" : "transparent",
            color: tab === "gallery" ? "#fff" : "#333",
            border: "none", borderRadius: "12px 12px 0 0", fontWeight: 600, fontSize: 16,
            transition: "all 0.2s"
          }}
        >갤러리</button>
        <button
          onClick={() => setTab("board")}
          style={{
            flex: 1, padding: "10px 0",
            background: tab === "board" ? "#1a9ad6" : "transparent",
            color: tab === "board" ? "#fff" : "#333",
            border: "none", borderRadius: "12px 12px 0 0", fontWeight: 600, fontSize: 16,
            transition: "all 0.2s"
          }}
        >게시판</button>
      </div>
      {/* 컨텐츠 */}
      {tab === "gallery" ? <SpotGallery spotId={spotId} /> : <SpotBoard spotId={spotId} />}
    </div>
  );
}

export default SpotView;