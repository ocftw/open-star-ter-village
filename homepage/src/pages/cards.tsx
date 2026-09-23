import type { GetStaticProps } from 'next';
import React from 'react';
import Head from 'next/head';
import contentMapper from '../layouts/contentMapper';
import { getLayout } from '../lib/service/getLayout';
import { getPage } from '../lib/service/getPage';
import type { Locale } from '../lib/i18n';
import type { HeadInfo, Layout } from '../types/content';

type CardsPageProps = {
  headInfo: HeadInfo;
  page: Awaited<ReturnType<typeof getPage>>;
  layout: Layout;
};

export const getStaticProps: GetStaticProps<CardsPageProps> = async (
  context,
) => {
  const locale = context.locale as Locale;
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

const CardsPage: React.FC<CardsPageProps> = ({ headInfo, page }) => {
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

export default CardsPage;
