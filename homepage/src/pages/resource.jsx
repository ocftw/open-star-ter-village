import contentMapper from '../layouts/contentMapper';
import { componentMapper } from '../lib/componentMapper';
import { fetchFooter } from '../lib/fetchFooter';
import { fetchPage } from '../lib/fetchPage';
import { getNavigationList } from '../lib/getNavigationList';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = fetchPage(locale, 'resource');
  const contentList = page.data['layout_list']?.map((layout) =>
    componentMapper(layout, []),
  );

  const navigation = await getNavigationList(locale);
  const header = {
    navigation,
  };
  const footer = fetchFooter(locale);
  const layout = {
    header,
    footer,
  };

  return {
    props: {
      page: {
        contentList,
      },
      navigationList: navigation,
      layout,
    },
  };
};

export default function Resource({ page }) {
  return <>{page.contentList?.map(contentMapper)}</>;
}
