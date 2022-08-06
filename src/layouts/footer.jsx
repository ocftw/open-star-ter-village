import Social from '../components/social'

const Footer = ({ data }) => (
  <div className="site-footer" id="footer">
    <div className="container footer-main">
      <Social data={data.social} />
      <span>{data.siteName}</span>
    </div>
  </div>
)

export default Footer