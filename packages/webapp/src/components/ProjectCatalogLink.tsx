'use client';

import type { CSSProperties, ReactNode } from 'react';
import { trackProjectCatalogInterest } from '@/lib/analytics';

const PROJECT_CATALOG_URL = 'https://openstartervillage.ocf.tw/cards';

export default function ProjectCatalogLink({
  placement,
  children,
  className,
  style,
}: {
  placement: 'header' | 'game_over';
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <a
      href={PROJECT_CATALOG_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => trackProjectCatalogInterest(placement)}
      data-testid={`project-catalog-${placement}`}
    >
      {children}
    </a>
  );
}
