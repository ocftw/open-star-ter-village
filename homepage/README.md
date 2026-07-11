# 開源星手村 首頁

版本紀錄請參閱 [`CHANGELOG.md`](./CHANGELOG.md)。

目前，模板設計基於 [首頁 wireframe](https://drive.google.com/file/d/1mHfiHLZPNvAGKtlY788Ojkmap9SXupH-/view?usp=sharing)，並使用 [Bootstrap v4.6.x](https://getbootstrap.com/docs/4.6/getting-started/introduction/) 和 [Font Awesome v5.15.4](https://fontawesome.com/v5/docs) 進行 CSS 設計。

專案目前部署於 Netlify 上，Netlify有提供免費的[網域](https://openstartervillage.netlify.app/)，並且支援[自動部署](https://docs.netlify.com/site-deploys/overview/)，因此專案的部署流程相當簡單。

同時，專案也支援[多語言](https://nextjs.org/docs/advanced-features/i18n-routing)，並且使用 [Decap CMS](https://decapcms.org/) 作為網站內容管理工具。

## 專案設定

- Runtime：Node.js >= 24
- Package manager：Yarn 3.4.1
- Framework：Next.js 13
- CMS：Decap CMS

常用指令：

```bash
yarn dev        # 啟動開發伺服器
yarn build      # 建置網站
yarn start      # 啟動 production server
yarn lint       # Prettier check + ESLint
yarn lint:fix   # 自動修正格式與 lint 問題
```

## 💫 部署

[![部署至 Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ocftw/open-star-ter-village/tree/homepage)

### 線上展示

[![Netlify 狀態](https://api.netlify.com/api/v1/badges/2440ec97-301c-4a60-ae46-558cd2cb00b9/deploy-status)](https://app.netlify.com/sites/openstartervillage/deploys)

[https://openstartervillage.netlify.app/](https://openstartervillage.netlify.app/)

## 網域設定

開源星手村在ocf.tw底下有一個子網域，網址為[https://openstartervillage.ocf.tw/](https://openstartervillage.ocf.tw/)，目前已經將此網址導向至Netlify。

## 🚀 快速開始

### 參與合作/貢獻方式

歡迎加入[Discord](https://discord.gg/JnTHGnxwYS)，於 #村長辦公室 與 #基礎建設部 提出您的見解並參與討論！

### 網站開發

若您對網站開發有興趣，歡迎參考以下資訊。

- [官方網站進度規劃](https://github.com/ocftw/open-star-ter-village/wiki/Homepage-Roadmap)

#### 開發前需了解的事項

請參考[CONTRIBUTING.md](./CONTRIBUTING.md)。

### 網站內容編輯

- [網站編輯說明](https://github.com/ocftw/open-star-ter-village/wiki/%E7%B6%B2%E7%AB%99%E7%B7%A8%E8%BC%AF%E8%AA%AA%E6%98%8E-%E2%80%90-How-to-Edit-Homepage)

Decap CMS 支援 Markdown 語法，如對此不熟悉可參考以下兩個網站學習 Markdown 語法，並透過 [markdown playground](https://hackmd.io/2OBWFw_FSiazt4JxoINNlQ?both) 進行練習。

- <https://markdown.tw/> （注意：此網頁在手機和小螢幕裝置上的排版支援有限）
- <https://www.casper.tw/development/2019/11/23/ten-mins-learn-markdown/>

### 增加新語言/修改語言代碼/刪除語言

1. 增加語言於 [`next.config.js`](./next.config.js) 中的 `i18n.locales` 陣列中。語言代碼請參考 [BCP 47](https://www.w3.org/International/questions/qa-choosing-language-tags#question), [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes), [ISO 639-2](https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes), [ISO 639-3](https://en.wikipedia.org/wiki/List_of_ISO_639-3_codes)

目前支援的語言有 `zh-Hant`, `en`。

```js
// next.config.js
i18n: {
  locales: ['zh-Hant', 'en'],
  defaultLocale: 'zh-Hant',
},

// decap-cms.config.js
// decap cms i18n inherits from next.config.js
i18n: {
  structure: 'multiple_folders',
  locales: nextConfig.i18n.locales,
  default_locale: nextConfig.i18n.defaultLocale,
},
```

> Decap cms中的語言陣列與預設語言是沿用next.config.js中的設定，因此在next.config.js中新增語言後，decap cms會自動套用新增的語言。
>
> 語言陣列中的語言順序為decap cms中的編輯文件的語言順序。

2. 修改語言代碼需同時修改 `next.config.js` 中的 `i18n.locales` 並將 [`_cards`](./_cards/), [`_footer`](./_footer/), [`_pages`](./_pages/) 資料夾中底下的語言資料夾名稱一併修改。

例如：將 `zh-tw` 修改為 `zh-hant`，則 `_cards`, `_footer`, `_pages` 底下的 `zh-tw` 資料夾名稱也需一併修改為 `zh-hant`。

> Decap cms中的語言陣列與預設語言是沿用next.config.js中的設定，因此在next.config.js中修改語言後，decap cms會自動套用修改。
>
> 語言資料夾名稱需與 `next.config.js` 中的 `i18n.locales` 陣列中的語言代碼一致。
>
> 如果`defaultLocale`是`zh-tw`，則在`zh-tw`修改為`zh-hant`時，需要同時修改`defaultLocale`為`zh-hant`。
>
> 在 [`public/_redirects`](./public/_redirects) 中新增一個重新導向規則，將舊的語言代碼導向到新的語言代碼。例如，如果您將 `zh-tw` 更改為 `zh-hant`，則應在 `public/_redirects` 中添加 `/zh-tw/* /zh-hant/:splat 301!`。

## 其他連結

- [開源新手村 ★ 入村總綱領](https://hackmd.io/1B3eCm8sSbqDTdcMI7o85g)
- [共用資料夾區](https://drive.google.com/drive/folders/1d2rlxRLQ_iUVhq9-ZO7BGCjTl1ES2zf6)

## 靈感來源

- [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git)
- [Creating a static website with ReactJS and renderToStaticMarkup()](https://www.codemzy.com/blog/static-website-react-rendertostaticmarkup)
- [亂數假文產生器 Chinese Lorem Ipsum](http://www.richyli.com/tool/loremipsum/)
- [Static Site Generation with React and Webpack](https://sking7.github.io/articles/945674580.html)
- [Benchmarking esbuild, swc, tsc, and babel for React/JSX projects](https://datastation.multiprocess.io/blog/2021-11-13-benchmarking-esbuild-swc-typescript-babel.html)
- [Why you should use SWC (and not Babel)](https://blog.logrocket.com/why-you-should-use-swc/)
- [Migrating to SWC: A brief overview](https://blog.logrocket.com/migrating-swc-webpack-babel-overview/)
- [Why Next.js switched from Babel to SWC](https://nextjs.org/blog/next-11-1#adopting-rust-based-swc)
- [Next.js documents](https://nextjs.org/docs/getting-started)
- [Next.js blogging template for Netlify](https://github.com/wutali/nextjs-netlify-blog-template)
- [unified](https://github.com/unifiedjs/unified)
- [remark](https://github.com/remarkjs/remark)
- [rehype](https://github.com/rehypejs/rehype)
- [How to build a blog with Next.js](https://dev.to/sagar/building-a-blog-with-next-js-253)
- [How to Internationalize Sites with Country-Based Redirects](https://www.netlify.com/blog/2021/11/05/how-to-internationalize-sites-with-country-based-redirects/)

## 特別感謝

[@binaryluke](https://github.com/binaryluke) 在 v2.0.0 階段提供網站架構想法。
