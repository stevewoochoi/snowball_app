import SpotGallery from "./SpotGallery";
import SpotBoard from "./SpotBoard";

// 카페 테마 컬러/배경/오브젝트 강조
function SpotViewCafe({ spotId, spot }) {
  return (
    <div style={{
      display: "flex", width: "94vw", height: "82vh", minWidth: 320, minHeight: 480,
      borderRadius: 30, background: "#f8f6f3",
      boxShadow: "0 8px 32px #0002", overflow: "hidden",
      border: "7px solid #e7d6c2", position: "relative"
    }}>
      {/* 좌측 벽: 게스트북, 스티커(포스트잇) */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        padding: "38px 10px 18px 24px", borderRight: "2px solid #f1e3cb",
        background: "linear-gradient(180deg,#fff7ef 85%,#ffe7ba 100%)"
      }}>
        <div style={{ width: "100%", marginBottom: 16 }}>
          <span style={{
            fontWeight: 900, fontSize: 22, letterSpacing: 1, color: "#d2883c",
            textShadow: "0 1px 8px #ffeac1"
          }}>GUEST BOOK</span>
          {/* 포스트잇 스티커 */}
          <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
            {["#fffb9c", "#ffd6e2", "#b3e6fa"].map((color, i) => (
              <div key={i} style={{
                width: 22, height: 22, background: color,
                borderRadius: 5, transform: `rotate(${10 - 7 * i}deg)`,
                boxShadow: "0 2px 6px #ffd"
              }} />
            ))}
          </div>
        </div>
        <SpotBoard spotId={spotId} />
      </div>

      {/* 중앙: 카페 메뉴/아바타 */}
      <div style={{
        width: 300, minWidth: 160, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start", background: "#fcf6ee",
        borderLeft: "2px solid #f1e3cb", borderRight: "2px solid #f1e3cb",
        position: "relative"
      }}>
        {/* 카페 대표이미지/아바타 */}
        <img src={spot?.profileImg || "/etc/cafe-avatar.png"} alt=""
          style={{ width: 80, height: 80, borderRadius: "50%", margin: "20px auto 7px", boxShadow: "0 4px 14px #ffeab180" }} />
        <div style={{ fontSize: 23, fontWeight: 900, color: "#9b5e2b", marginBottom: 8 }}>{spot?.name || "카페 스팟"}</div>
        <div style={{ fontSize: 15, color: "#a7896c", marginBottom: 22 }}>{spot?.desc || "커피향 가득한 나만의 공간"}</div>
        {/* 메뉴판 (chalkboard 느낌) */}
        <div style={{
          width: 180, margin: "0 auto", height: 64, background: "#3d2c19", borderRadius: 12,
          boxShadow: "0 1px 12px #9b5e2b44", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ color: "#fffbe8", fontFamily: "cursive", fontSize: 17, fontWeight: 600 }}>MENU</div>
          <div style={{ color: "#ffd07f", fontSize: 14, marginTop: 4 }}>
            ☕ 아메리카노&nbsp; •&nbsp; 카페라떼&nbsp; •&nbsp; 바닐라&nbsp; •&nbsp; 티<br />
            <span style={{ color: "#f0e7d6" }}>🍰 오늘의 디저트</span>
          </div>
        </div>
      </div>

      {/* 우측 벽: 앨범(갤러리), 헥사곤 썸네일 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        padding: "38px 24px 18px 10px", background: "linear-gradient(180deg,#fffbe6 85%,#f7efd8 100%)"
      }}>
        <div style={{ width: "100%", marginBottom: 16, position: "relative" }}>
          <span style={{
            fontWeight: 900, fontSize: 22, letterSpacing: 1, color: "#b7a75e",
            textShadow: "0 2px 8px #f6e996"
          }}>ALBUM</span>
          {/* Hexagon 패턴 */}
          <div style={{ marginTop: 10, marginBottom: 7, display: "flex", flexWrap: "wrap", gap: 3, justifyContent: "center" }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: 42, height: 42, background: "#fcf4e3",
                clipPath: "polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)",
                boxShadow: "0 1px 5px #e7cf8c",
                display: "inline-block", margin: 1, position: "relative"
              }} />
            ))}
            {/* 추가: 사진 썸네일 삽입 등 */}
          </div>
        </div>
        <SpotGallery spotId={spotId} />
      </div>
    </div>
  );
}

export default SpotViewCafe;