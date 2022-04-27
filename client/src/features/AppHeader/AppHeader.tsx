import styles from './AppHeader.module.css';
import logo from './logo.svg';

const AppHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <img className={styles.logo} src={logo} alt="logo" />
      <p>
        OpenStarTerVillage
      </p>
      <a
        className={styles.link}
        href="https://github.com/ocftw/open-star-ter-village"
        target="_blank"
        rel="noopener noreferrer"
      >
        Clone from github
      </a>
    </header>
  )
}

export default AppHeader;
