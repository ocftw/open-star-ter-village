import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { PageFrontMatter } from '../../types/content';

const pagesDirectory = join(process.cwd(), '_pages');

function getPageFilePath(lang: string, page: string) {
  return join(pagesDirectory, lang, `${page}.md`);
}

export function fetchPage(lang: string, page: string) {
  try {
    const filePath = getPageFilePath(lang, page);

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContent);

    return {
      data: data as PageFrontMatter,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}
