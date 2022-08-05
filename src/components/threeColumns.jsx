const ThreeColumns = () => (
  <div className="section" id="game-feature">
    <div className="container">
      <div className="section-head">
        <h2>{`遊戲特色`}</h2>
      </div>
      <div className="row">
        <div key={`feature 1`} className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{`特色一`}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: `特色一`
              }}
            />
          </div>
        </div>
        <div key={`feature 2`} className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{`特色二`}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: `特色二`
              }}
            />
          </div>
        </div>
        <div key={`feature 3`} className="col-md-4 mb-3">
          <div className="section-main">
            <h3>{`特色三`}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: `特色三`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ThreeColumns
