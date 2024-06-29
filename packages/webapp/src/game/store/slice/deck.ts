export interface Deck<T> {
  drawPile: T[];
  discardPile: T[];
}

const initialState = <T>(): Deck<T> => ({
  drawPile: [],
  discardPile: [],
});

type Shuffler<T> = (pile: T[]) => T[];

const initialize = <T>(state: Deck<T>, cards: T[]): void => {
  state.drawPile = cards;
  state.discardPile = [];
}

const shuffleDrawPile = <T>(state: Deck<T>, shuffler: Shuffler<T>): void => {
  state.drawPile = shuffler(state.drawPile);
}

const shuffleDiscardPile = <T>(state: Deck<T>, shuffler: Shuffler<T>): void => {
  state.discardPile = shuffler(state.discardPile);
}

const moveDiscardPileUnderDrawPile = <T>(state: Deck<T>): void => {
  state.drawPile.push(...state.discardPile);
  state.discardPile = [];
}

const draw = <T>(state: Deck<T>, n: number): void => {
  state.drawPile = state.drawPile.slice(n);
}

const discard = <T>(state: Deck<T>, discards: T[]): void => {
  state.discardPile.push(...discards);
}

const peek = <T>(state: Deck<T>, n: number): T[] => {
  return state.drawPile.slice(0, n);
}

const DeckSlice = {
  initialState,
  mutators: {
    initialize,
    shuffleDrawPile,
    shuffleDiscardPile,
    moveDiscardPileUnderDrawPile,
    draw,
    discard,
  },
  selectors: {
    peek,
  },
};

export const DeckMutator = DeckSlice.mutators;
export const DeckSelector = DeckSlice.selectors;
export default DeckSlice;
