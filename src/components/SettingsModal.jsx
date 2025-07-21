// src/components/SettingsModal.jsx
function SettingsModal({ onClose, onLogout }) {
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