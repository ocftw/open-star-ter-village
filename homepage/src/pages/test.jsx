import Image from "next/image";

import Head from "next/head";
import Base from "../layouts/base";
import ThreeColumns from "../components/threeColumns";

import { fetchCards } from "../lib/fetchCards";

const navigationList = [
  { link: `#page-top`, text: `回到頁首` },
  { link: `#cards-intro`, text: `卡片介紹` },
  { link: `/campaign`, text: `活動頁` },
  { link: `/`, text: `首頁` },
];

const getSupportLanguages = () => {
  return ["en", "zh-tw"];
};

export const getStaticProps = async () => {
  const lang = "zh-tw";
  const cards = await fetchCards(lang);

  const updatedCards = cards.map((card) => {
    const updatedImage = card.frontMatter.image
      ? card.frontMatter.image.replace("/homepage/public", "")
      : "";

    return {
      ...card,
      frontMatter: {
        ...card.frontMatter,
        image: updatedImage,
      },
    };
  });

  return {
    props: { cards: updatedCards },
  };
};

const test = ({ cards }) => {
  return (
    <Base nav={navigationList}>
      <ThreeColumns
        id={`cards-intro`}
        title={`卡片介紹`}
        columns={cards.map((card) => [
          card.frontMatter.title,
          `
            <img src=${card.frontMatter.image} alt=${card.frontMatter.title}>
            <strong>${card.frontMatter.description}</strong>
            <div>${card.content}</div>
            `,
        ])}
      />

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
          <div>
            content: <div dangerouslySetInnerHTML={{ __html: card.content }} />
          </div>
          <br />
        </div>
      ))}
    </Base>
  );
};

export default test;
