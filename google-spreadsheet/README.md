# 開源星手村 - Google 表單

# Open Star Ter Village - Google Spreadsheet

Open Star Ter Village - Google spreadsheet is a standalone prototype project for playing the game online during the COVID restriction. It is a Google-script plugin on a [spreadsheet](https://docs.google.com/spreadsheets/d/1xnuGOg5xSfGYNmfHm7EeSpFB-QRtlG-Kq8t53B7cmUU/edit#gid=695693469) and it requires your authentication before the game starts. You can freely clone the spreadsheet and this project and create your Open Star Ter Village on your Google drive and enjoy with your friends/teams.

## how to create your open-star-ter-village game

Simply make a copy from the spreadsheet then enjoy!

### make a copy from the spreadsheet

short video/screenshot tutorial **[Help needed]**

### update the game logic

We encourage you to clone the code base from this repository rather than pull the code base from the spreadsheet scripts.

```shell
git clone git@github.com:ocftw/open-star-ter-village.git open-star-ter-village
cd open-star-ter-village/google-srpeadsheet
```

Push the code changes into Google scripts after any updating. Yeah, this consider a deployment in some way.

```shell
yarn push
```

## contribute

### dependencies

Please ensure your nodejs engine is higher than v6.0.0. `Node.js >= v6.0.0`

The Google script is managed with google codelab cli `@google/clasp`. Please follow there [tutorial](https://codelabs.developers.google.com/codelabs/clasp/#1) to setup your environment and get ready to code.
