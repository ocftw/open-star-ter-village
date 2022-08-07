import Social from './social'

const Banner = ({ data }) => (
  <div className="banner">
    <img src={data.heroImage} />
    <div className="container">
      <div className="banner-details">
        <h1>{data.title}</h1>
        <span>{data.subtitle}</span>
        <ul className="sub-data">
          <li key={`sub-data`}>{`item 1`}</li>
          <li key={`sub-data`}>{`item 2`}</li>
        </ul>
        <Social data={data.social} />
      </div>
    </div>
  </div>
)

export default Banner
