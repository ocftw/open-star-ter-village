const url = "https://drive.google.com/file/d/1PQQfFv0QSdt3qymEEu5B_NrmKSsn34UI/view?usp=sharing"

const Redirect = () => (
  <>
    <meta httpEquiv="refresh" content={`0; ${url}`} />
    <div>redirect to {url}. Click <a href={url}>here</a> if the browser did not redirect now.</div>
  </>
);

Redirect.__staticPageOptions = {
  description: `開源星手村完整桌遊說明書`,
}

export default Redirect
