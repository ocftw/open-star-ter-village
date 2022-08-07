const ThreeColumns = ({ data }) => (
  <div className="section" id={data.id}>
    <div className="container">
      <div className="section-head">
        <h2>{data.title}</h2>
      </div>
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{data.columns[0][0]}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: data.columns[0][1]
              }}
            />
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{data.columns[1][0]}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: data.columns[1][1]
              }}
            />
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{data.columns[2][0]}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: data.columns[2][1]
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ThreeColumns
