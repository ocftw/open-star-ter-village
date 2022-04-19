import './AppHeader.css';
import { Header, Link } from './AppHeader.styled';
import logo from './logo.svg';

const AppHeader: React.FC = () => {
  return (
    <Header>
      <img src={logo} className="app-logo" alt="logo" />
      <p>
        OpenStarTerVillage
      </p>
      <Link
        href="https://github.com/ocftw/open-star-ter-village"
        target="_blank"
        rel="noopener noreferrer"
      >
        Clone from github
      </Link>
    </Header>
  )
}

export default AppHeader;
