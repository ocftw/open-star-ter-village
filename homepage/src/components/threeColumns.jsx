import Column from './column';

const ThreeColumns = ({ id, title, columns }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="row">
        <div className="col-lg-6 col-xl-4 mb-3">
          <Column
            title={columns[0].title}
            image={columns[0].image}
            text={columns[0].text}
          />
        </div>
        <div className="col-lg-6 col-xl-4 mb-3">
          <Column
            title={columns[1].title}
            image={columns[1].image}
            text={columns[1].text}
          />
        </div>
        <div className="col-lg-6 col-xl-4 mb-3">
          <Column
            title={columns[2].title}
            image={columns[2].image}
            text={columns[2].text}
          />
        </div>
      </div>
    </div>
  </div>
);

export default ThreeColumns;
