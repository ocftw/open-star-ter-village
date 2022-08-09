const Section = ({ data }) => (
  <div className="section" id={data.id}>
    <div className="container">
      <div className="section-head">
        <h2>{data.title}</h2>
      </div>
      <div className="">
        <div className="section-main">
          <h3>{data.subtitle}</h3>
          <div
            dangerouslySetInnerHTML={{
              __html: data.content
            }}
          />
        </div>
      </div>
    </div>
  </div>
)

export default Section
