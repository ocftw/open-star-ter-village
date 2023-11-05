import { componentMapper } from './PageContentService/componentMapper';
import { fetchAllCards } from '../repository/fetchAllCards';
import { fetchPage } from '../repository/fetchPage';

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
