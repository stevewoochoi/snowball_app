// src/components/icons/CloseIcon.jsx
function CloseIcon({ size = 38, color = "#fff", bg = "rgba(30,30,30,0.82)", ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="19" cy="19" r="19" fill={bg} />
      <path
        d="M12.8 12.8l12.4 12.4M25.2 12.8L12.8 25.2"
        stroke={color}
        strokeWidth="2.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default CloseIcon;