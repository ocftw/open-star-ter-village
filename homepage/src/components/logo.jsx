import Image from 'next/image';

const Logo = ({ text, src, dimension }) => (
  <div className="flex flex-row flex-align-center logo-margin">
    <span className="logo-title">{text}</span>
    <Image
      className="logo-image"
      src={src}
      alt={`${text}-logo`}
      height={dimension.height}
      width={dimension.width}
      style={{
        objectFit: 'cover',
      }}
    />
  </div>
);

export default Logo;
