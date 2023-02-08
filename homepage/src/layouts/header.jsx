import { siteData } from "../constants"

const Header = ({ logo, nav }) => (
  <header className="site-header fixed-top">
    <div className="container">
      <nav className="navbar navbar-expand-lg">
        <div className="logo navbar-brand">
          <a href="/">
            <img src={logo} height="48" alt="logo" />
          </a>
        </div>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarItems" aria-controls="navbarItems" aria-expanded="false" aria-label="Toggle navigation">
          <i className="fas fa-bars"></i>
        </button>
        <div className="collapse navbar-collapse justify-content-end align-items-end" id="navbarItems">
          <ul className="navbar-nav">
            {
              nav.map(menuItem => (
                <li key={`nav-item-${menuItem.text}`} className="nav-item">
                  <a className="nav-link" href={menuItem.link}>{menuItem.text}</a>
                </li>
              ))
            }
          </ul>
        </div>
      </nav>
    </div>
  </header>
)

Header.defaultProps = {
  logo: siteData.logo,
  nav: [],
}

export default Header
