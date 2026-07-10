type SegmentedProps<T extends string | number> = {
  /** Bilingual label, e.g. "玩家人數 · Players" */
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

export default function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label}>
      <div className="en-cap" style={{ marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(option)}
              style={{
                flex: 1,
                padding: '8px 0',
                background: selected ? 'var(--ink)' : 'white',
                color: selected ? 'white' : 'var(--ink)',
                border: '1.5px solid var(--ink)',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 13,
                fontFamily: 'var(--font-en)',
                boxShadow: selected ? 'none' : '0 2px 0 var(--ink)',
                transform: selected ? 'translateY(2px)' : 'none',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
