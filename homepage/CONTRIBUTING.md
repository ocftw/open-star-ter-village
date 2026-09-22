# 貢獻專案

## 系統需求

| 工具 |    版本 |
| ---: | ------: |
| Node |    >=24 |
| pnpm | 11.15.1 |

若尚未安裝 Node，請前往[此處](https://nodejs.org/en/)進行安裝。
pnpm 由 repository 根目錄的 `packageManager` 欄位固定版本，透過 Corepack 使用即可。

## 網站架構

```mermaid
graph TB
  Public["Public Files (images, style sheet, etc.)"]

  Markdown[("Markdown files")]

  Config[Next.js Configuration]

  subgraph Components
    ReusableComponents["Reusable Components"]
  end

  subgraph Admin[Admin Page]
    DecapCMSConfig["Decap CMS Config"] --> DecapCMS[Decap CMS]
  end

  Config -->|i18n config| DecapCMSConfig
  Components -->|Live Preview| DecapCMS

  subgraph Pages[All pages. Index, Cards, etc.]
    NextJSClient["Next.js Client"]
    Components --> NextJSClient
    NextJSClient -->|Render| ClientPages["Client Pages"]
    StaticPages["Static Pages"]
  end

  NextJSServer -->|Generate| StaticPages
  NextJSServer["Next.js Server"] -->|i18n routing| NextJSClient
  Config -->|i18n auto routing &\n img optimise| NextJSServer
  Config -->|Image Optimisation| StaticPages["Static Pages"]

  Public -->|Optimise & Serve| NextJSServer
  DecapCMS -->|Write| Markdown
  Markdown -->|Provide assets| NextJSServer

  StaticPages -->|html| User
  ClientPages -->|js| User
```

## 部署

本專案使用 Netlify 與 Netlify Next.js runtime 進行部署，帶來以下優勢：

- 分支預覽部署 (Branch Preview Deployment) 讓您可以預覽每個 Git 分支的變更。
- 使用 [Netlify Identity](https://docs.netlify.com/security/secure-access-to-sites/identity/) 和 [Git Gateway](https://docs.netlify.com/security/secure-access-to-sites/git-gateway/) 管理非 GitHub 使用者的網頁編輯權限。

如果您不熟悉 Netlify，請參考[Netlify 文件](https://docs.netlify.com/)。

### 主要網站

[https://openstartervillage.netlify.app](https://openstartervillage.netlify.app)

### Canary 版本

為了在不直接影響主要網站的情況下測試新的 CI/CD 流程，我們使用 Canary 版本。

[https://openstartervillage-canary.netlify.app](https://openstartervillage-canary.netlify.app)

> Canary 版本會在每次推送到 `main` 分支時自動部署。它具有與主要網站相同的環境變數，但其網址不會被列入搜尋引擎索引。

## 開發前置流程

### 複製專案

```shell
git clone https://github.com/ocftw/open-star-ter-village.git
cd open-star-ter-village
```

### 安裝開發環境所需的套件

```shell
corepack enable
pnpm install --frozen-lockfile
```

## 開發專案

本專案使用 Next.js 架構，若您不熟悉 Next.js，請參考[Next.js 文件](https://nextjs.org/docs/getting-started)。若需更深入了解不同方面，可查看以下文件：

- [Next.js `getStaticProps`](https://nextjs.org/docs/basic-features/data-fetching#getstaticprops-documentation)
- [i18n 設定](https://nextjs.org/docs/advanced-features/i18n-routing)
- [圖片最佳化](https://nextjs.org/docs/basic-features/image-optimization)

### 開發模式

> 若要在本地端開發並測試 CMS，需要先在 **開源星手村 git 專案根目錄** 啟動 `decap-server`：
>
> ```shell
> npx decap-server
> ```

以下指令將立即監控 `src/` 和 `public/` 資料夾中的檔案，並啟動本地網頁伺服器，用於測試和預覽結果。伺服器預設運行於端口 3000。<http://localhost:3000>

```shell
pnpm homepage dev
```

### 建置發布版本

```shell
pnpm homepage build
```

### 啟動伺服器端

```shell
pnpm homepage start
```

## Decap CMS 設定

Decap CMS 是一個用於網站內容管理的工具。若您希望深入了解如何設定 Decap CMS 中的 collection、widget、i18n，您可以參考以下文件：

- [Decap CMS local backend 設定](https://decapcms.org/docs/beta-features/#working-with-a-local-git-repository)
- [Decap CMS Collection 設定](https://decapcms.org/docs/collection-types/)
- [Decap CMS Widget 設定](https://decapcms.org/docs/widgets/)
- [Decap CMS i18n 設定](https://decapcms.org/docs/beta-features/#i18n-support)

## 其他功能設定

### 網站分析

網站分析使用 Google Tag Manager 進行設定，主要用於分析網站流量。主要的設定檔案為 [`src/lib/service/gtm.js`](./src/lib/service/gtm.js)，使用於 [`src/pages/_app.jsx`](./src/pages/_app.jsx) 與 [`src/pages/_document.jsx`](./src/pages/_document.jsx)。

正式站使用 `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-N324PT4J`。此環境變數未設定時不會載入 GTM，也不會寫入 `dataLayer`，因此本機與 Deploy Preview 不會污染正式資料。

站內推廣使用 GA4 建議事件 `view_promotion` 與 `select_promotion`。線上遊戲頁尾連結的 `promotion_id` 為 `footer_play_online`，資源頁橫幅為 `resource_play_online`。可重複使用的 CTA 橫幅由 CMS 的 `layout_cta_banner` 管理；`analytics_id` 必須在所有語言版本保持相同。

所有連結啟用時會送出 `link_click`。事件包含不含查詢參數的目的網址、穩定的 `link_id`、版位與裝置寬度分類。重要連結應設定 `data-analytics-id`；相同連結若出現在不同版位，應另外設定 `data-analytics-placement`。請勿把電子郵件、權杖或其他個人資料放入這些屬性。

### 網站 SEO

網站 SEO 僅有在 [`public/sitemap.xml`](./public/sitemap.xml) 與 [`public/robots.txt`](./public/robots.txt) 中設定，由於頁面還沒擴增到完全由 CMS 產生，尚未以[`src/pages/sitemap.xml.js`](./src/pages/sitemap.xml.js)的方式即時生成 sitemap。若您希望更深入了解如何設定網站 SEO，您可以參考以下文件：

- <https://nextjs.org/learn-pages-router/seo/crawling-and-indexing/xml-sitemaps>
- <https://nextjs.org/learn-pages-router/seo/crawling-and-indexing/robots-txt>
