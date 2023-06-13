import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const cardsDirectory = join(process.cwd(), '_cards')

export async function fetchCard() {
  // const filesInCards = fs.readdirSync("../../_cards/zh-tw");

  const fullPath = join(cardsDirectory, 'zh-tw', 'firebox.md')

  const card = fs.readFileSync(fullPath, "utf8");
  return matter(card)

  // Get the front matter and slug (the filename without .md) of all files
  const cards = filesInCards.map((filename) => {
    const file = fs.readFileSync(`../../_cards/zh-tw${filename}`, "utf8");
    const matterData = matter(file);

    return matterData.data;

    // return {
    //   ...matterData.data, // matterData.data contains front matter
    //   slug: filename.slice(0, filename.indexOf(".")),
    // };
  });

  // return {
  //   props: {
  //     cards
  //   }
  // }
}
