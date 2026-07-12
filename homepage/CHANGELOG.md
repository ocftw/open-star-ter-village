# Changelog

All notable changes to the homepage are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- Upgrade to Next.js 16.2.10, React 19.2.7, Decap CMS App 3.14.1,
  react-markdown 10.1.0, ESLint 9.39.5, and current compatible supporting
  packages.
- Validate public rendering against pre-upgrade desktop and mobile snapshots.
- Validate the Decap CMS shell locally and on Netlify Deploy Previews.
- Move homepage release history out of the README.

### Deferred

- ESLint 10 is deferred because the current Next.js plugin stack fails at
  runtime while linting with `scopeManager.addGlobals is not a function`.

### Removed

- Remove the archived Gatsby-era `_legacy` source and its unused dependency
  assumptions.

## [3.2.0]

升級 Netlify CMS 為 Decap CMS，修復陳舊相依套件所引起的問題。

## [3.1.0]

新增多語言支援與 Netlify CMS 功能。

## [3.0.0]

隨著專案擴展，計劃支援多語言，考慮引入 CMS 以降低團隊維護成本，因此轉換至 Next.js 結構。

## [2.1.0]

將 `homepage` 分支合併至 `main`，視為子專案，同時改用 Yarn 管理套件，以維持桌遊網頁版專案一致性，並刪除 `homepage` 分支。

## [2.0.0]

移除 Gatsby，改為純粹的 React JS 靜態網站生成，降低專案入門門檻，同時移除 Contentful CMS 部分，減少團隊金錢支出。

## [1.0.0]

以 [RG-Portfolio Gatsby starter](https://github.com/Rohitguptab/rg-portfolio.git) 為基礎新增網站首頁。

[unreleased]: https://github.com/ocftw/open-star-ter-village/compare/homepage-v3.2.0...HEAD
[3.2.0]: https://github.com/ocftw/open-star-ter-village/releases/tag/homepage-v3.2.0
[3.1.0]: https://github.com/ocftw/open-star-ter-village/releases/tag/homepage-v3.1.0
[3.0.0]: https://github.com/ocftw/open-star-ter-village/releases/tag/homepage-v3.0.0
[2.1.0]: https://github.com/ocftw/open-star-ter-village/releases/tag/homepage-v2.1.0
