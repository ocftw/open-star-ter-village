import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

import { remark } from 'remark';
import html from 'remark-html';

const cardsDirectory = join(process.cwd(), '_cards');

/**
 * lang ISO language and locale string
 * e.g. 'zh-tw', 'en', 'en-us', ...
 */
function getCardDirectoryPath(lang) {
  // return language folder path
  return join(cardsDirectory, lang);
}

export async function fetchCards(lang) {
  const cardsDirectory = getCardDirectoryPath(lang);
  const filesInCards = fs.readdirSync(cardsDirectory);

  const cards = filesInCards.map(async (filename) => {
    const fullPath = join(cardsDirectory, filename);
    const file = fs.readFileSync(fullPath, 'utf8');
    const matterFile = matter(file);
    const { data, content } = matterFile;

    const processedContent = await remark().use(html).process(content);
    const contentHtml = processedContent.toString();

    return {
      frontMatter: data,
      content: contentHtml,
    };
  });

  return Promise.all(cards);
}
