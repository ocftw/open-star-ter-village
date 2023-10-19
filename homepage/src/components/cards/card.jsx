import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

const Card = ({ card }) => (
  <div className="col-md-4 mb-3" id={card.data.id}>
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

export default Card;
