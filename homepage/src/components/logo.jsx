import Image from 'next/image';
import Link from 'next/link';

const Logo = ({ title, altText, src, dimension, link }) => (
  <div className="d-flex align-items-center logo-margin">
    <span className="logo-title">{title}</span>
    <Link href={link} target="_blank">
      <Image
        className="logo-image"
        src={src}
        alt={altText}
        height={dimension.height}
        width={dimension.width}
        style={{
          objectFit: 'cover',
        }}
      />
    </Link>
  </div>
);

export default Logo;
