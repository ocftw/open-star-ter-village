import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const pagesDirectory = join(process.cwd(), '_pages');

function getPagesDirectoryPath(lang) {
  return join(pagesDirectory, lang);
}

export function fetchAllPages(lang) {
  const pagesDirectory = getPagesDirectoryPath(lang);
  const filesInPages = fs.readdirSync(pagesDirectory);

  const pagesList = filesInPages.map((filename) => {
    const fullPath = join(pagesDirectory, filename);
    const file = fs.readFileSync(fullPath, 'utf8');
    const matterFile = matter(file);
    const { data, content } = matterFile;

    return {
      data,
    };
  });

  return pagesList;
}

export async function getNavigationList(lang) {
  const pagesList = fetchAllPages(lang);

  // * dynamic page navigation
  const navigationList = pagesList
    .filter((page) => page.path && page.name)
    .sort((a, b) => a.order - b.order)
    .map((page) => {
      page.path = page.path.replace('index', '');
      return { link: `/${page.path}`, text: page.name };
    });

  return navigationList;
}
