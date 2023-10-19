import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const pagesDirectory = join(process.cwd(), '_pages');

function getPageFilePath(lang, page) {
  return join(pagesDirectory, lang, `${page}.md`);
}

export function fetchPage(lang, page) {
  try {
    const filePath = getPageFilePath(lang, page);

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    return {
      data,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
