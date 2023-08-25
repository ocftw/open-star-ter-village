import dynamic from 'next/dynamic';
import Head from 'next/head';
import Script from 'next/script';
import config from './config.json';

const CMS = dynamic(
  () =>
    import('decap-cms-app').then((cms) => {
      cms.init({ config });
    }),
  { ssr: false, loading: () => <p>Loading...</p> },
);

const Admin = () => {
  return (
    <>
      <Head>
        <title>Content Manager</title>
      </Head>
      <Script
        id="netlify-identity-widget"
        src="https://identity.netlify.com/v1/netlify-identity-widget.js"
      />
      <CMS />
    </>
  );
};

export default Admin;
