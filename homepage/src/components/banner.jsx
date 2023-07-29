import Image from 'next/image';
import Social from './social';

const Banner = ({ heroImage, title, subtitle = '', highlights = [] }) => (
  <div className="banner">
    <Image
      src={heroImage}
      alt={`${title}-hero-image`}
      fill
      priority
      sizes="100vh"
      style={{ objectFit: 'cover' }}
    />
    <div className="container">
      <div className="banner-details">
        <h1>{title}</h1>
        <span>{subtitle}</span>
        <ul className="sub-data">
          {highlights.map((highlight) => (
            <li key={`sub-data-${highlight}`}>{highlight}</li>
          ))}
        </ul>
        <Social />
      </div>
    </div>
  </div>
);

export default Banner;
