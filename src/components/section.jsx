const Section = ({ id, title, subtitle, content }) => (
  <div className="section" id={id}>
    <div className="container">
      <div className="section-head">
        <h2>{title}</h2>
      </div>
      <div className="">
        <div className="section-main">
          <h3>{subtitle}</h3>
          <div
            dangerouslySetInnerHTML={{
              __html: content
            }}
          />
        </div>
      </div>
    </div>
  </div>
)

Section.defaultProps = {
  id: '',
  title: '',
  subtitle: '',
  content: '',
}

export default Section
