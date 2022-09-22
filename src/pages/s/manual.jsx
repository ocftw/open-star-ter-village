const siteData = {
  siteName: `開源星手村`,
  description: `科技怎麼改變世界？玩桌遊、就知道！`,
  logo: `/images/logo.png`,
}

const url = "https://drive.google.com/file/d/1PQQfFv0QSdt3qymEEu5B_NrmKSsn34UI/view?usp=sharing"

const Redirect = () => (
  <>
    <meta httpEquiv="refresh" content={`0; ${url}`} />
    <div>redirect to {url}</div>
  </>
);

Redirect.__staticPageOptions = {
  title: siteData.siteName,
  description: siteData.description,
}

export default Redirect
