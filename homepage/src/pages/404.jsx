import Head from 'next/head'
import Base from '../layouts/base';

const navigationList = [
  { link: `/`, text: `首頁` },
]

const NotFoundPage = () => (
  <Base nav={navigationList}>
    <Head>
      <title>{`開源星手村 - 找不到網頁`}</title>
      <meta name="description" content="" />
    </Head>
    <div className="site-container not-found-page">
      <div className="container text-center">
        <h1>NOT FOUND</h1>
        <p>有問題？找兔摩。<a href='https://forms.gle/t9j8dbiKUohny8PZ8'>填寫表單</a>回報你找到的問題吧！</p>
      </div>
    </div>
  </Base>
);

export default NotFoundPage
