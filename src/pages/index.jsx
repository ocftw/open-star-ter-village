import Base from '../layouts/base'
import Banner from '../components/banner'
import TwoColumns from '../components/twoColumns'
import ThreeColumns from '../components/threeColumns'
import ImageAndText from '../components/imageAndText'

const data = {
  siteName: `開源星手村`,
  subtitle: ``,
  instagram: `https://instagram.com/openstartervillage/`,
  discord: `https://discord.gg/JnTHGnxwYS`,
  github: `https://github.com/ocftw/open-star-ter-village`,
}

const Index = () => (
  <Base data={data}>
    <Banner data={data} />
    <TwoColumns />
    <ImageAndText />
    <ThreeColumns />
    <ThreeColumns />
  </Base>
)

export default Index
