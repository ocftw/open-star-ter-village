import Footer from './footer/footer';
import Header from './header/header';

const PageWrapper = ({ children, nav, siteData }) => (
  <>
    <Header nav={nav} siteData={siteData} />
    <main>{children}</main>
    <Footer siteData={siteData} />
  </>
);

export default PageWrapper;
