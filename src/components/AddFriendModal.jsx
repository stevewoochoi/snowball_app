// src/components/AddFriendModal.jsx
import styles from './AddFriendModal.module.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AddFriendModal({ onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    axios.get(`/api/search?q=${encodeURIComponent(q)}&type=user`)
    .then(res => {
      const myUserId = localStorage.getItem("userId") || localStorage.getItem("snowball_uid");
      // 내 계정은 제외하고 보여줌
      const users = (res.data.users || []).filter(u => String(u.id) !== String(myUserId));
      setResults(users);
    })
    .finally(() => setLoading(false));
}, [q]);

  // 친구 요청 버튼 클릭 이벤트 (API 연동)
  const handleAddFriend = async (userId) => {
    // 로그 출력: 누가 누구에게 친구 요청하는지
    const myUserId = localStorage.getItem("userId") || localStorage.getItem("snowball_uid");
    console.log(`[AddFriendModal] 친구 추가 버튼 클릭: 내 userId=${myUserId}, 대상 userId=${userId}`);
    try {
      // /api/friends/request에 본인 userId, 대상 userId 모두 전달 (params로)
      await axios.post("/api/friends/request", null, {
        params: {
          userId: myUserId,
          friendId: userId,
        },
      });
      alert("친구 요청이 전송되었습니다!");
    } catch (e) {
      if (e.response && e.response.data && e.response.data.message) {
        alert("친구 요청 실패: " + e.response.data.message);
      } else {
        alert("친구 요청 실패: 서버 오류");
      }
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
              <span className={styles.userInfo}>{user.nickname}</span>
              <button
                className={styles.addBtn}
                onClick={() => {
                  const myUserId = localStorage.getItem("userId") || localStorage.getItem("snowball_uid");
                  console.log(`[AddFriendModal] 친구 추가 버튼 클릭됨: 내 userId=${myUserId}, 대상 userId=${user.id}`);
                  handleAddFriend(user.id);
                }}
                title="친구 요청"
              >+</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}