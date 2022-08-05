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

const projectIntroData = {
  id: `project-intro`,
  title: `專案介紹`,
  columns: [
    [`what is the problem`, `開源生態圈內最常遇到的職業是工程師和UIUX相關工作者，有時讓人誤以為工程與軟體相關人士才能貢獻專案，但其實越多不同行業的人加入，就能讓生態圈有機會用不同角度的思考並解決更多面向的問題！`],
    [`why this is the solution`, `我們希望能透過有趣的遊戲引發大眾對開源文化的興趣，並透過好玩的方式更了解開源專案，因此彙集了開源人們實際參與的經驗，並參考海內外實際執行過的專案內容與人力配置方式，讓參與者成為一日開源人。`],
  ]
}

const Index = () => (
  <Base data={data}>
    <Banner data={data} />
    <TwoColumns data={projectIntroData} />
    <ImageAndText />
    <ThreeColumns />
    <ThreeColumns />
  </Base>
)

export default Index
