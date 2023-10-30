import Image from 'next/image';
import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const ImageAndText = ({ id, image, title, subtitle, content, highlights }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="image-and-text-main row">
        <div className="left col-sm-5 col-lg-4 mb-3">
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
        <div className="left col-sm-7 col-lg-8">
          <div className="image-and-text-details">
            <span className="name">{subtitle}</span>
            <h2 className="sub-position">{title}</h2>
            <ParseMarkdownAndHtml markdown={true}>
              {content}
            </ParseMarkdownAndHtml>
            <ul className="details">
              {highlights?.map((highlight) => (
                <li key={highlight.item}>
                  <strong>{highlight.item}</strong>
                  <div>{highlight.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ImageAndText;
