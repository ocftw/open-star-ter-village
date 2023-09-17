import contentMapper from '../layouts/contentMapper';
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
      {page.data['layout_list']?.map(contentMapper)}
    </>
  );
}
