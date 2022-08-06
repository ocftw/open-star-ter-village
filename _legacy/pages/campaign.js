import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import SEO from "../components/seo";

import Banner from "../components/banner";
import Section from "../components/section";

const CampaignPage = ({ data }) => {
  const mainBannerData = {
    heroImage: data.contentfulSiteInformation.heroImage,
    siteName: "「開源星手村」工作坊",
    designation: "用桌遊，參與台灣的未來",
  };

  const sectionOneData = {
    title: `開源─開放這個世界的資源`,
    subtitle: `願「源」力與你同在`,
    content: `
    「開源星手村」讓你深度體驗「開源」（Open Resource）專案。<br />
    <br />
    你用過「台北等公車」嗎？又或者是否使用過「口罩地圖」？以上的專案都是由民間發起，或由非營利組織主導，號召程式設計、行銷公關、文化工作者等不同專業的夥伴，透過貢獻彼此的專業所架構而成的開源專案。<br />
    <br />
    開放文化基金會一直以來致力於推動台灣社群的發展與耕耘，讓各方人才在執行多元專案的過程裡，同時推動社會進步、充實自我技能與成就。<br />
    <br />
    因為開放這個世界的資源，才能夠讓更多人朝共好的目標前進；因為集結眾人之力合作，我們也同時參與著更進步的未來。<br />
    <br />
    願「源」力與我們同在。`,
  };

  const sectionTwoData = {
    title: `打造您的樂高`,
    subtitle: ``,
    content: ``,
    video: `6NhyCXJU-IQ`,
  };

  const sectionThreeData = {
    title: `參與專案，參與台灣的未來`,
    subtitle: `給下一代社會的日常備忘錄`,
    content: `現在，來參與彼此的未來吧！<br />
    <br />
    要記得，各類的開源專案，是社會前進不可或缺的力量。<br />
    要記得，進社會前，我們要準備非常多學校沒教的能力。<br />
    要記得，你的專業能在更大的舞台被看見，受萬眾矚目。<br />
    要記得，當世界限縮你的眼界時，試著開放就成為必然。<br />
    要記得，當大學成為職業介紹所時，突破框架誠屬自然。<br />
    要記得，在未來的社會上，你絕非只是一個工作的機器。<br />
    <br />
    台灣的未來需要你的參與。<br />
    這一次，我們絕不能缺席。`,
  };
  const sectionFourData = {
    title: `多元參與，全面體驗`,
    subtitle: ``,
    content: `
    不論你是熱血的憤怒青年，或是縱橫職場的高手，又或者你希望能夠發掘更多人生的可能性，都可以來參加這次的工作坊。<br />
<br />
    一起合作完成任務<br />
    兩場次桌遊工作坊<br />
    多項專案執行體驗<br />
    全面的發掘行動力<br />
    `,
  };
  const sectionFiveData = {
    title: `一起變成知識與實踐都強壯的巨巨`,
    subtitle: ``,
    content: `
    <div style="display: flex">
    <div>
    <h3>教育/文化/社會職人場</h3>
    <h4>教育輔助</h4>
    開源星手村模擬了各式的專案及職業取向，可以讓莘莘學子在體驗中找到未來可能的人生方向。如今的學院幾乎成為職業介紹所，作為桌遊，我們可以是最強的教育輔助與人生夥伴。<br />
    <br />
    <h4>文化輸出</h4>
    人文與科技或許並非孤立於兩端的雙子星，它們之間只是缺少了深入互動的關鍵。在開源專案裡，文化人往往扮演著要角，透過開源星手村，讓我們一起找出關鍵，成為多方的橋樑。<br />
    <br />
    <h4>思想坦克</h4>
    在後現代社會裡，「反思」一詞不斷地被徵引，無論是在人生道路或是生涯發展裡，其所帶來的動能往往是社會進步所需。在一次次開源專案裡，讓思想的坦克帶我們一步步前進吧。<br />
    </div>
    <div>
    <h3>熱血青年培力探索場</h3>
    <h4>拓展人脈</h4>
    透過桌遊的遊玩歷程，「關係」不斷地被建立起來，在一次次的合作與競爭中，人脈也能夠逐漸地累積。從中學習彼此的優點以及專業，是未來不可或缺的技能與經驗，加入我們吧！<br />
    <br />
    <h4>主體培力</h4>
    現今的社會已經從傳統的單打獨鬥成為群體合作，然而在群體中的個人「主體性」仍是重要的。期許你在一次次的遊玩經驗中，讓彼此像映照對方的鏡子，交疊出屬於自己的主體。<br />
    <br />
    <h4>累積實力</h4>
    開源星手村是一個專案體驗桌遊，過程中你將累積許多對專案的了解，以及自身技能的特性。在完成專案後，我們除了能得到成就感外，還可以培養一生受用的實力，一起來變強吧！<br />
    </div>
    </div>
    `,
  };

  return (
    <Layout header="home">
      <SEO
        title={data.contentfulSiteInformation.siteName}
        keywords={[]}
      />
      <Banner data={mainBannerData} />
      <Section data={sectionOneData} />
      <Section data={sectionTwoData} />
      <Section data={sectionThreeData} />
      <Section data={sectionFourData} />
      <Section data={sectionFiveData} />
    </Layout>
  )
};

export default CampaignPage;

export const pageQuery = graphql`
  query CampaignQuery {
    contentfulSiteInformation(node_locale: { eq: "zh-Hant-TW" }) {
      siteName
      heroImage {
        gatsbyImageData(layout: FULL_WIDTH, aspectRatio: 1.78)
      }
      menus
    }
  }
`;
