import type { HeadlineProps } from '../types/components';

const Headline = ({ id, title, subtitle }: HeadlineProps) => (
  <div className="headline" id={id}>
    <h1>{title}</h1>
    <span>{subtitle}</span>
  </div>
);

export default Headline;
