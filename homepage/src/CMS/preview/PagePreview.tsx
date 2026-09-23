import React from 'react';
import { componentMapper } from '../../lib/service/PageContentService/componentMapper';
import contentMapper from '../../layouts/contentMapper';
import type { PageLayout } from '../../types/content';
import type { DecapEntry, PreviewTemplateProps } from '../types';

const PagePreview: React.FC<PreviewTemplateProps> = ({
  entry,
  assetsByLocale,
  locale,
}) => {
  const assets = assetsByLocale[locale];

  const layoutList = entry.getIn(['data', 'layout_list']);
  const sections = layoutList?.map((layout: DecapEntry) => {
    const component = componentMapper(
      layout.toJS() as PageLayout,
      assets.cards,
    );
    return contentMapper(component);
  });
  return <div>{sections}</div>;
};

export default PagePreview;
