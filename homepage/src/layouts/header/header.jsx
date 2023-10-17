import Navigator from './navigator';

const Header = ({ nav = [], siteData }) => (
  <header className="site-header fixed-top">
    <div className="container">
      <Navigator logo={siteData.logo} navigationItems={nav} />
    </div>
  </header>
);

export default Header;
