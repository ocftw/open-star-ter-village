import Link from 'next/link';

const FooterLinks = ({ links }) => (
  <div className="flex flex-row gap">
    {links.map((link) => (
      <Link
        href={link.url}
        key={link.displayText}
        target="_blank"
        rel="noopener noreferrer"
        locale={false}
      >
        {link.displayText}
      </Link>
    ))}
  </div>
);

export default FooterLinks;
