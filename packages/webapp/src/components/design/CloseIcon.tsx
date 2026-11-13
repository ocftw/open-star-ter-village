/** Inline × for close controls; same grid-centred SVG approach as DoubleChevron. */
export default function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <path d="M2 2 L12 12 M12 2 L2 12" />
    </svg>
  );
}
