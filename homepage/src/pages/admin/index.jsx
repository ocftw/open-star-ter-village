import dynamic from 'next/dynamic';
import Head from 'next/head';
import Script from 'next/script';
import config from './config.json';

import Banner from '../../components/banner';
import ImageAndText from '../../components/imageAndText';
import Headline from '../../components/headline';

const PagePreview = ({ entry }) => {
  const layoutList = entry.getIn(['data', 'layout_list']);
  const sections = layoutList?.map((layout) => {
    const layoutType = layout.get('type')?.toString();
    if (layoutType === 'layout_banner') {
      return (
        <Banner
          key={layout.get('title')?.toString()}
          heroImage={layout.get('hero_image')?.toString()}
          title={layout.get('title')?.toString()}
          subtitle={layout.get('subtitle')?.toString()}
          highlights={layout.get('highlights')?.toArray()}
        />
      );
    } else if (layoutType === 'layout_image_text') {
      return (
        <ImageAndText
          key={layout.get('title')?.toString()}
          id={layout.get('title')?.toString()}
          image={layout.get('image')?.toString()}
          title={layout.get('title')?.toString()}
          subtitle={layout.get('subtitle')?.toString()}
          content={layout.get('text')?.toString()}
          highlights={layout.get('highlights')?.toArray()}
        />
      );
    } else if (layoutType === 'layout_headline') {
      return (
        <Headline
          key={layout.get('title')?.toString()}
          title={layout.get('title')?.toString()}
          subtitle={layout.get('subtitle')?.toString()}
        />
      );
    } else {
      return <div key={layout.get('title')?.toString()}></div>;
    }
  });
  return <div>{sections}</div>;
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
