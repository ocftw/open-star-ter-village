import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

// import { remark } from 'remark';
// import html from 'remark-html';

const pagesDirectory = join(process.cwd(), '_pages');

function getPageFilePath(lang, page) {
  return join(pagesDirectory, lang, `${page}.md`);
}

export function fetchPage(lang, page) {
  try {
    const filePath = getPageFilePath(lang, page);

    // ? How to determine to use fs.readFile or fs.readFileSync?

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);

    return {
      data,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }

  /*
  // use fs.readFile instead of fs.readFileSync will get error
  try {
    const filePath = getPageFilePath(lang, page);

    fs.readFile(filePath, 'utf8', (error, fileContent) => {
      if (error) {
        console.error(error);
        throw error;
      }

      const { data, content } = matter(fileContent);

      return {
        data,
      };
    });
  } catch (error) {
    console.log(error);
    throw error;
  }

  // Uncaught Error: Error serializing `.page` returned from `getStaticProps` in "/resource".
  // Reason: `undefined` cannot be serialized as JSON. Please use `null` or omit this value.
 */
}
