import { useEffect, useState } from 'react';
import axios from 'axios';

// 모바일(iOS 포함)에서 팝업이 화면을 자연스럽게 차지하도록 레이아웃/폭 조정.
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
      // iPhone 15 Pro/모바일 대응: 폭, 여백, 위치, 버튼 크기 최적화
      position: 'fixed',
      top: '2vh', // 변경
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(255,255,255,0.82)',   // ⭐️ 반투명 흰색으로!
      // background: 'white',
      border: '2px solid #b0c4d6',
      borderRadius: 13, // ⭐️ 더 작게
      boxShadow: '0 4px 18px #0002',
      padding: '10px 3vw 8px 3vw', // 변경
      zIndex: 3001,
      maxWidth: '96vw',   // 변경
      minWidth: 0,   // 변경
      width: '92vw',   // 변경
      margin: '0 auto', // 추가
      minHeight: 70,   // ⭐️ 줄임 (변경)
      pointerEvents: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <style>{`
        @media (max-width: 600px) {
          .spot-slider {
            gap: 8px !important;
            scrollbar-width: none;
          }
          .spot-slider::-webkit-scrollbar {
            display: none;
          }
          .spot-slider > div {
            min-width: 52px !important;
            max-width: 56px !important;
          }
        }
        @media (max-width: 430px) {
          .spot-slider::-webkit-scrollbar { display: none; }
        }
      `}</style>
      {/* 위치, 이름 입력 */}
      {/* <div style={{fontSize: 12, color: '#379e6b', marginBottom: 4, fontWeight: 500}}>
        위치: <span style={{fontWeight:600}}>{center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
      </div> */}
      <input
        placeholder="스팟 이름"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{
          width:'96%', fontSize:16, padding: '10px 14px', border:'1.1px solid #b0c4d6',
          borderRadius:7, marginBottom: step === 1 ? 14 : 8, outline:'none',
          boxShadow:'0 1px 4px #0001', transition:'border 0.2s'
        }}
      />
      {/* === 1단계: 건물 선택 (슬라이드) === */}
      {step === 1 && (
        <>
          <div style={{fontWeight:600, fontSize:13, marginBottom: 2, alignSelf:'flex-start'}}>건물 선택</div>
          <div className="spot-slider" style={{
            width:'100%', display: 'flex', flexDirection: 'row', flexWrap: 'nowrap',
            overflowX: 'scroll', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none',
            gap: 8, padding: '0 0 4px 0', marginBottom: 7,
            scrollbarWidth: 'none'
          }}>
            {buildings.map(b => (
              <div
                key={b.id}
                onClick={() => { setBuildingId(b.id); setStep(2); if(onBuildingSelect) onBuildingSelect(b); }}
                style={{
                  minWidth: 52, maxWidth: 56, minHeight: 58, borderRadius: 8, flexShrink: 0,
                  border: buildingId === b.id ? '2px solid #1a9ad6' : '1.1px solid #bbb',
                  background: buildingId === b.id ? '#f1fafd' : '#fcfcfc',
                  boxShadow: buildingId === b.id ? '0 0 5px #8be6ff33' : 'none',
                  cursor: 'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
                }}
              >
                <img src={b.iconUrl} alt={b.name} style={{width:38, height:38, margin:'0'}} />
                <span style={{
                  marginTop:2, fontSize:13, fontWeight:buildingId === b.id ? 700 : 400, color:'#444', maxWidth: 56, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                }}>{b.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {/* === 2단계: 카테고리 선택 === */}
      {step === 2 && currentBuilding && (
        <>
          <div style={{fontWeight:600, fontSize:13, marginBottom: 2, alignSelf:'flex-start'}}>카테고리 선택</div>
          <div className="spot-slider" style={{
            width:'100%', display:'flex', flexDirection: 'row', flexWrap: 'nowrap',
            overflowX:'scroll', WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none',
            gap:8, padding:'6px 0 4px 0', marginBottom: 6,
            scrollbarWidth: 'none'
          }}>
            {categories.map(c => (
              <div
                key={c.id}
                onClick={() => { setCategoryId(c.id); if(onCategorySelect) onCategorySelect(c); }}
                style={{
                  minWidth:52, maxWidth:56, minHeight:46, borderRadius:8, flexShrink:0,
                  border: categoryId === c.id ? '2px solid #8ac421' : '1.1px solid #bbb',
                  background: categoryId === c.id ? '#f6fcf2' : '#fcfcfc',
                  boxShadow: categoryId === c.id ? '0 0 6px #abf78b77' : 'none',
                  display:'flex', flexDirection:'column', alignItems:'center',
                  cursor:'pointer', transition:'border 0.18s'
                }}
              >
                <img src={c.iconUrl} alt={c.name} style={{width:28, height:28, margin:'8px 0 3px 0'}} />
                <span style={{fontSize:13, fontWeight:categoryId === c.id ? 700 : 400, color:'#333', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'
                }}>
                  {c.name}
                </span>
              </div>
            ))}
          </div>
          <div style={{width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:7}}>
            <button onClick={() => { setStep(1); setCategoryId(''); if(onCategorySelect) onCategorySelect(null); }} style={{
              fontSize:11, color:'#1a9ad6', background:'none', border:'none', cursor:'pointer', padding: '3px 6px' // 버튼 크기 축소 (변경)
            }}>← 건물 다시 선택</button>
            <div>
              <button
                onClick={() => {
                  if (name && buildingId && categoryId) onSubmit({ name, buildingId, categoryId });
                }}
                style={{
                  background: '#1a9ad6', color: 'white', border: 'none',
                  padding: '5px 20px', borderRadius: 8, fontWeight: 'bold', fontSize: 12, marginLeft: 6,
                  boxShadow:'0 2px 7px #32b0ff22', cursor:'pointer'
                }}
                disabled={!(name && buildingId && categoryId)}
              >등록</button>
              <button onClick={onClose} style={{
                background: '#fff', color: '#1a9ad6', border: '1.2px solid #b0c4d6',
                padding: '5px 18px', borderRadius: 8, fontWeight: 'bold', fontSize: 12, cursor:'pointer', marginLeft: 6
              }}>닫기</button>
            </div>
          </div>
        </>
      )}
      {/* 닫기(취소) 버튼만, 1단계 하단 */}
      {step === 1 && (
        <div style={{textAlign:'center', marginTop:10, width:'100%'}}>
          <button onClick={onClose} style={{
            background: '#fff', color: '#1a9ad6', border: '1.2px solid #b0c4d6',
            padding: '5px 12px', borderRadius: 8, fontWeight: 'bold', fontSize: 11, cursor:'pointer'
          }}>닫기</button>
        </div>
      )}
    </div>
  );
}

export default SpotForm;