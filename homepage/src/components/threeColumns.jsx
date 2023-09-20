import Column from './column';

const ThreeColumns = ({ id, title, columns, markdown }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="row">
        <div className="col-md-4 mb-3">
          {Array.isArray(columns[0]) ? (
            <Column
              title={columns[0][0]}
              // image is part of the text in hard coded data
              // image={columns[0][1]}
              text={columns[0][1]}
              markdown={false}
            />
          ) : (
            <Column
              title={columns[0].title}
              image={columns[0].image}
              text={columns[0].text}
              markdown={true}
            />
          )}
        </div>
        <div className="col-md-4 mb-3">
          {Array.isArray(columns[1]) ? (
            <Column
              title={columns[1][0]}
              // image is part of the text in hard coded data
              // image={columns[1][1]}
              text={columns[1][1]}
              markdown={false}
            />
          ) : (
            <Column
              title={columns[1].title}
              image={columns[1].image}
              text={columns[1].text}
              markdown={true}
            />
          )}
        </div>
        <div className="col-md-4 mb-3">
          {Array.isArray(columns[2]) ? (
            <Column
              title={columns[2][0]}
              // image is part of the text in hard coded data
              // image={columns[2][1]}
              text={columns[2][1]}
              markdown={false}
            />
          ) : (
            <Column
              title={columns[2].title}
              image={columns[2].image}
              text={columns[2].text}
              markdown={true}
            />
          )}
        </div>
      </div>
    </div>
  </div>
);

export default ThreeColumns;
