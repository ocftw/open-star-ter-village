import Head from 'next/head';

import { fetchAllCards } from '../lib/repository/fetchAllCards';
import DecapCms from '../CMS/DecapCms';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locales }) => {
  const assets = locales.map((locale) => {
    const cards = fetchAllCards(locale);

    return {
      locale,
      cards,
    };
  });

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
  return (
    <>
      <Head>
        <title>Content Manager</title>
      </Head>
      <DecapCms assetsByLocale={assetsByLocale} />
    </>
  );
};

export default Admin;

Admin.getLayout = (page) => page;
