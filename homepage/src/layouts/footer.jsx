import Link from 'next/link';
import { useRouter } from 'next/router';
import SocialMedia from '../components/socialMedia';
import Logo from '../components/logo';
import footerZh from '../../_footer/zh-tw/footer.json';
import footerEn from '../../_footer/en/footer.json';

const Footer = ({ siteData }) => {
  const router = useRouter();
  const locale = router.locale;
  const footerData = locale === 'en' ? footerEn : footerZh;
  const footerLinks = footerData?.footer?.links ?? [];
  return (
    <div className="site-footer" id="footer">
      <div className="container footer-main">
        <div className="flex flex-row gap">
          {footerLinks.map((link) => (
            <Link
              href={link.url}
              key={link.display_text}
              target="_blank"
              rel="noopener noreferrer"
              locale={false}
            >
              {link.display_text}
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
};

export default Footer;
