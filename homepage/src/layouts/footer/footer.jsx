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

  const footerLogos = footerData?.footer?.logos ?? [];
  const logos = footerLogos.map((logo) => ({
    text: logo.logo_text,
    image: logo.logo_image,
  }));

  return (
    <div className="site-footer" id="footer">
      <div className="container footer-main">
        <FooterLinks links={links} />
        <span>{siteData.title}</span>
        <SocialMedia />
        <div className="d-flex flex-row flex-justify-center logos margin-2-percent">
          <Logo
            text={logos[0].text}
            src={logos[0].image}
            dimension={{ width: 170, height: 34 }}
          />
          <Logo
            text={logos[1].text}
            src={logos[1].image}
            dimension={{ width: 163, height: 45 }}
          />
        </div>
      </div>
    </div>
  );
};

export default Footer;
