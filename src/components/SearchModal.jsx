// src/components/SearchModal.jsx
import styles from './SearchModal.module.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AddFriendModal from './AddFriendModal';



function SearchModal({ open, onClose, onSelectSpot, onSelectUser, onAddFriend }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ spots: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');

  const [recentSpots, setRecentSpots] = useState([]);
  const [popularSpots, setPopularSpots] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);

  const [showAddFriend, setShowAddFriend] = useState(false);

  // 검색 실행 로그
  useEffect(() => {
    // 2글자 이상부터 검색 시작
    if (!q || q.length < 2) {
      setResults({ spots: [], users: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    axios.get(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      .then(res => {
        // 검색 API 결과 로그
        console.log("[SearchModal] search result", res.data);
        setResults(res.data || {});
      })
      .finally(() => setLoading(false));
  }, [q, type]);

  // open될 때만 최근/인기스팟 요청 + 검색결과 초기화(검색어는 유지)
  useEffect(() => {
    if (!open) return;
    setResults({ spots: [], users: [] });
    setLoadingRecent(true);
    axios.get('/api/spots/recent?limit=8')
      .then(res => setRecentSpots(res.data || []))
      .finally(() => setLoadingRecent(false));

    setLoadingPopular(true);
    axios.get('/api/spots/popular?limit=8')
      .then(res => setPopularSpots(res.data || []))
      .finally(() => setLoadingPopular(false));
  }, [open]);

  // 닫힐 때만 검색어 초기화
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  const friends = [
    { id: 11, nickname: "bestiam7", detail: "xxxx" },
    { id: 12, nickname: "snowball23", detail: "xxxx" },
    { id: 13, nickname: "xxxxxx", detail: "xxxx" }
  ];

  // 클릭 중복 방지: true면 클릭 한 번만 허용
  let clickLock = false;

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          {/* Close button */}
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          {showAddFriend ? (
            <AddFriendModal onClose={() => setShowAddFriend(false)} />
          ) : (
            <>
              {/* 최근검색 */}
              <div className={styles.sectionHeader}>
                <span>최근 등록된 스팟</span>
                <button className={styles.moreBtn}>더보기</button>
              </div>
              <div className={styles.cardRow}>
                {loadingRecent ? (
                  <div className={styles.loading}>불러오는 중...</div>
                ) : recentSpots.length === 0 ? (
                  <div className={styles.empty}>없음</div>
                ) : (
                  recentSpots.map(s => (
                    <div className={styles.spotCard} key={s.id}
                  onClick={e => {
                    e.stopPropagation();
                    if (clickLock) return;
                    clickLock = true;
                    console.log("[SearchModal] 최근스팟 클릭:", s);
                    onSelectSpot && onSelectSpot(s);
                    onClose();
                    setTimeout(() => { clickLock = false; }, 800);
                  }}>
                      <img
                        className={styles.cardImg}
                        src={s.iconUrl || (s.building && s.building.iconUrl) || "/etc/img-not-found.png"}
                        alt={s.name}
                        onError={e => { e.target.onerror = null; e.target.src = "/etc/img-not-found.png"; }}
                      />
                      <div className={styles.cardTitle}>{s.name}</div>
                      <div className={styles.cardSub}>{s.sub}</div>
                    </div>
                  ))
                )}
              </div>
              {/* 인기 스팟 */}
              <div className={styles.sectionHeader}>
                <span>인기 스팟</span>
                <button className={styles.moreBtn}>더보기</button>
              </div>
              <div className={styles.cardRow}>
                {loadingPopular ? (
                  <div className={styles.loading}>불러오는 중...</div>
                ) : popularSpots.length === 0 ? (
                  <div className={styles.empty}>없음</div>
                ) : (
                  popularSpots.map(s => (
                    <div className={styles.spotCard} key={s.id}
                      onClick={e => {
                        e.stopPropagation();
                        if (clickLock) return;
                        clickLock = true;
                        console.log("[SearchModal] 인기스팟 클릭:", s);
                        onSelectSpot && onSelectSpot(s);
                        onClose();
                        setTimeout(() => { clickLock = false; }, 800);
                      }}>
                      <img
                        className={styles.cardImg}
                        src={s.iconUrl || (s.building && s.building.iconUrl) || "/etc/img-not-found.png"}
                        alt={s.name}
                        onError={e => { e.target.onerror = null; e.target.src = "/etc/img-not-found.png"; }}
                      />
                      <div className={styles.cardTitle}>{s.name}</div>
                      <div className={styles.cardSub}>{s.sub}</div>
                    </div>
                  ))
                )}
              </div>
              {/* 친구 */}
              <div className={styles.sectionHeader} style={{ marginTop: 16 }}>
                <span>친구</span>
                <button
                  className={styles.addFriendBtn}
                  title="친구 추가"
                  style={{ color: 'black', fontWeight: 'bold', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setShowAddFriend(true)}
                >
                  +
                </button>
              </div>
              {/* 검색 입력 & 탭 */}
              <div className={styles.searchBarWrap}>
                <input
                  className={styles.input}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="스팟명, 지역명, 아이디"
                />
                <button className={styles.searchBtn}>
                  <img src="/button/btn_searchbutton2.png" alt="검색" style={{ width: 30, height: 30 }} />
                </button>
              </div>
              <div className={styles.tabs}>
                {["all", "spot", "user"].map(t =>
                  <button
                    key={t}
                    className={`${styles.tabBtn} ${type === t ? styles.active : ""}`}
                    onClick={() => setType(t)}
                  >{t === "all" ? "전체" : t === "spot" ? "스팟" : "유저"}</button>
                )}
              </div>
              {/* 검색 결과: 2글자 이상 입력 시만 */}
              {q.length >= 2 && (
                <div className={styles.resultSection}>
                  {loading && <div className={styles.loading}>검색 중...</div>}
                  {!loading && q && (results.spots?.length || results.users?.length) === 0 &&
                    <div className={styles.empty}>결과가 없습니다.</div>
                  }
                  {/* 결과 카드 */}
                  {results.spots?.length > 0 && (
                    <div>
                      <div className={styles.sectionTitle}>스팟</div>
                      <ul className={styles.resultList}>
                        {results.spots.map(s => (
                          <li
                            className={styles.resultItem}
                            key={s.id}
                            onClick={e => {
                              e.stopPropagation();
                              if (clickLock) return;
                              clickLock = true;
                              onSelectSpot && onSelectSpot(s);
                              onClose();
                              setTimeout(() => { clickLock = false; }, 800);
                            }}>
                            <div className={styles.resultMain}>{s.name}</div>
                            <div className={styles.resultSub}>{s.category?.name}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.users?.length > 0 && (
                    <div>
                      <div className={styles.sectionTitle}>유저</div>
                      <ul className={styles.resultList}>
                        {results.users.map(u => (
                          <li
                            className={styles.resultItem}
                            key={u.id}
                            onClick={e => {
                              e.stopPropagation();
                              if (clickLock) return;
                              clickLock = true;
                              onSelectUser && onSelectUser(u);
                              onClose();
                              setTimeout(() => { clickLock = false; }, 800);
                            }}>
                            <div className={styles.resultMain}>{u.nickname}</div>
                            <div className={styles.resultSub}>{u.email}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default SearchModal;