import Head from 'next/head';
import Script from 'next/script';
import contentMapper from '../layouts/contentMapper';
import { getLayout } from '../lib/service/getLayout';
import { getPage } from '../lib/service/getPage';

/**
 *
 * @type {import('next').GetStaticProps}
 */
export const getStaticProps = async ({ locale }) => {
  const headInfo = {
    title: {
      en: `OpenStarTerVillage`,
      'zh-Hant': `開源星手村`,
    },
    description: {
      en: `How can technology change the world? Play this board game and discover the answer for yourself!`,
      'zh-Hant': `科技怎麼改變世界？玩桌遊、就知道！`,
    },
  };

  const page = await getPage('index', locale);

  const layout = await getLayout(locale);

  return {
    props: {
      headInfo: {
        title: headInfo.title[locale],
        description: headInfo.description[locale],
      },
      page,
      layout,
    },
  };
};

const Index = ({ headInfo, page }) => (
  <>
    <Head>
      <title>{headInfo.title}</title>
      <meta name="description" content={headInfo.description} />
      <meta
        name="google-site-verification"
        content="NejiRhdBA-bewypiYDtrGnKJ09VSH6-15HsXUNKdrm4"
      />
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
    {page.contentList?.map(contentMapper)}
  </>
);

export default Index;
