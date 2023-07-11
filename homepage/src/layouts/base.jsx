import Footer from './footer';
import Header from './header';

const Base = ({ children, nav }) => (
  <>
    <Header nav={nav} />
    <main>{children}</main>
    <Footer />
  </>
);

export default Base;
