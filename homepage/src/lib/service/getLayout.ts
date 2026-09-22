import { fetchAllPages } from '../repository/fetchAllPages';
import { fetchFooter } from '../repository/fetchFooter';
import { fetchAllCards } from '../repository/fetchAllCards';
import { anchorMapper } from './PageContentService/anchorMapper';
import type {
  Card,
  Layout,
  NavigationItem,
  PageFrontMatter,
} from '../../types/content';

const getNavigation = (
  pages: { data: PageFrontMatter }[],
  cards: Card[],
): NavigationItem[] => {
  const navigation = pages
    .filter((page) => page.data.unique_slug && page.data.name)
    .sort((a, b) => (a.data.page_order ?? 0) - (b.data.page_order ?? 0))
    .map((page) => {
      const path = page.data.unique_slug!.replace('index', '');
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
        text: page.data.name!,
        subNavigation,
      };
    });

  return navigation;
};

export const getLayout = async (locale: string): Promise<Layout> => {
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
