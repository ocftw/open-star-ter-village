const siteData = {
  siteName: `開源星手村`,
  description: `體驗如何參與改變世界的專案`,
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
