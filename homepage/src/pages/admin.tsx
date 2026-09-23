import type { GetStaticProps } from 'next';
import React, { type ReactElement } from 'react';
import Head from 'next/head';

import { fetchAllCards } from '../lib/repository/fetchAllCards';
import DecapCms from '../CMS/DecapCms';
import type { AssetsByLocale } from '../types/content';

type Props = {
  assetsByLocale: AssetsByLocale;
};

export const getStaticProps: GetStaticProps<Props> = async ({
  locales = [],
}) => {
  const assets = locales.map((locale) => {
    const cards = fetchAllCards(locale);

    return {
      locale,
      cards,
    };
  });

  const assetsByLocale = assets.reduce<AssetsByLocale>((assets, asset) => {
    assets[asset.locale] = asset;
    return assets;
  }, {});

  return {
    props: {
      assetsByLocale,
    },
  };
};

const Admin: React.FC<Props> & {
  getLayout?: (page: ReactElement) => ReactElement;
} = ({ assetsByLocale }) => {
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

Admin.getLayout = (page: ReactElement) => page;
