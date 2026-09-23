import React, { type ReactElement } from 'react';
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import Head from 'next/head';
import Script from 'next/script';
import SiteLayout from '../layouts/siteLayout/siteLayout';
import LinkClickTracker from '../components/linkClickTracker';
import { GTM_ID } from '../lib/service/gtm';
import type { Locale } from '../lib/i18n';
import type { Layout, SiteData } from '../types/content';
import '../../public/css/style.css';

type PageProps = {
  layout?: Layout;
};

type GetLayout = (
  page: ReactElement,
  pageProps: PageProps,
  siteData: SiteData,
) => ReactElement;

type PageWithLayout = NextPage<PageProps> & {
  getLayout?: GetLayout;
};

type AppWithLayoutProps = AppProps<PageProps> & {
  Component: PageWithLayout;
};

const siteDataDictionary: Record<Locale, SiteData> = {
  en: {
    title: `OpenStarTerVillage`,
    description: `How can technology change the world? Play this board game and discover the answer for yourself!`,
    logo: `/images/logo.png`,
  },
  'zh-Hant': {
    title: `開源星手村`,
    description: `科技怎麼改變世界？玩桌遊、就知道！`,
    logo: `/images/logo.png`,
  },
};

const getDefaultLayout: GetLayout = (page, pageProps, siteData) => {
  return (
    <SiteLayout siteData={siteData} {...pageProps.layout}>
      {page}
    </SiteLayout>
  );
};

const App: React.FC<AppWithLayoutProps> = ({
  Component,
  pageProps,
  router,
}) => {
  const siteData = siteDataDictionary[router.locale as Locale];

  const getLayout = Component.getLayout || getDefaultLayout;

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {GTM_ID && (
        <Script
          id="gtm-base"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer', '${GTM_ID}');
        `,
          }}
        />
      )}
      <LinkClickTracker locale={router.locale} />
      {getLayout(<Component {...pageProps} />, pageProps, siteData)}
    </>
  );
};

export default App;
