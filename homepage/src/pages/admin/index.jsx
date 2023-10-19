import dynamic from 'next/dynamic';
import Head from 'next/head';
import Script from 'next/script';
import config from './config.json';

import FooterLinks from '../../layouts/footer/footerLinks';
import { componentMapper } from '../../lib/componentMapper';
import contentMapper from '../../layouts/contentMapper';

const PagePreview = ({ entry }) => {
  const layoutList = entry.getIn(['data', 'layout_list']);
  const sections = layoutList?.map((layout) => {
    const component = componentMapper(layout.toJS(), []);
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

const CMS = dynamic(
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

      cms.registerPreviewTemplate('pages', PagePreview);
      cms.registerPreviewTemplate('footer', FooterPreview);
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

Admin.getLayout = (page) => page;
