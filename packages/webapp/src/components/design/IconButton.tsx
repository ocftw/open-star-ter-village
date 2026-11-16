import { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Accessible name; icon-only buttons have no visible text. */
  label: string;
  /** Decorative icon; hidden from assistive tech. */
  children: ReactNode;
};

/**
 * Figma UI原則 IconButton (Property 1 = Default / Hover). The Hover frame is
 * rendered by CSS `:hover` and `:focus-visible`, not by a prop.
 */
export default function IconButton({
  label,
  children,
  type = 'button',
  className,
  ...buttonProps
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={['gr-icon-btn', className].filter(Boolean).join(' ')}
      {...buttonProps}
    >
      <span aria-hidden="true" className="gr-icon-btn__icon">
        {children}
      </span>
    </button>
  );
}
