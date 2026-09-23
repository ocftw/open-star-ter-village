import React from 'react';
import SocialMedia from '../../components/socialMedia';
import Logo from '../../components/logo';
import FooterLinks from './footerLinks';
import type { Footer as FooterModel, SiteData } from '../../types/content';

type FooterProps = Partial<FooterModel> & {
  siteData: SiteData;
};

const Footer: React.FC<FooterProps> = ({
  siteData,
  links = [],
  logos = [],
}) => {
  return (
    <div className="site-footer" id="footer">
      <div className="container footer-main">
        <FooterLinks links={links} />
        <span>{siteData.title}</span>
        <SocialMedia />
        <div className="d-flex justify-content-center logos margin-2-percent">
          {logos.map((logo) => (
            <Logo
              key={logo.altText}
              title={logo.title}
              altText={logo.altText}
              src={logo.imageUrl}
              dimension={{ width: 163, height: 45 }}
              link={logo.linkUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Footer;
