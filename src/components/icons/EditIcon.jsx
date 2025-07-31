// src/components/icons/EditIcon.jsx
function EditIcon({ size = 26, color = "#197ad6", style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="26" height="26" rx="8" fill="#f7fafd"/>
      <path d="M7.8 17.2l7.7-7.7c.3-.3.8-.3 1.1 0l1.2 1.2c.3.3.3.8 0 1.1l-7.7 7.7c-.2.2-.5.3-.7.2l-2.1-.6c-.4-.1-.6-.5-.5-.8l.6-2.1c0-.2.1-.4.2-.5zm9.4-6.1l-1.1-1.1 1.3-1.3c.2-.2.6-.2.8 0l.3.3c.2.2.2.6 0 .8l-1.3 1.3z" stroke={color} strokeWidth="1.5" fill="none"/>
    </svg>
  );
}
export default EditIcon;