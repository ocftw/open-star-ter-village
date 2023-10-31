import { useRouter } from 'next/router';
import SocialMedia from '../../components/socialMedia';
import Logo from '../../components/logo';
import footerZh from '../../../_footer/zh-tw/footer.json';
import footerEn from '../../../_footer/en/footer.json';
import FooterLinks from './footerLinks';

const Footer = ({ siteData, footer }) => {
  const router = useRouter();
  const locale = router.locale;
  const footerData = locale === 'en' ? footerEn : footerZh;
  const footerLinks = footer?.links ?? footerData?.footer?.links ?? [];
  const links = footerLinks.map((link) => ({
    displayText: link.display_text,
    url: link.url,
  }));
  return (
    <div className="site-footer" id="footer">
      <div className="container footer-main">
        <FooterLinks links={links} />
        <span>{siteData.title}</span>
        <SocialMedia />
        <div className="d-flex flex-row flex-justify-center logos margin-2-percent">
          <Logo
            text="Initiator"
            src="/images/campaignpage/logo__OCF.svg"
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
