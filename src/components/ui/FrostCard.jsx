// src/components/ui/FrostCard.jsx
export default function FrostCard({children, as:Tag="div", style={}, ...rest}){
  return (
    <Tag
      style={{
        background: "var(--sb-card)",
        backdropFilter: "var(--sb-blur)",
        WebkitBackdropFilter: "var(--sb-blur)",
        borderRadius: "var(--sb-radius-lg)",
        boxShadow: "var(--sb-shadow)",
        border: "1px solid var(--sb-stroke)",
        padding: 16,
        ...style
      }}
      {...rest}
    >{children}</Tag>
  );
}