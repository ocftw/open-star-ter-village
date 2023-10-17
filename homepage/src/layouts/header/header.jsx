import AnchorNavigator from './anchorNavigator';
import Navigator from './navigator';

const Header = ({ nav = [], siteData, pageProps }) => (
  <header className="site-header fixed-top">
    <div className="container">
      <Navigator logo={siteData.logo} navigationItems={nav} />
      {/* skip level 1 anchors */}
      <AnchorNavigator anchors={pageProps?.page?.anchors?.filter(anchor => anchor.level === 2)} />
    </div>
  </header>
);

export default Header;
