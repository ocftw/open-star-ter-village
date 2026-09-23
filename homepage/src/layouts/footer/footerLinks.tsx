import React from 'react';
import Link from 'next/link';
import TrackedLink from '../../components/trackedLink';
import type { FooterLink } from '../../types/content';

const getLinkProps = (url: string, localeIndependent = false) => {
  const isExternal = /^https?:\/\//.test(url);
  return {
    target: isExternal ? '_blank' : undefined,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    // Internal links keep the active locale so an English reader stays on the
    // English page, where the anchor they were sent to actually exists. Links
    // marked locale-independent in the CMS are one shared page for every
    // language, such as /admin, so they keep their unprefixed path.
    locale: isExternal || localeIndependent ? (false as const) : undefined,
  };
};

type FooterLinksProps = {
  links: FooterLink[];
};

const FooterLinks: React.FC<FooterLinksProps> = ({ links }) => (
  <div className="d-flex gap">
    {links.map((link) => {
      const linkProps = getLinkProps(link.url, link.localeIndependent);
      if (link.analyticsId) {
        return (
          <TrackedLink
            analyticsId={link.analyticsId}
            creativeName="Footer play online link"
            creativeSlot="site_footer"
            href={link.url}
            key={link.displayText}
            {...linkProps}
          >
            {link.displayText}
          </TrackedLink>
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
