import Head from 'next/head';
import { getNavigationList } from '../lib/getNavigationList';
import { fetchFooter } from '../lib/fetchFooter';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Page Not Found`,
      'zh-tw': `開源星手村 - 找不到網頁`,
    },
  };

  const desc = {
    en: `
      Bug report? Ask TwoMore. <a href="https://forms.gle/t9j8dbiKUohny8PZ8">Filling the form</a> to report a bug!
    `,
    'zh-tw': `
      有問題？找兔摩。<a href="https://forms.gle/t9j8dbiKUohny8PZ8">填寫表單</a>回報你找到的問題吧！
    `,
  };

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
      navigationList: navigation,
      headInfo: {
        title: headInfo.title[locale],
      },
      desc: desc[locale],
      layout,
    },
  };
};

const NotFoundPage = ({ headInfo, desc }) => (
  <>
    <Head>
      <title>{headInfo.title}</title>
      <meta name="description" content="" />
    </Head>
    <div className="site-container not-found-page">
      <div className="container text-center">
        <h1>NOT FOUND</h1>
        <p
          dangerouslySetInnerHTML={{
            __html: desc,
          }}
        ></p>
      </div>
    </div>
  </>
);

export default NotFoundPage;
