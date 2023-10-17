import Footer from '../footer/footer';
import Header from '../header/header';

const SiteLayout = ({ children, nav, siteData, pageProps }) => (
  <>
    <Header nav={nav} siteData={siteData} />
    <main>{children}</main>
    <Footer siteData={siteData} />
  </>
);

export default SiteLayout;
