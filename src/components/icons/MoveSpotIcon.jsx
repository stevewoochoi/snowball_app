function MoveSpotIcon({ size = 28, color = "#197ad6", bg = "#eaf7fe", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="14" fill={bg} />
      <g stroke={color} strokeWidth="2" strokeLinecap="round">
        {/* 위 */}
        <path d="M14 6v8" />
        <polyline points="14,6 11,9 17,9 14,6" fill={color} />
        {/* 아래 */}
        <path d="M14 14v8" />
        <polyline points="14,22 11,19 17,19 14,22" fill={color} />
        {/* 왼쪽 */}
        <path d="M6 14h8" />
        <polyline points="6,14 9,11 9,17 6,14" fill={color} />
        {/* 오른쪽 */}
        <path d="M14 14h8" />
        <polyline points="22,14 19,11 19,17 22,14" fill={color} />
      </g>
      {/* 중앙 원 (잡기 손잡이 느낌) */}
      <circle cx="14" cy="14" r="3.5" fill="#fff" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}

export default MoveSpotIcon;