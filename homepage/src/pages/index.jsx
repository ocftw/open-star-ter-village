import Head from 'next/head';
import Script from 'next/script';
import { fetchPage } from '../lib/fetchPage';
import { getPagesList } from '../lib/getPagesList';
import contentMapper from '../layouts/contentMapper';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const pagesList = await getPagesList(locale);
  // const backToTop = {
  //   en: 'Back to top',
  //   'zh-tw': '回到頁首',
  // };

  // const projectIntroNav = {
  //   en: 'Project Intro',
  //   'zh-tw': '專案介紹',
  // };

  // const gameIntroNav = {
  //   en: 'Game Intro',
  //   'zh-tw': '遊戲介紹',
  // };

  const cardsPage = {
    en: 'Cards',
    'zh-tw': '卡片頁',
  };

  // * dynamic page navigation
  const navigationList = pagesList
    .filter((page) => page.path && page.name)
    .map((page) => {
      page.path = page.path.replace('index', '');
      return { link: `/${page.path}`, text: page.name };
    });
  // add hard coded cards page
  navigationList.push({ link: `/cards`, text: cardsPage[locale] });

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

  const page = fetchPage(locale, 'index');

  return {
    props: {
      navigationList,
      headInfo: {
        title: headInfo.title[locale],
        description: headInfo.description[locale],
      },
      page,
    },
  };
};

const Index = ({ headInfo, page }) => (
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
    {page.data['layout_list']?.map(contentMapper)}
  </>
);

export default Index;
