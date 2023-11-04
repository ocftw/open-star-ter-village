import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { processCard } from './processCard';

const cardsDirectory = join(process.cwd(), '_cards');

/**
 * lang ISO language and locale string
 * e.g. 'zh-tw', 'en', 'en-us', ...
 */
function getCardDirectoryPath(lang) {
  // return language folder path
  return join(cardsDirectory, lang);
}

export function fetchAllCards(lang) {
  const cardsDirectory = getCardDirectoryPath(lang);
  const filesInCards = fs.readdirSync(cardsDirectory);

  const cards = filesInCards.map((filename) => {
    const fullPath = join(cardsDirectory, filename);
    const file = fs.readFileSync(fullPath, 'utf8');
    const matterFile = matter(file);
    const { data, content } = matterFile;

    return { data, content };
  });

  return cards.map((card) => processCard(card, cards));
}
