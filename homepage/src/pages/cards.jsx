import Head from 'next/head';
import Headline from '../components/headline';
import CardsGrid from '../components/cardsGrid';
import contentMapper from '../layouts/contentMapper';
import { fetchPage } from '../lib/fetchPage';
import { fetchCards } from '../lib/fetchCards';
import { getNavigationList } from '../lib/getNavigationList';
import { componentMapper } from '../lib/componentMapper';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const rawCards = fetchCards(locale);
  const cardTasks = rawCards.map(async ({ data, content }) => {
    let image = data.image;
    const defaultImage = '/images/uploads/初階專案卡封面-01.png';
    image = image ? image.replace('/homepage/public', '') : defaultImage;

    // Workaround for image prefix path. Will be removed after image path is fixed in all cards.
    image = !image.startsWith('/') ? `/${image}` : image;

    data.image = image;

    const { markdownToHtml } = await import('../lib/markdownToHtml');
    const processedContent = await markdownToHtml(content);

    return {
      frontMatter: data,
      content: processedContent,
    };
  });
  const cards = await Promise.all(cardTasks);

  const navigationList = await getNavigationList(locale);

  const page = fetchPage(locale, 'cards');

  const contentList = page.data['layout_list']?.map((layout) =>
    componentMapper(layout, rawCards),
  );

  const title = {
    en: 'Card Introduction',
    'zh-tw': '卡片介紹',
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

  const projectCardSubtitle = {
    'open gov': {
      en: 'Open Government',
      'zh-tw': '開放政府專案',
    },
    'open data': {
      en: 'Open Data',
      'zh-tw': '開放資料專案',
    },
    'open source': {
      en: 'Open Source',
      'zh-tw': '開放原始碼專案',
    },
  };

  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Card Introduction`,
      'zh-tw': `開源星手村 - 卡片介紹`,
    },
  };

  return {
    props: {
      cards,
      navigationList,
      headInfo: {
        title: headInfo.title[locale],
      },
      title: title[locale],
      projectCardTitle: projectCardTitle[locale],
      jobCardTitle: jobCardTitle[locale],
      eventCardTitle: eventCardTitle[locale],
      projectCardSubtitle: {
        'open gov': projectCardSubtitle['open gov'][locale],
        'open data': projectCardSubtitle['open data'][locale],
        'open source': projectCardSubtitle['open source'][locale],
      },
      page: {
        contentList,
      },
    },
  };
};

const cards = ({
  cards,
  headInfo,
  title,
  projectCardTitle,
  jobCardTitle,
  eventCardTitle,
  projectCardSubtitle,
  page,
}) => {
  return (
    <>
      <Head>
        <title>{headInfo.title}</title>
        <meta name="description" content="" />
      </Head>
      {page.contentList?.map(contentMapper)}
      <Headline title={title} />
      <CardsGrid
        id={`project-cards`}
        title={projectCardTitle}
        cards={cards}
        filter={`project`}
        projectCardSubtype={`open gov`}
        projectCardSubtitle={projectCardSubtitle['open gov']}
      />
      <CardsGrid
        id={`project-cards`}
        title={projectCardTitle}
        cards={cards}
        filter={`project`}
        projectCardSubtype={`open data`}
        projectCardSubtitle={projectCardSubtitle['open data']}
      />
      <CardsGrid
        id={`project-cards`}
        title={projectCardTitle}
        cards={cards}
        filter={`project`}
        projectCardSubtype={`open source`}
        projectCardSubtitle={projectCardSubtitle['open source']}
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
    </>
  );
};

export default cards;
