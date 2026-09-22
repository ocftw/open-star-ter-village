import Card from './card';
import type { CardsProps } from '../../types/components';

const Cards = ({ id, title, cards }: CardsProps) => {
  return (
    <div className="section" id={id}>
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
        </div>
        <div className="row">
          {cards.map((card) => (
            <Card key={card.data.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cards;
