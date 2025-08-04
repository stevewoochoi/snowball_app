import { useState, useEffect } from 'react';
import BASEMAPS from './Map/MapStyle';
import FriendManagerModal from './FriendManagerModal';

function SettingsModal({ onClose, onLogout, basemap, onBasemapChange, user }) {
  const [mapSelectionOpen, setMapSelectionOpen] = useState(false);
  const [friendManagerOpen, setFriendManagerOpen] = useState(false);

  function toggleMapSelection() {
    setMapSelectionOpen(!mapSelectionOpen);
  }
  function handleBasemapChange(value) {
    if (onBasemapChange) onBasemapChange(value);
  }

  // 내 정보 (닉네임, 이메일, 레벨 등)
  // user prop이 없으면 localStorage에서 불러옴
  const myNickname = user?.nickname || localStorage.getItem('snowball_nickname') || '';
  const myEmail = user?.email || localStorage.getItem('snowball_email') || '';
  const myLevel = user?.level || localStorage.getItem('snowball_level') || '';

  return (
    <div style={{
      position: 'fixed', top: 36, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.17)', zIndex: 2100, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start'
    }}>
      <div style={{
        margin: '32px 0 0 20px', padding: 24, background: '#fff', borderRadius: 18,
        minWidth: 220, minHeight: 120, boxShadow: '0 4px 30px #0002', position: 'relative'
      }}>
        {/* 내 정보 */}
        <div style={{marginBottom: 14}}>
          <div style={{fontSize: 16, fontWeight: 700, color: "#197ad6", marginBottom: 4}}>내 계정</div>
          <div style={{fontSize: 14, color: "#283040"}}>닉네임: <b>{myNickname}</b></div>
          {myEmail && <div style={{fontSize: 13, color: "#888"}}>이메일: {myEmail}</div>}
          {myLevel && <div style={{fontSize: 13, color: "#888"}}>Level: {myLevel}</div>}
        </div>

        {/* 친구관리 버튼 */}
        <button
          onClick={() => setFriendManagerOpen(true)}
          style={{
            background:'#1a9ad6', color:'#fff', border:'none', borderRadius:8, padding:'8px 0',
            margin:'0 0 16px 0', width:'100%', fontWeight:'bold', fontSize:15, textAlign:'center', cursor:'pointer'
          }}
        >친구 관리</button>

        <button
          onClick={toggleMapSelection}
          style={{background:'#eee', color:'#333', border:'none', borderRadius:8, padding:'8px 40px', margin:'0 0 10px 0', width:'100%', fontWeight:'bold', fontSize:16, textAlign:'center', cursor:'pointer'}}
          aria-expanded={mapSelectionOpen}
          aria-controls="map-selection-panel"
        >
          지도 선택 {mapSelectionOpen ? '▲' : '▼'}
        </button>
        {mapSelectionOpen && (
          <div id="map-selection-panel" style={{marginBottom: 10, paddingLeft: 12, fontSize: 14, color: '#333'}}>
            <div style={{marginBottom: 6, fontWeight: 'bold'}}>원하는 지도 스타일을 선택하세요.</div>
            {Object.entries(BASEMAPS).map(([key, map]) => (
              <label key={key} style={{display: 'block', marginBottom: 4, cursor: 'pointer'}}>
                <input
                  type="radio"
                  name="basemap"
                  value={key}
                  checked={basemap === key}
                  onChange={() => handleBasemapChange(key)}
                  style={{marginRight: 6}}
                />
                {map.name}
                {basemap === key && <span style={{ color: "#197ad6", marginLeft: 4, fontWeight: 700 }}>선택됨</span>}
              </label>
            ))}
          </div>
        )}
        <button
          onClick={onLogout}
          style={{background:'#eee', color:'#333', border:'none', borderRadius:8, padding:'8px 20px', margin:'10px 0', width:'100%', fontWeight:'bold', fontSize:16}}
        >로그아웃</button>
        <button
          onClick={onClose}
          style={{
            position:'absolute', top:12, right:18, background:'none', border:'none', fontSize:20, color:'#666', cursor:'pointer'
          }}
        >×</button>
      </div>
      {/* 친구관리 모달 */}
      {friendManagerOpen && (
        <FriendManagerModal
          onClose={() => setFriendManagerOpen(false)}
          myUserId={user?.id || localStorage.getItem('snowball_uid')}
        />
      )}
    </div>
  );
}

export default SettingsModal;