import Head from 'next/head';
import Base from '../layouts/base';
import Headline from '../components/headline';
import CardsGrid from '../components/cardsGrid';

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

  const projectCardTitle = {
    en: 'Project Card',
    'zh-tw': '專案卡',
  };

  const jobCardTitle = {
    en: 'Job Card',
    'zh-tw': '人力卡',
  };

  const eventCardTitle = {
    en: 'Event Card',
    'zh-tw': '事件卡',
  };

  const campaignPage = {
    en: 'Activities',
    'zh-tw': '活動頁',
  };

  const homepage = {
    en: 'Home',
    'zh-tw': '首頁',
  };

  const navigationList = [
    { link: `#page-top`, text: backToTop[locale] },
    { link: `#project-cards`, text: projectCardTitle[locale] },
    { link: `#job-cards`, text: jobCardTitle[locale] },
    { link: `#event-cards`, text: eventCardTitle[locale] },
    { link: `/campaign`, text: campaignPage[locale] },
    { link: `/`, text: homepage[locale] },
  ];

  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Card Introduction`,
      'zh-tw': `開源星手村 - 卡片介紹`,
    },
  };

  return {
    props: {
      cards: updatedCards,
      navigationList,
      headInfo: {
        title: headInfo.title[locale],
      },
      title: title[locale],
      projectCardTitle: projectCardTitle[locale],
      jobCardTitle: jobCardTitle[locale],
      eventCardTitle: eventCardTitle[locale],
    },
  };
};

const cards = ({
  cards,
  navigationList,
  headInfo,
  title,
  projectCardTitle,
  jobCardTitle,
  eventCardTitle,
}) => {
  return (
    <Base nav={navigationList}>
      <Head>
        <title>{headInfo.title}</title>
        <meta name="description" content="" />
      </Head>
      <Headline title={title} />
      <CardsGrid
        id={`project-cards`}
        title={projectCardTitle}
        cards={cards}
        filter={`project`}
      />
      <CardsGrid
        id={`job-cards`}
        title={jobCardTitle}
        cards={cards}
        filter={`job`}
      />
      <CardsGrid
        id={`event-cards`}
        title={eventCardTitle}
        cards={cards}
        filter={`event`}
      />
    </Base>
  );
};

export default cards;
