import Footer from './footer';
import Header from './header';

const Base = ({ children, nav, siteData }) => (
  <>
    <Header nav={nav} siteData={siteData} />
    <main>{children}</main>
    <Footer siteData={siteData} />
  </>
);

export default Base;
