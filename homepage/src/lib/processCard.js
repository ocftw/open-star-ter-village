import { getJobCardColor } from './getJobCardColor';
import { titleToAnchorId } from './titleToAnchorId';

export const processCard = (card, cards) => {
  let { data, content } = card;

  let image = data.image;
  const defaultImage = '/images/uploads/初階專案卡封面-01.png';
  image = image ?? defaultImage;

  data = {
    ...data,
    image,
  };

  //
  const id = data.id || titleToAnchorId(data.title);
  data = {
    ...data,
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
    const color = {};

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
    const color = {};
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
      .filter((x) => x)
      .map(({ data, content }) => {
        const color = getJobCardColor(data.tags[0]);

        data = {
          ...data,
          color,
        };

        return {
          data,
          content,
        };
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
