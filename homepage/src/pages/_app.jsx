import { useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import PageWrapper from '../layouts/pageWrapper';
import { pageview, GTM_ID } from '../lib/gtm';
import '../../public/css/style.css';

const useRouteChangeComplete = (callback) => {
  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeComplete', callback);
    return () => {
      router.events.off('routeChangeComplete', callback);
    };
  }, [router.events]);
};

const siteDataDictionary = {
  en: {
    title: `OpenStarTerVillage`,
    description: `How can technology change the world? Play this board game and discover the answer for yourself!`,
    logo: `/images/logo.png`,
  },
  'zh-tw': {
    title: `開源星手村`,
    description: `科技怎麼改變世界？玩桌遊、就知道！`,
    logo: `/images/logo.png`,
  },
};

const getDefaultLayout = (page, pageProps, siteData) => {
  return (
    <PageWrapper nav={pageProps.navigationList} siteData={siteData}>
      {page}
    </PageWrapper>
  );
};

export default function App({ Component, pageProps, router }) {
  const siteData = siteDataDictionary[router.locale];
  useRouteChangeComplete(pageview);

  const getLayout = Component.getLayout || getDefaultLayout;

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      {/* <!-- Google tag (gtag.js) --> */}
      <Script
        id="gtag-base"
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
      {getLayout(<Component {...pageProps} />, pageProps, siteData)}
    </>
  );
}
