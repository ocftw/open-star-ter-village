# 文件用截圖

`homepage/README.md` 內以 HTML 註解標記了待補的截圖位置。補上檔案後，把該行註解改成 Markdown 圖片語法即可，例如：

```markdown
![Decap CMS 登入畫面](./docs/images/cms-login.png)
```

| 檔名                   | 狀態      | 內容                                                                              | 取得方式                                 |
| ---------------------- | --------- | --------------------------------------------------------------------------------- | ---------------------------------------- |
| `cms-login.png`        | ✅ 已補上 | Decap CMS 登入畫面，含「使用你的 GitHub 帳號來進行登入」按鈕                      | 以未登入狀態開啟 `/admin/`               |
| `github-signin.png`    | ✅ 已補上 | GitHub 登入畫面，標題為 Sign in to GitHub to continue to Open StarTer Village CMS | 於無痕視窗點擊登入按鈕                   |
| `cms-collections.png`  | ✅ 已補上 | 登入後的集合列表（Pages／Cards／Settings／Footer）                                | 登入後的後台首頁                         |
| `github-authorize.png` | ⬜ 待補   | GitHub OAuth 授權畫面，含 Authorize 按鈕                                          | 首次授權時出現；已授權過的帳號不會再顯示 |

截圖統一縮至寬 1600px（`sips -Z 1600`），避免 retina 原始檔佔用 repo 空間。

## 注意事項

- 截圖請避免包含個人 email、實際帳號名稱、token、或其他可識別資訊。
- 截圖若在 `cms-preview` 分支部署上取得，網址列會顯示 `cms-preview--openstartervillage.netlify.app`。內容編輯說明是給正式站使用者看的，建議改用正式站 `/admin/` 重新截圖，或裁切掉網址列，避免讀者誤以為要從 preview 網址登入。
- `github-authorize.png` 需要一個尚未授權過此應用程式的帳號才拍得到。
