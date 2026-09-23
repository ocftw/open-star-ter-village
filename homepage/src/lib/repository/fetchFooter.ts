import fs from 'fs';
import { join } from 'path';
import type { Footer } from '../../types/content';

type RawFooter = {
  links: {
    display_text: string;
    url: string;
    analytics_id?: string;
    locale_independent?: boolean;
  }[];
  logos: {
    title: string;
    image_url: string;
    alt_text: string;
    link_url: string;
  }[];
};

const FOOTER_FOLDER = '_footer';

export function fetchFooter(lang: string) {
  const filePath = join(process.cwd(), FOOTER_FOLDER, lang, 'footer.json');

  const file = fs.readFileSync(filePath, 'utf8');

  const rawFooter: RawFooter = JSON.parse(file).footer;
  const footer: Footer = {
    links: rawFooter.links.map((link) => ({
      displayText: link.display_text,
      url: link.url,
      ...(link.analytics_id ? { analyticsId: link.analytics_id } : {}),
      ...(link.locale_independent ? { localeIndependent: true } : {}),
    })),
    logos: rawFooter.logos.map((logo) => ({
      title: logo.title,
      imageUrl: logo.image_url,
      altText: logo.alt_text,
      linkUrl: logo.link_url,
    })),
  };
  return footer;
}
