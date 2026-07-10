import { InputHTMLAttributes, ReactNode, useId } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Bilingual label, e.g. "玩家名稱 · Player name" */
  label: string;
  /** Muted helper or error text below the input */
  helper?: ReactNode;
  error?: boolean;
};

export default function Field({ label, helper, error = false, ...inputProps }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label className="en-cap" htmlFor={id} style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        style={{
          width: '100%',
          padding: '10px 14px',
          background: 'white',
          border: `1.5px solid ${error ? 'var(--orange-deep)' : 'var(--ink)'}`,
          borderRadius: 10,
          fontSize: 14,
          fontFamily: 'var(--font-zh)',
          boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.04)',
          outline: 'none',
          ...inputProps.style,
        }}
      />
      {helper && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: error ? 'var(--orange-deep)' : 'var(--ink-mute)',
          }}
        >
          {helper}
        </div>
      )}
    </div>
  );
}
