import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

const ThreeColumns = ({ id, title, columns }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{columns[0][0]}</h3>
            <div className="flex flex-col">
              <ReactMarkdown rehypePlugins={rehypeRaw}>
                {columns[0][1]}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{columns[1][0]}</h3>
            <div className="flex flex-col">
              <ReactMarkdown rehypePlugins={rehypeRaw}>
                {columns[1][1]}
              </ReactMarkdown>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{columns[2][0]}</h3>
            <div className="flex flex-col">
              <ReactMarkdown rehypePlugins={rehypeRaw}>
                {columns[2][1]}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ThreeColumns;
