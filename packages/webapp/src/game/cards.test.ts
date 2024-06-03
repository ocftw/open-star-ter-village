import { Cards } from './cards';

describe('Cards', () => {
  describe('GetById', () => {
    it('should return card', () => {
      const cards = ['K', 'Q', 'J', 'T'];
      const card = Cards.GetById(cards, 2);
      expect(card).toEqual('J');
    });
  });

  describe('Add', () => {
    it('should merge new card into cards', () => {
      const cards = ['knight', 'king', 'bishop'];
      const newCards = ['queen', 'pawn', 'bishop'];
      Cards.Add(cards, newCards);
      expect(cards).toEqual(['knight', 'king', 'bishop', 'queen', 'pawn', 'bishop']);
    });
  });

  describe('Remove', () => {
    it('should remove discard card from cards', () => {
      const cards = ['knight', 'pawn', 'king', 'bishop', 'queen', 'pawn', 'bishop', 'pawn'];
      const discardCards = ['pawn', 'pawn', 'bishop'];
      Cards.Remove(cards, discardCards);
      expect(cards).toEqual(['knight', 'king', 'queen', 'bishop', 'pawn']);
    });

    it('should not remove invalid discard from cards', () => {
      const cards = ['knight', 'pawn', 'king', 'bishop', 'queen', 'pawn', 'bishop', 'pawn'];
      const discardCards = ['invalid_item'];
      Cards.Remove(cards, discardCards);
      expect(cards).toEqual(['knight', 'pawn', 'king', 'bishop', 'queen', 'pawn', 'bishop', 'pawn']);
    });
  });
});
