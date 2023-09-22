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

  const cardsPage = {
    en: 'Cards',
    'zh-tw': '卡片頁',
  };

  // * dynamic page navigation
  const navigationList = pagesList
    .filter((page) => page.path && page.name)
    .map((page) => {
      page.path = page.path.replace('index', '');
      return { link: `/${page.path}`, text: page.name };
    });
  // add hard coded cards page
  navigationList.push({ link: `/cards`, text: cardsPage[locale] });

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
