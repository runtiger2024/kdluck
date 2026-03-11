# KDLuck 知識付費平台 TODO

## 資料庫與基礎架構
- [x] 設計完整資料庫 schema（課程、章節、影片、訂單、優惠券、全站配置、評價、學習進度）
- [x] 執行資料庫遷移

## 後端 API
- [x] 課程 CRUD API（含分類篩選、搜尋）
- [x] 章節與影片管理 API
- [x] 訂單管理 API（建立、查詢、狀態更新）
- [x] 優惠券管理 API（建立、驗證、使用）
- [x] 全站配置 API（Logo、名稱、客服、SEO）
- [x] 影片安全 Signed URL 產生
- [x] 學員評價 API
- [x] 學習進度記錄 API
- [x] 數據統計 API（銷售總額、用戶增長）
- [x] LLM 課程推薦 API
- [x] LINE 通知觸發器（模板系統已建立，需配置 LINE Messaging API Key）

## 管理後台
- [x] 管理後台 Dashboard 佈局（側邊欄導航）
- [x] 課程管理頁面（新增/編輯/刪除課程）
- [x] 章節與影片管理頁面（拖曳排序、上傳）
- [x] 訂單管理頁面
- [x] 用戶管理頁面
- [x] 優惠券管理頁面
- [x] 全站配置頁面（Logo、名稱、客服、SEO）
- [x] 數據中心頁面（銷售圖表、用戶增長趨勢）

- [x] 電影感視覺風格主題設定（深青色+焦橙色漸層）
- [x] 首頁設計（Hero、精選課程、分類導航）
- [x] 課程目錄頁面（分類篩選、搜尋、分頁）
- [x] 課程詳情頁面（大綱、講師、試看、評價、購買）
- [x] 學習播放器（影片播放、進度記憶、課程列表）
- [x] 會員中心（個人資料、已購課程、訂單紀錄）
- [x] AI 推薦課程頁面
- [x] 導航列與頁尾組件ail 註冊）
- [x] 結帳流程頁面（訂單對話框含優惠券、付款方式選擇）

## 整合功能
- [x] 金流整合（銀行轉帳+手動確認已完成，Stripe/綠界 API 預留接口）
- [x] LINE Messaging API 推播通知（模板系統+觸發器已建立，需配置 LINE API Key）
- [x] LLM 課程推薦引擎
- [x] Vitest 測試（51 tests passed）

## 部署
- [x] 最終 checkpoint 與交付

## 綠界 ECPay 支付整合
- [x] 配置綠界 MerchantID、HashKey、HashIV
- [x] 建立綠界 ECPay 訂單產生 API（後端）
- [x] 建立綠界付款回調 Webhook 處理
- [x] 建立付款成功/取消頁面
- [x] 更新前端結帳流程支援綠界與線下轉帳
- [x] 付款成功後自動開通課程
- [x] 完善線下轉帳流程（顯示轉帳資訊、管理員手動確認）
- [x] 撰寫綠界相關 Vitest 測試（62 tests passed）

## 管理後台功能補齊
- [x] 支付 API 管理頁面（綠界 MerchantID/HashKey/HashIV 設定、銀行轉帳帳戶資訊設定）
- [x] 更新環境變數（光貿、LINE Login、LINE Messaging）
- [x] 新增資料庫表（invoices、line_push_history）
- [x] 光貿電子發票整合（後端 API + 管理後台發票管理頁面）
- [x] LINE 登入整合（後端 OAuth + 前端登入按鈕）
- [x] 管理後台：評價管理頁面（查看/刪除學員評價）
- [x] 管理後台：講師管理獨立頁面
- [x] 管理後台：分類管理獨立頁面
- [x] 管理後台：LINE 推播管理頁面（發送推播、查看歷史、模板套用）
- [x] 管理後台側邊欄新增所有導航項目
- [x] 撰寫新功能 Vitest 測試（79 tests passed）

## Bug 修復
- [x] /admin/settings 頁面缺少支付API設定 → 已建立獨立 /admin/payment 頁面
- [x] 深度檢查所有管理後台頁面是否正確呈現

## API 金鑰管理重構
- [x] 移除所有「Settings → Secrets」的引導文字
- [x] 支付設定頁面：加入綠界 MerchantID/HashKey/HashIV 直接輸入欄位
- [x] 支付設定頁面：加入光貿 InvoiceNumber/AppKey 直接輸入欄位
- [x] 支付設定頁面：加入 LINE Channel ID/Secret/Messaging Token 直接輸入欄位
- [x] 後端 ecpay.ts：改為從 DB site_config 讀取金鑰（fallback 到環境變數）
- [x] 後端 amego.ts：改為從 DB site_config 讀取金鑰
- [x] 後端 line.ts：改為從 DB site_config 讀取金鑰
- [x] 金鑰欄位使用密碼遮罩顯示，提升安全性
- [x] 深度檢查所有其他可能的問題
- [x] Vitest 測試全部通過（80 tests passed）
