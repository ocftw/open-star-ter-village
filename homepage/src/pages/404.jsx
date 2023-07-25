import Head from 'next/head';
import Base from '../layouts/base';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const homepage = {
    en: 'Home',
    'zh-tw': '首頁',
  };

  const navigationList = [{ link: `/`, text: homepage[locale] }];

  const desc = {
    en: `
      Having an issue? Find 兔摩. <a href="https://forms.gle/t9j8dbiKUohny8PZ8">Fill out the form</a> to report the problem!
    `,
    'zh-tw': `
      有問題？找兔摩。<a href="https://forms.gle/t9j8dbiKUohny8PZ8">填寫表單</a>回報你找到的問題吧！
    `,
  };

  return {
    props: {
      navigationList,
      desc: desc[locale],
    },
  };
};

const NotFoundPage = ({ navigationList, desc }) => (
  <Base nav={navigationList}>
    <Head>
      <title>{`開源星手村 - 找不到網頁`}</title>
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
  </Base>
);

export default NotFoundPage;
