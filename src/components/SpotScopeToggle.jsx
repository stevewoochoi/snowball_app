import styles from './SpotScopeToggle.module.css';

export default function SpotScopeToggle({ scope, onChange, disabled }) {
  const options = [
    { value: "PRIVATE", label: "비공개" },
    { value: "FRIENDS", label: "친구공개" },
    { value: "PUBLIC", label: "전체공개" }
  ];
  return (
    <div className={styles.scopeToggleWrap}>
      {options.map(opt => (
        <button
          key={opt.value}
          className={`${styles.scopeBtn} ${scope === opt.value ? styles.selected : ""}`}
          onClick={() => !disabled && scope !== opt.value && onChange(opt.value)}
          disabled={disabled || scope === opt.value}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}