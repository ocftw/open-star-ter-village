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

  const title = {
    en: 'Card Introduction',
    'zh-tw': '卡片介紹',
  };

  const backToTop = {
    en: 'Back to top',
    'zh-tw': '回到頁首',
  };

  const projectCard = {
    en: 'Project Card',
    'zh-tw': '專案卡',
  };

  const jobCard = {
    en: 'Job Card',
    'zh-tw': '人力卡',
  };

  const eventCard = {
    en: 'Event Card',
    'zh-tw': '事件卡',
  };

  const campaign = {
    en: 'Campaign',
    'zh-tw': '活動頁',
  };

  const homepage = {
    en: 'Home',
    'zh-tw': '首頁',
  };

  const navigationList = [
    { link: `#page-top`, text: backToTop[locale] },
    { link: `#project-cards`, text: projectCard[locale] },
    { link: `#job-cards`, text: jobCard[locale] },
    { link: `#event-cards`, text: eventCard[locale] },
    { link: `/campaign`, text: campaign[locale] },
    { link: `/`, text: homepage[locale] },
  ];

  return {
    props: {
      cards: updatedCards,
      navigationList,
      title: title[locale],
      projectCard: projectCard[locale],
      jobCard: jobCard[locale],
      eventCard: eventCard[locale],
    },
  };
};

const cards = ({
  cards,
  navigationList,
  title,
  projectCard,
  jobCard,
  eventCard,
}) => {
  return (
    <Base nav={navigationList}>
      <Headline title={title} />
      <CardsColumns
        id={`project-cards`}
        title={projectCard}
        cards={cards}
        type={`project`}
      />
      <CardsColumns
        id={`job-cards`}
        title={jobCard}
        cards={cards}
        type={`job`}
      />
      <CardsColumns
        id={`event-cards`}
        title={eventCard}
        cards={cards}
        type={`event`}
      />
    </Base>
  );
};

export default cards;
