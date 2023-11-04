import Head from 'next/head';
import contentMapper from '../layouts/contentMapper';
import { getLayout } from '../lib/getLayout';
import { getPage } from '../lib/getPage';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = await getPage('cards', locale);

  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Card Introduction`,
      'zh-tw': `開源星手村 - 卡片介紹`,
    },
  };

  const layout = await getLayout(locale);

  return {
    props: {
      headInfo: {
        title: headInfo.title[locale],
        description: '',
      },
      page,
      layout,
    },
  };
};

const cards = ({ headInfo, page }) => {
  return (
    <>
      <Head>
        <title>{headInfo.title}</title>
        <meta name="description" content={headInfo.description} />
      </Head>
      {page.contentList?.map(contentMapper)}
    </>
  );
};

export default cards;
