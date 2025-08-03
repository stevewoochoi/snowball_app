// src/components/SettingsModal.jsx
import { useState } from 'react';
import BASEMAPS from './Map/MapStyle'; // 분리된 스타일 import!

function SettingsModal({ onClose, onLogout, basemap, onBasemapChange }) {
  const [mapSelectionOpen, setMapSelectionOpen] = useState(false);

  function toggleMapSelection() {
    setMapSelectionOpen(!mapSelectionOpen);
  }

  function handleBasemapChange(value) {
    if (onBasemapChange) {
      onBasemapChange(value);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.17)', zIndex: 2100, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start'
    }}>
      <div style={{
        margin: '32px 0 0 20px', padding: 24, background: '#fff', borderRadius: 18,
        minWidth: 220, minHeight: 120, boxShadow: '0 4px 30px #0002', position: 'relative'
      }}>
        <div style={{fontSize: 20, fontWeight: 'bold', marginBottom: 12}}>설정</div>
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
    </div>
  );
}

export default SettingsModal;