import Card from '../../components/cards/card';
import { processCard } from '../../lib/utils/processCard';

const CardPreview = ({ entry, getAsset, assetsByLocale, locale }) => {
  const assets = assetsByLocale[locale];

  const data = entry.getIn(['data']).toJS();
  const content = data.body;

  const card = processCard({ data, content }, assets.cards);

  card.data.image = getAsset(card.data.image).toString();

  return <Card card={card} />;
};

export default CardPreview;
