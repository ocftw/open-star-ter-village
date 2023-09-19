import Head from 'next/head';
import Script from 'next/script';
import { fetchPage } from '../lib/fetchPage';
import contentMapper from '../layouts/contentMapper';
import Banner from '../components/banner';
import TwoColumns from '../components/twoColumns';
import ThreeColumns from '../components/threeColumns';
import ImageAndText from '../components/imageAndText';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const backToTop = {
    en: 'Back to top',
    'zh-tw': '回到頁首',
  };

  const projectIntroNav = {
    en: 'Project Intro', // prefer Intro or Introduction?
    'zh-tw': '專案介紹',
  };

  const gameIntroNav = {
    en: 'Game Intro', // same as above
    'zh-tw': '遊戲介紹',
  };

  const cardsPage = {
    en: 'Cards',
    'zh-tw': '卡片頁',
  };

  const activitiesPage = {
    en: 'Activities',
    'zh-tw': '活動頁',
  };

  const navigationList = [
    { link: `#page-top`, text: backToTop[locale] },
    { link: `#project-intro`, text: projectIntroNav[locale] },
    { link: `#game-intro`, text: gameIntroNav[locale] },
    { link: `/cards`, text: cardsPage[locale] },
    { link: `/activities`, text: activitiesPage[locale] },
  ];

  const headInfo = {
    title: {
      en: `OpenStarTerVillage`,
      'zh-tw': `開源星手村`,
    },
    description: {
      en: `How can technology change the world? Play this board game and discover the answer for yourself!`,
      'zh-tw': `科技怎麼改變世界？玩桌遊、就知道！`,
    },
  };

  const banner = {
    componentType: 'Banner',
    title: {
      en: `Open StarTer Village`,
      'zh-tw': `開源星手村`,
    },
    subtitle: {
      en: `How can technology change the world? Play this board game and discover the answer for yourself!`,
      'zh-tw': `科技怎麼改變世界？玩桌遊、就知道！`,
    },
    heroImage: `/images/heroimage.jpg`,
    highlights: {
      en: [
        `Worker placement game`,
        `Simulate real-world open source project scenarios`,
      ],
      'zh-tw': [`工人放置`, `模擬真實開源情境`],
    },
  };

  const projectIntro = {
    componentType: 'TwoColumns',
    id: `project-intro`,
    title: {
      en: `Project Introduction`,
      'zh-tw': `專案介紹`,
    },
    columns: {
      en: [
        [
          `The problem we desire to solve`,
          `
          You're not the only one bothered by numerous public concerns. These issues can range from small everyday inconveniences to critical work needs or even larger societal problems. Think about frequently missing buses, the slow disappearance of native languages, or the confusing candidate information during elections and so on. These are the things everyone wants to change, but often we're unsure where to start.
          There's a way to put you on the shoulders of giants — Open Source.
          Through open resources and technology, apply the achievements of predecessors, cooperate with partners, and make practical scientific and technological tools or services to fundamentally improve problems.
          Unfortunately, when you hear "technology tools", everyone always has the impression that "you can write programs to participate".
          `,
        ],
        [
          `Our solution`,
          `
          This game popularize the great values of Open Source, Open Resources, and Collaborative Sharing!
          Breaking the stereotype of the technology era that "only those who can write code can change the world"!
          We aspire for this project to open up a dialogue between technology and society, enhance the diversity of contributors in the open source community, and address a broader range of issues with greater inclusivity.
          Through the fun board game "Open StarTer Village," we hope to not only allow players to experience the process and joy of open source projects from initiation to fruition, but also to learn about real open source projects.
          Players could discover that different expertise in language, marketing, law, etc. are all indispensable in using technology to change the world!
          `,
        ],
      ],
      'zh-tw': [
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
      ],
    },
  };

  const gameIntro = {
    componentType: 'ImageAndText',
    id: `game-intro`,
    title: {
      en: `Game Introduction`,
      'zh-tw': `基本遊戲介紹`,
    },
    subtitle: '',
    image: `/images/boardgame.jpg`,
    content: {
      en: `
        Players play as Open Source StarTer villager to learn what an open source "starter" is.
        Initiate projects, assign specific roles to participate in projects, execute spontaneous projects or assist others, And with environmental effects such as event cards and star source trees, cooperate with other players to advance the project.
        The player who gets the most influence points in the process of cooperating with each other wins! At the same time, cooperation between players will accelerate the change of the world, progress and degradation are up to you!
        Experience the process of participating in open source projects, and experience the open source environment of initiating, participating, completing and enhancing society together,
        The player who gets the most influence points in the process of cooperating with each other wins!
        <a href="https://openstartervillage.ocf.tw/s/manual" target="_blank">Click me to read the full game rule book</a>
      `,
      'zh-tw': `
        由玩家扮演到開源星手村取經，學習何謂開源的「新手」。
        做到發起專案、指定特定角色參與專案、執行自發的專案或協助他人等動作，
        並搭配事件卡、星源樹等環境效果，與其他玩家合作推進專案。在互相合作的過程中獲得最多影響力分數的玩家獲勝！
        同時，玩家間的合作將加速改變世界，進步、退化由你決定！
        體驗參與開源專案的過程，一起經歷發起專案、參與專案、完成專案並增進社會的開源環境，
        在互相合作的過程中獲得最多影響力分數的玩家獲勝！
        <a href="https://openstartervillage.ocf.tw/s/manual" target="_blank">點我看完整遊戲規則書</a>
      `,
    },
    highlights: {
      en: [
        [`Time`, `60-90 mins`],
        [`Players`, `2-4 players`],
        [`Type`, `Strategy, Worker Placement`],
      ],
      'zh-tw': [
        [`時間`, `60-90分`],
        [`人數`, `2-4人`],
        [`類型`, `策略、工人放置`],
      ],
    },
  };

  const gameFeatures = {
    componentType: 'ThreeColumns',
    id: `game-feature`,
    title: {
      en: `Game Features`,
      'zh-tw': `遊戲特色`,
    },
    columns: {
      en: [
        [
          `The world faces new challenges`,
          `
          <img src="/images/homepage/as_real_as_life.png" alt="as_real_as_life">
          <strong>As real as your life!</strong>
          <div>
          Whether it is a shark biting off a submarine cable and directly disconnecting the network, the inexplicable spread of pneumonia makes people change their homes; Or the newly appointed officials support the opening of science and technology, and the real world will encounter large and small events that affect the development of technology and the popularization of open concepts. Hyper-realistic event card design that hits/inspires you on your open source life path every turn! Each turn players will face the events that are happening in the Open Source StarTer Village, which may bring new problems, new challenges, and may also bring players help on the road to open source!
          </div>
          `,
        ],
        [
          `Create an open source project`,
          `
          <img src="/images/homepage/create_new_project.png" alt="create_new_project">
          <strong>Solving problems is not just shouting!</strong>
          <div>
          From daily personal life to environmental conservation policy formulation, in the face of small challenges and problems, one person can not think of a solution, a group of people can always solve it! Through the open source project card design, from the real open source projects and the results of cooperation with everyone, we can see the diversity of scientific and technological tools!
          </div>
          `,
        ],
        [
          `Find like-minded partners`,
          `
          <img src="/images/homepage/find_mates.png" alt="find_mates">
          <strong>The same philosophy, but each has its own strengths!</strong>
          <div>
          If you want to do a good job, you must first find the right person! Opening any technological tool, software, or web page, it's not just about having code, right? When facing a problem, if there is something you don't understand, seek help from someone. The copy that engineers can't write, the bill that they don't understand, the pronunciation that they can't pronounce, the topic they don't understand, the art that they can't draw—all these issues can be solved through collaboration. Character cards with seven different skills, each playing to their strengths, perfectly meet the diverse needs of developing technology tools!
          </div>
          `,
        ],
      ],
      'zh-tw': [
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
          </div>
          `,
        ],
        [
          `開始開源專案`,
          `
          <img src="/images/homepage/create_new_project.png" alt="create_new_project">
          <strong>解決問題，不只嚷嚷而已！</strong>
          <div>
          小至每天的個人生活、大到保育環境政策制訂，面對小小大大的挑戰與問題，一個人想不到解決辦法、一群人總能搞定！
          藉由開源專案卡設計，從真實存在的開源專案和眾人合作成果，看見科技工具的多元性！
          </div>
          `,
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
          </div>
          `,
        ],
      ],
    },
  };

  const gameUseCases = {
    componentType: 'ThreeColumns',
    id: `game-usecase`,
    title: {
      en: `Game Uses and Purposes`,
      'zh-tw': `遊戲用途與目的`,
    },
    columns: {
      en: [
        [
          `Teaching materials`,
          `Whether it is a university, high school course, or a related club course, planning the Learning Scenario that includes a teaching briefing and board games to easily convey the concept of open source!`,
        ],
        [
          `Organise community`,
          `You're already an open source veteran and active member of the community, and you want to absorb new blood without much effort? Just gather a group and invite new friends to join in the fun!`,
        ],
        [`Entertainment`, `Give me a dozen cute characters!`],
      ],
      'zh-tw': [
        [
          `教學教材`,
          `無論大學、高中課程或相關社團課程，教學簡報配合桌遊，輕鬆認識開源觀念！`,
        ],
        [
          `社群推坑`,
          `已是開源老手、社群活躍成員的你，想要不費吹灰之力吸收新血？揪團玩就對了！`,
        ],
        [`自娛娛人`, `角色可愛就給我來一打！`],
      ],
    },
  };

  const projectRoles = {
    componentType: 'ThreeColumns',
    id: `project-role-in-society`,
    title: {
      en: `How do open source projects change the world?`,
      'zh-tw': `開源專案的角色扮演`,
    },
    columns: {
      en: [
        [
          `First Aid Kit: Social Issues Drive Project Begins`,
          `
            <strong>Project Card - Mask Map</strong> is one of the projects of the gov-zero (G0V) of Taiwan's open source community, in response to the Wuhan pneumonia epidemic in 2020, the Taiwan government adopted mask real-name system measures. In just a few days, community participants connected with real-time inventory data of pharmacies opened by various governments, mask distribution information and locations of medical institutions and supermarkets, etc., to create an application to view the stock of masks in various places in real time.
          `,
        ],
        [
          `Social Issues Promoter: The project is carried out to promote the discussion of the issue`,
          `
            <strong>Project card - Scan and Buy</strong> is an application derived from the "Transparent Footprint" project, which promotes environmental data disclosure, tracks real-time monitoring data of pollution indicators such as corporate waste gas and wastewater, and records of illegal penalties. It is hoped that black-hearted enterprises will be identified, the government will be promoted to improve the legal system of environmental protection and the enterprise control system, and at the same time strengthen citizen participation and supervision, and check the consumption choice every time!
          `,
        ],
        [
          `Urging progress leaders: Discussion of issues moves society forward`,
          `
            <strong>Project Card - Citizen Judges</strong> can not only open up to Congress and the executive branch, but also the courts can become government departments that allow citizens to participate! The Legislative Yuan passed the National Judges Law in 2020 and is expected to be officially launched in 2023. The collegial panel of the Act will be composed of six national judges and three professional judges, and eligible and randomly selected citizens may participate in the court discussion and judgment process. It is hoped that judicial justice will be implemented together in combination with the social expectations of the people and the professionalism of judges.
          `,
        ],
      ],
      'zh-tw': [
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
      ],
    },
  };

  const page = fetchPage(locale, 'index');

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
        highlights: banner.highlights[locale],
      },
      projectIntro: {
        ...projectIntro,
        title: projectIntro.title[locale],
        columns: projectIntro.columns[locale],
      },
      gameIntro: {
        ...gameIntro,
        title: gameIntro.title[locale],
        content: gameIntro.content[locale],
        highlights: gameIntro.highlights[locale],
      },
      gameFeatures: {
        ...gameFeatures,
        title: gameFeatures.title[locale],
        columns: gameFeatures.columns[locale],
      },
      gameUseCases: {
        ...gameUseCases,
        title: gameUseCases.title[locale],
        columns: gameUseCases.columns[locale],
      },
      projectRoles: {
        ...projectRoles,
        title: projectRoles.title[locale],
        columns: projectRoles.columns[locale],
      },
      page,
    },
  };
};

const Index = ({
  headInfo,
  page,
  banner,
  projectIntro,
  gameIntro,
  gameFeatures,
  gameUseCases,
  projectRoles,
}) => (
  <>
    <Head>
      <title>{headInfo.title}</title>
      <meta name="description" content={headInfo.description} />
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
    {page && page.data['layout_list']?.map(contentMapper)}
    {/* <>
      <Banner
        title={banner.title}
        subtitle={banner.subtitle}
        heroImage={banner.heroImage}
        highlights={banner.highlights}
      />
      <TwoColumns
        id={projectIntro.id}
        title={projectIntro.title}
        columns={projectIntro.columns}
      />
      <ImageAndText
        id={gameIntro.id}
        title={gameIntro.title}
        subtitle={gameIntro.subtitle}
        image={gameIntro.image}
        content={gameIntro.content}
        highlights={gameIntro.highlights}
      />
      <ThreeColumns
        id={gameFeatures.id}
        title={gameFeatures.title}
        columns={gameFeatures.columns}
      />
      <ThreeColumns
        id={gameUseCases.id}
        title={gameUseCases.title}
        columns={gameUseCases.columns}
      />
      <ThreeColumns
        id={projectRoles.id}
        title={projectRoles.title}
        columns={projectRoles.columns}
      />
    </> */}
  </>
);

export default Index;
