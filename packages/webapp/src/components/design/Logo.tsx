type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
};

const STAR_BOX: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 26,
  md: 32,
  lg: 44,
};

export default function Logo({ size = 'md' }: LogoProps) {
  const box = STAR_BOX[size];
  const big = size === 'lg';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: box,
          height: box,
          background: 'var(--orange)',
          border: '2px solid var(--ink)',
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 3px 0 var(--ink)',
          transform: 'rotate(-4deg)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-en)',
            fontWeight: 900,
            color: 'white',
            fontSize: big ? 24 : 18,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div
          style={{
            fontFamily: 'var(--font-zh)',
            fontWeight: 900,
            fontSize: big ? 22 : 16,
            color: 'var(--ink)',
          }}
        >
          開源星手村
        </div>
        <div
          style={{
            fontFamily: 'var(--font-en)',
            fontSize: big ? 11 : 9,
            color: 'var(--ink-mute)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}
        >
          Open StarTer Village
        </div>
      </div>
    </div>
  );
}
