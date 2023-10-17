import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

const languageLabelDictionary = {
  en: 'English',
  'zh-tw': '中文',
};

const LanguageDropdownMenu = () => {
  const router = useRouter();
  const { asPath, locales } = router;
  return (
    <div className="dropdown-menu">
      {locales.map((locale) => (
        <Link
          key={languageLabelDictionary[locale]}
          className="dropdown-item"
          href={`/${locale}${asPath}`}
          locale={false}
        >
          {languageLabelDictionary[locale]}
        </Link>
      ))}
    </div>
  );
};

const Navigator = ({ logo, navigationItems }) => (
  <nav className="navbar navbar-expand-lg">
    <div className="logo navbar-brand">
      <Link href="/">
        <Image src={logo} height="48" width="60" alt="logo" />
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
        {navigationItems.map((item) => (
          <li key={`nav-item-${item.text}`} className="nav-item">
            <Link className="nav-link" href={item.link}>
              {item.text}
            </Link>
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
