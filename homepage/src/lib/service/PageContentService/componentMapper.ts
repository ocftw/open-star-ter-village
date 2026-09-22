import { titleToAnchorId } from '../../utils/titleToAnchorId';
import type { Card, CardsLayout, PageLayout } from '../../../types/content';
import type {
  BannerProps,
  CardsProps,
  ColumnsProps,
  CtaBannerProps,
  HeadlineProps,
  ImageAndTextProps,
  SectionProps,
} from '../../../types/components';

const removeUndefined = <T extends object>(obj: T): T => {
  const newObj: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      newObj[key] = value;
    }
  });
  return newObj as T;
};

export const componentTypes = {
  Banner: 'Banner',
  Headline: 'Headline',
  OneColumn: 'OneColumn',
  TwoColumns: 'TwoColumns',
  ThreeColumns: 'ThreeColumns',
  ImageAndText: 'ImageAndText',
  CtaBanner: 'CtaBanner',
  Cards: 'Cards',
} as const;

export type PageComponent =
  | { type: typeof componentTypes.Banner; props: BannerProps }
  | { type: typeof componentTypes.Headline; props: HeadlineProps }
  | { type: typeof componentTypes.OneColumn; props: SectionProps }
  | { type: typeof componentTypes.TwoColumns; props: ColumnsProps }
  | { type: typeof componentTypes.ThreeColumns; props: ColumnsProps }
  | { type: typeof componentTypes.ImageAndText; props: ImageAndTextProps }
  | { type: typeof componentTypes.CtaBanner; props: CtaBannerProps }
  | { type: typeof componentTypes.Cards; props: CardsProps }
  | { type: ''; props: Record<string, never> };

export const componentMapper = (
  layout: PageLayout,
  cards: Card[] = [],
): PageComponent => {
  let component: PageComponent = { type: '', props: {} };
  switch (layout.type) {
    case 'layout_banner': {
      component = {
        type: componentTypes.Banner,
        props: {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          subtitle: layout.subtitle,
          heroImage: layout.hero_image,
          highlights: layout.highlights,
        },
      };
      break;
    }
    case 'layout_headline': {
      component = {
        type: componentTypes.Headline,
        props: {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          subtitle: layout.subtitle,
        },
      };
      break;
    }
    case 'layout_image_text': {
      component = {
        type: componentTypes.ImageAndText,
        props: {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          subtitle: layout.subtitle,
          image: layout.image,
          content: layout.text,
          highlights: layout.highlights,
          markdown: true,
        },
      };
      break;
    }
    case 'layout_cta_banner': {
      component = {
        type: componentTypes.CtaBanner,
        props: {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          content: layout.text,
          ctaLabel: layout.cta_label,
          ctaUrl: layout.cta_url,
          analyticsId: layout.analytics_id,
          openInNewTab: layout.open_in_new_tab,
        },
      };
      break;
    }
    case 'layout_section': {
      const columnCount = layout.columns?.length;
      if (columnCount !== undefined && columnCount <= 1) {
        component = {
          type: componentTypes.OneColumn,
          props: {
            id: titleToAnchorId(layout.title),
            title: layout.title,
            subtitle: layout.columns?.[0]?.title,
            image: layout.columns?.[0]?.image,
            content: layout.columns?.[0]?.text,
            markdown: true,
          },
        };
        break;
      } else if (columnCount === 2) {
        component = {
          type: componentTypes.TwoColumns,
          props: {
            id: titleToAnchorId(layout.title),
            title: layout.title,
            columns: layout.columns!,
            markdown: true,
          },
        };
        break;
      } else if (columnCount !== undefined && columnCount >= 3) {
        component = {
          type: componentTypes.ThreeColumns,
          props: {
            id: titleToAnchorId(layout.title),
            title: layout.title,
            columns: layout.columns!,
            markdown: true,
          },
        };
        break;
      }
    }
    // falls through: a section without columns renders as unfiltered cards
    case 'layout_cards': {
      const { card_type, card_tags } = layout as CardsLayout;
      let filteredCards = cards;
      // filter cards by card_type
      if (card_type) {
        filteredCards = cards.filter((card) => card_type === card.data.type);
      }
      // filter cards by card_tags
      if (card_tags && card_tags.length > 0) {
        filteredCards = filteredCards.filter((card) =>
          card_tags.every((tag) => card.data.tags?.includes(tag)),
        );
      }

      component = {
        type: componentTypes.Cards,
        props: {
          id: titleToAnchorId(layout.title),
          title: layout.title,
          cards: filteredCards,
        },
      };
      break;
    }
  }

  return {
    ...component,
    props: removeUndefined(component.props),
  } as PageComponent;
};
