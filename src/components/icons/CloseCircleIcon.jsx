// src/components/icons/CloseCircleIcon.jsx
function CloseCircleIcon({ size = 44, color = "#222", background = "#fff", shadow = true, style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      style={{
        ...style,
        boxShadow: shadow ? "0 2px 16px #2222" : undefined,
        borderRadius: "50%",
        background,
        display: "block",
      }}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="22" cy="22" r="21" fill={background} stroke="#dedede" strokeWidth="2" />
      <path
        d="M16 16l12 12M28 16l-12 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default CloseCircleIcon;