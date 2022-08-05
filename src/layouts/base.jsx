import Footer from './footer'
import Header from './header'

const Base = ({ children }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
)

export default Base
