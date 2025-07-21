import { useEffect, useState } from 'react';
import axios from 'axios';

function SpotForm({ center, onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios.get("/api/buildings")
      .then(res => setBuildings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBuildings([]));
    axios.get("/api/categories")
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  const selectedBuilding = buildings.find(b => b.id === buildingId);
  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <>
      {/* === 손가락 아이콘 오버레이 === */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -55%)',
          zIndex: 3100,
          pointerEvents: 'none',
          textAlign: 'center',
        }}
      >
        <img
          src="/etc/finger.png"
          alt="spot-finger"
          style={{
            width: 54,
            height: 54,
            filter: 'drop-shadow(0 2px 8px #0002)'
          }}
        />
        <div style={{
          fontSize: 14, marginTop: 2, color: '#1a9ad6',
          textShadow: '0 1px 5px #fff, 0 1px 8px #fff'
        }}>
          여기에 건물이 생겨요
        </div>
      </div>
      {/* === 상단 고정 팝업 (슬림버전) === */}
      <div style={{
        position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
        background: 'white', border: '2px solid #b0c4d6', borderRadius: 20,
        boxShadow: '0 4px 18px #0002', padding: 16, zIndex: 3001,
        maxWidth: 420, minWidth: 240, width: '92vw', minHeight: 120,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <h3 style={{margin:0, marginBottom: 8, fontWeight:650, color:'#247', fontSize: '1.1rem'}}>스팟 짓기</h3>
        <div style={{fontSize: 12, color: '#379e6b', marginBottom: 7, fontWeight: 500}}>
          위치: <span style={{fontWeight:600}}>{center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
        </div>
        <input
          placeholder="스팟 이름"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{
            width:'91%', fontSize:14, padding: '7px 10px', border:'1px solid #b0c4d6',
            borderRadius:8, marginBottom:10, outline:'none',
            boxShadow:'0 1px 3px #0001', transition:'border 0.2s'
          }}
        />
        <div style={{fontWeight:500, fontSize:13, margin:'3px 0 3px 4px', alignSelf:'flex-start'}}>건물 선택</div>
        <div style={{
          display:'flex', overflowX:'auto', gap:6, padding:'1px 0 6px 0', marginBottom: 4, width:'100%'
        }}>
          {buildings.map(b => (
            <div
              key={b.id}
              onClick={() => setBuildingId(b.id)}
              style={{
                minWidth:42, maxWidth:42, minHeight:42, borderRadius:8, flexShrink:0,
                border: buildingId === b.id ? '2px solid #1a9ad6' : '1px solid #ddd',
                background: buildingId === b.id ? '#f1fafd' : '#fcfcfc',
                boxShadow: buildingId === b.id ? '0 0 5px #8be6ff77' : 'none',
                display:'flex', flexDirection:'column', alignItems:'center',
                cursor:'pointer', transition:'border 0.15s'
              }}
            >
              <img src={b.iconUrl} alt={b.name} style={{width:24, height:24, margin:'5px 0 2px 0'}} />
              <span style={{fontSize:10, fontWeight:buildingId === b.id ? 700 : 400, color:'#333'}}>
                {b.name}
              </span>
            </div>
          ))}
        </div>
        <div style={{fontWeight:500, fontSize:13, margin:'2px 0 3px 4px', alignSelf:'flex-start'}}>카테고리 선택</div>
        <div style={{
          display:'flex', overflowX:'auto', gap:6, padding:'1px 0 4px 0', marginBottom: 6, width:'100%'
        }}>
          {categories.map(c => (
            <div
              key={c.id}
              onClick={() => setCategoryId(c.id)}
              style={{
                minWidth:36, maxWidth:36, minHeight:36, borderRadius:7, flexShrink:0,
                border: categoryId === c.id ? '1.5px solid #8ac421' : '1px solid #ddd',
                background: categoryId === c.id ? '#f6fcf2' : '#fcfcfc',
                boxShadow: categoryId === c.id ? '0 0 3px #abf78b77' : 'none',
                display:'flex', flexDirection:'column', alignItems:'center',
                cursor:'pointer', transition:'border 0.15s'
              }}
            >
              <img src={c.iconUrl} alt={c.name} style={{width:18, height:18, margin:'4px 0 2px 0'}} />
              <span style={{fontSize:9.5, fontWeight:categoryId === c.id ? 700 : 400, color:'#333'}}>
                {c.name}
              </span>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center', marginTop:6, width:'100%'}}>
          <button
            onClick={() => {
              if (name && buildingId && categoryId) onSubmit({ name, buildingId, categoryId });
            }}
            style={{
              background: '#1a9ad6', color: 'white', border: 'none',
              padding: '7px 22px', borderRadius: 7, fontWeight: 'bold', fontSize: 14, marginRight: 10,
              boxShadow:'0 2px 6px #32b0ff22', cursor:'pointer'
            }}
          >등록</button>
          <button onClick={onClose} style={{
            background: '#fff', color: '#1a9ad6', border: '1px solid #b0c4d6',
            padding: '7px 18px', borderRadius: 7, fontWeight: 'bold', fontSize: 13, cursor:'pointer'
          }}>닫기</button>
        </div>
      </div>
    </>
  );
}

export default SpotForm;