import Banner from '../components/banner';
import TwoColumns from '../components/twoColumns';
import ThreeColumns from '../components/threeColumns';
import ImageAndText from '../components/imageAndText';
import Section from '../components/section';
import Headline from '../components/headline';

const contentMapper = (layout) => {
  switch (layout.type) {
    case 'layout_banner':
      return (
        <Banner
          key={layout.title}
          id={layout.id}
          title={layout.title}
          subtitle={layout.subtitle}
          heroImage={layout.hero_image}
          highlights={layout.highlights}
        />
      );
    case 'layout_section':
      if (layout.columns?.length === 2) {
        return (
          <TwoColumns
            key={layout.title}
            id={layout.id}
            title={layout.title}
            columns={layout.columns}
            markdown={true}
          />
        );
      } else if (layout.columns?.length === 3) {
        return (
          <ThreeColumns
            key={layout.title}
            id={layout.id}
            title={layout.title}
            columns={layout.columns}
            markdown={true}
          />
        );
      } else {
        return (
          <Section
            key={layout.title}
            id={layout.id}
            title={layout.title}
            subtitle={layout.columns?.[0]?.title}
            image={layout.columns?.[0]?.image}
            content={layout.columns?.[0]?.text}
            markdown={true}
          />
        );
      }
    case 'layout_image_text':
      return (
        <ImageAndText
          key={layout.title}
          id={layout.id}
          image={layout.image}
          title={layout.title}
          subtitle={layout.subtitle}
          content={layout.text}
          highlights={layout.highlights}
          markdown={true}
        />
      );
    case 'layout_headline':
      return <Headline key={layout.title} title={layout.title} />;
    default:
      return null;
  }
};

export default contentMapper;
