const Header = ({ data }) => (
  <header className="site-header">
    <div className="container">
      <div className="header-main">
        <div className="logo">
          <a href="/">
            <img src={`images/logo.png`} alt="logo" />
            <span>{data.siteName}</span>
          </a>
        </div>
        <div className="responsive-menu">
          <span></span>
        </div>
        <div className="menu">
          <ul>
            <li key="page-top">
              <a href={`/#page-top`}>回到頁首</a>
            </li>
            <li key="project-intro">
              <a href="/#project-intro">專案介紹</a>
            </li>
            <li key="game-intro">
              <a href={`/#game-intro`}>遊戲介紹</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </header>
)

export default Header
