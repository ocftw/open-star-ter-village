import Image from 'next/image';
import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const Column = ({ title, image, text, markdown }) => (
  <div className="section-main">
    <h3>{title}</h3>
    <div className="flex flex-col">
      {image && (
        <div className="image-container">
          <Image src={image} alt={`${title} image`} fill className="image" />
        </div>
      )}
      <ParseMarkdownAndHtml markdown={markdown}>{text}</ParseMarkdownAndHtml>
    </div>
  </div>
);

export default Column;
