import { filterInplace } from '../utils';

export interface ICards {
  GetById<T>(cards: T[], index: number): T;
  Add<T>(cards: T[], newCards: T[]): void;
  AddOne<T>(cards: T[], newCard: T): void;
  Remove<T>(cards: T[], discardCards: T[]): void;
  RemoveOne<T>(cards: T[], discardCard: T): void;
}

export const Cards: ICards = {
  GetById(cards, index) {
    return cards[index];
  },
  Add<T>(cards: T[], newCards: T[]): void {
    cards.push(...newCards);
  },
  AddOne(cards, newCard) {
    return Cards.Add(cards, [newCard]);
  },
  Remove<T>(cards: T[], discardCards: T[]): void {
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
  },
  RemoveOne(cards, discardCard) {
    return Cards.Remove(cards, [discardCard]);
  },
}
