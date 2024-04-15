import Head from 'next/head';
import contentMapper from '../layouts/contentMapper';
import { getLayout } from '../lib/service/getLayout';
import { getPage } from '../lib/service/getPage';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const page = await getPage('cards', locale);

  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Card Introduction`,
      'zh-Hant': `開源星手村 - 卡片介紹`,
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
