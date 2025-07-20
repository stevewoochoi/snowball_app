import { useEffect, useState } from 'react';
import axios from 'axios';

function SpotForm({ center, onSubmit, onClose }) {
  const [name, setName] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showBuildingList, setShowBuildingList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);

  useEffect(() => {
    axios.get("/api/buildings")
      .then(res => setBuildings(Array.isArray(res.data) ? res.data : []))
      .catch(() => setBuildings([]));
    axios.get("/api/categories")
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  // 선택된 building/category 이름 표시용
  const selectedBuilding = buildings.find(b => b.id === buildingId);
  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div style={{
    position: 'fixed', top: '24%', left: '50%', transform: 'translate(-50%, 0)',
    background: 'white', border: '2px solid #b0c4d6', borderRadius: 16, 
    boxShadow: '0 4px 32px #0003', padding: 24, zIndex: 2000, minWidth: 270, maxWidth: 340
  }}>
    <h3 style={{margin:0, marginBottom: 12, fontWeight:600, color:'#247'}}>스팟 짓기</h3>
    <div style={{fontSize: 12, color: '#6a7', marginBottom: 8, textAlign:'right'}}>
      위치: <span style={{fontWeight:500}}>{center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
    </div>
    {/* 스팟 이름 */}
    <input
      placeholder="스팟 이름을 입력하세요"
      value={name}
      onChange={e => setName(e.target.value)}
      style={{
        width:'90%', fontSize:16, padding: '10px 14px', border:'1.5px solid #b0c4d6',
        borderRadius:10, marginBottom:14, outline:'none',
        boxShadow:'0 1px 6px #0001', transition:'border 0.2s',
      }}
    />

{/* 건물 선택 (좌우 스크롤 카드) */}
    <div style={{fontWeight:500, fontSize:13, margin:'6px 0 5px 4px'}}>건물 선택</div>
    <div style={{
      display:'flex', overflowX:'auto', gap:12, padding:'2px 0 12px 0', marginBottom: 8
    }}>
      {buildings.map(b => (
        <div
          key={b.id}
          onClick={() => setBuildingId(b.id)}
          style={{
            minWidth:56, maxWidth:56, minHeight:56, borderRadius:11, flexShrink:0,
            border: buildingId === b.id ? '2.5px solid #1a9ad6' : '1.5px solid #ddd',
            background: buildingId === b.id ? '#f1fafd' : '#fcfcfc',
            boxShadow: buildingId === b.id ? '0 0 7px #8be6ff77' : 'none',
            display:'flex', flexDirection:'column', alignItems:'center', 
            cursor:'pointer', transition:'border 0.2s'
          }}
        >
          <img src={b.iconUrl} alt={b.name} style={{width:32, height:32, margin:'7px 0 2px 0'}} />
          <span style={{fontSize:12, fontWeight:buildingId === b.id ? 700 : 400, color:'#333'}}>
            {b.name}
          </span>
        </div>
      ))}
    </div>

{/* 카테고리 선택 (좌우 스크롤 카드) */}
    <div style={{fontWeight:500, fontSize:13, margin:'2px 0 5px 4px'}}>카테고리 선택</div>
    <div style={{
      display:'flex', overflowX:'auto', gap:12, padding:'2px 0 10px 0', marginBottom: 10
    }}>
      {categories.map(c => (
        <div
          key={c.id}
          onClick={() => setCategoryId(c.id)}
          style={{
            minWidth:50, maxWidth:50, minHeight:50, borderRadius:11, flexShrink:0,
            border: categoryId === c.id ? '2.5px solid #8ac421' : '1.5px solid #ddd',
            background: categoryId === c.id ? '#f6fcf2' : '#fcfcfc',
            boxShadow: categoryId === c.id ? '0 0 6px #abf78b77' : 'none',
            display:'flex', flexDirection:'column', alignItems:'center', 
            cursor:'pointer', transition:'border 0.2s'
          }}
        >
          <img src={c.iconUrl} alt={c.name} style={{width:26, height:26, margin:'6px 0 2px 0'}} />
          <span style={{fontSize:11, fontWeight:categoryId === c.id ? 700 : 400, color:'#333'}}>
            {c.name}
          </span>
        </div>
      ))}
    </div>

      {/* 건물 리스트 모달 */}
      {showBuildingList && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.12)', zIndex: 2100, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 24px #0002',
            display: 'grid', gridTemplateColumns: 'repeat(3, 88px)', gap: 16, maxWidth: 350
          }}>
            {buildings.map(b => (
              <div key={b.id}
                onClick={() => { setBuildingId(b.id); setShowBuildingList(false); }}
                style={{
                  border: buildingId === b.id ? '2.5px solid #28a' : '1.5px solid #bbb',
                  borderRadius: 10, padding: 8, cursor: 'pointer',
                  background: buildingId === b.id ? '#e9f7fd' : '#f9f9f9',
                  textAlign: 'center', fontWeight: 500, color: '#333'
                }}
              >
                <img src={b.iconUrl} alt={b.name} style={{width: 38, height: 38, marginBottom: 4}} /><br />
                <span style={{fontSize: 14}}>{b.name}</span>
              </div>
            ))}
            <button onClick={() => setShowBuildingList(false)} style={{
              gridColumn: 'span 3', marginTop: 6, background: '#fff', color: '#28a', border: '1.5px solid #28a', padding: 7, borderRadius: 7, fontWeight: 'bold'
            }}>닫기</button>
          </div>
        </div>
      )}

      {/* 카테고리 리스트 모달 */}
      {showCategoryList && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.12)', zIndex: 2100, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 24px #0002',
            display: 'grid', gridTemplateColumns: 'repeat(3, 88px)', gap: 16, maxWidth: 350
          }}>
            {categories.map(c => (
              <div key={c.id}
                onClick={() => { setCategoryId(c.id); setShowCategoryList(false); }}
                style={{
                  border: categoryId === c.id ? '2.5px solid #28a' : '1.5px solid #bbb',
                  borderRadius: 10, padding: 8, cursor: 'pointer',
                  background: categoryId === c.id ? '#e9f7fd' : '#f9f9f9',
                  textAlign: 'center', fontWeight: 500, color: '#333'
                }}
              >
                <img src={c.iconUrl} alt={c.name} style={{width: 32, height: 32, marginBottom: 4}} /><br />
                <span style={{fontSize: 14}}>{c.name}</span>
              </div>
            ))}
            <button onClick={() => setShowCategoryList(false)} style={{
              gridColumn: 'span 3', marginTop: 6, background: '#fff', color: '#28a', border: '1.5px solid #28a', padding: 7, borderRadius: 7, fontWeight: 'bold'
            }}>닫기</button>
          </div>
        </div>
      )}

      <div style={{textAlign:'center', marginTop:10}}>
      <button
        onClick={() => {
          if (name && buildingId && categoryId) onSubmit({ name, buildingId, categoryId });
        }}
        style={{
          background: '#1a9ad6', color: 'white', border: 'none',
          padding: '9px 32px', borderRadius: 9, fontWeight: 'bold', fontSize: 16, marginRight: 10,
          boxShadow:'0 2px 10px #32b0ff22', cursor:'pointer'
        }}
      >등록</button>
      <button onClick={onClose} style={{
        background: '#fff', color: '#1a9ad6', border: '1.5px solid #b0c4d6',
        padding: '9px 28px', borderRadius: 9, fontWeight: 'bold', fontSize: 15, cursor:'pointer'
      }}>닫기</button>
    </div>
  </div>
  );
}

export default SpotForm;