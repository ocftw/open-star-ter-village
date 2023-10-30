import Image from 'next/image';
import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

const NonProjectCard = ({ card }) => (
  <div className="col-md-4 mb-3" id={card.data.id}>
    <div
      className="section-main"
      style={{
        minHeight: '20rem',
        backgroundColor: `${card.data.color.background}`,
        color: 'white',
        border: `1rem solid ${card.data.color.border}`,
      }}
    >
      <h3>{card.data.title}</h3>
      <div>
        <div
          className="avatar avatar-tablet"
          style={{ backgroundColor: card.data.color.avatar }}
        >
          <div className="image-container">
            <Image
              src={card.data.image}
              alt={card.data.title}
              fill
              className="image"
            />
          </div>
        </div>
        <strong>{card.data.description}</strong>
        <ParseMarkdownAndHtml markdown={true}>
          {card.content}
        </ParseMarkdownAndHtml>
      </div>
    </div>
  </div>
);

export default NonProjectCard;
