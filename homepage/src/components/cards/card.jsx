import DefaultCard from './defaultCard';
import ProjectCard from './projectCard';

const Card = ({ card }) => {
  if (card.data.type === 'project') {
    return <ProjectCard card={card} />;
  }
  return <DefaultCard card={card} />;
};

export default Card;
