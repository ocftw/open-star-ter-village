import Head from 'next/head';
import Script from 'next/script';
import Base from '../layouts/base';
import Banner from '../components/banner';
import TwoColumns from '../components/twoColumns';
import ThreeColumns from '../components/threeColumns';
import ImageAndText from '../components/imageAndText';

const navigationList = [
  { link: `#page-top`, text: `回到頁首` },
  { link: `#project-intro`, text: `專案介紹` },
  { link: `#game-intro`, text: `遊戲介紹` },
  { link: `/campaign`, text: `活動頁` },
];

const Index = () => (
  <Base nav={navigationList}>
    <Head>
      <title>{`開源星手村`}</title>
      <meta name="description" content={`科技怎麼改變世界？玩桌遊、就知道！`} />
    </Head>
    <Script
      id="netlify-identity-widget"
      src="https://identity.netlify.com/v1/netlify-identity-widget.js"
    />
    <Script
      id="netlify-login-user"
      dangerouslySetInnerHTML={{
        __html: `
        if (window.netlifyIdentity) {
          window.netlifyIdentity.on("init", user => {
            if (!user) {
              window.netlifyIdentity.on("login", () => {
                document.location.href = "/admin/";
              });
            }
          });
        }
      `,
      }}
    />
    <Banner
      title={`開源星手村`}
      subtitle={`科技怎麼改變世界？玩桌遊、就知道！`}
      heroImage={`/images/heroimage.jpg`}
      highlights={[`工人放置`, `模擬真實開源情境`]}
    />
    <TwoColumns
      id={`project-intro`}
      title={`專案介紹`}
      columns={[
        [
          `我們想解決的問題`,
          `
          追不上的公車、沒落的母語、大選前霧煞煞的候選人資訊⋯⋯小至生活不便、大至工作所需或社會問題，
          有好多事情不只你煩惱，大家都想改變，卻不知道如何著手。
          其實有個讓你站在巨人肩膀上的方法－開源（Open Source）。
          透過開放的資源與科技技術，應用前人的成果，與夥伴合作，做出實際的科技工具或服務，從根本改善問題。
          可惜聽到「科技工具」，大家總有「會寫程式才能參與吧」的印象產生。
        `,
        ],
        [
          `我們的方案`,
          `
          普及開源、開放資源，共享協作的美好觀念！
          打破「會寫程式才能改變世界」的科技時代刻板印象！
          開啟技術與社會的對話，增加開源人多樣性，改善更多元的大小事！
          我們希望透過《開源星手村》趣味桌遊，不僅讓玩家體驗開源專案從發起→參與→到開花結果的過程和樂趣，更能認識真實存在的開源成果，
          發覺原來語言、行銷、法律等不同專長，在用科技改變世界的過程中，缺一不可！
        `,
        ],
      ]}
    />
    <ImageAndText
      id={`game-intro`}
      title={`基本遊戲介紹`}
      subtitle={''}
      image={`/images/boardgame.jpg`}
      content={`
      由玩家扮演到開源星手村取經，學習何謂開源的「新手」。
      做到發起專案、指定特定角色參與專案、執行自發的專案或協助他人等動作，
      並搭配事件卡、星源樹等環境效果，與其他玩家合作推進專案。在互相合作的過程中獲得最多影響力分數的玩家獲勝！
      同時，玩家間的合作將加速改變世界，進步、退化由你決定！
      體驗參與開源專案的過程，一起經歷發起專案、參與專案、完成專案並增進社會的開源環境，
      在互相合作的過程中獲得最多影響力分數的玩家獲勝！
        <a href="https://openstartervillage.ocf.tw/s/manual" target="_blank">點我看完整遊戲規則書</a>
      `}
      highlights={[
        [`時間`, `60-90分`],
        [`人數`, `2-4人`],
        [`類型`, `策略、工人放置`],
      ]}
    />
    <ThreeColumns
      id={`game-feature`}
      title={`遊戲特色`}
      columns={[
        [
          `世界面臨新的挑戰`,
          `
          <img src="/images/homepage/as_real_as_life.png" alt="as_real_as_life">
          <strong>跟你的人生一樣真實！</strong>
          <div>
          不管是鯊魚咬斷海底電纜直接斷網、莫名肺炎擴散讓人變宅；
          或者新上任的官員力挺科技開放，真實世界會遇到左右技術發展、開放觀念普及的大小事件，開源星手村通通有！
          超擬真事件卡設計，每個回合都痛擊／鼓舞你的開源人生路！
          每個回合玩家們將會面臨開源星手村正在發生的事件，可能帶來新的問題、新的挑戰，也可能帶給玩家在開源路上的幫助！
          </div>`,
        ],
        [
          `開始開源專案`,
          `
          <img src="/images/homepage/create_new_project.png" alt="create_new_project">
          <strong>解決問題，不只嚷嚷而已！</strong>
          <div>
          小至每天的個人生活、大到保育環境政策制訂，面對小小大大的挑戰與問題，一個人想不到解決辦法、一群人總能搞定！
          藉由開源專案卡設計，從真實存在的開源專案和眾人合作成果，看見科技工具的多元性！
          </div>`,
        ],
        [
          `尋找志同道合的夥伴`,
          `
          <img src="/images/homepage/find_mates.png" alt="find_mates">
          <strong>理念一致卻各有所長！</strong>
          <div>
          工欲善其事，必先找對人！打開任何一款科技工具、軟體、網頁，都不可能只有程式碼對吧？
          在面對問題的路上有不懂的地方就去找人來幫忙，工程師不會寫的文案、不了解的法案、不會唸的發音、不了解的議題、不會畫的美術，
          七種技能的角色卡，各自發揮所長，完美解決開發科技工具的多元需求！
          </div>`,
        ],
      ]}
    />
    <ThreeColumns
      id={`game-usecase`}
      title={`遊戲用途與目的`}
      columns={[
        [
          `教學教材`,
          `無論大學、高中課程或相關社團課程，教學簡報配合桌遊，輕鬆認識開源觀念！`,
        ],
        [
          `社群推坑`,
          `已是開源老手、社群活躍成員的你，想要不費吹灰之力吸收新血？揪團玩就對了！`,
        ],
        [`自娛娛人`, `角色可愛就給我來一打！`],
      ]}
    />
    <ThreeColumns
      id={`project-role-in-society`}
      title={`開源專案的角色扮演`}
      columns={[
        [
          ` 急難救助消防員：社會問題推動專案開始`,
          `
            <strong>專案卡 ─ 口罩藏寶圖 口罩在哪裡</strong>
            原型為口罩地圖，是臺灣開源社群 g0v 零時政府的專案之一，因應 2020 年武漢肺炎流行，臺灣政府採取口罩實名制措施，
            社群參與者在寥寥數天內，串接各政府開放的藥局即時存貨資料、醫療院所與超商的口罩發放資訊和地點等，打造即時查看各地口罩存量的應用程式。
        `,
        ],
        [
          `社會議題推進手：專案的進行推動議題討論`,
          `
            <strong>專案卡 ─ 嗶了再買</strong>
            原型為掃了再買，是由「透明足跡」專案衍伸的應用程式，推動環境資料公開，追蹤企業廢氣、廢水等汙染指標即時監測數據以及違規裁罰記錄，
            期望揪出黑心企業、推動政府完善環境保護法制和企業管制體制，同時強化公民參與監督，把關每次的消費選擇！
        `,
        ],
        [
          `敦促進步領頭羊：議題討論促使社會前進`,
          `
            <strong>專案卡 ─ 國民法官</strong>
            不只國會與行政部門可以開放，法院也能成為讓公民參與的政府部門！立法院於 2020 年通過國民法官法，預計於 2023 年正式上路。
            該法的合議庭將由 6 位國民法官與 3 位職業法官組成，符合條件且經隨機抽選到的國民可參與法院討論與判決過程，
            以期結合人民的社會期待與法官的專業，共同落實司法正義。
        `,
        ],
      ]}
    />
  </Base>
);

export default Index;
