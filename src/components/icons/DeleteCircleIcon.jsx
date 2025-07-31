// src/components/icons/DeleteCircleIcon.jsx
function DeleteCircleIcon({ size = 32, color = "#fff", bg = "#e8443e", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={style} fill="none">
      <circle cx="16" cy="16" r="16" fill={bg} />
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <rect x="11" y="14" width="10" height="8" rx="2" />
        <path d="M13.5 14V12.5a2.5 2.5 0 0 1 5 0V14" />
        <path d="M12.5 17.5v2m3-2v2m3-2v2" />
      </g>
      {/* 뚜껑 */}
      <rect x="10.5" y="13" width="11" height="1.2" rx="0.5" fill={color} opacity="0.85" />
    </svg>
  );
}
export default DeleteCircleIcon;