import SocialMedia from '../../components/socialMedia';
import Logo from '../../components/logo';
import FooterLinks from './footerLinks';

const Footer = ({ siteData, footer, links = [], logos = [] }) => {
  return (
    <div className="site-footer" id="footer">
      <div className="container footer-main">
        <FooterLinks links={links} />
        <span>{siteData.title}</span>
        <SocialMedia />
        <div className="d-flex justify-content-center logos margin-2-percent">
          {logos.map((logo) => (
            <Logo
              key={logo.text}
              title={logo.title}
              text={logo.text}
              src={logo.image}
              dimension={{ width: 163, height: 45 }}
              link={logo.link}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Footer;
