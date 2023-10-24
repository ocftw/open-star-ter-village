import Image from 'next/image';
import { ParseMarkdownAndHtml } from '../parseMarkdownAndHtml';

const Card = ({ card }) => {
  if (card.data.type === 'event') {
    return (
      <div className="col-md-4 mb-3" id={card.data.id}>
        <div
          className="section-main"
          style={{
            minHeight: '28rem',
            backgroundColor: '#eaa652',
            color: 'white',
            border: '1rem solid #e6912b',
          }}
        >
          <h3>{card.data.title}</h3>
          <div>
            <div className="avatar avatar-event">
              <div className="image-container">
                <Image src={card.data.image} alt={card.data.title} fill className='image' />
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
  } else if (card.data.type === 'job') {
    const color = {};

    switch (card.data.tags[0]) {
      case 'civil servants':
        color.avatar = '#b1bb95';
        color.background = '#8b9f6d';
        color.border = '#6f8d50';
        break;
      case 'engineer':
        color.avatar = '#95a2b2';
        color.background = '#5e7d93';
        color.border = '#2a6780';
        break;
      case 'writer':
        color.avatar = '#94a8a1';
        color.background = '#62867f';
        color.border = '#287168';
        break;
      case 'legal':
        color.avatar = '#d4ab8d';
        color.background = '#c2865f';
        color.border = '#b76a46';
        break;
      case 'designer':
        color.avatar = '#d1bb8f';
        color.background = '#be9f5f';
        color.border = '#b18b42';
        break;
      case 'marketing':
        color.avatar = '#c1907b';
        color.background = '#aa644f';
        color.border = '#984334';
        break;
      case 'advocator':
        color.avatar = '#9a91ab';
        color.background = '#6c688b';
        color.border = '#474c79';
        break;
    }

    return (
      <div className="col-md-4 mb-3" id={card.data.id}>
        <div
          className="section-main"
          style={{
            minHeight: '20rem',
            backgroundColor: `${color.background}`,
            color: 'white',
            border: `1rem solid ${color.border}`,
          }}
        >
          <h3>{card.data.title}</h3>
          <div>
            <div className="avatar" style={{ backgroundColor: color.avatar }}>
              <div className="image-container">
                <Image src={card.data.image} alt={card.data.title} fill className='image' />
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
  } else {
    return (
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
  }
};

export default Card;
