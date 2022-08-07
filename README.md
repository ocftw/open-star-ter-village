# 開源星手村 首頁

## 專案架構

目前此專案與網頁版共用專案，暫時以不同分支作為不同 pipeline 的切分依據。

- 分支一 `main` 為桌遊網頁版開發主幹，以 heroku 為部屬環境
- 分支二 `homepage` 為首頁開發主幹，以 netlify 為部屬環境

前往[桌遊網頁版專案](https://github.com/ocftw/open-star-ter-village/tree/main)
前往[官網首頁專案](https://github.com/ocftw/open-star-ter-village/tree/homepage)

homepage 是以 [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git) 為基礎建置，移除了Gatsby並改用純粹的React JS static site generating以降低入門門檻，並移除Contentful CMS部分以減少團隊花費。

模版設計上目前以[首頁 wireframe](https://drive.google.com/file/d/1mHfiHLZPNvAGKtlY788Ojkmap9SXupH-/view?usp=sharing)為開發方向，CSS延續之前的樣板繼續使用 [Bootstrap v4.6.x](https://getbootstrap.com/docs/4.6/getting-started/introduction/), [Font Awesome v5.15.4](https://fontawesome.com/v5/docs)

目前部屬在 Netlify 上，並有[預覽網頁](https://openstartervillage-preview.netlify.app/activity-test-page)與[正式網頁](https://openstartervillage.netlify.app/)

### 線上展示

[![Netlify Status](https://api.netlify.com/api/v1/badges/2440ec97-301c-4a60-ae46-558cd2cb00b9/deploy-status)](https://app.netlify.com/sites/openstartervillage/deploys)

[https://openstartervillage.netlify.app/](https://openstartervillage.netlify.app/)

### 如何參與合作/貢獻

你可以在[共用資料夾的坑區](https://drive.google.com/drive/folders/1JgqEh5gkf9nzqwznLLAo1vtgHWi3o7gw)以及[試算表中的Story mapping](https://docs.google.com/spreadsheets/d/1QBjG9JozOvP1TOwg33h0Gs6yIdifd1sJ6CJTZZHZr7I/edit?usp=sharing)找到我們目前需要幫忙的內容。

> 公用資料夾的坑主要為網頁內容或需要與工程師進一步確認的事項；試算表中的Story mapping主要是以工程師的任務為主

也歡迎加入[discord](https://discord.gg/JnTHGnxwYS)與大家一起討論，你可以在 #村長辦公室 與 #基礎建設部 提出各種見解與參與討論喔！

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
git clone -b homepage --single-branch https://github.com/ocftw/open-star-ter-village.git
cd open-star-ter-village
```

#### 下載開發環境所需的packages

```shell
npm install
```

#### 開發專案

我們以建置靜態網站為主要目的，如果要知道如何建置靜態網站請參考[連結](#建置專案)。

下面的指令提供了即時監看 `index.html`, `src/`, 與 `assets/` 底下的檔案。監聽的內容目前只包括以如下幾種為副檔名的檔案，`.js`, `.jsx`, `.json`, `.css` 與 `.html`

```shell
npm run dev
```

與此同時用下面的指令開啟一個本機的網頁伺服器用來測試與瀏覽建置的結果。開啟後，預設的port為3000。<http://localhost:3000>

```shell
npm run serve
```

#### 建置專案

```shell
npm run build
```

## 💫 Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ocftw/open-star-ter-village/tree/homepage)

## Inspired

- [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git)
- [Creating a static website with ReactJS and renderToStaticMarkup()](https://www.codemzy.com/blog/static-website-react-rendertostaticmarkup)
- [亂數假文產生器 Chinese Lorem Ipsum](http://www.richyli.com/tool/loremipsum/)

## 特別感謝

@binaryluke
