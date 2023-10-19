import Image from 'next/image';
import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

const Card = ({ card }) => (
  <div className="col-md-4 mb-3" id={card.data.id}>
    <div className="section-main">
      <h3>{card.data.title}</h3>
      <div>
        <div className="image-container">
          <Image src={card.data.image} alt={card.data.title} fill className='image' />
        </div>
        <strong>{card.data.description}</strong>
        <ParseMarkdownAndHtml markdown={true}>
          {card.content}
        </ParseMarkdownAndHtml>
      </div>
    </div>
  </div>
);

export default Card;
