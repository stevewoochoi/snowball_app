import styles from './SearchModal.module.css';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AddFriendModal from './AddFriendModal';

function SearchModal({ open, onClose, onSelectSpot, onSelectUser, userId, onCenterMap }) {
  const effectiveUserId = userId ?? localStorage.getItem("snowball_uid");
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ spots: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('all');

  const [recentSpots, setRecentSpots] = useState([]);
  const [popularSpots, setPopularSpots] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);

  const [showAddFriend, setShowAddFriend] = useState(false);

  // === OSM(Nominatim) typeahead ===
  const [osmResults, setOsmResults] = useState([]); // [{display_name, lat, lon, class, type}]
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmError, setOsmError] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const debounceTimerRef = useRef(null);
  const lastQueryRef = useRef("");

  const fetchOsm = async (query) => {
    if (!query || query.trim().length < 2) {
      setOsmResults([]);
      setOsmError("");
      return;
    }
    // 동일 질의 중복 호출 방지
    if (lastQueryRef.current === query) return;
    lastQueryRef.current = query;

    setOsmLoading(true);
    setOsmError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=5&accept-language=ko`;
      const res = await fetch(url, {
        headers: {
          // 일부 환경에서 도움이 되지만, 브라우저에서 임의 User-Agent는 무시됨
          // 정책 준수: 요청량은 디바운스로 제한
          'Accept': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`Nominatim ${res.status}`);
      const data = await res.json();
      setOsmResults(Array.isArray(data) ? data : []);
      setHighlightIdx(data && data.length ? 0 : -1);
    } catch (err) {
      console.error('[SearchModal] OSM 검색 오류:', err);
      setOsmError('주소 검색 중 오류가 발생했습니다.');
      setOsmResults([]);
      setHighlightIdx(-1);
    } finally {
      setOsmLoading(false);
    }
  };

  // 주소 지오코딩 → 지도 중심 이동

  const handleGeocode = async () => {
    if (!q) return;
    // 1) OSM 첫 결과 우선 이동
    if (osmResults && osmResults.length > 0) {
      pickOsmPlace(osmResults[0]);
      return;
    }
    // 2) 백엔드 프록시 지오코딩 (기존)
    if (!onCenterMap) return;
    try {
      const url = `/api/geocode?query=${encodeURIComponent(q)}`;
      console.log("[SearchModal] 🗺️ 주소 지오코딩 호출:", url);
      const { data } = await axios.get(url);
      if (data && (data.lat ?? data.latitude) != null && (data.lng ?? data.longitude) != null) {
        const lat = Number(data.lat ?? data.latitude);
        const lng = Number(data.lng ?? data.longitude);
        onCenterMap({ lat, lng, address: data.address || data.formatted || q });
        onClose && onClose();
        return;
      }
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const best = data.results[0];
        const lat = Number(best.lat ?? best.latitude);
        const lng = Number(best.lng ?? best.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          onCenterMap({ lat, lng, address: best.formatted || q });
          onClose && onClose();
          return;
        }
      }
      alert("해당 주소를 찾지 못했습니다.");
    } catch (e) {
      console.error("[SearchModal] 지오코딩 오류:", e?.response?.data || e);
      alert("주소 검색 중 오류가 발생했습니다.");
    }
  };

  // Helpers: resolve building & category icons
  const pickOsmPlace = (item) => {
    if (!item || !onCenterMap) return;
    const lat = Number(item.lat ?? item.latitude);
    const lng = Number(item.lon ?? item.lng ?? item.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    onCenterMap({ lat, lng, address: item.display_name || q });
    onClose && onClose();
  };

  const getBuildingIcon = (s) => {
    return s.iconUrl || s.buildingIconUrl || (s.building && s.building.iconUrl) || "/etc/img-not-found.png";
  };
  const getCategoryIcon = (s) => {
    // Try DTO fields first, then embedded relation, then any alt key
    return (
      s.categoryIconUrl ||
      s.categoryIcon ||
      (s.category && (s.category.iconUrl || s.categoryIconUrl || s.iconCategoryUrl)) ||
      null
    );
  };

  // === Spot relation badge (my / friends / official / public) ===
  const getSpotBadgeKey = (s) => {
    if (!s) return null;
    const me = Number(effectiveUserId);
    if (s.scope === 'OFFICIAL') return 'official';
    if (Number(s.ownerId) === me) return 'my';
    if (s.scope === 'FRIENDS') return 'friends';
    if (s.scope === 'PUBLIC') return 'public'; // 모르는 유저의 PUBLIC 스팟 등
    return null;
  };

  const getSpotBadgeLabel = (key) => {
    switch (key) {
      case 'official': return 'official spot';
      case 'my': return 'my spot';
      case 'friends': return 'friends spot';
      case 'public': return 'public spot';
      default: return '';
    }
  };

  // 검색 실행
  useEffect(() => {
    if (!q || q.length < 2) {
      setResults({ spots: [], users: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    const apiUrl = `/api/search?q=${encodeURIComponent(q)}&type=${type}&viewerId=${effectiveUserId || ""}`;
    console.log("[SearchModal] 🔎 검색 API 호출:", apiUrl, "viewerId:", effectiveUserId);
    axios.get(apiUrl)
      .then(res => {
        console.log("[SearchModal] 🔽 검색 결과:", res.data);
        setResults(res.data || {});
      })
      .finally(() => setLoading(false));
  }, [q, type, effectiveUserId]);

  // 오픈 시 최신/인기
  useEffect(() => {
    if (!open) return;
    setResults({ spots: [], users: [] });

    const recentUrl = `/api/search/recent?limit=8&viewerId=${effectiveUserId || ""}`;
    const popularUrl = `/api/search/popular?limit=8&viewerId=${effectiveUserId || ""}`;
    console.log("[SearchModal] 🕒 최근스팟 API:", recentUrl, "viewerId:", effectiveUserId);
    setLoadingRecent(true);
    axios.get(recentUrl)
      .then(res => {
        console.log("[SearchModal] 최근스팟 결과:", res.data);
        setRecentSpots(res.data || []);
        if ((res.data || []).length > 0) {
          const d = (res.data || [])[0];
          console.log('[SearchModal] 최근 첫 항목 아이콘 체크:', {
            iconUrl: d.iconUrl,
            buildingIconUrl: d.buildingIconUrl,
            categoryIconUrl: d.categoryIconUrl,
            hasCategory: !!d.category,
            catRelIcon: d.category?.iconUrl
          });
        }
      })
      .finally(() => setLoadingRecent(false));

    console.log("[SearchModal] 🔥 인기스팟 API:", popularUrl, "viewerId:", effectiveUserId);
    setLoadingPopular(true);
    axios.get(popularUrl)
      .then(res => {
        console.log("[SearchModal] 인기스팟 결과:", res.data);
        setPopularSpots(res.data || []);
        if ((res.data || []).length > 0) {
          const d = (res.data || [])[0];
          console.log('[SearchModal] 인기 첫 항목 아이콘 체크:', {
            iconUrl: d.iconUrl,
            buildingIconUrl: d.buildingIconUrl,
            categoryIconUrl: d.categoryIconUrl,
            hasCategory: !!d.category,
            catRelIcon: d.category?.iconUrl
          });
        }
      })
      .finally(() => setLoadingPopular(false));
  }, [open, effectiveUserId]);

  // OSM 검색 디바운스 (400ms)
  useEffect(() => {
    if (!open) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (!q || q.trim().length < 2) {
      setOsmResults([]);
      setHighlightIdx(-1);
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchOsm(q.trim());
    }, 400);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [q, open]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (!open) return null;

  let clickLock = false;

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
          {/* 최근 스팟 */}
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
                    onSelectSpot && onSelectSpot(s);
                    onClose();
                    setTimeout(() => { clickLock = false; }, 800);
                  }}>
                  <div className={styles.cardImgWrap} style={{ marginBottom: '14px' }}>
                    <img
                      className={styles.cardImgBase}
                      src={getBuildingIcon(s)}
                      alt={s.name}
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/etc/img-not-found.png"; }}
                    />
                    {getCategoryIcon(s) && (
                      <img
                        className={styles.cardImgBadge}
                        src={getCategoryIcon(s)}
                        alt="category"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className={styles.cardTitle} style={{ marginTop: '6px' }}>{s.name}</div>
                  <div className={styles.cardSub} style={{ marginTop: '2px' }}>
                    {s.ownerNickname ? s.ownerNickname : s.ownerId}
                  </div>
                  {(() => {
                    const key = getSpotBadgeKey(s);
                    if (!key) return null;
                    const label = getSpotBadgeLabel(key);
                    const cls = `${styles.spotBadge} ` + (
                      key === 'official' ? styles.spotBadgeOfficial :
                      key === 'my' ? styles.spotBadgeMy :
                      key === 'friends' ? styles.spotBadgeFriends :
                      key === 'public' ? styles.spotBadgePublic : ''
                    );
                    return (
                      <div style={{ marginTop: 4 }}>
                        <span className={cls}>{label}</span>
                      </div>
                    );
                  })()}
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
                    onSelectSpot && onSelectSpot(s);
                    onClose();
                    setTimeout(() => { clickLock = false; }, 800);
                  }}>
                  <div className={styles.cardImgWrap} style={{ marginBottom: '14px' }}>
                    <img
                      className={styles.cardImgBase}
                      src={getBuildingIcon(s)}
                      alt={s.name}
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/etc/img-not-found.png"; }}
                    />
                    {getCategoryIcon(s) && (
                      <img
                        className={styles.cardImgBadge}
                        src={getCategoryIcon(s)}
                        alt="category"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className={styles.cardTitle} style={{ marginTop: '6px' }}>{s.name}</div>
                  <div className={styles.cardSub} style={{ marginTop: '2px' }}>
                    {s.ownerNickname ? s.ownerNickname : s.ownerId}
                  </div>
                  {(() => {
                    const key = getSpotBadgeKey(s);
                    if (!key) return null;
                    const label = getSpotBadgeLabel(key);
                    const cls = `${styles.spotBadge} ` + (
                      key === 'official' ? styles.spotBadgeOfficial :
                      key === 'my' ? styles.spotBadgeMy :
                      key === 'friends' ? styles.spotBadgeFriends :
                      key === 'public' ? styles.spotBadgePublic : ''
                    );
                    return (
                      <div style={{ marginTop: 4 }}>
                        <span className={cls}>{label}</span>
                      </div>
                    );
                  })()}
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
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (highlightIdx >= 0 && osmResults[highlightIdx]) {
                    pickOsmPlace(osmResults[highlightIdx]);
                  } else {
                    handleGeocode();
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (osmResults.length) setHighlightIdx(i => Math.min(i + 1, osmResults.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (osmResults.length) setHighlightIdx(i => Math.max(i - 1, 0));
                }
              }}
              placeholder="스팟명, 지역명, 아이디, 주소 입력 가능"
            />
            <button className={styles.searchBtn} onClick={handleGeocode} title="주소로 이동">
              <img src="/button/btn_searchbutton2.png" alt="검색" style={{ width: 30, height: 30 }} />
            </button>
          </div>
          {q.trim().length >= 2 && (osmLoading || osmResults.length > 0 || osmError) && (
            <div style={{
              position: 'relative',
              zIndex: 5,
            }}>
              <ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: 8,
                overflow: 'hidden',
                maxHeight: 280,
                overflowY: 'auto',
                background: '#fff'
              }}>
                {osmLoading && (
                  <li style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>주소 검색 중...</li>
                )}
                {osmError && !osmLoading && (
                  <li style={{ padding: '10px 12px', fontSize: 13, color: '#b91c1c' }}>{osmError}</li>
                )}
                {!osmLoading && !osmError && osmResults.map((item, idx) => (
                  <li
                    key={`${item.place_id || item.osm_id || item.display_name}-${idx}`}
                    onMouseDown={(e) => { e.preventDefault(); }}
                    onClick={() => pickOsmPlace(item)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: idx === highlightIdx ? '#f3f4f6' : '#fff',
                      borderTop: '1px solid #f3f4f6'
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{item.display_name?.split(',')[0] || '장소'}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {item.class}/{item.type} · {item.display_name}
                    </div>
                  </li>
                ))}
                {!osmLoading && !osmError && osmResults.length === 0 && (
                  <li style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>주소/장소 결과 없음</li>
                )}
              </ul>
            </div>
          )}
          <div className={styles.tabs}>
            {["all", "spot", "user"].map(t =>
              <button
                key={t}
                className={`${styles.tabBtn} ${type === t ? styles.active : ""}`}
                onClick={() => setType(t)}
              >{t === "all" ? "전체" : t === "spot" ? "스팟" : "유저"}</button>
            )}
          </div>
          {/* 검색 결과 */}
          {q.length >= 2 && (
            <div className={styles.resultSection}>
              {loading && <div className={styles.loading}>검색 중...</div>}
              {!loading && q && (results.spots?.length || results.users?.length) === 0 &&
                <div className={styles.empty}>결과가 없습니다.</div>
              }
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
                        <div className={styles.resultSpotInfo}>
                          {s.ownerNickname
                            ? `${s.ownerNickname} (ID:${s.ownerId})`
                            : `ID:${s.ownerId}`}
                        </div>
                        {(() => {
                          const key = getSpotBadgeKey(s);
                          if (!key) return null;
                          const label = getSpotBadgeLabel(key);
                          const cls = `${styles.spotBadge} ` + (
                            key === 'official' ? styles.spotBadgeOfficial :
                            key === 'my' ? styles.spotBadgeMy :
                            key === 'friends' ? styles.spotBadgeFriends :
                            key === 'public' ? styles.spotBadgePublic : ''
                          );
                          return (
                            <div style={{ marginTop: 4 }}>
                              <span className={cls}>{label}</span>
                            </div>
                          );
                        })()}
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
        </div>
      </div>
      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
    </>
  );
}

export default SearchModal;