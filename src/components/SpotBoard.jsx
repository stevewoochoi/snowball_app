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
    await axios.post(`/api/spots/${spotId}/board`, { content });
    setContent("");
    axios.get(`/api/spots/${spotId}/board`).then(res => setPosts(res.data || []));
  };

  return (
    <div>
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="게시글을 입력하세요" style={{ width: "100%", minHeight: 64, borderRadius: 8, border: "1px solid #d4e5f6", marginBottom: 10 }} />
      <button onClick={handlePost}>글 등록</button>
      <ul style={{ marginTop: 18, padding: 0 }}>
        {posts.map(post => (
          <li key={post.id} style={{ marginBottom: 18, borderBottom: "1px solid #eee", paddingBottom: 10 }}>
            <div style={{ fontWeight: 600, color: "#197ad6" }}>{post.author?.nickname} <span style={{ fontWeight: 400, color: "#999", fontSize: 13 }}> | {post.createdAt}</span></div>
            <div>{post.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default SpotBoard;