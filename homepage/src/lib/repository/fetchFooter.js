import fs from 'fs';
import { join } from 'path';

const FOOTER_FOLDER = '_footer';

export function fetchFooter(lang) {
  const filePath = join(process.cwd(), FOOTER_FOLDER, lang, 'footer.json');

  const file = fs.readFileSync(filePath, 'utf8');

  const rawFooter = JSON.parse(file).footer;
  const footer = {
    links: rawFooter.links.map((link) => ({
      displayText: link.display_text,
      url: link.url,
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
