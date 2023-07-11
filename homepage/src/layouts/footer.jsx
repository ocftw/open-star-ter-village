import Link from 'next/link';
import Social from '../components/social';
import Logo from '../components/logo';
import { siteData } from '../constants';

const Footer = ({ siteName }) => (
  <div className="site-footer" id="footer">
    <div className="container footer-main">
      <div className="flex flex-row gap">
        <Link href="/s/manual" target="_blank" rel="noopener noreferrer">
          遊戲規則書
        </Link>
        <Link href="/admin" target="_blank" rel="noopener noreferrer">
          管理後台
        </Link>
      </div>
      <span>{siteName}</span>
      <Social />
      <div className="flex flex-row flex-justify-center logos margin-2-percent">
        <Logo text="Initiator" src="/images/campaignpage/logo__OCF.png" />
        <Logo text="Sponsor" src="/images/campaignpage/logo__FNF.png" />
      </div>
    </div>
  </div>
);

Footer.defaultProps = {
  siteName: siteData.title,
};

export default Footer;
