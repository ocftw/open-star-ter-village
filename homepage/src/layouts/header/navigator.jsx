import Image from 'next/image';
import Link from 'next/link';
import LanguageDropdownMenu from './languageDropdownMenu';

const Navigator = ({ logo, navigationItems }) => (
  <nav className="navbar navbar-expand-md">
    <div className="logo navbar-brand">
      <Link href="/">
        <Image src={logo} height="48" width="60" alt="logo" />
      </Link>
    </div>
    <button
      className="navbar-toggler"
      type="button"
      data-toggle="collapse"
      data-target="#navigatorItems"
      aria-controls="navigatorItems"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <i className="fas fa-bars"></i>
    </button>
    <div className="collapse navbar-collapse" id="navigatorItems">
      <ul className="navbar-nav ml-auto">
        {navigationItems.map((item) => (
          <li key={item.text} className="nav-item dropdown">
            <a
              className="nav-link dropdown-toggle"
              data-toggle="dropdown"
              href="#"
              role="button"
              aria-haspopup="true"
              aria-expanded="false"
            >
              {item.text}
            </a>
            <div className="dropdown-menu dropdown-menu-right">
              <Link className="dropdown-item" href={item.link}>
                {item.text}
              </Link>
              <div className="dropdown-divider"></div>
              {item.subNavigation.map((subNav) => (
                <Link
                  key={subNav.text}
                  className="dropdown-item text-wrap-md"
                  href={subNav.link}
                >
                  {subNav.text}
                </Link>
              ))}
            </div>
          </li>
        ))}
        <li className="nav-item dropdown">
          <a
            className="nav-link dropdown-toggle"
            data-toggle="dropdown"
            href="#"
            role="button"
            aria-haspopup="true"
            aria-expanded="false"
          >
            🌐
          </a>
          <LanguageDropdownMenu />
        </li>
      </ul>
    </div>
  </nav>
);

export default Navigator;
