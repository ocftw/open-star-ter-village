import Base from '../layouts/base'
import Banner from '../components/banner'
import TwoColumns from '../components/twoColumns'
import ThreeColumns from '../components/threeColumns'
import ImageAndText from '../components/imageAndText'

const siteData = {
  siteName: `開源星手村`,
  description: `體驗如何參與改變世界的專案`,
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
  [`世界面臨新的挑戰`, `
      <img src="images/feature_example1.jpg" alt="feature1">
      <div>
      每個回合玩家們將會面臨世界上正在發生的事件，可能帶來新的問題新的挑戰，也可能帶給玩家在開源路上的幫助！
      </div>`],
  [`開始開源專案`, `
      <img src="images/feature_example2.jpg" alt="feature2">
      <div>
      面對新的挑戰與問題，你想到解決問題的方法了嗎？那就拿出來與大家一起討論和實作吧！
      </div>`],
  [`尋找志同道合的夥伴`, `
      <img src="images/feature_example3.jpg" alt="feature3">
      <div>
      工欲善其事，必先找對人！在面對問題的路上有不懂的地方就去找人來幫忙，找專業的人作對的事情才會事半功倍！
      </div>`],
]

const gameUseCaseDataColumns = [
  [`社會問題推動專案開始`, `
      <strong>專案卡 ─ 口罩藏寶圖 口罩在哪裡</strong>
      原型為口罩地圖，是臺灣開源社群 g0v 零時政府的專案之一，因應 2020 年武漢肺炎流行，臺灣政府採取口罩實名制措施，
      社群參與者串接各政府開放的藥局即時存貨資料、醫療院所與超商的口罩發放資訊和地點等，打造即時查看各地口罩存量的應用程式。
  `],
  [`專案的進行推動議題討論`, `
      <strong>專案卡 ─ 嗶了再買</strong>
      原型為掃了再買，是由「透明足跡」專案衍伸的應用程式，推動環境資料公開，追蹤企業廢氣、廢水等汙染指標即時監測數據以及違規裁罰記錄，
      期望揪出黑心企業、推動政府完善環境保護法制和企業管制體制，同時強化公民參與監督，把關每次的消費選擇！
  `],
  [`議題討論促使社會前進`, `
      <strong>專案卡 ─ 國民法官</strong>
      不只國會與行政部門可以開放，法院也能成為讓公民參與的政府部門！立法院於 2020 年通過國民法官法，預計於 2023 年正式上路。
      該法的合議庭將由 6 位國民法官與 3 位職業法官組成，符合條件且經隨機抽選到的國民可參與法院討論與判決過程，
      以期結合人民的社會期待與法官的專業，共同落實司法正義。
  `],
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
