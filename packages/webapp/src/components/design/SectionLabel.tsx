type SectionLabelProps = {
  /** Primary zh-Hant label */
  zh: string;
  /** Secondary English caption, rendered in caps */
  en: string;
  /** Optional muted helper text below the labels */
  hint?: string;
  /** Bigger zh type for page-level sections */
  big?: boolean;
};

export default function SectionLabel({ zh, en, hint, big = false }: SectionLabelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          style={{
            fontWeight: 800,
            fontSize: big ? 18 : 14,
            color: 'var(--ink)',
          }}
        >
          {zh}
        </span>
        <span className="en-cap">{en}</span>
      </div>
      {hint && (
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.4 }}>{hint}</div>
      )}
    </div>
  );
}
