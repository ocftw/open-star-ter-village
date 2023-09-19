import contentMapper from '../layouts/contentMapper';
import { fetchPage } from '../lib/fetchPage';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = fetchPage(locale, 'resource');

  const homepage = {
    en: 'Home',
    'zh-tw': '首頁',
  };

  const cardsPage = {
    en: 'Cards',
    'zh-tw': '卡片頁',
  };

  const activitiesPage = {
    en: 'Activities',
    'zh-tw': '活動頁',
  };

  // site page navigation
  const navigationList = [
    { link: `/cards`, text: cardsPage[locale] },
    { link: `/activities`, text: activitiesPage[locale] },
    { link: `/`, text: homepage[locale] },
  ];

  /*
  // content navigation
  const navigationList = page.data['layout_list']?.map((layout) => {
    return {
      text: layout?.title,
      link: `#${layout?.title}`,
    };
  });
   */

  return {
    props: {
      page,
      navigationList,
    },
  };
};

export default function Resource({ page }) {
  return <>{page.data['layout_list']?.map(contentMapper)}</>;
}
