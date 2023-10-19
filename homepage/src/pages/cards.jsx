import Head from 'next/head';
import contentMapper from '../layouts/contentMapper';
import { fetchPage } from '../lib/fetchPage';
import { fetchCards } from '../lib/fetchCards';
import { getNavigationList } from '../lib/getNavigationList';
import { componentMapper } from '../lib/componentMapper';
import { processCardData } from '../lib/processCardData';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const rawCards = fetchCards(locale);
  const cardTasks = rawCards.map(async ({ data, content }) => {

    return {
      data: processCardData(data),
      content,
    };
  });
  const cards = await Promise.all(cardTasks);

  const navigationList = await getNavigationList(locale);

  const page = fetchPage(locale, 'cards');

  const contentList = page.data['layout_list']?.map((layout) =>
    componentMapper(layout, cards),
  );

  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Card Introduction`,
      'zh-tw': `開源星手村 - 卡片介紹`,
    },
  };

  return {
    props: {
      navigationList,
      headInfo: {
        title: headInfo.title[locale],
      },
      page: {
        contentList,
      },
    },
  };
};

const cards = ({ headInfo, page }) => {
  return (
    <>
      <Head>
        <title>{headInfo.title}</title>
        <meta name="description" content={headInfo.description} />
      </Head>
      {page.contentList?.map(contentMapper)}
    </>
  );
};

export default cards;
