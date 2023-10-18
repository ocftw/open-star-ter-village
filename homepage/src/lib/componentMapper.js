import { titleToAnchorId } from './titleToAnchorId';

const removeUndefined = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}

export const componentTypes = {
  Banner: 'Banner',
  Headline: 'Headline',
  OneColumn: 'OneColumn',
  TwoColumns: 'TwoColumns',
  ThreeColumns: 'ThreeColumns',
  ImageAndText: 'ImageAndText',
}

export const componentMapper = (layout) => {
  let type = '';
  let props = {};
  switch (layout.type) {
    case 'layout_banner': {
      type = componentTypes.Banner;
      props = {
        id: titleToAnchorId(layout.title),
        title: layout.title,
        subtitle: layout.subtitle,
        heroImage: layout.hero_image,
        highlights: layout.highlights,
      };
      break;
    }
    case 'layout_headline': {
      type = componentTypes.Headline;
      props = {
        id: titleToAnchorId(layout.title),
        title: layout.title,
        subtitle: layout.subtitle,
      };
      break;
    }
    case 'layout_image_text': {
      type = componentTypes.ImageAndText;
      props = {
        id: titleToAnchorId(layout.title),
        title: layout.title,
        subtitle: layout.subtitle,
        image: layout.image,
        content: layout.text,
        highlights: layout.highlights,
        markdown: true,
      };
      break;
    }
    case 'layout_section': {
      if (layout.columns?.length === 1) {
        type = componentTypes.OneColumn;
        props = {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          subtitle: layout.columns?.[0]?.title,
          image: layout.columns?.[0]?.image,
          content: layout.columns?.[0]?.text,
          markdown: true,
        };
        break;
      } else if (layout.columns?.length === 2) {
        type = componentTypes.TwoColumns;
        props = {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          columns: layout.columns,
          markdown: true,
        };
        break;
      } else if (layout.columns?.length === 3) {
        type = componentTypes.ThreeColumns;
        props = {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          columns: layout.columns,
          markdown: true,
        };
        break;
      }
    }
  }

  return {
    type,
    props: removeUndefined(props),
  };
}
