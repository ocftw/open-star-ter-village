import Image from 'next/image';
import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const Section = ({ id, title, subtitle, image, content }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="section-main">
        <h3>{subtitle}</h3>
        {image && (
          <div className="image-container">
            <Image src={image} alt={`${title} image`} fill className="image" />
          </div>
        )}
        <ParseMarkdownAndHtml markdown={true}>{content}</ParseMarkdownAndHtml>
      </div>
    </div>
  </div>
);

Section.defaultProps = {
  id: '',
  title: '',
  subtitle: '',
  content: '',
};

export default Section;
