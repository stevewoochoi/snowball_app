import { useState, useEffect } from "react";
import axios from "axios";

function CommentList({ spotId, postId, showComposer = false }) {
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setShowInput(!!showComposer);
  }, [showComposer]);

  const authHeaders = () => {
    const token = localStorage.getItem("snowball_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadComments = async () => {
    try {
      const res = await axios.get(
        `/api/spots/${spotId}/board/posts/${postId}/comments?page=0&size=20`,
        { headers: authHeaders() }
      );
      const data = res.data.content || res.data; // Page or Array
      setComments(data);
    } catch (e) {
      console.error("[CommentList] 댓글 불러오기 실패:", e);
    }
  };

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    try {
      await axios.post(
        `/api/spots/${spotId}/board/posts/${postId}/comments`,
        { content: commentContent },
        { headers: authHeaders() }
      );
      setCommentContent("");
      setShowInput(false);
      await loadComments();
    } catch (e) {
      alert("댓글 작성 실패 (로그인이 필요합니다).");
    }
  };

  useEffect(() => {
    loadComments();
  }, [spotId, postId]);

  return (
    <div style={{ marginTop: 8, paddingLeft: 0 }}>
      {showInput && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <input
            value={commentContent}
            onChange={e => setCommentContent(e.target.value)}
            style={{
              flex: 1,
              border: "1px solid #ccc", borderRadius: 6,
              padding: "6px 8px",
              marginRight: 6
            }}
          />
          <button
            onClick={handleComment}
            style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#1a73d6", color: "#fff", fontSize: 12, cursor: 'pointer' }}
          >
            등록
          </button>
        </div>
      )}
      <ul style={{ listStyle: "none", padding: 0, marginTop: 8, marginLeft: 20 }}>
        {comments.map(c => (
          <li key={c.id} style={{ marginBottom: 6, fontSize: 14, textAlign: 'left' }}>
            <div style={{ marginLeft: 12 }}>
              <b>{c.authorNickname || "익명"}</b>
              <span style={{ color: "#999", marginLeft: 6 }}>
                {c.createdAt ? c.createdAt.split("T")[0] + " " + c.createdAt.split("T")[1].substring(0,5) : ""}
              </span>
              <div style={{ marginTop: 2 }}>{c.content}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default CommentList;