import Footer from '../footer/footer';
import Header from '../header/header';

const SiteLayout = ({ children, siteData, pageProps, header, footer }) => (
  <>
    <Header siteData={siteData} {...header} />
    <main>{children}</main>
    <Footer siteData={siteData} {...footer} />
  </>
);

export default SiteLayout;
