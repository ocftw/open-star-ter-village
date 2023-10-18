import Banner from '../components/banner';
import TwoColumns from '../components/twoColumns';
import ThreeColumns from '../components/threeColumns';
import ImageAndText from '../components/imageAndText';
import Section from '../components/section';
import Headline from '../components/headline';
import { componentTypes } from '../lib/componentMapper';

const contentMapper = (component) => {
  switch (component.type) {
    case componentTypes.Banner:
      return <Banner key={component.id} {...component.props} />;
    case componentTypes.Headline:
      return <Headline key={component.id} {...component.props} />;
    case componentTypes.ImageAndText:
      return <ImageAndText key={component.id} {...component.props} />;
    case componentTypes.OneColumn:
      return <Section key={component.id} {...component.props} />;
    case componentTypes.TwoColumns:
      return <TwoColumns key={component.id} {...component.props} />;
    case componentTypes.ThreeColumns:
      return <ThreeColumns key={component.id} {...component.props} />;
    default:
      return null;
  }
};

export default contentMapper;
