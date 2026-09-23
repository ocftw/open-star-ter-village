import React from 'react';
import DefaultCard from './defaultCard';
import ProjectCard from './projectCard';
import type { Card as CardModel } from '../../types/content';

const Card: React.FC<{ card: CardModel }> = ({ card }) => {
  if (card.data.type === 'project') {
    return <ProjectCard card={card} />;
  }
  return <DefaultCard card={card} />;
};

export default Card;
