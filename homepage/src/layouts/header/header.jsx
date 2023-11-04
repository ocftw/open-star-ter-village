import Navigator from './navigator';

const Header = ({ nav = [], siteData, navigation = [] }) => (
  <header className="site-header fixed-top">
    <div className="container">
      <Navigator logo={siteData.logo} navigationItems={navigation} />
    </div>
  </header>
);

export default Header;
