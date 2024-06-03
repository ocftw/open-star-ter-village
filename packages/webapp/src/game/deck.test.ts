import { Deck, newCardDeck } from './deck';

describe('CardDeck', () => {
  it('should return empty draw pile and discard pile as default', () => {
    const cardDeck = newCardDeck();
    expect(cardDeck.drawPile).toEqual([]);
    expect(cardDeck.discardPile).toEqual([]);
  });

  it('should return given draw pile and empty discard pile', () => {
    const cardDeck = newCardDeck(['abc', 'xyz', 'ijk']);
    expect(cardDeck.drawPile).toEqual(['abc', 'xyz', 'ijk']);
    expect(cardDeck.discardPile).toEqual([]);
  });

  it('should return empty draw pile and given discard pile', () => {
    const cardDeck = newCardDeck(undefined, ['abc', 'xyz', 'ijk']);
    expect(cardDeck.drawPile).toEqual([]);
    expect(cardDeck.discardPile).toEqual(['abc', 'xyz', 'ijk']);
  });
});

describe('Deck', () => {
  const reverse = <T>(array: T[]) => array.slice().reverse();
  const sort = <T>(array: T[]) => array.slice().sort();

  describe('ShuffleDrawPile', () => {
    const drawPile = [1, 3, 2, 6, 4, 5];
    describe(`given draw pile ${drawPile}`, () => {
      it.each([
        [reverse, [5, 4, 6, 2, 3, 1]],
        [sort, [1, 2, 3, 4, 5, 6]],
      ])('should shuffle by %s to be %j', (shuffler, expected) => {
        const cardDeck = newCardDeck(drawPile);
        Deck.ShuffleDrawPile(cardDeck, shuffler);
        expect(cardDeck.drawPile).toEqual(expected);
      });
    });
  });

  describe('ShuffleDiscardPile', () => {
    const discardPile = [1, 3, 2, 6, 4, 5];
    describe(`given dicard pile ${discardPile}`, () => {
      it.each([
        [reverse, [5, 4, 6, 2, 3, 1]],
        [sort, [1, 2, 3, 4, 5, 6]],
      ])('should shuffle by %s to be %j', (shuffler, expected) => {
        const cardDeck = newCardDeck([], discardPile);
        Deck.ShuffleDiscardPile(cardDeck, shuffler);
        expect(cardDeck.discardPile).toEqual(expected);
      });
    });
  });

  describe('PutDiscardPileToDrawPile', () => {
    describe.each([
      [[], [4, 5, 6], [4, 5, 6]],
      [[3, 2, 1], [], [3, 2, 1]],
      [[3, 2, 1], [4, 5, 6], [3, 2, 1, 4, 5, 6]],
    ])('given draw pile %j and discard pile %j', (drawPile, discardPile, expected) => {
      const cardDeck = newCardDeck(drawPile, discardPile);
      Deck.PutDiscardPileToDrawPile(cardDeck);
      test(`draw pile should be ${expected}`, () => {
        expect(cardDeck.drawPile).toEqual(expected);
      });
      test('discard pile should be empty', () => {
        expect(cardDeck.discardPile).toEqual([]);
      });
    });
  });

  describe('Draw', () => {
    const drawPile = ['card 1', 'card 3', 'card 2'];
    describe(`given draw pile ${drawPile}`, () => {
      test.each([
        [2, ['card 1', 'card 3']],
        [0, []],
        [1, ['card 1']],
        [5, ['card 1', 'card 3', 'card 2']],
      ])('draw %i cards from deck should return %j', (n, expected) => {
        const cardDeck = newCardDeck(drawPile);
        const actual = Deck.Draw(cardDeck, n);
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('Discard', () => {
    const discardPile = ['card 3', 'card 2'];
    describe(`given discard pile ${discardPile}`, () => {
      test.each([
        [['card 1'], ['card 3', 'card 2', 'card 1']],
        [[], ['card 3', 'card 2']],
        [['card 1', 'card 3', 'card 1'], ['card 3', 'card 2', 'card 1', 'card 3', 'card 1']],
      ])('discard %j cards to deck discard pile should be %j', (discards, expected) => {
        const cardDeck = newCardDeck([], discardPile);
        Deck.Discard(cardDeck, discards);
        expect(cardDeck.discardPile).toEqual(expected);
      });
    });
  });
});
