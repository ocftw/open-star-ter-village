import { getJobCardColor } from './getJobCardColor';
import { titleToAnchorId } from './titleToAnchorId';
import type { Card, CardColor, CardData, RawCard } from '../../types/content';

export const processCard = (card: RawCard, cards: RawCard[]): Card => {
  const { content } = card;

  let image = card.data.image;
  const defaultImage = '/images/uploads/初階專案卡封面-01.png';
  image = image ?? defaultImage;

  //
  const id = card.data.id || titleToAnchorId(card.data.title);
  let data: CardData = {
    ...card.data,
    image,
    id,
  };

  // Non-project card
  if (data.type === 'job') {
    const color = getJobCardColor(data.tags[0]);

    data = {
      ...data,
      color,
    };
  }

  if (data.type === 'event') {
    const color: CardColor = {};

    color.avatar = '#f1c287';
    color.background = '#eaa652';
    color.border = ' #e6912b';

    data = {
      ...data,
      color,
    };
  }
  // project card
  if (data.type === 'project') {
    const color: CardColor = {};
    const mainTag = data.tags.find((tag) =>
      ['open gov', 'open data', 'open source'].includes(tag),
    );
    switch (mainTag) {
      case 'open gov':
        color.background = '#efac49';
        break;
      case 'open data':
        color.background = '#73a09b';
        break;
      case 'open source':
        color.background = '#9b2123';
        break;
      default:
        color.background = '#ffffff';
    }

    const tags = data.tags || [];
    const jobCards = cards.filter((card) => card.data.type === 'job');
    const avatarList = tags
      .map((tag) => {
        const jobCard = jobCards.find((jobCard) =>
          jobCard.data.tags.some((t) => t === tag),
        );
        return jobCard;
      })
      .filter((x) => x !== undefined)
      .map(({ data, content }) => {
        const color = getJobCardColor(data.tags[0]);

        return {
          data: {
            ...data,
            color,
          },
          content,
        } as Card;
      });

    data = {
      ...data,
      color,
      avatarList,
    };
  }

  return {
    data,
    content,
  };
};
