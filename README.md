# 開源星手村

我們希望能有更多人加入開源社群的行列，因此設計了這款桌上遊戲，希望讓初次接觸開源的人能快速了解開源社群；理解開源專案是如何在社群間協作，與認識開源所帶來的好處等。整個遊戲不論是出版品或是網路版，皆會釋出給每一個人自由使用。

## 專案架構

目前此專案與網頁版共用專案，暫時以不同分支作為不同 pipeline 的切分依據。

- 分支一 `main` 為桌遊網頁版開發主幹，以 heroku 為部屬環境
- 分支二 `homepage` 為首頁開發主幹，以 netlify 為部屬環境

前往[桌遊網頁版專案](https://github.com/ocftw/open-star-ter-village/tree/main)
前往[官網首頁專案](https://github.com/ocftw/open-star-ter-village/tree/homepage)

## 桌遊說明

### 桌遊目的

讓初次接觸開源的人可以了解

* 開源文化的內涵：開放定義、四大自由等
* 開源的好處
* 開源社群的運作
* 開源專案如何協作
* 世界/臺灣影響力重大或有趣的開放原始碼/開放政府/開放資料專案

### 桌遊適用場合

* 介紹及入門開源文化的聚會(開源新手村/開源科技訓練營等)
* 開源社群聚會
* 日常休閒遊玩

### 遊戲人數

3-6人

### 遊戲時數

約 60 分鐘

## 現在開始玩

### 開放遊戲伺服器

建制中！

### 打造你自己的遊戲伺服器

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ocftw/open-star-ter-village)

## 參與貢獻

### 開始參與

我們歡迎您以任何形式參與，您甚至不用會寫程式，也能夠參與貢獻你的想法！目前專案有實體桌遊與線上桌遊兩個方向，實體桌遊會根據現有的規則設計與製作卡片、圖板並發行；線上桌遊最初呈現在Google表單以驗證遊戲可行性，目前團隊正在嘗試移植到網頁上，希望可以藉此推廣至更多人。

#### 發現問題

#### 解決問題

#### 增加功能

* 參與卡片與圖板設計
* [加入網頁版的開發](./WEBAPP)

#### 加入我們一起討論

### 程式碼結構一覽

* `packages/`
  * `game/`
* `client/`
* `server/`
* `google-spreadsheet/` (obsolete)

## 授權條款

開源星手村的出版品、內容與資料夾內容以[創用CC姓名標示4.0](./LICENSE)授權。

開源星手村中的原始碼會以[MIT條款](./LICENSE-CODE)授權。

# open-star-ter-village

An open source board game to encourage people join open source community. You can understand more about open source community by playing this board game. It helps you practice how the open source community cooperates on the projects and acknoledge the benefits provided by the open source projects. All game design and game system are published for everyone.

## Board game summary

### Design Idea

### Players

3 to 6 people

### Playing time

Around 60 minutes

## Play it now

### Public server

NOT READY YET

### Deploy your own game server

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ocftw/open-star-ter-village)

## Contributing

### Start contributing now

Any participation way is welcome. Coding is not required, just contribute your idea! Current project contains physical board game publish and online. We will publish the board game accroding to the latest game rules, card and board designs. The online game was proof of concept on Google Spreadsheet and it worked in a few trials with positive feedback. So we are migrating to webapp to encourge more people to play or join open source community.

#### Open Issue

#### Solve Issue

#### Add Features

* Join to design the card and board from scratch.
* [Join the webapp development](./WEBAPP)

#### Join us in discussions

### Code Base Overview

* `packages/`
  * `game/`
* `client/`
* `server/`
* `google-spreadsheet/` (obsolete)

## License

The open-star-ter-village in the assets, content, and data folders are licensed under a [CC-BY-License](./LICENSE).

All other codes in this repository is licensed under a [MIT-License](./LICENSE-CODE).
