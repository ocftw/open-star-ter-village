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

const projectIntroDataColumns = [
  [`我們想解決的問題`, `增加開源人的多樣性，目前多數開源專案與社群仍以科技技術人才為核心，有時造成技術/科技人才才能貢獻專案的刻板印象，其實更多職業的加入，能讓各專案看見更廣的視野，甚至解決更多不同面向問題。`],
  [`我們的方案`, `透過這款「實際體驗專案執行」的桌游，讓更多人了解社群與生態圈的運作方式，遊戲設計中參考現行開源專案與生態圈現況，除了讓遊戲者感受實際「發起/執行專案」的樂趣，也透過完成專案，了解世界變動如何與專案完成度相互影響，體驗「改變世界」的過程。`],
]

const gameIntroHighlights = [
  [`時間`, `60-90分`],
  [`人數`, `2-4人`],
  [`類型`, `策略、工人放置`],
]

const gameFeatureDataColumns = [
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
]

const gameUseCaseDataColumns = [
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
]

const navigationList = [
  { link: `#page-top`, text: `回到頁首` },
  { link: `#project-intro`, text: `專案介紹` },
  { link: `#game-intro`, text: `遊戲介紹` },
]

const Index = () => (
  <Base data={{ ...siteData, social: socialData, nav: navigationList }}>
    <Banner
      title={siteData.siteName}
      subtitle={`體驗如何參與改變世界的專案`}
      heroImage={`images/heroimage.jpg`}
      highlights={[`工人放置`, `模擬真實開源情境`]}
      social={socialData}
    />
    <TwoColumns id={`project-intro`} title={`專案介紹`} columns={projectIntroDataColumns} />
    <ImageAndText
      id={`game-intro`}
      title={`基本遊戲介紹`}
      subtitle={`?????`}
      image={`images/boardgame.jpg`}
      content={`tags <br /> and content`}
      highlights={gameIntroHighlights}
    />
    <ThreeColumns id={`game-feature`} title={`遊戲特色`} columns={gameFeatureDataColumns} />
    <ThreeColumns id={`game-usecase`} title={`遊戲使用方式`} columns={gameUseCaseDataColumns} />
  </Base>
)

Index.__staticPageOptions = {
  title: siteData.siteName,
  description: siteData.description,
}

export default Index
