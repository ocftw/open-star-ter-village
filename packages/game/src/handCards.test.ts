import { HandCards } from './handCards';

describe('HandCards', () => {
  describe('GetById', () => {
    it('should return hand card', () => {
      const handCards = ['K', 'Q', 'J', 'T'];
      const handCard = HandCards.GetById(handCards, 2);
      expect(handCard).toEqual('J');
    });
  });

  describe('Add', () => {
    it('should merge new card into hand cards', () => {
      const handCards = ['knight', 'king', 'bishop'];
      const newCards = ['queen', 'pawn', 'bishop'];
      HandCards.Add(handCards, newCards);
      expect(handCards).toEqual(['knight', 'king', 'bishop', 'queen', 'pawn', 'bishop']);
    });
  });

  describe('Remove', () => {
    it('should remove discard card from hand cards', () => {
      const handCards = ['knight', 'pawn', 'king', 'bishop', 'queen', 'pawn', 'bishop', 'pawn'];
      const discardCards = ['pawn', 'pawn', 'bishop'];
      HandCards.Remove(handCards, discardCards);
      expect(handCards).toEqual(['knight', 'king', 'queen', 'bishop', 'pawn']);
    });

    it('should not remove invalid discard from hand cards', () => {
      const handCards = ['knight', 'pawn', 'king', 'bishop', 'queen', 'pawn', 'bishop', 'pawn'];
      const discardCards = ['invalid_item'];
      HandCards.Remove(handCards, discardCards);
      expect(handCards).toEqual(['knight', 'pawn', 'king', 'bishop', 'queen', 'pawn', 'bishop', 'pawn']);
    });
  });
});
