import Footer from '../footer/footer';
import Header from '../header/header';

const SiteLayout = ({ children, nav, siteData, pageProps, header, footer }) => (
  <>
    <Header nav={nav} siteData={siteData} {...header} />
    <main>{children}</main>
    <Footer siteData={siteData} {...footer} />
  </>
);

export default SiteLayout;
