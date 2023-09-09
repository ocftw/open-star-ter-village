import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const Section = ({ id, title, subtitle, content }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="section-main">
        <h3>{subtitle}</h3>
        <ParseMarkdownAndHtml>{content}</ParseMarkdownAndHtml>
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
