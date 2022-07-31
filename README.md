# 開源星手村 首頁

## 專案架構

目前此專案與網頁版共用專案，暫時以不同分支作為不同 pipeline 的切分依據。

- 分支一 `main` 為桌遊網頁版開發主幹，以 heroku 為部屬環境
- 分支二 `homepage` 為首頁開發主幹，以 netlify 為部屬環境

homepage 是以 [RG-Portfolio gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git) 為基礎建制，底層使用 [Gatsby](https://www.gatsbyjs.org/) 網頁框架與 [Contenful](https://www.gatsbyjs.org/packages/gatsby-source-contentful/?=Contenful) 內容管理系統合併使用。

### 線上展示

[![Netlify Status](https://api.netlify.com/api/v1/badges/2440ec97-301c-4a60-ae46-558cd2cb00b9/deploy-status)](https://app.netlify.com/sites/openstartervillage/deploys)

[https://openstartervillage.netlify.app/](https://openstartervillage.netlify.app/)

### 內容編輯需求

[contentful](https://www.contentful.com/) 的 OpenStarTerVillage 存取權限，可以從[這裡](https://app.contentful.com/spaces/7bjk35noegpy/home)到OpenStarTerVillage的內容管理首頁。[contentful](https://www.contentful.com/) 可以 github 帳號註冊與登入。

> contentful對於社群使用者的上限為5人，如果沒有權限請到 Discord 中的村長辦公室或基礎建設部找內容管理員取得權限。

#### 各種有用的連結

- [開源新手村★入村總綱領](https://hackmd.io/1B3eCm8sSbqDTdcMI7o85g)
- [共用資料夾區](https://drive.google.com/drive/folders/1d2rlxRLQ_iUVhq9-ZO7BGCjTl1ES2zf6)

### 開發前須知

#### 系統需求

| tool | version |
|-----:|--------:|
| node |    >=14 |
|  npm |     >=8 |

如果沒有node，可以到[這裡](https://nodejs.org/en/)安裝

### 開發建議流程

#### clone 專案

```shell
git clone -b homepage --single-branch https://github.com/ocftw/open-star-ter-village.git
cd open-star-ter-village
```

#### 環境設定

首頁的建制需要`contentful`的 `CONTENTFUL_SPACE_ID` 與 `CONTENTFUL_ACCESS_TOKEN` 設置於環境變數中，也可以在專案根目錄中加入`.env`檔案。我們推薦使用`.env`檔案較為方便也簡單管理。如何取得Token請參考[Personal Access Tokens](https://www.contentful.com/help/personal-access-tokens/)

> 如果使用舊版的程式碼，環境變數`spaceId`與`accessToken`將會由`CONTENTFUL_SPACE_ID`與`CONTENTFUL_ACCESS_TOKEN`取代，在未來版本中`spaceId`與`accessToken`將不會被使用

以下為`.env`檔案的範例：

```.env
CONTENTFUL_SPACE_ID="xxxxxxxxxx"
CONTENTFUL_ACCESS_TOKEN="xxxxxxxxxxxXXXXXxxxxXXxxXXXXxxxxXxXXXXxxxxx"
```

預覽內容的環境設定

請加入 `CONTENTFUL_HOST` 這個欄位，並設定為 `preview.contentful.com`，如果沒有提供此欄位，預設值為 `cdn.contentful.com`。詳細內容請參考 [Preview API](https://www.contentful.com/developers/docs/references/content-preview-api/) 與 [gatsby-source-contentful plugin](https://www.gatsbyjs.com/plugins/gatsby-source-contentful/)

```.env
CONTENTFUL_HOST="preview.contentful.com"
```

### Feature

- Blogs listing with each blog post.
- Contact form with Email notification using formspree.io.
- Photos and Blogs page listing.
- Different types of sections like About, Service, Blogs, Work, Testimonials, Photos, and contact.
- All settings manage from contentful for example Header Menu, Homepage sections, blogs, and photos, etc.
- Social share in blog details pages.
- PWA

## 🚀 Quick start

1. **Setup this site.**

    Use the Gatsby CLI to Clone this site.

    ```sh
    # Clone this Repositories
    gatsby new rg-portfolio https://github.com/Rohitguptab/rg-portfolio.git
    ```

1. **Setup Contentful Models**

    Use [contentful-cli](https://github.com/contentful/contentful-cli) to import the models from contentful-data.json

    ```
    contentful space --space-id <CONTENTFUL_SPACE_ID> import --content-file contentful-data.json
    ```

    Checkout my below blog how to Import and Export data from ContentFul

    [https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli](https://rohitgupta.netlify.app/import-and-export-data-with-contentful-cli)

1. **Start developing.**

    Navigate into your new site’s directory and start it up.

    ```sh
    cd rg-portfolio
    npm install
    gatsby develop
    ```

1. **Setup your Own Configure Projects.**

    Enter your own key

    [ContentFul](https://be.contentful.com/login):

    - spaceId = **Key**
    - accessToken = **Key**

1. **Open the source code and start editing!**

    Your site is now running at `http://localhost:8000`!

    _Note: You'll also see a second link:_`http://localhost:8000/___graphql`_. This is a tool you can use to experiment with querying your data. Learn more about using this tool in the [Gatsby tutorial](https://www.gatsbyjs.org/tutorial/part-five/#introducing-graphiql)._

    Open the `rg-portfolio` directory in your code editor of choice and edit `src/pages/index.js`. Save your changes and the browser will update in real time!

## 🎓 Learning Gatsby

Looking for more guidance? Full documentation for Gatsby lives [on the website](https://www.gatsbyjs.org/). Here are some places to start:

- **For most developers, we recommend starting with our [in-depth tutorial for creating a site with Gatsby](https://www.gatsbyjs.org/tutorial/).** It starts with zero assumptions about your level of ability and walks through every step of the process.

- **To dive straight into code samples, head [to our documentation](https://www.gatsbyjs.org/docs/).** In particular, check out the _Guides_, _API Reference_, and _Advanced Tutorials_ sections in the sidebar.

## 💫 Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ocftw/open-star-ter-village/tree/homepage)

  <!-- AUTO-GENERATED-CONTENT:END -->
