import Head from 'next/head';
import Script from 'next/script';

import { fetchCards } from '../../lib/fetchCards';
import { processCard } from '../../lib/processCard';
import { DecapCms } from './DecapCms';

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
