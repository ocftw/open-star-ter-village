import { ButtonHTMLAttributes } from 'react';

type StickerButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Visual treatment: default is the solid orange CTA */
  variant?: 'primary' | 'ghost' | 'teal' | 'dark';
  size?: 'sm' | 'md';
};

export default function StickerButton({
  variant = 'primary',
  size = 'md',
  className,
  ...buttonProps
}: StickerButtonProps) {
  const classes = [
    'btn-sticker',
    variant !== 'primary' ? variant : null,
    size === 'sm' ? 'sm' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button className={classes} {...buttonProps} />;
}
