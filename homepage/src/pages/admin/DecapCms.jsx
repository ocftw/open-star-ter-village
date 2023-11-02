import dynamic from 'next/dynamic';
import { PagePreview } from './preview/PagePreview';
import { FooterPreview } from './preview/FooterPreview';
import { CardPreview } from './preview/CardPreview';

import config from './config.json';

const withAssetsByLocale = (Component, assetsByLocale) => {
  const WrappedComponent = (props) => (
    <Component {...props} assetsByLocale={assetsByLocale} />
  );
  WrappedComponent.displayName = `withAssetsByLocale(${Component.displayName})`;
  return WrappedComponent;
};

export const DecapCms = (assetsByLocale) =>
  dynamic(
    () =>
      import('decap-cms-app').then((cms) => {
        cms.init({ config });
        cms.registerPreviewStyle(
          'https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css',
        );
        cms.registerPreviewStyle(
          'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css',
        );
        cms.registerPreviewStyle(
          'https://fonts.googleapis.com/css?family=Montserrat:400,700',
        );
        cms.registerPreviewStyle(
          'https://fonts.googleapis.com/css?family=Roboto+Slab:400,100,300,700',
        );
        cms.registerPreviewStyle('/css/style.css');

        cms.registerPreviewTemplate(
          'pages',
          withAssetsByLocale(PagePreview, assetsByLocale),
        );
        cms.registerPreviewTemplate(
          'footer',
          withAssetsByLocale(FooterPreview, assetsByLocale),
        );
        cms.registerPreviewTemplate(
          'cards',
          withAssetsByLocale(CardPreview, assetsByLocale),
        );
      }),
    { ssr: false, loading: () => <p>Loading...</p> },
  );
