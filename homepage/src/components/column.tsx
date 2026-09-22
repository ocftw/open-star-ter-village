import Image from 'next/image';
import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';
import type { SectionColumn } from '../types/content';

const Column = ({ title, image, text }: SectionColumn) => (
  <div className="section-main">
    <h3>{title}</h3>
    <div className="d-flex flex-column">
      {image && (
        <div className="image-container">
          <Image src={image} alt={`${title} image`} fill className="image" />
        </div>
      )}
      <ParseMarkdownAndHtml markdown={true}>{text}</ParseMarkdownAndHtml>
    </div>
  </div>
);

export default Column;
