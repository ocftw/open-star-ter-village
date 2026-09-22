import Link from 'next/link';
import TrackedPromotionLink from '../../components/trackedPromotionLink';
import type { FooterLink } from '../../types/content';

const getLinkProps = (url: string) => {
  const opensNewTab = /^https?:\/\//.test(url);
  return {
    target: opensNewTab ? '_blank' : undefined,
    rel: opensNewTab ? 'noopener noreferrer' : undefined,
  };
};

const FooterLinks = ({ links }: { links: FooterLink[] }) => (
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
            locale={false}
            {...linkProps}
          >
            {link.displayText}
          </TrackedPromotionLink>
        );
      }

      return (
        <Link
          href={link.url}
          key={link.displayText}
          locale={false}
          {...linkProps}
        >
          {link.displayText}
        </Link>
      );
    })}
  </div>
);

export default FooterLinks;
