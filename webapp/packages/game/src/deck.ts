import { IDeck } from './types';

export class Deck<T = any> implements IDeck<T> {
  private pile: T[];
  private discardPile: T[];
  private shuffler: (cards: T[]) => T[];
  private autoRefill: boolean;

  public constructor(cards: T[], shuffler: (cards: T[]) => T[], autoRefill: boolean = false) {
    this.pile = cards;
    this.discardPile = [];
    this.shuffler = shuffler;
    this.autoRefill = autoRefill;
  }

  public draw(n: number = 1) {
    if (this.pile.length < n && this.autoRefill) {
      this.pile.push(...this.shuffler(this.discardPile));
      this.discardPile = [];
    }
    return this.pile.splice(0, n);
  }

  public discard(card: T | T[]) {
    const cards = Array.isArray(card) ? card : [card];
    this.discardPile.push(...cards);
  }

  public shuffle() {
    this.pile = this.shuffler(this.pile);
  }
}
