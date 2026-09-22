import React from 'react';
import Link from 'next/link';
import TrackedPromotionLink from '../../components/trackedPromotionLink';
import type { FooterLink } from '../../types/content';

const getLinkProps = (url: string) => {
  const isExternal = /^https?:\/\//.test(url);
  return {
    target: isExternal ? '_blank' : undefined,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    // Internal links keep the active locale so an English reader stays on the
    // English page, where the anchor they were sent to actually exists.
    locale: isExternal ? (false as const) : undefined,
  };
};

type FooterLinksProps = {
  links: FooterLink[];
};

const FooterLinks: React.FC<FooterLinksProps> = ({ links }) => (
  <div className="d-flex gap">
    {links.map((link) => {
      const linkProps = getLinkProps(link.url);
      if (link.analyticsId) {
        return (
          <TrackedPromotionLink
            analyticsId={link.analyticsId}
            creativeName="Footer play online link"
            creativeSlot="site_footer"
            href={link.url}
            key={link.displayText}
            {...linkProps}
          >
            {link.displayText}
          </TrackedPromotionLink>
        );
      }

      return (
        <Link href={link.url} key={link.displayText} {...linkProps}>
          {link.displayText}
        </Link>
      );
    })}
  </div>
);

export default FooterLinks;
