import dynamic from 'next/dynamic';
import Head from 'next/head';
import Script from 'next/script';
import config from './config.json';

import Banner from '../../components/banner';
import ImageAndText from '../../components/imageAndText';
import Headline from '../../components/headline';
import Section from '../../components/section';
import TwoColumns from '../../components/twoColumns';
import ThreeColumns from '../../components/threeColumns';
import FooterLinks from '../../layouts/footer/footerLinks';

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
      const highlights = layout
        .get('highlights')
        ?.map((highlight) => {
          return {
            item: highlight.get('item')?.toString(),
            description: highlight.get('description')?.toString(),
          };
        })
        ?.toArray();
      return (
        <ImageAndText
          key={layout.get('title')?.toString()}
          id={layout.get('title')?.toString()}
          image={layout.get('image')?.toString()}
          title={layout.get('title')?.toString()}
          subtitle={layout.get('subtitle')?.toString()}
          content={layout.get('text')?.toString()}
          highlights={highlights}
          markdown={true}
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
    } else if (layoutType === 'layout_section') {
      const columnSize = layout.get('columns')?.size ?? 0;
      if (columnSize === 0 || columnSize === 1) {
        return (
          <Section
            key={layout.get('title')?.toString()}
            id={layout.get('title')?.toString()}
            title={layout.get('title')?.toString()}
            subtitle={layout.getIn(['columns', 0, 'title'])?.toString()}
            image={layout.getIn(['columns', 0, 'image'])?.toString()}
            content={layout.getIn(['columns', 0, 'text'])?.toString()}
            markdown={true}
          />
        );
      } else if (columnSize === 2) {
        const columns = layout
          .get('columns')
          ?.map((column) => {
            return {
              title: column.get('title')?.toString(),
              image: column.get('image')?.toString(),
              text: column.get('text')?.toString(),
            };
          })
          .toArray();
        return (
          <TwoColumns
            key={layout.get('title')?.toString()}
            id={layout.get('title')?.toString()}
            title={layout.get('title')?.toString()}
            columns={columns}
            markdown={true}
          />
        );
      } else if (columnSize >= 3) {
        const columns = layout
          .get('columns')
          ?.map((column) => {
            return {
              title: column.get('title')?.toString(),
              image: column.get('image')?.toString(),
              text: column.get('text')?.toString(),
            };
          })
          .toArray();
        return (
          <ThreeColumns
            key={layout.get('title')?.toString()}
            id={layout.get('title')?.toString()}
            title={layout.get('title')?.toString()}
            columns={columns}
            markdown={true}
          />
        );
      }
    } else {
      return <div key={layout.get('title')?.toString()}></div>;
    }
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
