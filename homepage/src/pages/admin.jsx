import Head from 'next/head';
import Script from 'next/script';

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
