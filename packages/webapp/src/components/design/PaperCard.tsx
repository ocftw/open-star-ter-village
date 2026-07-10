import { CSSProperties, HTMLAttributes } from 'react';

type PaperCardProps = HTMLAttributes<HTMLDivElement> & {
  /** Inner padding; the mock varies this per surface, so it is a prop */
  padding?: CSSProperties['padding'];
};

export default function PaperCard({
  padding = 18,
  className,
  style,
  ...divProps
}: PaperCardProps) {
  const classes = ['paper-card', className].filter(Boolean).join(' ');
  return <div className={classes} style={{ padding, ...style }} {...divProps} />;
}
