import { filterInplace } from '../../utils';

const getById = <T>(cards: T[], index: number): T => {
  return cards[index];
};
const add = <T>(cards: T[], newCards: T[]): void => {
  cards.push(...newCards);
};
const addOne = <T>(cards: T[], newCard: T): void => {
  cards.push(newCard);
};
const remove = <T>(cards: T[], discardCards: T[]): void => {
  // O(M+N)
  // convert discard cards to card => number map
  const discardCardsMap = new Map<T, number>();
  for (let discardCard of discardCards) {
    discardCardsMap.set(discardCard, (discardCardsMap.get(discardCard) ?? 0) + 1);
  }
  // remove discard card as empty in cards
  filterInplace(cards, (card) => {
    if ((discardCardsMap.get(card) ?? 0) > 0) {
      discardCardsMap.set(card, discardCardsMap.get(card)! - 1);
      return false;
    }
    return true;
  });
}
const removeOne = <T>(cards: T[], discardCard: T): void => {
  return remove(cards, [discardCard]);
};

const initialState = <T>(): T[] => [];

const CardsSlice = {
  initialState,
  mutators: {
    add,
    addOne,
    remove,
    removeOne,
  },
  selectors: {
    getById,
  },
};

/** @deprecated */
export const CardsMutator = CardsSlice.mutators;
/** @deprecated */
export const CardsSelector = CardsSlice.selectors;
/** @deprecated */
export default CardsSlice;
