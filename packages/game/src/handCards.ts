import { filterInplace } from './utils';

export interface IHandCards {
  GetById<T>(handCards: T[], index: number): T;
  Add<T>(handCards: T[], newCards: T[]): void;
  AddOne<T>(handCards: T[], newCard: T): void;
  Remove<T>(handCards: T[], discardCards: T[]): void;
  RemoveOne<T>(handCards: T[], discardCard: T): void;
}

export const HandCards: IHandCards = {
  GetById(handCards, index) {
    return handCards[index];
  },
  Add<T>(handCards: T[], newCards: T[]): void {
    handCards.push(...newCards);
  },
  AddOne(handCards, newCard) {
    return HandCards.Add(handCards, [newCard]);
  },
  Remove<T>(handCards: T[], discardCards: T[]): void {
    // O(M+N)
    // convert discard cards to card => number map
    const discardCardsMap = new Map<T, number>();
    for (let discardCard of discardCards) {
      discardCardsMap.set(discardCard, (discardCardsMap.get(discardCard) ?? 0) + 1);
    }
    // remove discard card as empty in hand cards
    filterInplace(handCards, (handCard) => {
      if ((discardCardsMap.get(handCard) ?? 0) > 0) {
        discardCardsMap.set(handCard, discardCardsMap.get(handCard)! - 1);
        return false;
      }
      return true;
    });
  },
  RemoveOne(handCards, discardCard) {
    return HandCards.Remove(handCards, [discardCard]);
  },
}
