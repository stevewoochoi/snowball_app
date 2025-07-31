// src/components/icons/DeleteIcon.jsx
function DeleteIcon({ size = 22, color = "#e8443e", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="22" height="22" rx="7" fill="#fbeaea"/>
      <path d="M8.2 8.9v5.1m2.8-5.1v5.1M5 8.3h12M9 5.7h4c.3 0 .5.2.5.5V7H8.5V6.2c0-.3.2-.5.5-.5zm7 1.6v9c0 .6-.5 1-1 1H7c-.6 0-1-.5-1-1v-9" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
export default DeleteIcon;