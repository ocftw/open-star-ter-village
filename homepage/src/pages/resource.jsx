import Banner from '../components/banner';
import TwoColumns from '../components/twoColumns';
import ThreeColumns from '../components/threeColumns';
import ImageAndText from '../components/imageAndText';
import Section from '../components/section';
import Headline from '../components/headline';

import { fetchPage } from '../lib/fetchPage';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = fetchPage(locale, 'resource');

  return {
    props: {
      page,
    },
  };
};

export default function Resource({ page }) {
  return (
    <>
      {page.data['layout_list']?.map((layout) => {
        switch (layout.type) {
          case 'layout_banner':
            return (
              <Banner
                key={layout?.title}
                title={layout?.title}
                subtitle={layout?.subtitle}
                heroImage={layout?.heroImage}
                highlights={layout?.highlights}
              />
            );
          case 'layout_section':
            if (layout.columns?.length === 2) {
              const columns = layout.columns?.map((column) => {
                return [column?.title, column?.text];
              });
              return (
                <TwoColumns
                  key={layout?.title}
                  id={layout?.id}
                  title={layout?.title}
                  columns={columns}
                />
              );
            } else if (layout.columns?.length === 3) {
              const columns = layout.columns?.map((column) => {
                return [column?.title, column?.text];
              });
              return (
                <ThreeColumns
                  key={layout?.title}
                  id={layout?.id}
                  title={layout?.title}
                  columns={columns}
                />
              );
            } else {
              return (
                <Section
                  key={layout?.title}
                  id={layout?.id}
                  title={layout?.title}
                  subtitle={layout?.columns[0].title}
                  content={layout?.columns[0].text}
                />
              );
            }
          case 'layout_image_text':
            return (
              <ImageAndText
                key={layout?.title}
                id={layout?.id}
                image={layout?.image}
                title={layout?.title}
                subtitle={layout?.subtitle}
                content={layout?.text}
                highlights={layout?.highlights}
              />
            );
          case 'layout_headline':
            return <Headline key={layout?.title} title={layout?.title} />;
          default:
            return null;
        }
      })}
    </>
  );
}
