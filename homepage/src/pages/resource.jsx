import contentMapper from '../layouts/contentMapper';
import { fetchPage } from '../lib/fetchPage';
import { getNavigationList } from '../lib/getNavigationList';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = fetchPage(locale, 'resource');
  const navigationList = await getNavigationList(locale);

  return {
    props: {
      page,
      navigationList,
    },
  };
};

export default function Resource({ page }) {
  return <>{page.data['layout_list']?.map(contentMapper)}</>;
}
