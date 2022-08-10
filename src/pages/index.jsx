import Base from '../layouts/base'
import Banner from '../components/banner'
import TwoColumns from '../components/twoColumns'
import ThreeColumns from '../components/threeColumns'
import ImageAndText from '../components/imageAndText'

const siteData = {
  siteName: `開源星手村`,
  description: ``,
  logo: `images/logo.png`,
}

const socialData = {
  instagram: `https://instagram.com/openstartervillage/`,
  discord: `https://discord.gg/JnTHGnxwYS`,
  github: `https://github.com/ocftw/open-star-ter-village`,
}

const bannerData = {
  title: siteData.siteName,
  subtitle: `副標題`,
  heroImage: `images/heroimage.jpg`,
}

const projectIntroData = {
  id: `project-intro`,
  title: `專案介紹`,
  columns: [
    [`what is the problem`, `開源生態圈內最常遇到的職業是工程師和UIUX相關工作者，有時讓人誤以為工程與軟體相關人士才能貢獻專案，但其實越多不同行業的人加入，就能讓生態圈有機會用不同角度的思考並解決更多面向的問題！`],
    [`why this is the solution`, `我們希望能透過有趣的遊戲引發大眾對開源文化的興趣，並透過好玩的方式更了解開源專案，因此彙集了開源人們實際參與的經驗，並參考海內外實際執行過的專案內容與人力配置方式，讓參與者成為一日開源人。`],
  ]
}

const gameFeatureData = {
  id: `game-feature`,
  title: `遊戲特色`,
  columns: [
    [``, `
      <img src="images/feature_example1.jpg" alt="feature1">
      <div>
      先那提為演低舉……像做是研不童依、的那的張生工點過保器買賽應但說那畫本學、作會只解的們其根……我三灣的事只，護新來色我未會手這人多弟老：的不生光發東重證！紀料形。
      速她地慢去爸話市？題同資增、牛錯口國走到告活易、臉出種小看木性園勢去讓感聲人不拿個了力產包已會電士。
      </div>`],
    [``, `
      <img src="images/feature_example2.jpg" alt="feature2">
      <div>
      不有當待源兒速有求他失裡，事黨戲節球代收，中曾之朋頭上自我那山有清力氣工候度或頭細。
      數總片些美出，布生聽國戲車，故已題造後期身，研問官究中意後期英健能代，經因吃他，麗事正時我經女究吃客心。
      南提運來對生，情包入，運難就要仍是笑之，以離度少須提行性長濟像學要設？
      </div>`],
    [``, `
      <img src="images/feature_example3.jpg" alt="feature3">
      <div>
      議為生每期另星告弟片交分廣值認學每以全部一巴都，中後完。
      親河經，你北還愛斯，預機有深能頭是親，以依畫不門期我力自例她費長年精，印因電效動招小提學部則意注……不西己國現過，爸等物。
      位飛們備……初說非：吃性然眼華然有好李，體住力來大色。量計？
      是邊故受道：沒人飯我兒公。半更點合錢、產要景外些作成輕業中哥十著的動！
      </div>`],
  ],
}

const gameUseCaseData = {
  id: `game-usecase`,
  title: `遊戲使用方式`,
  columns: [
    [`有越影都室`, `
      設能多機。
      作建們說月氣眼來兒不去物人家味幾大腦：樹頭負有發，樂足景，在也靜東人對小可……各信花朋但流所發散母會北廣精度個房另、小何行。
      不型始沒認葉間農大，車轉生持象香上相後地，場境年本藝的議議我營灣前竟！送文議盡道觀新結國元物來案謝了開。老用不上人！`],
    [`在如我出不你現們入化中`, `
      們緊答為著分現定的發法育公意怎期，客會麼花分家我母時東頭專，難中可你喜不教能個……清展有。
      利飛受不代果只水張年合經城歡，打斷接自。個收親成車說邊重願界感不我，終建看關主交西經力現，的男次是文動球之外送作方，新錢處共了市製那表工照才。
      舉往法的用進不破到麗代。`],
    [`人特打空不收要大電市日愛師文`, `
      破過得情萬到也我！了然天人學，化化期學！
      後讀界精。經水叫：轉國出獲超不夫角所臉獲！毛不遊活們知業……腦語人及向個個輪然早的。下後生體養、以我數事記否。發我經著管形：少破人自見出建然法和就是；市務有能張福？
      所月源總一應學日新……一之算士你公說們家每施唱動刻。總者片日，藝天課頭不乎政一足身能得不有了在。`],
  ],
}

const navigationList = [
  { link: `#page-top`, text: `回到頁首` },
  { link: `#project-intro`, text: `專案介紹` },
  { link: `#game-intro`, text: `遊戲介紹` },
]

const Index = () => (
  <Base data={{ ...siteData, social: socialData, nav: navigationList }}>
    <Banner data={{ ...bannerData, social: socialData }} />
    <TwoColumns data={projectIntroData} />
    <ImageAndText />
    <ThreeColumns data={gameFeatureData} />
    <ThreeColumns data={gameUseCaseData} />
  </Base>
)

Index.__staticPageOptions = {
  title: siteData.siteName,
  description: siteData.description,
}

export default Index
