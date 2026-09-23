import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { processCard } from '../utils/processCard';
import type { Card, CardFrontMatter, RawCard } from '../../types/content';

const cardsDirectory = join(process.cwd(), '_cards');

/**
 * lang ISO language and locale string
 * e.g. 'zh-Hant', 'en', 'en-us', ...
 */
function getCardDirectoryPath(lang: string) {
  // return language folder path
  return join(cardsDirectory, lang);
}

export function fetchAllCards(lang: string): Card[] {
  const cardsDirectory = getCardDirectoryPath(lang);
  const filesInCards = fs.readdirSync(cardsDirectory);

  const cards = filesInCards.map((filename): RawCard => {
    const fullPath = join(cardsDirectory, filename);
    const file = fs.readFileSync(fullPath, 'utf8');
    const matterFile = matter(file);
    const { data, content } = matterFile;

    return { data: data as CardFrontMatter, content };
  });

  return cards.map((card) => processCard(card, cards));
}
