# 🎲 GameOfTwo

跟朋友一起玩的線上小遊戲平台。建立房間、把房號或連結傳給朋友，2～4 人就能開玩，不用註冊。

目前的遊戲：

| 遊戲 | 人數 | 類型 |
|---|---|---|
| 💣 終極密碼 | 2–4 人 | 輪流猜數字，猜中炸彈的人輸 |
| 🎨 你畫我猜 | 2–4 人 | 輪流畫畫，其他人搶答 |
| 🎲 吹牛骰子 | 2–4 人 | 隱藏骰子、喊數量、不信就開 |
| 🐮 誰是牛頭王 | 2–4 人 | 同時出牌，收到最少牛頭的人贏 |
| 🧠 默契大考驗 | 2–4 人 | 同時作答，跟別人選一樣就得分 |
| 👆 連打大賽 | 2–4 人 | 10 秒內比誰點得多 |
| ✊ 剪刀石頭布 | 2–4 人 | 同時出拳，先贏 3 輪 |
| 🃏 記憶翻牌 | 2–4 人 | 輪流翻牌配對 |
| 🔲 點格棋 | 2–4 人 | 畫線圍格子 |
| 🌈 顏色接龍 | 2–4 人 | 類似 UNO，同色或同數字接龍 |
| 🔢 1A2B 猜數字 | 2–4 人 | 輪流猜同一組密碼，線索共用 |
| ⚡ 反應力對決 | 2–4 人 | 變綠瞬間比誰最快按 |
| 🕵️ 誰是臥底 | 3–4 人 | 輪流描述、投票抓臥底 |
| ⚫ 黑白棋 | 2 人 | 夾住對方的棋子翻面 |
| 🚢 海戰棋 | 2 人 | 藏艦隊、輪流開砲 |
| 🔴 四子棋 | 2 人 | 棋子往下掉，先連成四顆 |
| ⭕ 井字遊戲 | 2 人 | 經典圈圈叉叉 |

房間功能：聊天與快速表情、懲罰模式（每局結束抽懲罰卡給輸的人）、房主可移除離線玩家。

**自訂題庫**：在首頁或大廳點「✏️ 自訂題庫」，可以替默契大考驗、你畫我猜、誰是臥底和懲罰卡加入自己的題目。題目存在 Firebase 的 `banks/`，所有房間共用，開局時會優先抽自訂題目（每局約一半）。

> 更新到有自訂題庫的版本後，要把 [`database.rules.json`](database.rules.json) 的最新內容重新貼到 Firebase 的「規則」分頁並發布，不然無法新增題目（遊戲本身仍可正常玩，只會用內建題目）。

## 架構

- 前端：Vite + React + TypeScript，部署在 GitHub Pages（純靜態網站）
- 即時同步：Firebase Realtime Database（免費方案就夠用）
- 沒設定 Firebase 時會自動使用**本機示範模式**：用 IndexedDB 模擬，只能在同一個瀏覽器的分頁之間連線，方便開發與測試

```
src/
  backend/      資料庫介面：firebase.ts（正式）與 local.ts（本機示範）
  platform/     房間邏輯：建立/加入房間、房主、計分、開局
  games/        每個小遊戲一個資料夾（logic.ts 規則 + View.tsx 畫面）
  components/   大廳、遊戲區、玩家列表
  pages/        首頁、房間頁
```

房主固定是「最早加入且在線上」的玩家，房主斷線或離開時會自動交給下一位。

## 設計與動畫

介面參考 Apple 的介面設計原則（WWDC *Designing Fluid Interfaces* 等）：

- **材質**：半透明毛玻璃面板與導覽列，大面板模糊更多、陰影更深；文字密集處維持足夠不透明度
- **彈簧曲線**：`src/styles.css` 開頭的 `--spring-*` 是用阻尼比與反應時間算出的 CSS `linear()` 曲線。一般介面用阻尼 1.0（不回彈），只有「有動量」的東西（按鈕放開、新放上的棋子）才用阻尼 0.8 的回彈
- **有目的的動畫**：輪到你時遊戲框發光並輕震、得分時分數彈一下並飄出 +1、自己贏時噴彩帶、棋子落下與翻面、出牌飛入
- **公平性優先**：反應力對決的「變綠」刻意不加任何過渡
- **無障礙**：遵守系統的「減少動態效果」（動畫改為瞬間、不噴彩帶）、「減少透明度」、「增加對比」設定
- **UI/UX 檢查**（依 ui-ux-pro-max 檢查清單，並用 axe-core 量測）：文字對比至少 4.5:1（漸層按鈕每一段都檢查過）、觸控裝置上的按鈕至少 44×44、介面圖示用 Lucide 向量圖示（遊戲本身的 emoji 是內容，保留）、不只用顏色表達資訊、有「跳到主要內容」連結與正確的標題層級

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

> 規則目前讓任何知道房號的人都能讀寫該房間；自訂題庫則是任何打開網站的人都能新增或刪除，遊戲邏輯也在玩家的瀏覽器執行。跟朋友玩沒問題，但懂技術的人可以從開發者工具看到隱藏資訊（例如終極密碼的答案）。之後若需要防作弊，可以把遊戲邏輯搬到伺服器（例如 Cloudflare Workers）。

## 新增一個小遊戲

1. 在 `src/games/` 建立新資料夾，參考 `guess-bomb/`（輪流制）、`mind-meld/`（同時作答）或 `tap-race/`（即時）：
   - `logic.ts`：`setup`（開局）、`applyMove`（處理玩家動作，不合法就 `throw new GameError(...)`）、`getResult`（判斷是否結束與每人得分）。這三個必須是純函式；進行中需要亂數時（例如重新洗牌），用 `src/games/rng.ts` 並把種子存在狀態裡（參考 `color-chain/`）
   - `View.tsx`：遊戲畫面，透過 `sendMove` 送出動作
   - `index.ts`：組合成 `GameModule`，並設定 `minPlayers` / `maxPlayers`
2. 把它加進 `src/games/registry.ts` 的 `GAMES` 陣列

大廳會依照房間目前的在線人數，自動判斷哪些遊戲可以開始。
