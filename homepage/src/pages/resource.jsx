import Head from 'next/head';
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
  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Resource`,
      'zh-tw': `開源星手村 - 資源頁`,
    },
  };

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
      headInfo: {
        title: headInfo.title[locale],
        description: '',
      },
      page: {
        contentList,
      },
      layout,
    },
  };
};

export default function Resource({ page, headInfo }) {
  return (
    <>
      <Head>
        <title>{headInfo.title}</title>
        <meta name="description" content={headInfo.description} />
      </Head>
      {page.contentList?.map(contentMapper)}
    </>
  );
}
