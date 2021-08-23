import { Deck } from "./deck";

describe('deck', () => {
  it('should return a card', () => {
    // Arrange
    const deck = new Deck<string>(['card-a'], x => x);
    // Act
    const [acutal] = deck.draw();
    // Assert
    expect(acutal).toBe('card-a');
  });

  it('should discard a card', () => {
    // Arrange
    const deck = new Deck<string>([], x => x);
    try {
      // Act
      deck.discard('card-a');
    } catch (err) {
      expect(err).not.toBeDefined();
    }
    // Assert
    expect(true).toBe(true);
  });

  it('should shuffle the deck', () => {
    // Arrange
    const deck = new Deck<string>(['card-a', 'card-b'], x => x.slice(0).reverse());
    deck.shuffle();
    // Act
    const actual = deck.draw(2);
    // Assert
    expect(actual).toMatchObject(['card-b', 'card-a']);
  });

  it('should refill the deck', () => {
    // Arrange
    const deck = new Deck<string>([], x => x.slice(0).reverse(), true);
    deck.discard(['card-a', 'card-b']);
    // Act
    const actual = deck.draw(2);
    // Assert
    expect(actual).toMatchObject(['card-b', 'card-a']);
  });
});
