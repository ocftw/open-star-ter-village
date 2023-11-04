import { componentMapper } from './componentMapper';
import { fetchCards } from './fetchCards';
import { fetchPage } from './fetchPage';
import { processCard } from './processCard';

export const getPage = async (pageName, locale) => {
  const rawCards = fetchCards(locale);
  const cardTasks = rawCards.map(async (card) => {
    return processCard(card, rawCards);
  });
  const cards = await Promise.all(cardTasks);

  const page = fetchPage(locale, pageName);

  const contentList = page.data['layout_list']?.map((layout) =>
    componentMapper(layout, cards),
  );

  return {
    contentList,
  };
};
