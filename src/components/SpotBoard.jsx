import { useState, useEffect } from "react";
import axios from "axios";
import CommentList from "./CommentList";

function SpotBoard({ spotId }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [openComment, setOpenComment] = useState({});

  // JWT 헤더 구성 (로그인 상태면 Authorization 추가)
  const authHeaders = () => {
    const token = localStorage.getItem("snowball_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizePageResponse = (data) => {
    // Spring Page response
    if (data && Array.isArray(data.content)) {
      return { items: data.content, last: data.last === true };
    }
    // Plain array fallback
    if (Array.isArray(data)) {
      const start = page * size;
      const end = start + size;
      const slice = data.slice(start, end);
      return { items: slice, last: end >= data.length };
    }
    return { items: [], last: true };
  };

  const loadPage = async (nextPage = 0, replace = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const url = `/api/spots/${spotId}/board?page=${nextPage}&size=${size}`;
      const res = await axios.get(url, { headers: authHeaders() });
      const { items, last } = normalizePageResponse(res.data || []);
      setPosts(prev => replace ? items : [...prev, ...items]);
      setHasMore(!last);
      setPage(nextPage);
    } catch (e) {
      console.error('[SpotBoard] 목록 로드 실패:', e?.response || e);
      if (page === 0) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // spotId 바뀌면 처음부터 로드
    setPosts([]);
    setHasMore(true);
    loadPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, size]);

  const handlePost = async () => {
  if (!content.trim()) return;

  // 보내는 데이터 로그!
  const postData = { content };
  console.log("[SpotBoard] 등록 데이터:", postData);

  try {
    const res = await axios.post(`/api/spots/${spotId}/board`, postData, { headers: authHeaders() });
    console.log("[SpotBoard] 서버 응답:", res.data);
    setContent("");
    // 등록 후 목록 새로고침 (첫 페이지부터)
    await loadPage(0, true);
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
        background: "#fff",
        color: "#222",
        fontSize: 16,
        padding: "10px 12px",
        outline: "none",
        marginBottom: 8
      }}
    />
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
      <button
        onClick={handlePost}
        style={{
          background: "#222",
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 14,
          padding: "8px 16px",
          cursor: "pointer"
        }}
      >
        글 등록
      </button>
    </div>
    <div style={{ maxHeight: '60vh', overflow: 'auto', marginTop: 8 }}>
      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
        {posts.length === 0 && !loading ? (
          <li style={{ color: '#999', fontSize: 15, padding: '24px 0', textAlign: 'center' }}>
            아직 등록된 글이 없습니다.
          </li>
        ) : (
          posts.map(post => (
            <li key={post.id}
              style={{
                marginBottom: 5,
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: 5,
                color: '#222',
                wordBreak: 'break-all',
                background: '#fff',
                borderRadius: 9,
                boxShadow: '0 1px 5px #ececec',
                padding: '13px 14px'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: '#1a73d6', fontSize: 12 }}>
                  {post.authorNickname || '익명'}
                  <span style={{ fontWeight: 400, color: '#aaa', fontSize: 11, marginLeft: 7 }}>
                    | {post.createdAt ? `${post.createdAt.split('T')[0]} ${post.createdAt.split('T')[1].substring(0,5)}` : ''}
                  </span>
                </div>
                <button
                  onClick={() => setOpenComment(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  style={{
                    border: '1px solid #e5e7eb',
                    background: openComment[post.id] ? '#111827' : '#fff',
                    color: openComment[post.id] ? '#fff' : '#374151',
                    borderRadius: 9,
                    fontSize: 11,
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  댓글달기
                </button>
              </div>
              <div style={{ color: '#212121', fontSize: 16, marginTop: 2, whiteSpace: 'pre-line' }}>
                {post.content}
              </div>
              <div style={{ marginTop: 8 }}>
                <CommentList spotId={spotId} postId={post.id} showComposer={!!openComment[post.id]} />
              </div>
            </li>
          ))
        )}
        {loading && (
          <li style={{ color: '#888', fontSize: 14, padding: '14px 0', textAlign: 'center' }}>로딩 중…</li>
        )}
      </ul>
    </div>
    {hasMore && (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <button
          onClick={() => loadPage(page + 1)}
          disabled={!hasMore || loading}
          style={{
            background: '#111827',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 10,
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          더 보기
        </button>
      </div>
    )}
  </div>
);
}
export default SpotBoard;