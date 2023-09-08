import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const Section = ({ id, title, subtitle, content }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="section-main">
        <h3>{subtitle}</h3>
        <ReactMarkdown rehypePlugins={rehypeRaw}>{content}</ReactMarkdown>
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
