function DragFingerIcon({ size = 28, color = "#197ad6", bg = "#eaf7fe", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="14" fill={bg} />
      <path d="M10.5 13V8.5a2 2 0 1 1 4 0V13M14.5 13V10a2 2 0 1 1 4 0v5.5c0 2.5-1.5 4.5-4.5 4.5-2 0-2.5-1-2.5-2.5v-3.5" 
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* 움직임 점선/화살표 */}
      <path d="M9 17.5c1 1 2 2 5 2s4-1 5-2" stroke="#8ac421" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}
export default DragFingerIcon;