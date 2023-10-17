import Footer from '../footer/footer';
import Header from '../header/header';

const SiteLayout = ({ children, nav, siteData, pageProps }) => (
  <>
    <Header nav={nav} siteData={siteData} pageProps={pageProps} />
    <main data-bs-spy="scroll" data-bs-target="#anchor-nav" data-bs-root-margin="0px 0px -40%" data-bs-smooth-scroll="true">{children}</main>
    <Footer siteData={siteData} />
  </>
);

export default SiteLayout;
