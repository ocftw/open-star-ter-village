import React from 'react';
import FooterLinks from '../../layouts/footer/footerLinks';
import type { DecapEntry, PreviewTemplateProps } from '../types';

const FooterPreview: React.FC<PreviewTemplateProps> = ({ entry }) => {
  const footer = entry.getIn(['data', 'footer']);
  const links = footer
    ?.get('links')
    .map((link: DecapEntry) => {
      return {
        displayText: link.get('display_text')?.toString(),
        url: link.get('url')?.toString(),
      };
    })
    .toArray();
  return <FooterLinks links={links} />;
};

export default FooterPreview;
