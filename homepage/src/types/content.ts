export type CardType = 'job' | 'event' | 'project';

export type CardColor = {
  avatar?: string;
  background?: string;
  border?: string;
};

export type CardFrontMatter = {
  id?: string;
  title: string;
  description?: string;
  image?: string;
  draft?: boolean;
  type: CardType;
  tags: string[];
};

export type RawCard = {
  data: CardFrontMatter;
  content: string;
};

export type CardData = CardFrontMatter & {
  id: string;
  image: string;
  color?: CardColor;
  avatarList?: Card[];
};

export type Card = {
  data: CardData;
  content: string;
};

export type ImageTextHighlight = {
  item: string;
  description: string;
};

export type SectionColumn = {
  title?: string;
  image?: string;
  text?: string;
};

export type BannerLayout = {
  type: 'layout_banner';
  title: string;
  subtitle?: string;
  hero_image: string;
  highlights?: string[];
};

export type HeadlineLayout = {
  type: 'layout_headline';
  title: string;
  subtitle?: string;
};

export type ImageTextLayout = {
  type: 'layout_image_text';
  title: string;
  subtitle?: string;
  image?: string;
  text?: string;
  highlights?: ImageTextHighlight[];
};

export type CtaBannerLayout = {
  type: 'layout_cta_banner';
  title: string;
  text?: string;
  cta_label: string;
  cta_url: string;
  analytics_id: string;
  open_in_new_tab?: boolean;
};

export type SectionLayout = {
  type: 'layout_section';
  title: string;
  columns?: SectionColumn[];
};

export type CardsLayout = {
  type: 'layout_cards';
  title: string;
  card_type?: CardType;
  card_tags?: string[];
};

export type PageLayout =
  | BannerLayout
  | HeadlineLayout
  | ImageTextLayout
  | CtaBannerLayout
  | SectionLayout
  | CardsLayout;

export type PageFrontMatter = {
  unique_slug?: string;
  name?: string;
  page_order?: number;
  layout_list?: PageLayout[];
};

export type NavigationItem = {
  link: string;
  text: string;
  subNavigation: {
    link: string;
    text: string;
    level: number;
  }[];
};

export type FooterLink = {
  displayText: string;
  url: string;
  analyticsId?: string;
};

export type FooterLogo = {
  title: string;
  imageUrl: string;
  altText: string;
  linkUrl: string;
};

export type Footer = {
  links: FooterLink[];
  logos: FooterLogo[];
};

export type Layout = {
  header: {
    navigation: NavigationItem[];
  };
  footer: Footer;
};

export type SiteData = {
  title: string;
  description: string;
  logo: string;
};

export type HeadInfo = {
  title: string;
  description: string;
};

export type AssetsByLocale = Record<
  string,
  {
    locale: string;
    cards: Card[];
  }
>;
