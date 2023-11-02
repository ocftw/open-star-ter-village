import dynamic from 'next/dynamic';
import Head from 'next/head';
import Script from 'next/script';
import config from './config.json';

import FooterLinks from '../../layouts/footer/footerLinks';
import { componentMapper } from '../../lib/componentMapper';
import contentMapper from '../../layouts/contentMapper';
import Card from '../../components/cards/card';
import { fetchCards } from '../../lib/fetchCards';
import { processCard } from '../../lib/processCard';

const PagePreview = ({ entry, assetsByLocale }) => {
  const cards = assetsByLocale['en'].cards;

  const layoutList = entry.getIn(['data', 'layout_list']);
  const sections = layoutList?.map((layout) => {
    const component = componentMapper(layout.toJS(), cards);
    return contentMapper(component);
  });
  return <div>{sections}</div>;
};

const FooterPreview = ({ entry }) => {
  const footer = entry.getIn(['data', 'footer']);
  const links = footer
    ?.get('links')
    .map((link) => {
      return {
        displayText: link.get('display_text')?.toString(),
        url: link.get('url')?.toString(),
      };
    })
    .toArray();
  return <FooterLinks links={links} />;
};

const CardPreview = ({ entry, getAsset, assetsByLocale }) => {
  const cards = assetsByLocale['en'].cards;

  const data = entry.getIn(['data']).toJS();
  const content = data.body;

  const card = processCard({ data, content }, cards);

  card.data.image = getAsset(card.data.image).toString();

  return <Card card={card} />;
};

const withAssetsByLocale = (Component, assetsByLocale) => {
  const WrappedComponent = (props) => (
    <Component {...props} assetsByLocale={assetsByLocale} />
  );
  WrappedComponent.displayName = `withAssetsByLocale(${Component.displayName})`;
  return WrappedComponent;
};

const DecapCms = (assetsByLocale) =>
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

        console.log('assetsByLocale', assetsByLocale);
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

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locales }) => {
  const assetsTasks = locales.map(async (locale) => {
    const rawCards = fetchCards(locale);
    const cardTasks = rawCards.map(async (card) => {
      return processCard(card, rawCards);
    });
    const cards = await Promise.all(cardTasks);

    return {
      locale,
      cards,
    };
  });

  const assets = await Promise.all(assetsTasks);
  const assetsByLocale = assets.reduce((assets, asset) => {
    assets[asset.locale] = asset;
    return assets;
  }, {});

  return {
    props: {
      assetsByLocale,
    },
  };
};

const Admin = ({ assetsByLocale }) => {
  const Cms = DecapCms(assetsByLocale);
  return (
    <>
      <Head>
        <title>Content Manager</title>
      </Head>
      <Script
        id="netlify-identity-widget"
        src="https://identity.netlify.com/v1/netlify-identity-widget.js"
      />
      <Cms />
    </>
  );
};

export default Admin;

Admin.getLayout = (page) => page;
