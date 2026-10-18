# 🎲 GameOfTwo

跟朋友一起玩的線上小遊戲平台。建立房間、把房號或連結傳給朋友，2～4 人就能開玩，不用註冊。

目前的遊戲：

| 遊戲 | 人數 |
|---|---|
| 💣 終極密碼 | 2–4 人 |
| ⭕ 井字遊戲 | 2 人 |

## 架構

- 前端：Vite + React + TypeScript，部署在 GitHub Pages（純靜態網站）
- 即時同步：Firebase Realtime Database（免費方案就夠用）
- 沒設定 Firebase 時會自動使用**本機示範模式**：用 localStorage 模擬，只能在同一個瀏覽器的分頁之間連線，方便開發與測試

```
src/
  backend/      資料庫介面：firebase.ts（正式）與 local.ts（本機示範）
  platform/     房間邏輯：建立/加入房間、房主、計分、開局
  games/        每個小遊戲一個資料夾（logic.ts 規則 + View.tsx 畫面）
  components/   大廳、遊戲區、玩家列表
  pages/        首頁、房間頁
```

房主固定是「最早加入且在線上」的玩家，房主斷線或離開時會自動交給下一位。

## 本機開發

```bash
npm install
npm run dev     # 開啟 http://localhost:5173 ，開多個分頁就能模擬多位玩家
npm test        # 跑遊戲規則與房間邏輯的單元測試
```

想在本機連 Firebase：把 `.env.example` 複製成 `.env.local` 並填入資料庫網址。

## 部署到 GitHub Pages

1. **設定 Firebase（約 3 分鐘，免費，不用信用卡）**
   1. 到 [Firebase Console](https://console.firebase.google.com/) 新增專案（Google Analytics 可以關掉）
   2. 左側選單 **建構 → Realtime Database → 建立資料庫**，地區建議選 `asia-southeast1`（新加坡），模式選「以鎖定模式啟動」
   3. 到 **規則** 分頁，貼上本 repo 的 [`database.rules.json`](database.rules.json) 內容後按「發布」
   4. 複製資料頁上方的資料庫網址，例如 `https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app`
2. **在 GitHub 設定**
   1. repo 的 **Settings → Secrets and variables → Actions → Variables** 新增變數 `FIREBASE_DATABASE_URL`，值填上一步的網址
   2. **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**
   3. 免費帳號的 GitHub Pages 只支援 public repo，private repo 需要先到 **Settings → General → Danger Zone → Change visibility** 改成 public
3. 推送到 `main` 分支後，GitHub Actions 會自動測試、建置並部署，網址是 `https://<你的帳號>.github.io/<repo 名稱>/`
   （也可以到 Actions 分頁手動執行 “Deploy to GitHub Pages”）

> 規則目前讓任何知道房號的人都能讀寫該房間，遊戲邏輯也在玩家的瀏覽器執行。跟朋友玩沒問題，但懂技術的人可以從開發者工具看到隱藏資訊（例如終極密碼的答案）。之後若需要防作弊，可以把遊戲邏輯搬到伺服器（例如 Cloudflare Workers）。

## 新增一個小遊戲

1. 在 `src/games/` 建立新資料夾，參考 `guess-bomb/`：
   - `logic.ts`：`setup`（開局）、`applyMove`（處理玩家動作，不合法就 `throw new GameError(...)`）、`getResult`（判斷是否結束與每人得分）。這三個必須是純函式
   - `View.tsx`：遊戲畫面，透過 `sendMove` 送出動作
   - `index.ts`：組合成 `GameModule`，並設定 `minPlayers` / `maxPlayers`
2. 把它加進 `src/games/registry.ts` 的 `GAMES` 陣列

大廳會依照房間目前的在線人數，自動判斷哪些遊戲可以開始。
