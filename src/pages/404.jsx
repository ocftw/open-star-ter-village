import Base from '../layouts/base';

const siteData = {
  siteName: `開源星手村`,
  description: ``,
  logo: `/images/logo.png`,
}

const socialData = {
  instagram: `https://instagram.com/openstartervillage/`,
  discord: `https://discord.gg/JnTHGnxwYS`,
  github: `https://github.com/ocftw/open-star-ter-village`,
}

const navigationList = [
  { link: `/`, text: `首頁` },
]

const NotFoundPage = () => (
  <Base data={{ ...siteData, social: socialData, nav: navigationList }}>
    <div className="site-container not-found-page">
      <div className="container text-center">
        <h1>NOT FOUND</h1>
        <p>有問題？找兔摩。<a href='https://forms.gle/t9j8dbiKUohny8PZ8'>填寫表單</a>回報你找到的問題吧！</p>
      </div>
    </div>
  </Base>
);

NotFoundPage.__staticPageOptions = {
  title: siteData.siteName,
  description: siteData.description,
}

export default NotFoundPage
