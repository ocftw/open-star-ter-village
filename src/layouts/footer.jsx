import Social from '../components/social'
import { siteData } from '../constants'

const Footer = ({ siteName }) => (
  <div className="site-footer" id="footer">
    <div className="container footer-main">
      <Social />
      <span>{siteName}</span>
    </div>
  </div>
)

Footer.defaultProps = {
  siteName: siteData.title
}

export default Footer
