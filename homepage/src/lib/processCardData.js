import { titleToAnchorId } from './titleToAnchorId';

export function processCardData(data) {
  let image = data.image;
  const defaultImage = '/images/uploads/初階專案卡封面-01.png';
  image = image ? image.replace('/homepage/public', '') : defaultImage;

  // Workaround for image prefix path. Will be removed after image path is fixed in all cards.
  image = !image.startsWith('/') ? `/${image}` : image;

  // Non-project card
  if (data.type === 'job') {
    const color = {};

    switch (data.tags[0]) {
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
  const jobCards = data.type === 'job';

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
    const avatarList = tags.map((tag) => {
      const jobCard = jobCards.find((jobCard) => jobCard.data.tags[0] === tag);
      return jobCard ? jobCard.data : null;
    });

    data = {
      ...data,
      color,
    };
  }

  return {
    ...data,
    image,
    id: data.id || titleToAnchorId(data.title),
  };
}
