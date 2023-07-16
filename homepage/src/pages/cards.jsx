import Base from '../layouts/base';
import Headline from '../components/headline';
import CardsColumns from '../components/cardsColumns';

import { fetchCards } from '../lib/fetchCards';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const cards = await fetchCards(locale);

  // Get correct image path
  const updatedCards = cards.map((card) => {
    const updatedImage = card.frontMatter.image
      ? card.frontMatter.image.replace('/homepage/public', '')
      : '/images/uploads/初階專案卡封面-01.png';

    return {
      ...card,
      frontMatter: {
        ...card.frontMatter,
        image: updatedImage,
      },
    };
  });

  const navigationList = [
    { link: `#page-top`, text: `回到頁首` },
    { link: `#project-cards`, text: `專案卡` },
    { link: `#job-cards`, text: `人力卡` },
    { link: `#event-cards`, text: `事件卡` },
    { link: `/campaign`, text: `活動頁` },
    { link: `/`, text: `首頁` },
  ];

  return {
    props: { cards: updatedCards, navigationList },
  };
};

const cards = ({ cards, navigationList }) => {
  return (
    <Base nav={navigationList}>
      <Headline title={`卡片介紹`} />
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
        id={`event-cards`}
        title={`事件卡`}
        cards={cards}
        type={`event`}
      />
    </Base>
  );
};

export default cards;
