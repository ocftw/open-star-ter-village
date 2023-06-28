import fs from "fs";
import { join } from "path";
import matter from "gray-matter";

const cardsDirectory = join(process.cwd(), "_cards");

/**
 * lang ISO language and locale string
 * e.g. 'zh-tw', 'en', 'en-us', ...
 */
function getCardDirectoryPath(lang) {
  // return language folder path
  return join(process.cwd(), "_cards", lang);
}

export async function fetchCards(lang) {
  const cardsDirectory = getCardDirectoryPath(lang);
  const filesInCards = fs.readdirSync(cardsDirectory);

  const cards = filesInCards.map((filename) => {
    const fullPath = join(cardsDirectory, filename);
    const file = fs.readFileSync(fullPath, "utf8");
    const matterData = matter(file);

    const { data, content } = matterData;

    return data;
  });

  return cards;
}
