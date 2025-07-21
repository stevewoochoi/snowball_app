import { useEffect, useState } from 'react';
import axios from 'axios';

function SpotForm({
  center,
  onSubmit,
  onClose,
  onBuildingSelect,
  onCategorySelect,
  selectedBuilding,
  selectedCategory,
}) {
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
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

  // 외부 상태/미리보기와 동기화
  useEffect(() => {
    if (buildingId && onBuildingSelect) onBuildingSelect(buildings.find(b => b.id === buildingId));
  }, [buildingId, buildings, onBuildingSelect]);
  useEffect(() => {
    if (categoryId && onCategorySelect) onCategorySelect(categories.find(c => c.id === categoryId));
  }, [categoryId, categories, onCategorySelect]);

  // 선택된 객체
  const currentBuilding = buildings.find(b => b.id === buildingId) || selectedBuilding;
  const currentCategory = categories.find(c => c.id === categoryId) || selectedCategory;

  return (
    <div style={{
      position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
      background: 'white', border: '2px solid #b0c4d6', borderRadius: 20,
      boxShadow: '0 4px 18px #0002', padding: '18px 20px 8px 20px', zIndex: 3001,
      maxWidth: 480, minWidth: 300, width: '94vw', minHeight: 120,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <style>{`
        .spot-slider::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* 위치, 이름 입력 */}
      <div style={{fontSize: 13, color: '#379e6b', marginBottom: 7, fontWeight: 500}}>
        위치: <span style={{fontWeight:600}}>{center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
      </div>
      <input
        placeholder="스팟 이름"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{
          width:'92%', fontSize:15, padding: '9px 12px', border:'1.2px solid #b0c4d6',
          borderRadius:9, marginBottom: step === 1 ? 16 : 9, outline:'none',
          boxShadow:'0 1px 4px #0001', transition:'border 0.2s'
        }}
      />
      {/* === 1단계: 건물 선택 (슬라이드) === */}
      {step === 1 && (
        <>
          <div style={{fontWeight:700, fontSize:16, marginBottom: 2, alignSelf:'flex-start'}}>건물 선택</div>
          <div className="spot-slider" style={{
            width:'100%', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
            overflowX: 'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none',
            gap: 8, padding: '2px 0 6px 0', marginBottom: 7,
            scrollbarWidth: 'none'
          }}>
            {buildings.map(b => (
              <div
                key={b.id}
                onClick={() => { setBuildingId(b.id); setStep(2); if(onBuildingSelect) onBuildingSelect(b); }}
                style={{
                  minWidth: 54, maxWidth: 54, minHeight: 72, borderRadius: 11, flexShrink: 0,
                  border: buildingId === b.id ? '2.5px solid #1a9ad6' : '1.2px solid #bbb',
                  background: buildingId === b.id ? '#f1fafd' : '#fcfcfc',
                  boxShadow: buildingId === b.id ? '0 0 8px #8be6ff33' : 'none',
                  cursor: 'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
                }}
              >
                <img src={b.iconUrl} alt={b.name} style={{width:54, height:54, margin:'0'}} />
                <span style={{
                  marginTop:4, fontSize:12, fontWeight:buildingId === b.id ? 700 : 400, color:'#444', maxWidth: 54, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                }}>{b.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {/* === 2단계: 카테고리 선택 === */}
      {step === 2 && currentBuilding && (
        <>
          <div style={{width:'100%', display:'flex', alignItems:'center', marginBottom:6, gap: 8}}>
            <button onClick={() => { setStep(1); setCategoryId(''); if(onCategorySelect) onCategorySelect(null); }} style={{
              fontSize:13, color:'#1a9ad6', background:'none', border:'none', cursor:'pointer'
            }}>← 건물 다시 선택</button>
          </div>
          <div style={{fontWeight:700, fontSize:16, marginBottom: 2, alignSelf:'flex-start'}}>카테고리 선택</div>
          <div className="spot-slider" style={{
            width:'100%', display:'flex', flexDirection: 'row', flexWrap: 'nowrap',
            overflowX:'auto', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none',
            gap:8, padding:'0 0 6px 0', marginBottom: 6,
            scrollbarWidth: 'none'
          }}>
            {categories.map(c => (
              <div
                key={c.id}
                onClick={() => { setCategoryId(c.id); if(onCategorySelect) onCategorySelect(c); }}
                style={{
                  minWidth:54, maxWidth:56, minHeight:60, borderRadius:14, flexShrink:0,
                  border: categoryId === c.id ? '2.5px solid #8ac421' : '1.2px solid #bbb',
                  background: categoryId === c.id ? '#f6fcf2' : '#fcfcfc',
                  boxShadow: categoryId === c.id ? '0 0 10px #abf78b77' : 'none',
                  display:'flex', flexDirection:'column', alignItems:'center',
                  cursor:'pointer', transition:'border 0.18s'
                }}
              >
                <img src={c.iconUrl} alt={c.name} style={{width:36, height:36, margin:'10px 0 4px 0'}} />
                <span style={{fontSize:13, fontWeight:categoryId === c.id ? 700 : 400, color:'#333', marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
          <div style={{textAlign:'center', marginTop:8, width:'100%'}}>
            <button
              onClick={() => {
                if (name && buildingId && categoryId) onSubmit({ name, buildingId, categoryId });
              }}
              style={{
                background: '#1a9ad6', color: 'white', border: 'none',
                padding: '9px 32px', borderRadius: 9, fontWeight: 'bold', fontSize: 15, marginRight: 10,
                boxShadow:'0 2px 10px #32b0ff22', cursor:'pointer'
              }}
              disabled={!(name && buildingId && categoryId)}
            >등록</button>
            <button onClick={onClose} style={{
              background: '#fff', color: '#1a9ad6', border: '1.5px solid #b0c4d6',
              padding: '9px 28px', borderRadius: 9, fontWeight: 'bold', fontSize: 15, cursor:'pointer'
            }}>닫기</button>
          </div>
        </>
      )}
      {/* 닫기(취소) 버튼만, 1단계 하단 */}
      {step === 1 && (
        <div style={{textAlign:'center', marginTop:12, width:'100%'}}>
          <button onClick={onClose} style={{
            background: '#fff', color: '#1a9ad6', border: '1.2px solid #b0c4d6',
            padding: '8px 18px', borderRadius: 7, fontWeight: 'bold', fontSize: 13, cursor:'pointer'
          }}>닫기</button>
        </div>
      )}
    </div>
  );
}

export default SpotForm;