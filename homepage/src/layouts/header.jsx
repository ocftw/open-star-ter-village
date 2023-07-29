import Image from 'next/image';
import Link from 'next/link';

const Header = ({ nav, siteData }) => (
  <header className="site-header fixed-top">
    <div className="container">
      <nav className="navbar navbar-expand-lg">
        <div className="logo navbar-brand">
          <Link href="/">
            <Image src={siteData.logo} height="48" width="60" alt="logo" />
          </Link>
        </div>
        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarItems"
          aria-controls="navbarItems"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <i className="fas fa-bars"></i>
        </button>
        <div
          className="collapse navbar-collapse justify-content-end align-items-end"
          id="navbarItems"
        >
          <ul className="navbar-nav">
            {nav.map((menuItem) => (
              <li key={`nav-item-${menuItem.text}`} className="nav-item">
                <Link className="nav-link" href={menuItem.link}>
                  {menuItem.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  </header>
);

Header.defaultProps = {
  nav: [],
};

export default Header;
