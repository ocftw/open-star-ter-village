import { ButtonHTMLAttributes } from 'react';

export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonVariant = 'primary' | 'sec' | 'tri';

/**
 * Figma UI原則 Button matrix (110:828): Small / Medium / Large ×
 * Primary / Sec / Tri. Small ships Primary and Sec only, so the type
 * rejects `size="small" variant="tri"`.
 */
type ButtonMatrix =
  | { size: 'small'; variant?: Exclude<ButtonVariant, 'tri'> }
  | { size?: Exclude<ButtonSize, 'small'>; variant?: ButtonVariant };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonMatrix;

export default function Button({
  size = 'medium',
  variant = 'primary',
  type = 'button',
  className,
  ...buttonProps
}: ButtonProps) {
  const classes = ['gr-btn', `gr-btn--${size}`, `gr-btn--${variant}`, className]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} {...buttonProps} />;
}
