import Navigator from './navigator';
import type { NavigationItem, SiteData } from '../../types/content';

type HeaderProps = {
  siteData: SiteData;
  navigation?: NavigationItem[];
};

const Header = ({ siteData, navigation = [] }: HeaderProps) => (
  <header className="site-header sticky-top">
    <div className="container">
      <Navigator logo={siteData.logo} navigationItems={navigation} />
    </div>
  </header>
);

export default Header;
