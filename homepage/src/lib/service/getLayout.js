import { fetchAllPages } from '../repository/fetchAllPages';
import { fetchFooter } from '../repository/fetchFooter';
import { fetchAllCards } from '../repository/fetchAllCards';
import { anchorMapper } from './PageContentService/anchorMapper';

const getNavigation = (pages, cards) => {
  const navigation = pages
    .filter((page) => page.data.unique_slug && page.data.name)
    .sort((a, b) => a.data.page_order - b.data.page_order)
    .map((page) => {
      const path = page.data.unique_slug.replace('index', '');
      const baseLink = `/${path}`;

      const anchors =
        page.data?.['layout_list']?.map((layout) =>
          anchorMapper(layout, cards),
        ) || [];
      const subNavigation = anchors.map((anchor) => ({
        link: `${baseLink}${anchor.hash}`,
        text: anchor.title,
        level: anchor.level,
      }));

      return {
        link: baseLink,
        text: page.data.name,
        subNavigation,
      };
    });

  return navigation;
};

export const getLayout = async (locale) => {
  const pages = fetchAllPages(locale);
  const cards = fetchAllCards(locale);
  const navigation = getNavigation(pages, cards);
  const header = {
    navigation,
  };
  const footer = fetchFooter(locale);
  const layout = {
    header,
    footer,
  };

  return layout;
};
