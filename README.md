# 開源星手村 - Open StarTer Village

English version: [README.en.md](./README.en.md)

我們鼓勵更多人參與開源社群，透過這款桌上遊戲，幫助初學者快速了解開源文化、專案協作，以及開源所帶來的好處。此遊戲（不論是實體版或線上版）都是開放的，任何人都可以自由使用。

## 遊戲概要

### 遊戲目標

透過遊戲，玩家將了解：

- 開源文化的核心價值，包括開放定義和四大自由
- 開源的優勢
- 開源社群的組織和運作方式
- 如何參與開源專案的協作
- 世界以及台灣重要且有趣的開放原始碼、開放政府和開放資料專案

### 適用場合

- 用於介紹和入門開源文化的活動，例如開源新手村、開源科技訓練營等
- 開源社群的聚會
- 日常娛樂

### 遊戲規格

- **適用玩家人數：** 3-6人
- **遊戲時間：** 約60分鐘

## 如何開始

### 開放遊戲租借

如果您有興趣租借遊戲，請寄信至 [hi@ocf.tw](mailto:hi@ocf.tw) 進行申請，同時請附上遊戲出借同意書。

- [遊戲規則與借用申請書](https://drive.google.com/drive/folders/16FZ0F8D32D4zWGBKwP13-fnf9gr-CZJz)

### 開放遊戲伺服器

**建置中！**

如需自行部署網頁版遊戲，請參考 [Deploy Your Own Village](./packages/webapp/README.md#deploy-your-own-village)。

## 如何參與

我們歡迎各種形式的貢獻，即使您不具備程式能力，也歡迎分享您的想法。此專案有實體和線上兩個版本，您可以在我們的維基頁面上查看所有專案的規劃和進度，任何有 "[Assistance Required]" 標記的項目都歡迎您加入貢獻。

### 發現問題？解決問題？

如果您有 GitHub 帳戶，歡迎在我們的 [Issues](https://github.com/ocftw/open-star-ter-village/issues) 頁面上回報問題或提出建議。
如果您沒有 GitHub 帳戶，也歡迎透過我們的 [Discord](https://discord.gg/JnTHGnxwYS) 與我們討論。

### 想要增加新功能？

如果您有 GitHub 帳戶，歡迎在我們的 [Discussions](https://github.com/ocftw/open-star-ter-village/discussions) 中提出您的建議，或直接透過 [Pull Requests](https://github.com/ocftw/open-star-ter-village/pulls) 提供您的解決方案。

### 加入討論

您可以透過我們的 [Discord](https://discord.gg/JnTHGnxwYS) 加入我們的討論。

## 線上專案架構

| 子專案                                           | 說明                                                            |
| --------------------------------------------- | ------------------------------------------------------------- |
| [google-spreadsheet](./google-spreadsheet/) | 原型版本 - 以 Google Spreadsheet 呈現                                |
| [packages/webapp](./packages/webapp/)       | 網頁版遊戲 - 處理遊戲規則                                                |
| [homepage](./homepage/)                     | [官方網站 - Official Website](https://openstartervillage.ocf.tw/) |

## 開發環境與專案結構

此 repository 使用 pnpm 11.15.1 monorepo workspace 統一管理 webapp 與
homepage：

- `packages/webapp/`：主要線上遊戲，包含 Next.js client 與 boardgame.io 遊戲伺服器。
- `homepage/`：官方網站，獨立部署於 Netlify，使用 Next.js 與 Decap CMS。
- `google-spreadsheet/`：早期 Google Apps Script 原型，僅作為參考。

基本需求：

- Node.js >= 24。
- 使用 repository 指定的 pnpm 版本，不需另行安裝全域 pnpm。
- 從 repository 根目錄執行 `pnpm install --frozen-lockfile` 安裝所有 workspace 套件。

根目錄 workspace 常用指令：

```bash
pnpm all:dev      # 啟動所有 pnpm workspace 的開發伺服器
pnpm all:build    # 建置所有 pnpm workspace
pnpm all:lint     # 檢查所有 pnpm workspace
```

Webapp 與 homepage 的細節請參考：

- [packages/webapp/README.md](./packages/webapp/README.md)
- [homepage/README.md](./homepage/README.md)

## Commit Convention

Commit 訊息採用 Conventional Commits：

```text
<type>(<optional scope>): <short description>
```

- Type 可使用：`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`。
- Subject line 保持在 72 字元以內。
- 使用祈使語氣，例如 `add` 而不是 `added`。
- 每次 commit 只包含一個小範圍的變更，不要把無關變更包在同一個 commit。
- 除非變更不易理解，否則不需要 commit body。

## 授權條款

- **遊戲內容：** [創用CC姓名標示4.0授權](./LICENSE)
- **程式碼：** [MIT條款](./LICENSE-CODE)

## 進一步了解

您可以在我們的 [Wiki 頁面](https://github.com/ocftw/open-star-ter-village/wiki) 深入了解此專案。

其他相關連結：

- [Discord](https://discord.gg/JnTHGnxwYS)
- [線上版規則書 (Rulebook)](https://drive.google.com/file/d/1gBGKhavLdDQ-J1elxQNN6E7Sdz0ZBTeO/view?usp=drive_link)
- [遊戲規則與借用申請書](https://drive.google.com/drive/folders/16FZ0F8D32D4zWGBKwP13-fnf9gr-CZJz)
- [教學工具包](https://drive.google.com/drive/folders/1fLz5wBrNFWEx7FTmyTkAJUrPibU9UvWM)
- [視覺素材](https://drive.google.com/drive/folders/1790me8hwJVJZpusIBtICdM2YOErbRIM5)
- [討論規則書](https://docs.google.com/document/d/16LIiWzstcg6QAppXn18WT-NbrKLKv0oJmkvpyxBwZgk/edit?usp=sharing)
