# 開源星手村 首頁

## 專案架構

<details>
<summary>更新紀錄</summary>

|      版本 | 更新細節                   |
|---------:|:--------------------------|
| `v1.0.0` | 增加網站首頁                |
| `v2.0.0` | 移除gatsby與contentful cms |
| `v2.1.0` | 由`homepage`分支併入`main`，套件管理由npm改用yarn  |
| `v3.0.0` | 改用next.js架構             |

</details>

homepage 是以 [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git) 為基礎建置，移除了Gatsby並改用純粹的React JS static site generating以降低入門門檻，並移除Contentful CMS部分以減少團隊金錢花費。

因為切換無相關的兩個分支容易造成開發者的困擾，因此將`homepage`分支併入`main`成為一個子專案，套件管理由npm改為yarn與桌遊網頁版專案的工具保持一致，並將`homepage`分支刪除。

隨著專案的推廣，我們需要將網站架構擴充支援多語系，同時考慮引入Netlify CMS以降低開發團隊維護成本，因此將網站架構改為Next.js，於後續版本加入多語系支援與Netlify CMS。

模版設計上目前以[首頁 wireframe](https://drive.google.com/file/d/1mHfiHLZPNvAGKtlY788Ojkmap9SXupH-/view?usp=sharing)為開發方向，CSS延續之前的樣板繼續使用 [Bootstrap v4.6.x](https://getbootstrap.com/docs/4.6/getting-started/introduction/), [Font Awesome v5.15.4](https://fontawesome.com/v5/docs)

目前部屬在 Netlify 上，並有[預覽網頁](https://openstartervillage-preview.netlify.app/activity-test-page)與[正式網頁](https://openstartervillage.netlify.app/)

### 線上展示

[![Netlify Status](https://api.netlify.com/api/v1/badges/2440ec97-301c-4a60-ae46-558cd2cb00b9/deploy-status)](https://app.netlify.com/sites/openstartervillage/deploys)

[https://openstartervillage.netlify.app/](https://openstartervillage.netlify.app/)

### 如何參與合作/貢獻

你可以在[共用資料夾的坑區](https://drive.google.com/drive/folders/1JgqEh5gkf9nzqwznLLAo1vtgHWi3o7gw)以及[試算表中的Story mapping](https://docs.google.com/spreadsheets/d/1QBjG9JozOvP1TOwg33h0Gs6yIdifd1sJ6CJTZZHZr7I/edit?usp=sharing)找到我們目前需要幫忙的內容。

> 公用資料夾的坑主要為網頁內容或需要與工程師進一步確認的事項；試算表中的Story mapping主要是以工程師的任務為主

也歡迎加入[discord](https://discord.gg/JnTHGnxwYS)與大家一起討論，你可以在 #村長辦公室 與 #基礎建設部 提出各種見解與參與討論喔！

#### 語法練習

- Markdown

  可以到這兩個網頁知道如何撰寫markdown語法，以及我們的 [markdown playground](https://hackmd.io/2OBWFw_FSiazt4JxoINNlQ?both) 進行練習。
  - <https://markdown.tw/> （網頁排版不支援手機/小螢幕裝置）
  - <https://www.casper.tw/development/2019/11/23/ten-mins-learn-markdown/>

- 將Markdown轉為html

  可以直接藉由這兩個網站輸入markdown得到html語法，也可以在 [markdown playground](https://hackmd.io/2OBWFw_FSiazt4JxoINNlQ?both) 找到簡易的對照表。
  - <https://codebeautify.org/markdown-to-html>
  - <https://markdowntohtml.com/>

- 增加html的attributes

- 在jsx中使用html

- 在jsx中使用React component

- 在jsx中使用expression

#### 各種有用的連結

- [開源新手村 ★ 入村總綱領](https://hackmd.io/1B3eCm8sSbqDTdcMI7o85g)
- [共用資料夾區](https://drive.google.com/drive/folders/1d2rlxRLQ_iUVhq9-ZO7BGCjTl1ES2zf6)

### 開發前須知

#### 系統需求

| tool | version |
| ---: | ------: |
| node |    >=14 |
|  npm |     >=8 |

如果沒有 node，可以到[這裡](https://nodejs.org/en/)安裝

### 開發建議流程

#### clone 專案

```shell
git clone https://github.com/ocftw/open-star-ter-village.git
cd open-star-ter-village
```

#### 下載開發環境所需的packages

```shell
cd homepage
yarn
```

#### 開發專案

我們以建置靜態網站為主要目的，如果要知道如何建置靜態網站請參考[連結](#建置專案)。

下面的指令提供了即時監看 `src/` 與 `public/` 底下的檔案，並開啟一個本機的網頁伺服器用來測試與瀏覽建置的結果。開啟後，預設的port為3000。<http://localhost:3000>

```shell
yarn dev
```

#### 建置production專案

```shell
yarn build
```

#### serve server side專案

```shell
yarn start
```

#### 產生靜態網頁

```shell
yarn export
```

#### serve 靜態網頁

```shell
npx serve out
```

## 💫 Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ocftw/open-star-ter-village/tree/homepage)

## Inspired

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

@binaryluke
