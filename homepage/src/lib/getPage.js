import { componentMapper } from './componentMapper';
import { fetchAllCards } from './fetchAllCards';
import { fetchPage } from './fetchPage';

export const getPage = async (pageName, locale) => {
  const cards = fetchAllCards(locale);

  const page = fetchPage(locale, pageName);

  const contentList = page.data['layout_list']?.map((layout) =>
    componentMapper(layout, cards),
  );

  return {
    contentList,
  };
};
