import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const ImageAndText = ({ id, image, title, subtitle, content, highlights }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="image-and-text-main row">
        <div className="left col-md-5 col-lg-4 mb-3">
          <img src={image} alt={`${title}-${subtitle}-image`} />
        </div>
        <div className="left col-md-7 col-lg-8">
          <div className="image-and-text-details">
            <span className="name">{subtitle}</span>
            <h2 className="sub-position">{title}</h2>
            <ParseMarkdownAndHtml>{content}</ParseMarkdownAndHtml>
            <ul className="details">
              {highlights?.map((highlight) => (
                <li key={`highlight-${highlight[0]}`}>
                  <strong>{highlight[0]}</strong>
                  <p>
                    <ParseMarkdownAndHtml>{highlight[1]}</ParseMarkdownAndHtml>
                  </p>
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
