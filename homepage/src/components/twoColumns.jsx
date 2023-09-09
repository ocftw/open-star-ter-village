import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';

const TwoColumns = ({ id, title, columns }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="section-main">
            <h3>{columns[0][0]}</h3>
            <div className="flex flex-col">
              <ParseMarkdownAndHtml>{columns[0][1]}</ParseMarkdownAndHtml>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="section-main">
            <h3>{columns[1][0]}</h3>
            <div className="flex flex-col">
              <ParseMarkdownAndHtml>{columns[1][1]}</ParseMarkdownAndHtml>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default TwoColumns;
