import type { Card, ImageTextHighlight, SectionColumn } from './content';

export type BannerProps = {
  id: string;
  title: string;
  subtitle?: string;
  heroImage: string;
  highlights?: string[];
};

export type HeadlineProps = {
  id: string;
  title: string;
  subtitle?: string;
};

export type ImageAndTextProps = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  content?: string;
  highlights?: ImageTextHighlight[];
  markdown?: boolean;
};

export type CtaBannerProps = {
  id: string;
  title: string;
  content?: string;
  ctaLabel: string;
  ctaUrl: string;
  analyticsId: string;
  openInNewTab?: boolean;
};

export type SectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  content?: string;
  markdown?: boolean;
};

export type ColumnsProps = {
  id: string;
  title: string;
  columns: SectionColumn[];
  markdown?: boolean;
};

export type CardsProps = {
  id: string;
  title: string;
  cards: Card[];
};
