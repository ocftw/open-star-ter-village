import contentMapper from '../layouts/contentMapper';
import { componentMapper } from '../lib/componentMapper';
import { fetchPage } from '../lib/fetchPage';
import { getNavigationList } from '../lib/getNavigationList';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = fetchPage(locale, 'resource');
  const contentList = page.data['layout_list']?.map(componentMapper);
  const navigationList = await getNavigationList(locale);

  return {
    props: {
      page: {
        contentList,
      },
      navigationList,
    },
  };
};

export default function Resource({ page }) {
  return <>{page.contentList?.map(contentMapper)}</>;
}
