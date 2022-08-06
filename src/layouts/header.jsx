const Header = ({ data }) => (
  <header className="site-header fixed-top">
    <div className="container">
      <nav className="navbar navbar-expand-lg">
        <div className="logo navbar-brand">
          <a href="/">
            <img src={data.logo} height="48" alt="logo" />
          </a>
        </div>
        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarItems" aria-controls="navbarItems" aria-expanded="false" aria-label="Toggle navigation">
          <i className="fas fa-bars"></i>
        </button>
        <div className="collapse navbar-collapse justify-content-end align-items-end" id="navbarItems">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href={`#page-top`}>{`回到頁首`}</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href={`#project-intro`}>{`專案介紹`}</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href={`#game-intro`}>{`遊戲介紹`}</a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  </header>
)

export default Header
