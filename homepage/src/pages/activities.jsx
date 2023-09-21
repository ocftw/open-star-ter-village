import Banner from '../components/banner';
import Section from '../components/section';
import TwoColumns from '../components/twoColumns';
import Head from 'next/head';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  // const backToTop = {
  //   en: 'Back to top',
  //   'zh-tw': '回到頁首',
  // };

  const aboutOpenSourceNav = {
    en: 'About Open Source',
    'zh-tw': '關於開源',
  };

  const ourBeliefsNav = {
    en: 'Our Beliefs',
    'zh-tw': '活動理念',
  };

  const instructorsNav = {
    en: 'Instructors',
    'zh-tw': '講師介紹',
  };

  const detailsNav = {
    en: 'Details',
    'zh-tw': '活動資訊',
  };

  const cardsPage = {
    en: 'Cards',
    'zh-tw': '卡片頁',
  };

  const homepage = {
    en: 'Home',
    'zh-tw': '首頁',
  };

  const navigationList = [
    // { link: `#page-top`, text: backToTop[locale] },
    // { link: `#about-open-source`, text: aboutOpenSourceNav[locale] },
    // { link: `#our-beliefs`, text: ourBeliefsNav[locale] },
    // { link: `#details`, text: detailsNav[locale] },
    // { link: `#instructors`, text: instructorsNav[locale] },
    { link: `/cards`, text: cardsPage[locale] },
    { link: `/`, text: homepage[locale] },
  ];

  const headInfo = {
    title: {
      en: `OpenStarTerVillage - Workshops`,
      'zh-tw': `開源星手村 - 工作坊`,
    },
    description: {
      en: `Participate in the change of Taiwan's future through a board game.`,
      'zh-tw': `用桌遊，參與台灣的未來`,
    },
  };

  const banner = {
    componentType: 'Banner',
    title: {
      en: `Workshops`,
      'zh-tw': `工作坊`,
    },
    subtitle: {
      en: `Participate in the change of Taiwan's future through a board game.`,
      'zh-tw': `用桌遊，參與台灣的未來`,
    },
    heroImage: '/images/campaignpage/heroimage.png',
  };

  const aboutOpenSource = {
    componentType: 'Section',
    id: 'about-open-source',
    title: {
      en: 'Open source, open resources around the world',
      'zh-tw': '開源，開放這個世界的資源',
    },
    subtitle: {
      en: 'May open source be with you',
      'zh-tw': '願「源」力與你同在',
    },
    content: {
      en: `
        Open Starter Village provides you with a comprehensive experience of open-source projects.<br />
        <br />
        Have you ever used the app "Bus Tracker Taipei" or the "Mask Maps"? These two open projects were both initiated by citizens, gathering people of different professions, such as program designers, marketing managers, publicists, and culture workers, to contribute their expertise. <br />
        <br />
        Open Culture Foundation (OCF) devotes its efforts to facilitating the development of Taiwan's open source community. In the process of implementing a variety of projects, talents from different industries can develop versatile skills and make great achievement while promoting social progress. <br />
        <br />
        By opening resources around the world, more and more people are able to head toward the collective good. Drawing on the power of the crowd, we are also creating a better future. <br />
        <br />
        May open source be with you!<br />
      `,
      'zh-tw': `
        「開源星手村」讓你深度體驗「開源」（Open Source）專案。<br />
        <br />
        你用過「台北等公車」嗎？又或者是否使用過「口罩地圖」？以上的專案都是由民間發起，號召程式設計、行銷公關、文化工作者等不同專業的夥伴，透過貢獻彼此的專業所架構而成的開源專案。<br />
        <br />
        開放文化基金會一直以來致力於推動台灣開源社群的發展與耕耘，讓各方人才在執行多元專案的過程裡，同時推動社會進步、充實自我技能與成就。<br />
        <br />
        因為開放這個世界的資源，才能夠讓更多人朝共好的目標前進；因為集結眾人之力合作，我們也同時參與著更進步的未來。<br />
        <br />
        願「源」力與我們同在。<br />
      `,
    },
  };

  const ourBeliefs = {
    componentType: 'Section',
    id: 'our-beliefs',
    bgImage: '/images/campaignpage/join_project.png',
    title: {
      en: `Join the projects and participate in the change of Taiwan's future`,
      'zh-tw': '參與專案，參與台灣的未來',
    },
    subtitle: {
      en: 'A memo to our next generation',
      'zh-tw': '給下一代社會的日常備忘錄',
    },
    content: {
      // Line 137. amend openess to openness
      en: `
        Let's participate in the change of our future!<br />
        <br />
        We know that open-source projects of different aspects are indispensable in promoting social progress.<br />
        We know that we need to equip ourselves with many skills which schools don't teach us before entering the workforce.<br />
        We know that you deserve a bigger stage and your professional skills need to be seen by more people.<br />
        We know that openness is a must when the world limits your mind.<br />
        We know that we have to think out of the box when universities are only vocational training centers.<br />
        We know that you are definitely more than a labor in the future society.<br />
        <br />
        <br />
        Taiwan's future needs your participation.<br />
        This time, we can't be absent.<br />
      `,
      'zh-tw': `
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
      `,
    },
  };

  const joinProject = {
    componentType: 'Section',
    id: '',
    title: {
      en: 'Participate in a variety of projects for an comprehensive experience',
      'zh-tw': '多元參與，全面體驗',
    },
    subtitle: {
      en: '',
      'zh-tw': '',
    },
    content: {
      en: `
      You might be a passionate, angry young man or a seasoned veteran in your industry, or you just want to explore possibilities in your life. Please join us at our board game workshops.
        <div class="flex-row flex-justify-center four-items">
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__cooperate_hands.png" alt="icon__cooperate_hands">
            <span>Tackling tasks together</span>
          </div>
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__round_table_meeting.png" alt="icon__round_table_meeting">
            <span>Two board game workshops</span>
          </div>
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__two_people_enlight.png" alt="icon__two_people_enlight">
            <span>Implementing mulitiple projects</span>
          </div>
          <div class="flex-col flex-justify-space-between flex-align-center box">
            <img src="/images/campaignpage/icon__magnifying_glass_head.png" alt="icon__magnifying_glass_head">
            <span>Boosting your motivation</span>
          </div>
        </div>
      `,
      'zh-tw': `
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
      `,
    },
  };

  const details = {
    componentType: 'TwoColumns',
    id: 'details',
    title: {
      en: 'Details',
      'zh-tw': '活動資訊',
    },
    columns: {
      en: [
        [
          `Workshop for educators, culture workers, and all walks of life`,
          `
          <div class="margin-2-percent">
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">Board game demo</span>
              <div class="flex flex-col sub-sub-content">
                <span>Time: Fri., <strong>Sep. 30, 2022</strong> 11:00–17:00 + Sat., <strong>Oct. 1, 2022</strong> 11:00–15:30</span>
                <span>Location: Da Xiao Building at Chinese Culture University</span>
              </div>
            </div>
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">Issue Workshop</span>
              <div class="flex flex-col sub-sub-content">
                <span>Sun., <strong>Oct. 2, 2022</strong> 10:00–16:00</span>
                <span>Location: Da Xin Building or Da Xia Building at Chinese Culture University</span>
              </div>
            </div>
          </div>
          <h3>Teaching Aid</h3>
          <p>Open Starter Village includes a variety of projects from different industries, which can be an entertaining supplementary material for Taiwan's 2019 curriculum since the board game goes along with its focuses, such as "technology and media", "interpersonal relations and teamwork", and "diverse culture and international perspectives". It is the best teaching aid for Taiwan's 2019 curriculum.</p>
          <h3>Crossover Interactions</h3>
          <p>Humanity and technology doesn't have to be two extremes, they just need to interact with each other. In open-source projects, everyone needs to interact, collaborate and negotiate with their partners. Let's find out the key factors to connections and bridge different professions through this board game.</p>
          <h3>Brianstorming</h3>
          <p>In Open Starter Village, players have to play different roles. You can be one of the marketing team members, a publicist or an R&D engineer. Brianstorming and collborating with different people can help us complete the projects and find a right place and a right direction during the process.</p>
          <a class="btn" href="https://ocftw.kktix.cc/events/osv-taspaa2022" target="_blank">Sign up for free</a>
          `,
        ],
        [
          `Workshop for passionate young men`,
          `
          <div class="margin-2-percent">
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">Issue Workshop</span>
              <div class="flex flex-col sub-sub-content">
                <span>Time: Sat., <strong>Oct. 29, 2022</strong> 10:00–17:30</span>
                <span>Location: University of Taipei</span>
              </div>
            </div>
          </div>
          <h3>Networking</h3>
          <p>During the game, relationships between one another are built one after another. Through collaboration and competition, your connections with people can be gradually expanded. We can learn from each other's advantages and professional skills, which can turn into skills and experiences you will need in the future. So join us!</p>
          <h3>Crossover Collaboration</h3>
          <p>Nowadays, the working mode in the society has shifted from solo to collaboration. However, finding your subjectivity in a group is still important. We hope that players can find a piece of themselves in others through each game and find the best way to collaborate.</p>
          <h3>Sharpening your skills</h3>
          <p>Open Starter Village is a project-based board game. During the game, you will learn more about open-source projects and shapen your professional skills. After completing projects, not only can we get a sense of achievement, but we can also cultivate our ability to collaborate with each other. Let's become more powerful!</p>
          <a class="btn" href="https://ocftw.kktix.cc/events/utstudent" target="_blank">Sign up for free</a>
          `,
        ],
      ],
      'zh-tw': [
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
          <a class="btn" href="https://ocftw.kktix.cc/events/osv-taspaa2022" target="_blank">立即免費報名</a>
          `,
        ],
        [
          `熱血青年培力探索場`,
          `
          <div class="margin-2-percent">
            <div class="flex flex-row flex-align-center">
              <span class="sub-sub-title">議題工作坊</span>
              <div class="flex flex-col sub-sub-content">
                <span><strong>10/29</strong>(六)10:00-17:30</span>
                <span>地點: 台北市立大學</span>
              </div>
            </div>
          </div>
          <h3>拓展人脈</h3>
          <p>透過桌遊的遊玩歷程，「關係」不斷地被建立起來，在一次次的合作與競爭中，人脈也能夠逐漸地累積。從中學習彼此的優點以及專業，是未來不可或缺的技能與經驗，加入我們吧！</p>
          <h3>多元合作</h3>
          <p>現今的社會已經從傳統的單打獨鬥成為群體合作，然而在群體中的個人「主體性」仍是重要的。期許在一次次的遊玩經驗中，讓彼此像映照對方的鏡子，找尋最適切的合作模式與方法。</p>
          <h3>累積實力</h3>
          <p>開源星手村是一個專案體驗桌遊，過程中你將累積許多對專案的了解，以及自身技能的特性。在完成專案後，我們除了能得到成就感外，還可以培養協同合作的實力，一起來變強吧！</p>
          <a class="btn" href="https://ocftw.kktix.cc/events/utstudent" target="_blank">立即免費報名</a>
          `,
        ],
      ],
    },
  };

  const instructors = {
    componentType: 'TwoColumns',
    id: 'instructors',
    title: {
      en: 'Our Experienced Instructors',
      'zh-tw': '華麗講者群',
    },
    columns: {
      en: [
        [
          ``,
          `
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/Claire.jpg" alt="Claire" />
            <strong>Claire</strong>
            <span>Civic engagement, owner of two cats, a social science major</span>
          </div>
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/Yawei.png" alt="Yawei" />
            <strong>Yawei</strong>
            <span>Freedom, cat person, milk tea lover</span>
          </div>
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/皇甫.png" alt="皇甫" />
            <strong>HuangFu</strong>
            <span>Feminist, non-binary, supporter</span>
          </div>
          <div class="flex flex-col flex-align-center talker">
            <img src="/images/campaignpage/speakers/Chewei.jpg" alt="Chewei" />
            <strong>Chewei (Instructor of workshop for teachers, 10/2)</strong>
            <span>Course API, Sch001, volunteer of the jothon</span>
          </div>
        `,
        ],
        [
          ``,
          `
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/Ted.jpg" alt="Ted" />
            <strong>Ted (Instructor of workshop for students, 10/29)</strong>
            <span>Junior high school student, TOEDU, medical image analysis</span>
          </div>
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/比鄰.jpg" alt="比鄰" />
            <strong>Billion  (Instructor of workshop for teachers, 10/2 & Instructor of workshop for students, 10/29)</strong>
            <span>Disinformation, volunteer-oriented , academic portfolio</span>
          </div>
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/Ddio.jpg" alt="Ddio" />
            <strong>Ddio (Instructor of workshop for teachers, 10/2 & Instructor of workshop for students, 10/29)</strong>
            <span>Part-time housewife, systematic investor of NGO, a proud tenant</span>
          </div>
          <div class="flex flex-col flex-align-center talker margin-3-percent">
            <img src="/images/campaignpage/speakers/Peii.jpg" alt="Peii" />
            <strong>Peii (Instructor of workshop for teachers, 10/2 & Instructor of workshop for students, 10/29)</strong>
            <span>NGO, archaeology enthusiast, camp lover</span>
          </div>
        `,
        ],
      ],
      'zh-tw': [
        [
          ``,
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
        `,
        ],
        [
          ``,
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
        `,
        ],
      ],
    },
  };

  return {
    props: {
      navigationList,
      headInfo: {
        title: headInfo.title[locale],
        description: headInfo.description[locale],
      },
      banner: {
        ...banner,
        title: banner.title[locale],
        subtitle: banner.subtitle[locale],
      },
      aboutOpenSource: {
        ...aboutOpenSource,
        title: aboutOpenSource.title[locale],
        subtitle: aboutOpenSource.subtitle[locale],
        content: aboutOpenSource.content[locale],
      },
      ourBeliefs: {
        ...ourBeliefs,
        title: ourBeliefs.title[locale],
        subtitle: ourBeliefs.subtitle[locale],
        content: ourBeliefs.content[locale],
      },
      joinProject: {
        ...joinProject,
        title: joinProject.title[locale],
        subtitle: joinProject.subtitle[locale],
        content: joinProject.content[locale],
      },
      details: {
        ...details,
        title: details.title[locale],
        columns: details.columns[locale],
      },
      instructors: {
        ...instructors,
        title: instructors.title[locale],
        columns: instructors.columns[locale],
      },
    },
  };
};

const Activities = ({
  headInfo,
  banner,
  aboutOpenSource,
  ourBeliefs,
  joinProject,
  details,
  instructors,
}) => (
  <>
    <Head>
      <title>{headInfo.title}</title>
      <meta name="description" content={headInfo.description} />
    </Head>
    <Banner
      title={banner.title}
      subtitle={banner.subtitle}
      heroImage={banner.heroImage}
    />
    <Section
      id={aboutOpenSource.id}
      title={aboutOpenSource.title}
      subtitle={aboutOpenSource.subtitle}
      content={aboutOpenSource.content}
    />
    <Section
      id={ourBeliefs.id}
      bgImage={ourBeliefs.bgImage}
      title={ourBeliefs.title}
      subtitle={ourBeliefs.subtitle}
      content={ourBeliefs.content}
    />
    <Section
      id={joinProject.id}
      title={joinProject.title}
      subtitle={joinProject.subtitle}
      content={joinProject.content}
    />
    <TwoColumns
      id={details.id}
      title={details.title}
      columns={details.columns}
    />
    <TwoColumns
      id={instructors.id}
      title={instructors.title}
      columns={instructors.columns}
    />
  </>
);

export default Activities;
