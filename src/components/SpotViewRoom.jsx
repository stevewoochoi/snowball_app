import SpotGallery from "./SpotGallery";
import SpotBoard from "./SpotBoard";

function SpotViewRoom({ spotId, spot, onClose }) {
  return (
    <div style={{
      overflowX: "auto",
      overflowY: "hidden",
      scrollSnapType: "x mandatory",
      width: "100vw",
      height: "100dvh",
      borderRadius: 30,
      background: "linear-gradient(140deg,#e6ecf5 80%,#d7e0ea 100%)",
      boxShadow: "0 8px 32px #0002",
      border: "7px solid #dde5ef",
      position: "relative",
      touchAction: "pan-x",
      overscrollBehaviorX: "contain",
      display: "flex"
    }}>
      {/* 좌측 벽: GUEST BOOK + 스티커 */}
      <div style={{
        width: "100vw",
        height: "100dvh",
        flexShrink: 0,
        display: "inline-block",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "48px 14px 18px 28px",
        borderRight: "2px solid #e8ecf5",
        background: "linear-gradient(180deg,#f5f6fa 85%,#e1e8f2 100%)"
      }}>
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
      <div style={{
        width: "100vw",
        height: "100dvh",
        flexShrink: 0,
        display: "inline-block",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        background: "linear-gradient(180deg,#eef2f6 80%,#dde8fa 100%)",
        borderLeft: "2px solid #e8ecf5",
        borderRight: "2px solid #e8ecf5"
      }}>
        <img src={spot?.profileImg || "/etc/default-avatar.png"} alt=""
          style={{ width: 100, height: 100, borderRadius: "50%", margin: "38px auto 14px", boxShadow: "0 4px 18px #1a9ad622" }} />
        <div style={{ fontSize: 26, fontWeight: 900, color: "#283040", marginBottom: 10 }}>{spot?.name || "스팟 이름"}</div>
        <div style={{ fontSize: 17, color: "#637081", marginBottom: 32 }}>{spot?.desc || "나만의 공간, 친구를 초대하세요!"}</div>
        <div style={{ fontWeight: 700, fontSize: 19, letterSpacing: 2, color: "#626262" }}>MENU</div>
        <div style={{
          width: "78%", margin: "14px auto 0 auto", height: 44,
          background: "#fffde6", borderRadius: 11, boxShadow: "0 1px 10px #e8dfbc"
        }} />
      </div>

      {/* 우측 벽: 앨범(갤러리) */}
      <div style={{
        width: "100vw",
        height: "100dvh",
        flexShrink: 0,
        display: "inline-block",
        scrollSnapAlign: "start",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "22px 22px 18px 14px",
        background: "linear-gradient(180deg,#f7f9fa 68%,#e6eaf4 100%)"
      }}>
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
          <SpotGallery spotId={spotId} />
        </div>
      </div>
    </div>
  );
}

export default SpotViewRoom;