export type ChevronDirection = 'left' | 'right' | 'up' | 'down';

export type DoubleChevronProps = {
  direction: ChevronDirection;
  /** Rendered width and height in px. */
  size?: number;
  className?: string;
};

const ROTATION: Record<ChevronDirection, number> = { right: 0, down: 90, left: 180, up: 270 };

/**
 * Figma UI原則 IconButton glyph: a double chevron (》 ︾ 《 ︽). One right-pointing
 * path rotated about the centre of a square viewBox, so every direction shares
 * the same optical centre. Decorative; the owning button supplies the name.
 */
export default function DoubleChevron({ direction, size = 20, className }: DoubleChevronProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-direction={direction}
      style={{ display: 'block', transform: `rotate(${ROTATION[direction]}deg)` }}
    >
      <path d="M3 4 L9 10 L3 16" />
      <path d="M11 4 L17 10 L11 16" />
    </svg>
  );
}
