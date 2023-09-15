import Link from 'next/link';
import SocialMedia from '../components/socialMedia';
import Logo from '../components/logo';

const Footer = ({ siteData }) => (
  <div className="site-footer" id="footer">
    <div className="container footer-main">
      <div className="flex flex-row gap">
        {siteData.footerLinks.map((link) => (
          <Link
            href={link.link}
            key={link.text}
            target="_blank"
            rel="noopener noreferrer"
            locale={false}
          >
            {link.text}
          </Link>
        ))}
      </div>
      <span>{siteData.title}</span>
      <SocialMedia />
      <div className="flex flex-row flex-justify-center logos margin-2-percent">
        <Logo
          text="Initiator"
          src="/images/campaignpage/logo__OCF.png"
          dimension={{ width: 170, height: 34 }}
        />
        <Logo
          text="Sponsor"
          src="/images/campaignpage/logo__FNF.png"
          dimension={{ width: 163, height: 45 }}
        />
      </div>
    </div>
  </div>
);

export default Footer;
