import contentMapper from '../layouts/contentMapper';
import { fetchPage } from '../lib/fetchPage';
import { getPagesList } from '../lib/getPagesList';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = fetchPage(locale, 'resource');
  const pagesList = await getPagesList(locale);

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

  // * dynamic page navigation
  // const navigationList = pagesList.map((page) => {
  //   page.path = page.path.replace('index', '');
  //   return { link: `/${page.path}`, text: page.name ?? 'page' };
  // });

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
