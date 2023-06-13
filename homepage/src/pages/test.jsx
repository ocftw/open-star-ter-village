import fs from "fs";
import matter from "gray-matter";

export async function getStaticProps() {
  // const filesInCards = fs.readdirSync("../../_cards/zh-tw");

  const card = fs.readFileSync("../../_cards/zh-tw/firebox.md", "utf8");

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

const test = () => {
  return <div>test</div>;
};

export default test;
