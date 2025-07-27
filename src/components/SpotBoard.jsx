import { useState, useEffect } from "react";
import axios from "axios";

function SpotBoard({ spotId }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");

  useEffect(() => {
    axios.get(`/api/spots/${spotId}/board`).then(res => setPosts(res.data || []));
  }, [spotId]);

  const handlePost = async () => {
  if (!content.trim()) return;

  // 보내는 데이터 로그!
  const postData = { content };
  console.log("[SpotBoard] 등록 데이터:", postData);

  try {
    const res = await axios.post(`/api/spots/${spotId}/board`, postData);
    console.log("[SpotBoard] 서버 응답:", res.data);
    setContent("");
    // 등록 후 목록 새로고침
    axios.get(`/api/spots/${spotId}/board`).then(res => setPosts(res.data || []));
  } catch (err) {
    console.error("[SpotBoard] 글 등록 실패:", err?.response || err);
    if (err?.response?.data) {
      alert("서버 오류: " + JSON.stringify(err.response.data, null, 2)); // 보기 쉽게
      console.log("[SpotBoard] 서버 에러 전체 응답:", err.response.data);
    }
  }
};

  return (
  <div style={{
    background: "#f8f9fc",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 2px 16px #0001"
  }}>
    <textarea
      value={content}
      onChange={e => setContent(e.target.value)}
      placeholder="게시글을 입력하세요"
      style={{
        width: "100%",
        minHeight: 64,
        borderRadius: 8,
        border: "1.5px solid #b9d1e8",
        marginBottom: 12,
        background: "#fff",
        color: "#222",
        fontSize: 16,
        padding: "10px 12px",
        outline: "none"
      }}
    />
    <button
      onClick={handlePost}
      style={{
        background: "#222",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        fontWeight: 700,
        fontSize: 20,
        padding: "10px 32px",
        marginBottom: 18,
        cursor: "pointer"
      }}
    >
      글 등록
    </button>
    <ul style={{ marginTop: 8, padding: 0, minHeight: 40 }}>
      {posts.length === 0 ? (
        <li style={{
          color: "#999", fontSize: 15, padding: "24px 0", textAlign: "center"
        }}>
          아직 등록된 글이 없습니다.
        </li>
      ) : (
        posts.map(post => (
          <li key={post.id}
            style={{
              marginBottom: 18,
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: 10,
              color: "#222",
              wordBreak: "break-all",
              background: "#fff",
              borderRadius: 9,
              boxShadow: "0 1px 5px #ececec",
              padding: "13px 14px"
            }}>
            <div style={{
              fontWeight: 700, color: "#1a73d6", marginBottom: 2, fontSize: 16
            }}>
              {post.author?.nickname || "익명"}
              <span style={{
                fontWeight: 400, color: "#aaa", fontSize: 13, marginLeft: 7
              }}>
                | {post.createdAt?.split("T")[0] || ""}
              </span>
            </div>
            <div style={{
              color: "#212121",
              fontSize: 16,
              marginTop: 2,
              whiteSpace: "pre-line"
            }}>
              {post.content}
            </div>
          </li>
        ))
      )}
    </ul>
  </div>
);
}
export default SpotBoard;