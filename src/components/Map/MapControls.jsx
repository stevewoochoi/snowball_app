function MapControls({ onCurrentLocation, onSeoulCityHall, onMyeongdong, onSearch }) {
  return (
    <>
      {/* 우측 상단 컨트롤 버튼 */}
      <div style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={onCurrentLocation}
          style={{
            padding: '6px 10px',
            background: '#000',
            color: '#fff',
            border: '1px solid #fff',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
          }}
        >
          내 위치
        </button>
        <button
          onClick={onSeoulCityHall}
          style={{
            padding: '6px 10px',
            background: '#000',
            color: '#fff',
            border: '1px solid #fff',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
          }}
        >
          서울시청
        </button>
        <button
          onClick={onMyeongdong}
          style={{
            padding: '6px 10px',
            background: '#000',
            color: '#fff',
            border: '1px solid #fff',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
          }}
        >
          명동역
        </button>
      </div>
      {/* 좌측 하단 검색 버튼 */}
      {/* <button
        onClick={onSearch}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 9999,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer'
        }}
        aria-label="검색"
      >
        <img
          src="/button/btn_searchbutton2.png"
          alt="검색"
          style={{ width: 70, height: 70, filter: 'drop-shadow(0 3px 12px #0002)' }}
        />
      </button> */}
    </>
  );
}

export default MapControls;