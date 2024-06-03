type StateDeck<T> = OpenStarTerVillageType.State.Deck<T>;

export function newCardDeck<T>(drawPile: T[] = [], discardPile: T[] = []): StateDeck<T> {
  return {
    drawPile,
    discardPile,
  };
}

export interface IDeck {
  ShuffleDrawPile<T>(deck: StateDeck<T>, shuffler: (pile: T[]) => T[]): void;
  ShuffleDiscardPile<T>(deck: StateDeck<T>, shuffler: (pile: T[]) => T[]): void;
  PutDiscardPileToDrawPile<T>(deck: StateDeck<T>): void;
  Draw<T>(deck: StateDeck<T>, n: number): T[];
  Discard<T>(deck: StateDeck<T>, ts: T[]): void;
}

export const Deck: IDeck = {
  ShuffleDrawPile<T>(deck: StateDeck<T>, shuffler: (pile: T[]) => T[]): void {
    deck.drawPile = shuffler(deck.drawPile);
  },
  ShuffleDiscardPile<T>(deck: StateDeck<T>, shuffler: (pile: T[]) => T[]): void {
    deck.discardPile = shuffler(deck.discardPile);
  },
  PutDiscardPileToDrawPile<T>(deck: StateDeck<T>): void {
    deck.drawPile = [...deck.drawPile, ...deck.discardPile];
    deck.discardPile = [];
  },
  Draw<T>(deck: StateDeck<T>, n: number): T[] {
    const result = deck.drawPile.slice(0, n);
    deck.drawPile = deck.drawPile.slice(n);
    return result;
  },
  Discard<T>(deck: StateDeck<T>, ts: T[]) {
    deck.discardPile = [...deck.discardPile, ...ts];
  }
}
