import Base from "../layouts/base";
import CardsColumns from "../components/cardsColumns";

import { fetchCards } from "../lib/fetchCards";

const navigationList = [
  { link: `#page-top`, text: `回到頁首` },
  { link: `#project-cards`, text: `專案卡` },
  { link: `#job-cards`, text: `人力卡` },
  { link: `#force-cards`, text: `源力卡` },
  { link: `#event-cards`, text: `事件卡` },
  { link: `/campaign`, text: `活動頁` },
  { link: `/`, text: `首頁` },
];

const getSupportLanguages = () => {
  return ["en", "zh-tw"];
};

export const getStaticProps = async () => {
  const lang = "zh-tw";
  const cards = await fetchCards(lang);

  // Get correct image path
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

const cards = ({ cards }) => {
  return (
    <Base nav={navigationList}>
      <CardsColumns
        id={`project-cards`}
        title={`專案卡`}
        cards={cards}
        type={`project`}
      />
      <CardsColumns
        id={`job-cards`}
        title={`人力卡`}
        cards={cards}
        type={`job`}
      />
      <CardsColumns
        id={`force-cards`}
        title={`源力卡`}
        cards={cards}
        type={`force`}
      />
      <CardsColumns
        id={`event-cards`}
        title={`事件卡`}
        cards={cards}
        type={`event`}
      />
    </Base>
  );
};

export default cards;
