import { titleToAnchorId } from './titleToAnchorId';

export const anchorMapper = (layout, cards = []) => {
  let id = '';
  let title = '';
  let level = 0;
  let subAnchors = [];

  switch (layout.type) {
    case 'layout_banner': {
      id = titleToAnchorId(layout.title);
      title = layout.title;
      level = 1;
      break;
    }
    case 'layout_headline': {
      id = titleToAnchorId(layout.title);
      title = layout.title;
      level = 1;
      break;
    }
    case 'layout_image_text': {
      (id = titleToAnchorId(layout.title)), (title = layout.title), (level = 2);
      break;
    }
    case 'layout_section': {
      (id = titleToAnchorId(layout.title)), (title = layout.title), (level = 2);
      break;
    }
    case 'layout_cards': {
      let filteredCards = cards;
      // filter cards by card_type
      if (layout.card_type) {
        filteredCards = cards.filter(
          (card) => layout.card_type === card.data.type,
        );
      }
      // filter cards by card_tags
      if (layout.card_tags && layout.card_tags.length > 0) {
        filteredCards = filteredCards.filter((card) =>
          layout.card_tags.every((tag) => card.data.tags?.includes(tag)),
        );
      }

      (id = titleToAnchorId(layout.title)), (title = layout.title), (level = 2);
      subAnchors = filteredCards.map((card) => ({
        id: titleToAnchorId(card.data.title),
        title: card.data.title,
        level: 3,
      }));
      break;
    }
  }

  return {
    hash: `#${id}`,
    title,
    level,
    subAnchors: subAnchors.map((subAnchor) => ({
      hash: `#${subAnchor.id}`,
      title: subAnchor.title,
      level: subAnchor.level,
    })),
  };
};
