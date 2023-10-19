import Card from './card';

const Cards = ({ id, title, cards }) => {
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
