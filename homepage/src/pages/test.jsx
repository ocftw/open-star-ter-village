import Image from "next/image";
import { fetchCards } from "../lib/fetchCards";

const getSupportLanguages = () => {
  return ["en", "zh-tw"];
};

export const getStaticProps = async () => {
  const lang = "zh-tw";
  const cards = await fetchCards(lang);

  return {
    props: { cards },
  };
};

const test = ({ cards }) => {
  return (
    <>
      {cards.map((card) => (
        <div
          key={card.frontMatter.title}
          style={{ width: "40vw", margin: "0 auto" }}
        >
          <div>
            image:{" "}
            <Image
              src={card.frontMatter.image}
              width={500}
              height={500}
              alt={card.frontMatter.title}
            />
          </div>
          <div>title: {card.frontMatter.title}</div>
          <div>desc: {card.frontMatter.description}</div>
          <div>draft: {card.frontMatter.draft}</div>
          <div>type: {card.frontMatter.type}</div>
          {/* <div>content: {card.content}</div> */}
          <div>
            content: <div dangerouslySetInnerHTML={{ __html: card.content }} />
          </div>
          <br />
        </div>
      ))}
    </>
  );
};

export default test;
