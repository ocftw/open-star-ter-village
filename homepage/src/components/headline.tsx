import React from 'react';
import type { HeadlineProps } from '../types/components';

const Headline: React.FC<HeadlineProps> = ({ id, title, subtitle }) => (
  <div className="headline" id={id}>
    <h1>{title}</h1>
    <span>{subtitle}</span>
  </div>
);

export default Headline;
