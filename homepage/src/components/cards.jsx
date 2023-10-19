import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const Cards = ({ id, title, cards }) => {
  return (
    <div className="section" id={id}>
      <div className="container">
        <div className="section-head">
          <h2>{title}</h2>
        </div>
        <div className="row">
          {cards.map((card) => (
            <Card key={card.data.title} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Card = ({ card }) => (
  <div className="col-md-4 mb-3">
    <div className="section-main">
      <h3>{card.data.title}</h3>
      <div>
        <img src={card.data.image} alt={card.data.title} />
        <strong>{card.data.description}</strong>
        <ParseMarkdownAndHtml markdown={true}>
          {card.content}
        </ParseMarkdownAndHtml>
      </div>
    </div>
  </div>
);

export default Cards;
