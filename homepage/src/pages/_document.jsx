import { Html, Head, Main, NextScript } from 'next/document';
import { GTM_ID } from '../lib/service/gtm';

export default function Document({ locale }) {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Josefin+Sans:300,400,400i,600,700,700i&display=swap"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Noto+Sans+TC:300,400,400i,600,700,700i&display=swap"
          rel="stylesheet"
          type="text/css"
        />
        <script
          src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.slim.min.js"
          defer
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.min.js"
          defer
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/js/fontawesome.min.js"
          defer
        ></script>
      </Head>
      <body id="page-top">
        <Main />
        <NextScript />
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display: none; visibility: hidden;" />`,
          }}
        />
      </body>
    </Html>
  );
}
