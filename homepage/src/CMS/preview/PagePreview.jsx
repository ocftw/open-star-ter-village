import { componentMapper } from '../../lib/componentMapper';
import contentMapper from '../../layouts/contentMapper';

const PagePreview = ({ entry, assetsByLocale }) => {
  const locale = 'en';
  const assets = assetsByLocale[locale];

  const layoutList = entry.getIn(['data', 'layout_list']);
  const sections = layoutList?.map((layout) => {
    const component = componentMapper(layout.toJS(), assets.cards);
    return contentMapper(component);
  });
  return <div>{sections}</div>;
};

export default PagePreview;
