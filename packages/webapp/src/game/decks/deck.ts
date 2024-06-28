export interface Deck<T> {
  drawPile: T[];
  discardPile: T[];
}

export function newCardDeck<T>(drawPile: T[] = [], discardPile: T[] = []): Deck<T> {
  return {
    drawPile,
    discardPile,
  };
}

export interface IDeck {
  ShuffleDrawPile<T>(deck: Deck<T>, shuffler: (pile: T[]) => T[]): void;
  ShuffleDiscardPile<T>(deck: Deck<T>, shuffler: (pile: T[]) => T[]): void;
  PutDiscardPileToDrawPile<T>(deck: Deck<T>): void;
  Draw<T>(deck: Deck<T>, n: number): T[];
  Discard<T>(deck: Deck<T>, ts: T[]): void;
}

export const Deck: IDeck = {
  ShuffleDrawPile<T>(deck: Deck<T>, shuffler: (pile: T[]) => T[]): void {
    deck.drawPile = shuffler(deck.drawPile);
  },
  ShuffleDiscardPile<T>(deck: Deck<T>, shuffler: (pile: T[]) => T[]): void {
    deck.discardPile = shuffler(deck.discardPile);
  },
  PutDiscardPileToDrawPile<T>(deck: Deck<T>): void {
    deck.drawPile = [...deck.drawPile, ...deck.discardPile];
    deck.discardPile = [];
  },
  Draw<T>(deck: Deck<T>, n: number): T[] {
    const result = deck.drawPile.slice(0, n);
    deck.drawPile = deck.drawPile.slice(n);
    return result;
  },
  Discard<T>(deck: Deck<T>, ts: T[]) {
    deck.discardPile = [...deck.discardPile, ...ts];
  }
}
