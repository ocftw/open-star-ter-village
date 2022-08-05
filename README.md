# 開源星手村 首頁

## 專案架構

目前此專案與網頁版共用專案，暫時以不同分支作為不同 pipeline 的切分依據。

- 分支一 `main` 為桌遊網頁版開發主幹，以 heroku 為部屬環境
- 分支二 `homepage` 為首頁開發主幹，以 netlify 為部屬環境

homepage 是以 [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git) 為基礎建制，底層使用 [Gatsby](https://www.gatsbyjs.org/) 網頁框架與 [Contenful](https://www.gatsbyjs.org/packages/gatsby-source-contentful/?=Contenful) 內容管理系統合併使用。

### 線上展示

[![Netlify Status](https://api.netlify.com/api/v1/badges/2440ec97-301c-4a60-ae46-558cd2cb00b9/deploy-status)](https://app.netlify.com/sites/openstartervillage/deploys)

[https://openstartervillage.netlify.app/](https://openstartervillage.netlify.app/)

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

## 💫 Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ocftw/open-star-ter-village/tree/homepage)

  <!-- AUTO-GENERATED-CONTENT:END -->
