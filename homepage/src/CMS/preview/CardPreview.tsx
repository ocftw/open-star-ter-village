import Card from '../../components/cards/card';
import { processCard } from '../../lib/utils/processCard';
import type { CardFrontMatter } from '../../types/content';
import type { PreviewTemplateProps } from '../types';

const CardPreview = ({
  entry,
  getAsset,
  assetsByLocale,
  locale,
}: PreviewTemplateProps) => {
  const assets = assetsByLocale[locale];

  const data = entry.getIn(['data']).toJS() as CardFrontMatter & {
    body: string;
  };
  const content = data.body;

  const card = processCard({ data, content }, assets.cards);

  card.data.image = getAsset(card.data.image).toString();

  return <Card card={card} />;
};

export default CardPreview;
