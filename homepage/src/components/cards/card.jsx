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
          style={{ border: `1rem solid ${card.data.color.background}` }}
        >
          <h3>{card.data.title}</h3>
          <div>
            <div className="d-flex">
              {card.data.avatarList.map((avatar) => (
                <div
                  key={avatar.data.title}
                  className="col-3 avatar avatar-list"
                  style={{
                    backgroundColor: `${avatar.data.color.background}`,
                    border: `1px solid ${avatar.data.color.border}`,
                  }}
                >
                  <div
                    style={{
                      backgroundImage: `url(${avatar.data.image})`,
                    }}
                  >
                    &nbsp;
                  </div>
                </div>
              ))}
            </div>
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
