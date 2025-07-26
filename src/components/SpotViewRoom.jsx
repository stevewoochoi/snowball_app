import SpotGallery from "./SpotGallery";
import SpotBoard from "./SpotBoard";

function SpotViewRoom({ spotId, spot }) {
  return (
    <div style={{
      display: "flex", width: "94vw", height: "82vh", minWidth: 320, minHeight: 480,
      borderRadius: 30, background: "#fff",
      boxShadow: "0 8px 32px #0001", overflow: "hidden",
      border: "7px solid #ededf5", position: "relative"
    }}>
      {/* 좌측 벽: GUEST BOOK + 스티커 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        padding: "32px 12px 18px 22px", borderRight: "2px solid #f6f6fa",
        background: "linear-gradient(180deg,#fff,#f6faff 88%,#e6eaff 100%)"
      }}>
        <div style={{ width: "100%", marginBottom: 16 }}>
          <span style={{
            fontWeight: 900, fontSize: 22, letterSpacing: 1, color: "#1a9ad6",
            textShadow: "0 1px 8px #bae4ff"
          }}>GUEST BOOK</span>
          {/* 스티커 */}
          <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
            {["#fef49c", "#ffe2e2", "#b7e3ff"].map((color, i) => (
              <div key={i} style={{
                width: 24, height: 24, background: color,
                borderRadius: 6, transform: `rotate(${8 - 4 * i}deg)`,
                boxShadow: "0 2px 6px #0001"
              }} />
            ))}
          </div>
        </div>
        <SpotBoard spotId={spotId} />
      </div>

      {/* 중앙: 주인공(프로필/메뉴) */}
      <div style={{
        width: 320, minWidth: 180, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start", background: "#f7faff",
        borderLeft: "2px solid #f6f6fa", borderRight: "2px solid #f6f6fa"
      }}>
        <img src={spot?.profileImg || "/etc/default-avatar.png"} alt=""
          style={{ width: 90, height: 90, borderRadius: "50%", margin: "24px auto 8px", boxShadow: "0 4px 18px #1a9ad633" }} />
        <div style={{ fontSize: 24, fontWeight: 900, color: "#2b313c", marginBottom: 8 }}>{spot?.name || "스팟 이름"}</div>
        <div style={{ fontSize: 16, color: "#7b7b7b", marginBottom: 24 }}>{spot?.desc || "나만의 공간, 친구를 초대하세요!"}</div>
        {/* 메뉴, 테마, 등등 확장 */}
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: 2, color: "#626262" }}>MENU</div>
        <div style={{ width: "75%", margin: "12px auto", height: 40, background: "#fffbe8", borderRadius: 9, boxShadow: "0 1px 8px #ffc" }} />
      </div>

      {/* 우측 벽: 앨범(갤러리), 헥사곤 썸네일 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        padding: "32px 24px 18px 12px", background: "linear-gradient(180deg,#fff,#f8faff 75%,#e6ecff 100%)"
      }}>
        <div style={{ width: "100%", marginBottom: 16, position: "relative" }}>
          <span style={{
            fontWeight: 900, fontSize: 22, letterSpacing: 1, color: "#fbb900",
            textShadow: "0 2px 8px #ffd87c"
          }}>ALBUM</span>
          {/* Hexagon 패턴 예시 */}
          <div style={{ marginTop: 12, marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                width: 44, height: 44, background: "#f6f4f9",
                clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
                boxShadow: "0 1px 5px #d7e8fc",
                display: "inline-block", margin: 1, position: "relative"
              }}>
                {/* 사진 샘플 삽입 가능 */}
                {/* <img src="..." style={{width: "100%", height:"100%", objectFit:"cover", borderRadius:8}} /> */}
              </div>
            ))}
          </div>
        </div>
        <SpotGallery spotId={spotId} />
      </div>
    </div>
  );
}

export default SpotViewRoom;