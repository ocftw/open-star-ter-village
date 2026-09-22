import DefaultCard from './defaultCard';
import ProjectCard from './projectCard';
import type { Card as CardModel } from '../../types/content';

const Card = ({ card }: { card: CardModel }) => {
  if (card.data.type === 'project') {
    return <ProjectCard card={card} />;
  }
  return <DefaultCard card={card} />;
};

export default Card;
