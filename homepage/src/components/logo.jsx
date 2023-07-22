import Image from 'next/image';

const Logo = ({ text, src }) => (
  <div className="flex flex-row flex-align-center">
    <span className="logo-title">{text}</span>
    <Image
      className="logo-image"
      src={src}
      alt={`${text}-logo`}
      sizes="(max-width: 767px) 100vw, 50vw"
    />
  </div>
);

export default Logo;
