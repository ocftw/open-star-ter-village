import Image from 'next/image';
import NonProjectCard from './nonProjectCard';
import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

const Card = ({ card }) => {
  if (card.data.type !== 'project') {
    return <NonProjectCard card={card} />;
  } else {
    return (
      <div className="col-md-4 mb-3" id={card.data.id}>
        <div
          className="section-main"
          style={{ backgroundColor: `${card.data.color.background}` }}
        >
          <h3>{card.data.title}</h3>
          <div>
            <div className="image-container">
              <Image
                src={card.data.image}
                alt={card.data.title}
                fill
                className="image"
              />
            </div>
            {/* {
              card.data.avatarList.map((avatar) => {
                <div className="image-container">
                  <Image src={avatar.data.image} alt={avatar.data.title} fill className='image' />
                </div>
              })
            } */}
            <strong>{card.data.description}</strong>
            <ParseMarkdownAndHtml markdown={true}>
              {card.content}
            </ParseMarkdownAndHtml>
          </div>
        </div>
      </div>
    );
  }
};

export default Card;
