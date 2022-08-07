import Footer from './footer'
import Header from './header'

const Base = ({ children, data }) => (
  <>
    <Header data={data} />
    <main>{children}</main>
    <Footer data={data} />
  </>
)

export default Base
