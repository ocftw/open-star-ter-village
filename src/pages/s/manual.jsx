const url = "https://drive.google.com/file/d/15XQnYhV-X86gHjE5gIk_ny2x3C-2MDSf/view?usp=share_link"

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
