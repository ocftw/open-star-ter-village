import Social from './social'

const Banner = ({ heroImage, title, subtitle, social }) => (
  <div className="banner">
    <img src={heroImage} />
    <div className="container">
      <div className="banner-details">
        <h1>{title}</h1>
        <span>{subtitle}</span>
        <ul className="sub-data">
          <li key={`sub-data`}>{`item 1`}</li>
          <li key={`sub-data`}>{`item 2`}</li>
        </ul>
        <Social data={social} />
      </div>
    </div>
  </div>
)

export default Banner
