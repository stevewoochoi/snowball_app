// src/components/AddFriendModal.jsx
import styles from './AddFriendModal.module.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddFriendModal({ onClose, viewerId }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // viewerId가 있을 때만 쿼리에 추가
  const withViewer = (urlBase) => {
    const uid = viewerId ?? localStorage.getItem("snowball_uid") ?? localStorage.getItem("userId");
    if (uid != null && uid !== '' && !Number.isNaN(Number(uid))) {
      const sep = urlBase.includes('?') ? '&' : '?';
      return `${urlBase}${sep}viewerId=${Number(uid)}`;
    }
    return urlBase;
  };

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const primaryUrl = withViewer(`/api/search?q=${encodeURIComponent(q)}&type=user`);
    axios.get(primaryUrl)
      .then(res => {
        const myUserId = viewerId ?? localStorage.getItem("snowball_uid") ?? localStorage.getItem("userId");
        const users = (res.data?.users || res.data || []).filter(u => String(u.id) !== String(myUserId));
        setResults(users);
      })
      .catch(err => {
        if (err?.response?.status === 400) {
          const fallbackUrl = withViewer(`/api/search?q=${encodeURIComponent(q)}`);
          return axios.get(fallbackUrl).then(res2 => {
            const myUserId = viewerId ?? localStorage.getItem("snowball_uid") ?? localStorage.getItem("userId");
            const users = (res2.data?.users || res2.data || []).filter(u => String(u.id) !== String(myUserId));
            setResults(users);
          }).catch(() => setResults([]));
        }
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [q, viewerId]);

  // 친구 요청 버튼 클릭 이벤트 (API 연동)
  const handleAddFriend = async (targetId) => {
    const myUserId = viewerId ?? localStorage.getItem("snowball_uid") ?? localStorage.getItem("userId");
    console.log(`[AddFriendModal] 친구 추가 클릭: 내 userId=${myUserId}, 대상 userId=${targetId}`);
    if (!myUserId) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      await axios.post("/api/friends/request", null, {
        params: {
          userId: myUserId,
          friendId: targetId,
          // 일부 서버는 viewerId를 요구할 수 있음
          viewerId: myUserId,
        },
      });
      alert("친구 요청을 보냈습니다.");
    } catch (e) {
      const msg = e?.response?.data?.message || "서버 오류";
      alert("친구 요청 실패: " + msg);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.title}>친구 검색</div>
        <input
          className={styles.input}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="닉네임/이메일로 검색"
          autoFocus
        />
        <div className={styles.resultList}>
          {loading && <div className={styles.loading}>검색 중...</div>}
          {!loading && q.length >= 2 && results.length === 0 && (
            <div className={styles.empty}>검색 결과가 없습니다.</div>
          )}
          {results.map(user => (
            <div className={styles.resultItem} key={user.id}>
              <span className={styles.userInfo}>
                {user.nickname} <span style={{ color: '#6b7280', fontSize: 12 }}>({user.email})</span>
              </span>
              <button
                className={styles.addBtn}
                onClick={() => handleAddFriend(user.id)}
                title="친구 요청"
              >+</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}