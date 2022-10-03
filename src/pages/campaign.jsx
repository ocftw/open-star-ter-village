import Base from '../layouts/base';
import Banner from '../components/banner';
import Section from '../components/section';
import TwoColumns from '../components/twoColumns';

const navigationList = [
  { link: `/`, text: `首頁` },
  { link: `/campaign`, text: `活動頁` },
  { link: `#about-open-source`, text: `關於開源` },
  { link: `#join-project`, text: `活動理念` },
  { link: `#talkers`, text: `講師介紹` },
  { link: `#upcoming-events`, text: `活動資訊` },
]

const Campaign = () => (
  <Base nav={navigationList}>
    <Banner
      title={`工作坊`}
      subtitle={`用桌遊，參與台灣的未來`}
      heroImage={`/images/campaignpage/heroimage.png`}
    />
    <Section
      id={`about-open-source`}
      title={`開源，開放這個世界的資源`}
      subtitle={`願「源」力與你同在`}
      content={`
        「開源星手村」讓你深度體驗「開源」（Open Source）專案。<br />
        <br />
        你用過「台北等公車」嗎？又或者是否使用過「口罩地圖」？以上的專案都是由民間發起，號召程式設計、行銷公關、文化工作者等不同專業的夥伴，透過貢獻彼此的專業所架構而成的開源專案。<br />
        <br />
        開放文化基金會一直以來致力於推動台灣開源社群的發展與耕耘，讓各方人才在執行多元專案的過程裡，同時推動社會進步、充實自我技能與成就。<br />
        <br />
        因為開放這個世界的資源，才能夠讓更多人朝共好的目標前進；因為集結眾人之力合作，我們也同時參與著更進步的未來。<br />
        <br />
        願「源」力與我們同在。<br />
      `}
    />
    <Section
      id={`join-project`}
      bgImage={`/images/campaignpage/join_project.png`}
      title={`參與專案，參與台灣的未來`}
      subtitle={`給下一代社會的日常備忘錄`}
      content={`
        現在，來參與彼此的未來吧！<br />
        <br />
        我們明白，各類的開源專案，是社會前進不可或缺的力量。<br />
        我們明白，進社會前，我們要準備非常多學校沒教的能力。<br />
        我們明白，你的專業能在更大的舞台被看見，受萬眾矚目。<br />
        我們明白，當世界限縮你的眼界時，試著開放就成為必然。<br />
        我們明白，當大學成為職業介紹所時，突破框架誠屬自然。<br />
        我們明白，在未來的社會上，你絕非只是一個工作的機器。<br />
        <br />
        <br />
        台灣的未來需要你的參與。<br />
        這一次，我們絕不能缺席。<br />
      `}
    />
    <Section
      id={``}
      title={`多元參與，全面體驗`}
      subtitle={``}
      content={`
        不論你是熱血的憤怒青年，或是縱橫職場的高手，又或者你希望能夠發掘更多人生的可能性，都可以來參加這次的工作坊。
        <div class="flex-row flex-justify-center four-items">
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__cooperate_hands.png" alt="icon__cooperate_hands">
            <span>一起合作完成任務</span>
          </div>
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__round_table_meeting.png" alt="icon__round_table_meeting">
            <span>兩場次桌遊工作坊</span>
          </div>
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__two_people_enlight.png" alt="icon__two_people_enlight">
            <span>多項專案執行體驗</span>
          </div>
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__magnifying_glass_head.png" alt="icon__magnifying_glass_head">
            <span>全面的發掘行動力</span>
          </div>
        </div>
      `}
    />
    <TwoColumns
      id={`upcoming-events`}
      title={`活動資訊`}
      columns={[
        [
          `教育/文化/社會職人場`,
          `
          <div class="margin-2-percent">
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">桌遊試玩</span>
              <div class="flex flex-col sub-sub-content">
                <span><strong>9/30</strong>(五)11:00~17:00~<strong>10/1</strong>(六)11:00~15:30</span>
                <span>地點: 中國文化大學-大孝館</span>
              </div>
            </div>
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">議題工作坊</span>
              <div class="flex flex-col sub-sub-content">
                <span><strong>10/2</strong>(日)10:00-16:00</span>
                <span>地點：(暫)中國文化大學的大新館或大夏館</span>
              </div>
            </div>
          </div>
          <h3>教育輔助</h3>
          <p>開源星手村模擬了各式的專案及職業取向，在「科技資訊與媒體素養」、「人際關係與團隊合作」、「多元文化與國際理解」等課綱方向，提供寓教於樂的補充，是最強的教學輔助。</p>
          <h3>多元互動</h3>
          <p>人文與科技，或許並非孤立於兩端的雙子星，它們之間只是缺少了深入互動的關鍵。在開源專案裡面，需要彼此互動、合作及協商，讓我們一起透過遊戲找出關鍵，成為多方的橋樑。</p>
          <h3>思想激盪</h3>
          <p>在開源星手村中，由於我們彼此將扮演多種角色，可能是行銷公關，也可能是研發工程師，多方腦力激盪，能在一次次合作裡完成專案，也能讓我們在裡頭找到最適切的位置與方向。</p>
          <a class="btn">立即免費報名</a>
          `
        ],
        [
          `熱血青年培力探索場`,
          `
          <div class="margin-2-percent">
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">議題工作坊</span>
              <div class="flex flex-col sub-sub-content">
                <span><strong>10/29</strong>(六)10:00-17:30</span>
                <span>地點: 市立台北大學</span>
              </div>
            </div>
          </div>
          <h3>拓展人脈</h3>
          <p>透過桌遊的遊玩歷程，「關係」不斷地被建立起來，在一次次的合作與競爭中，人脈也能夠逐漸地累積。從中學習彼此的優點以及專業，是未來不可或缺的技能與經驗，加入我們吧！</p>
          <h3>多元合作</h3>
          <p>現今的社會已經從傳統的單打獨鬥成為群體合作，然而在群體中的個人「主體性」仍是重要的。期許在一次次的遊玩經驗中，讓彼此像映照對方的鏡子，找尋最適切的合作模式與方法。</p>
          <h3>累積實力</h3>
          <p>開源星手村是一個專案體驗桌遊，過程中你將累積許多對專案的了解，以及自身技能的特性。在完成專案後，我們除了能得到成就感外，還可以培養協同合作的實力，一起來變強吧！</p>
          <a class="btn">立即免費報名</a>
          `
        ]
      ]}
    />
    <TwoColumns
      id={`talkers`}
      title={`華麗講者群`}
      columns={[
        [``,
          `
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/Claire.jpg" alt="Claire" />
            <strong>Claire</strong>
            <span>公民參與、兩隻貓、社科人</span>
          </div>
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/Yawei.png" alt="Yawei" />
            <strong>Yawei</strong>
            <span>自由、貓奴、奶茶控</span>
          </div>
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/皇甫.png" alt="皇甫" />
            <strong>皇甫</strong>
            <span>女性主義、非二元、貓手</span>
          </div>
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/Chewei.jpg" alt="Chewei" />
            <strong>Chewei（10/2 教師場）</strong>
            <span>Course API、零時小學校、揪松團志工</span>
          </div>
        `],
        [``,
          `
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/Ted.jpg" alt="Ted" />
            <strong>Ted（10/29 學生場）</strong>
            <span>國中生、開放教育 TOEDU、醫學影像分析</span>
          </div>
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/比鄰.jpg" alt="比鄰" />
            <strong>比鄰（10/2 教師場＋10/29 學生場）</strong>
            <span>假訊息、志工當當當、學習歷程累積</span>
          </div>
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/Ddio.jpg" alt="Ddio" />
            <strong>Ddio（10/2 教師場＋10/29 學生場）</strong>
            <span>斜槓主婦、定期定額投資 NGO、租屋最高</span>
          </div>
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/Peii.jpg" alt="Peii" />
            <strong>Peii（10/2 教師場＋10/29 學生場）</strong>
            <span>NGO、考古學、露營</span>
          </div>
        `]
      ]}
    />
  </Base>
)

export default Campaign
