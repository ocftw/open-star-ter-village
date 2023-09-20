import Image from 'next/image';
import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const ImageAndText = ({
  id,
  image,
  title,
  subtitle,
  content,
  highlights,
  markdown,
}) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="image-and-text-main row">
        <div className="left col-md-5 col-lg-4 mb-3">
          {image && (
            <div className="image-container">
              <Image
                src={image}
                alt={`${title} ${subtitle} image`}
                fill
                className="image"
              />
            </div>
          )}
        </div>
        <div className="left col-md-7 col-lg-8">
          <div className="image-and-text-details">
            <span className="name">{subtitle}</span>
            <h2 className="sub-position">{title}</h2>
            <ParseMarkdownAndHtml markdown={markdown}>
              {content}
            </ParseMarkdownAndHtml>
            <ul className="details">
              {highlights?.map((highlight) => {
                if (Array.isArray(highlight)) {
                  return (
                    <li key={`highlight-${highlight[0]}`}>
                      <strong>{highlight[0]}</strong>
                      <ParseMarkdownAndHtml markdown={false}>
                        {highlight[1]}
                      </ParseMarkdownAndHtml>
                    </li>
                  );
                } else {
                  return (
                    <li key={highlight.item}>
                      <strong>{highlight.item}</strong>
                      <div>{highlight.description}</div>
                    </li>
                  );
                }
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ImageAndText;
