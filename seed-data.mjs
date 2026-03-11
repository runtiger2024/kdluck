/**
 * KDLuck 知識付費平台 - 完整測試資料種子腳本
 * 包含：分類、講師、課程、章節、課時、優惠券、通知模板、網站配置、模擬訂單、評價
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log("Connected to database");

  try {
    // ═══════════════════════════════════════════════════
    // 1. 清除現有測試資料（保留真實用戶）
    // ═══════════════════════════════════════════════════
    console.log("\n🧹 清除現有測試資料...");
    await connection.execute("DELETE FROM learning_progress");
    await connection.execute("DELETE FROM reviews");
    await connection.execute("DELETE FROM enrollments");
    await connection.execute("DELETE FROM invoices");
    await connection.execute("DELETE FROM line_push_history");
    await connection.execute("DELETE FROM orders");
    await connection.execute("DELETE FROM lessons");
    await connection.execute("DELETE FROM chapters");
    await connection.execute("DELETE FROM courses");
    await connection.execute("DELETE FROM coupons");
    await connection.execute("DELETE FROM instructors");
    await connection.execute("DELETE FROM categories");
    await connection.execute("DELETE FROM notification_templates");
    await connection.execute("DELETE FROM site_config");

    // ═══════════════════════════════════════════════════
    // 2. 插入分類 (6個)
    // ═══════════════════════════════════════════════════
    console.log("📂 插入分類...");
    const categoriesData = [
      { name: "程式開發", slug: "programming", description: "從入門到進階的程式語言與軟體開發課程", iconUrl: "💻", sortOrder: 1 },
      { name: "數據科學", slug: "data-science", description: "數據分析、機器學習與人工智慧", iconUrl: "📊", sortOrder: 2 },
      { name: "設計創意", slug: "design", description: "UI/UX 設計、平面設計與視覺藝術", iconUrl: "🎨", sortOrder: 3 },
      { name: "商業管理", slug: "business", description: "創業、行銷策略與專案管理", iconUrl: "📈", sortOrder: 4 },
      { name: "語言學習", slug: "language", description: "英語、日語及多國語言學習", iconUrl: "🌍", sortOrder: 5 },
      { name: "個人成長", slug: "personal-growth", description: "時間管理、溝通技巧與自我提升", iconUrl: "🚀", sortOrder: 6 },
    ];
    for (const cat of categoriesData) {
      await connection.execute(
        "INSERT INTO categories (name, slug, description, iconUrl, sortOrder) VALUES (?, ?, ?, ?, ?)",
        [cat.name, cat.slug, cat.description, cat.iconUrl, cat.sortOrder]
      );
    }
    const [catRows] = await connection.execute("SELECT id, slug FROM categories ORDER BY sortOrder");
    const catMap = {};
    for (const row of catRows) catMap[row.slug] = row.id;
    console.log(`  ✅ 已插入 ${categoriesData.length} 個分類`);

    // ═══════════════════════════════════════════════════
    // 3. 插入講師 (4位)
    // ═══════════════════════════════════════════════════
    console.log("👨‍🏫 插入講師...");
    const instructorsData = [
      {
        name: "陳志明",
        title: "資深全端工程師 / 前 Google 軟體工程師",
        bio: "擁有 15 年軟體開發經驗，曾任職 Google、Microsoft 等國際科技公司。專精 React、Node.js、Python 全端開發，在 GitHub 上擁有超過 5000 顆星的開源專案。熱衷於將複雜的技術概念轉化為易懂的教學內容，已幫助超過 10,000 名學員成功轉職或提升技能。",
      },
      {
        name: "林雅婷",
        title: "AI 研究員 / 台大資工博士",
        bio: "台灣大學資訊工程博士，專攻自然語言處理與深度學習。曾在 NeurIPS、AAAI 等頂級會議發表多篇論文。現為知名 AI 新創公司首席科學家，同時擔任多所大學兼任助理教授。擅長將學術研究成果轉化為實務應用，教學風格深入淺出。",
      },
      {
        name: "王大衛",
        title: "UX 設計總監 / Adobe 認證講師",
        bio: "擁有 12 年 UI/UX 設計經驗，曾為 50+ 知名品牌打造數位產品體驗。Adobe 官方認證講師，Figma 社群大使。作品曾獲 Red Dot、iF 設計獎等國際殊榮。相信好的設計能改變世界，致力於培養下一代設計人才。",
      },
      {
        name: "張美玲",
        title: "商業策略顧問 / MBA / 連續創業家",
        bio: "哈佛商學院 MBA，連續創業家，成功創辦並出售兩家科技公司。現為多家上市公司策略顧問，專精數位轉型、成長駭客與商業模式創新。Forbes 30 Under 30 亞洲區入選者，著有暢銷書《從零到一的創業思維》。",
      },
    ];
    for (const inst of instructorsData) {
      await connection.execute(
        "INSERT INTO instructors (name, title, bio) VALUES (?, ?, ?)",
        [inst.name, inst.title, inst.bio]
      );
    }
    const [instRows] = await connection.execute("SELECT id, name FROM instructors ORDER BY id");
    const instMap = {};
    for (const row of instRows) instMap[row.name] = row.id;
    console.log(`  ✅ 已插入 ${instructorsData.length} 位講師`);

    // ═══════════════════════════════════════════════════
    // 4. 插入課程 (8門，含不同狀態/等級/價格)
    // ═══════════════════════════════════════════════════
    console.log("📚 插入課程...");
    const coursesData = [
      {
        title: "React 18 完整開發指南：從零到精通",
        slug: "react-18-complete-guide",
        subtitle: "掌握 React 18 最新特性，打造現代化前端應用",
        description: "本課程將帶您從零開始學習 React 18，涵蓋 JSX、元件設計、Hooks、狀態管理、路由、效能優化等核心概念。透過 5 個實戰專案，您將學會如何建構企業級的 React 應用程式。\n\n課程特色：\n• 完整涵蓋 React 18 新特性（Concurrent Mode、Suspense、Transitions）\n• 5 個由淺入深的實戰專案\n• TypeScript 整合教學\n• 效能優化與最佳實踐\n• 部署與 CI/CD 流程",
        categoryId: catMap["programming"],
        instructorId: instMap["陳志明"],
        price: "2980.00",
        originalPrice: "4500.00",
        status: "published",
        level: "beginner",
        enrollmentCount: 1247,
        avgRating: "4.85",
        ratingCount: 328,
        seoTitle: "React 18 完整開發指南 | KDLuck 線上課程",
        seoDescription: "從零開始學習 React 18，掌握現代前端開發技能。包含 5 個實戰專案。",
      },
      {
        title: "Python 機器學習實戰：從數據到模型",
        slug: "python-machine-learning",
        subtitle: "用 Python 掌握機器學習核心演算法與實務應用",
        description: "這門課程專為想進入 AI 領域的學員設計。從 Python 基礎語法開始，逐步深入 NumPy、Pandas、Scikit-learn、TensorFlow 等核心工具。透過真實數據集的實作練習，您將學會建構、訓練與部署機器學習模型。\n\n涵蓋主題：\n• 監督式學習（迴歸、分類、決策樹、隨機森林）\n• 非監督式學習（聚類、降維、異常偵測）\n• 深度學習基礎（神經網路、CNN、RNN）\n• 模型評估與調參技巧\n• 實際商業案例分析",
        categoryId: catMap["data-science"],
        instructorId: instMap["林雅婷"],
        price: "3680.00",
        originalPrice: "5200.00",
        status: "published",
        level: "intermediate",
        enrollmentCount: 856,
        avgRating: "4.92",
        ratingCount: 215,
        seoTitle: "Python 機器學習實戰 | KDLuck 線上課程",
        seoDescription: "用 Python 掌握機器學習核心演算法，從數據處理到模型部署。",
      },
      {
        title: "Figma UI/UX 設計大師班",
        slug: "figma-uiux-masterclass",
        subtitle: "從設計思維到 Figma 實作，打造令人驚豔的數位產品",
        description: "無論您是設計新手還是想轉換工具的設計師，這門課程都能幫助您精通 Figma。從設計基礎理論到進階原型製作，全方位提升您的 UI/UX 設計能力。\n\n您將學到：\n• 設計思維與用戶研究方法\n• Figma 核心功能與進階技巧\n• 設計系統建構（Design System）\n• 互動原型與動效設計\n• 設計交付與開發協作\n• 3 個完整的 App/Web 設計專案",
        categoryId: catMap["design"],
        instructorId: instMap["王大衛"],
        price: "2480.00",
        originalPrice: "3600.00",
        status: "published",
        level: "beginner",
        enrollmentCount: 634,
        avgRating: "4.78",
        ratingCount: 167,
        seoTitle: "Figma UI/UX 設計大師班 | KDLuck 線上課程",
        seoDescription: "從零學習 Figma UI/UX 設計，包含 3 個完整設計專案。",
      },
      {
        title: "創業實戰：從商業計畫到產品上線",
        slug: "startup-masterclass",
        subtitle: "連續創業家教你避開 90% 的創業陷阱",
        description: "這不是一門理論課程，而是一份來自實戰經驗的創業指南。張美玲老師將分享她兩次成功創業的完整歷程，從發現商機、驗證想法、組建團隊到融資上市的每一步。\n\n課程涵蓋：\n• 商業模式設計與驗證（Business Model Canvas）\n• 精實創業方法論（Lean Startup）\n• 產品市場契合度（Product-Market Fit）\n• 成長駭客策略\n• 融資簡報與投資人溝通\n• 團隊管理與企業文化建設",
        categoryId: catMap["business"],
        instructorId: instMap["張美玲"],
        price: "4280.00",
        originalPrice: "6000.00",
        status: "published",
        level: "intermediate",
        enrollmentCount: 423,
        avgRating: "4.90",
        ratingCount: 112,
        seoTitle: "創業實戰課程 | KDLuck 線上課程",
        seoDescription: "連續創業家教你從零開始創業，避開常見陷阱。",
      },
      {
        title: "Node.js 後端開發與 API 設計",
        slug: "nodejs-backend-api",
        subtitle: "用 Node.js + Express + TypeScript 打造高效能後端服務",
        description: "深入學習 Node.js 後端開發，從 RESTful API 設計到微服務架構。課程使用 TypeScript 確保型別安全，搭配 PostgreSQL 資料庫與 Redis 快取，打造生產級的後端應用。\n\n核心內容：\n• Node.js 事件循環與非同步程式設計\n• Express / Fastify 框架深入\n• RESTful API 設計最佳實踐\n• 資料庫設計與 ORM（Drizzle/Prisma）\n• 認證授權（JWT、OAuth2）\n• Docker 容器化與部署",
        categoryId: catMap["programming"],
        instructorId: instMap["陳志明"],
        price: "3280.00",
        originalPrice: null,
        status: "published",
        level: "intermediate",
        enrollmentCount: 578,
        avgRating: "4.72",
        ratingCount: 143,
        seoTitle: "Node.js 後端開發 | KDLuck 線上課程",
        seoDescription: "學習 Node.js 後端開發與 API 設計，打造高效能服務。",
      },
      {
        title: "ChatGPT 與 AI 工具實務應用",
        slug: "chatgpt-ai-tools",
        subtitle: "善用 AI 工具提升 10 倍工作效率",
        description: "AI 時代來臨，掌握 AI 工具已成為職場必備技能。這門課程將教您如何有效運用 ChatGPT、Midjourney、Claude 等 AI 工具，大幅提升工作效率。\n\n您將學到：\n• Prompt Engineering 提示詞工程\n• ChatGPT 進階應用技巧\n• AI 輔助寫作與內容創作\n• AI 輔助程式開發\n• AI 圖像生成與編輯\n• AI 在各行業的應用案例",
        categoryId: catMap["personal-growth"],
        instructorId: instMap["林雅婷"],
        price: "0.00",
        originalPrice: null,
        status: "published",
        level: "beginner",
        enrollmentCount: 2156,
        avgRating: "4.65",
        ratingCount: 489,
        seoTitle: "ChatGPT 與 AI 工具實務應用 | KDLuck 免費課程",
        seoDescription: "免費學習 ChatGPT 與各種 AI 工具的實務應用技巧。",
      },
      {
        title: "深度學習進階：Transformer 與大語言模型",
        slug: "deep-learning-transformer",
        subtitle: "深入理解 Transformer 架構與 LLM 原理",
        description: "本課程專為有機器學習基礎的學員設計，深入探討 Transformer 架構、注意力機制、以及大語言模型（LLM）的訓練與微調技術。\n\n進階主題：\n• Attention Is All You Need 論文精讀\n• BERT、GPT 系列架構解析\n• 模型微調（Fine-tuning）與 LoRA\n• RAG（檢索增強生成）\n• 模型部署與推理優化\n• 最新研究趨勢與論文導讀",
        categoryId: catMap["data-science"],
        instructorId: instMap["林雅婷"],
        price: "5680.00",
        originalPrice: "7800.00",
        status: "published",
        level: "advanced",
        enrollmentCount: 312,
        avgRating: "4.95",
        ratingCount: 87,
        seoTitle: "深度學習進階：Transformer 與 LLM | KDLuck 線上課程",
        seoDescription: "深入理解 Transformer 架構與大語言模型原理。",
      },
      {
        title: "商業數據分析與視覺化",
        slug: "business-data-analytics",
        subtitle: "用數據驅動商業決策（草稿中，即將上線）",
        description: "學習如何運用 Excel、Python、Tableau 等工具進行商業數據分析，將數據轉化為可行的商業洞察。",
        categoryId: catMap["business"],
        instructorId: instMap["張美玲"],
        price: "2880.00",
        originalPrice: "3800.00",
        status: "draft",
        level: "beginner",
        enrollmentCount: 0,
        avgRating: "0.00",
        ratingCount: 0,
        seoTitle: "商業數據分析 | KDLuck 線上課程",
        seoDescription: "學習商業數據分析與視覺化技巧。",
      },
    ];

    for (const course of coursesData) {
      await connection.execute(
        `INSERT INTO courses (title, slug, subtitle, description, categoryId, instructorId, price, originalPrice, status, level, enrollmentCount, avgRating, ratingCount, seoTitle, seoDescription)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          course.title, course.slug, course.subtitle, course.description,
          course.categoryId, course.instructorId, course.price, course.originalPrice,
          course.status, course.level, course.enrollmentCount, course.avgRating,
          course.ratingCount, course.seoTitle, course.seoDescription,
        ]
      );
    }
    const [courseRows] = await connection.execute("SELECT id, slug FROM courses ORDER BY id");
    const courseMap = {};
    for (const row of courseRows) courseMap[row.slug] = row.id;
    console.log(`  ✅ 已插入 ${coursesData.length} 門課程`);

    // ═══════════════════════════════════════════════════
    // 5. 插入章節與課時
    // ═══════════════════════════════════════════════════
    console.log("📖 插入章節與課時...");

    const courseContent = {
      "react-18-complete-guide": {
        chapters: [
          {
            title: "第一章：React 基礎入門",
            lessons: [
              { title: "1-1 課程介紹與環境建置", duration: 720, isFreePreview: true, description: "了解課程架構，安裝 Node.js、VS Code 並建立第一個 React 專案" },
              { title: "1-2 JSX 語法深入解析", duration: 1080, description: "學習 JSX 語法規則、表達式嵌入與條件渲染" },
              { title: "1-3 元件設計與 Props 傳遞", duration: 1320, description: "理解 React 元件化思維，學習 Props 的使用方式" },
              { title: "1-4 事件處理與表單操作", duration: 960, description: "學習 React 事件系統與受控/非受控表單元件" },
            ],
          },
          {
            title: "第二章：React Hooks 深入",
            lessons: [
              { title: "2-1 useState 與 useEffect 完全指南", duration: 1440, description: "深入理解 React 最常用的兩個 Hook" },
              { title: "2-2 useContext 與全域狀態管理", duration: 1200, description: "使用 Context API 實現跨元件狀態共享" },
              { title: "2-3 useReducer 與複雜狀態邏輯", duration: 1080, description: "學習 useReducer 處理複雜的狀態更新邏輯" },
              { title: "2-4 useMemo 與 useCallback 效能優化", duration: 900, description: "掌握 React 效能優化的核心技巧" },
              { title: "2-5 自定義 Hook 設計模式", duration: 1260, isFreePreview: true, description: "學習如何封裝可重用的自定義 Hook" },
            ],
          },
          {
            title: "第三章：React 18 新特性",
            lessons: [
              { title: "3-1 Concurrent Mode 並發模式", duration: 1380, description: "理解 React 18 的並發渲染機制" },
              { title: "3-2 Suspense 與資料載入", duration: 1140, description: "使用 Suspense 優雅處理非同步資料載入" },
              { title: "3-3 Transitions 與優先級排程", duration: 960, description: "學習 useTransition 與 useDeferredValue" },
            ],
          },
          {
            title: "第四章：實戰專案 - 電商平台",
            lessons: [
              { title: "4-1 專案架構設計與路由規劃", duration: 1500, description: "設計電商平台的整體架構與頁面路由" },
              { title: "4-2 商品列表與購物車實作", duration: 1800, description: "實作商品展示、篩選與購物車功能" },
              { title: "4-3 結帳流程與狀態管理", duration: 1620, description: "實作完整的結帳流程與全域狀態管理" },
              { title: "4-4 部署上線與效能優化", duration: 1200, description: "將專案部署到雲端並進行效能調優" },
            ],
          },
        ],
      },
      "python-machine-learning": {
        chapters: [
          {
            title: "第一章：Python 數據處理基礎",
            lessons: [
              { title: "1-1 Python 環境設定與 Jupyter Notebook", duration: 600, isFreePreview: true, description: "安裝 Anaconda 並設定 Jupyter 開發環境" },
              { title: "1-2 NumPy 陣列運算", duration: 1200, description: "學習 NumPy 多維陣列操作與數學運算" },
              { title: "1-3 Pandas 資料處理與清洗", duration: 1500, description: "掌握 Pandas DataFrame 操作與資料清洗技巧" },
              { title: "1-4 Matplotlib 資料視覺化", duration: 1080, description: "使用 Matplotlib 繪製各類統計圖表" },
            ],
          },
          {
            title: "第二章：監督式學習",
            lessons: [
              { title: "2-1 線性迴歸與多項式迴歸", duration: 1320, description: "理解迴歸分析的原理與實作" },
              { title: "2-2 邏輯迴歸與分類問題", duration: 1200, description: "學習分類問題的基本解法" },
              { title: "2-3 決策樹與隨機森林", duration: 1440, description: "掌握樹狀模型的原理與應用" },
              { title: "2-4 支持向量機 (SVM)", duration: 1080, description: "深入理解 SVM 的數學原理與核函數" },
              { title: "2-5 模型評估與交叉驗證", duration: 960, isFreePreview: true, description: "學習如何正確評估模型效能" },
            ],
          },
          {
            title: "第三章：深度學習入門",
            lessons: [
              { title: "3-1 神經網路基礎", duration: 1500, description: "理解人工神經網路的基本結構" },
              { title: "3-2 TensorFlow / Keras 實作", duration: 1800, description: "使用 TensorFlow 建構第一個深度學習模型" },
              { title: "3-3 CNN 影像辨識實戰", duration: 1620, description: "用卷積神經網路實作影像分類" },
            ],
          },
        ],
      },
      "figma-uiux-masterclass": {
        chapters: [
          {
            title: "第一章：設計思維基礎",
            lessons: [
              { title: "1-1 什麼是好的設計？", duration: 720, isFreePreview: true, description: "探討設計的本質與評判標準" },
              { title: "1-2 用戶研究方法論", duration: 1080, description: "學習用戶訪談、問卷調查與可用性測試" },
              { title: "1-3 設計流程與工具選擇", duration: 840, description: "了解完整的設計流程與常用工具" },
            ],
          },
          {
            title: "第二章：Figma 核心功能",
            lessons: [
              { title: "2-1 Figma 介面導覽與基本操作", duration: 960, description: "熟悉 Figma 的工作介面與基本工具" },
              { title: "2-2 Auto Layout 自動佈局", duration: 1320, description: "掌握 Auto Layout 的進階用法" },
              { title: "2-3 元件與變體設計", duration: 1440, description: "建立可重用的元件系統" },
              { title: "2-4 設計系統建構實戰", duration: 1800, isFreePreview: true, description: "從零建構一套完整的設計系統" },
            ],
          },
          {
            title: "第三章：實戰專案 - App 設計",
            lessons: [
              { title: "3-1 需求分析與線框圖", duration: 1200, description: "分析需求並繪製低保真線框圖" },
              { title: "3-2 視覺設計與高保真原型", duration: 1680, description: "完成高保真視覺設計" },
              { title: "3-3 互動原型與動效設計", duration: 1440, description: "製作可互動的原型與微動效" },
              { title: "3-4 設計交付與開發協作", duration: 960, description: "學習如何與開發團隊高效協作" },
            ],
          },
        ],
      },
      "startup-masterclass": {
        chapters: [
          {
            title: "第一章：創業前的準備",
            lessons: [
              { title: "1-1 創業心態與自我評估", duration: 840, isFreePreview: true, description: "評估自己是否適合創業" },
              { title: "1-2 發現商機與市場驗證", duration: 1200, description: "如何找到真正的市場需求" },
              { title: "1-3 商業模式設計（BMC）", duration: 1500, description: "使用 Business Model Canvas 設計商業模式" },
            ],
          },
          {
            title: "第二章：從 0 到 1",
            lessons: [
              { title: "2-1 MVP 最小可行產品", duration: 1320, description: "快速打造 MVP 驗證假設" },
              { title: "2-2 產品市場契合度", duration: 1080, description: "找到 Product-Market Fit 的方法" },
              { title: "2-3 早期用戶獲取策略", duration: 1200, description: "低成本獲取第一批用戶" },
            ],
          },
          {
            title: "第三章：成長與擴張",
            lessons: [
              { title: "3-1 成長駭客策略", duration: 1440, description: "數據驅動的成長方法論" },
              { title: "3-2 融資簡報製作", duration: 1080, isFreePreview: true, description: "如何製作打動投資人的 Pitch Deck" },
              { title: "3-3 團隊建設與文化", duration: 960, description: "打造高效能創業團隊" },
            ],
          },
        ],
      },
      "nodejs-backend-api": {
        chapters: [
          {
            title: "第一章：Node.js 核心概念",
            lessons: [
              { title: "1-1 Node.js 運行機制與事件循環", duration: 1080, isFreePreview: true, description: "深入理解 Node.js 的非同步架構" },
              { title: "1-2 模組系統與套件管理", duration: 840, description: "CommonJS vs ESM，npm vs pnpm" },
              { title: "1-3 TypeScript 整合設定", duration: 960, description: "在 Node.js 專案中使用 TypeScript" },
            ],
          },
          {
            title: "第二章：API 設計與實作",
            lessons: [
              { title: "2-1 RESTful API 設計原則", duration: 1200, description: "學習 REST 架構風格與最佳實踐" },
              { title: "2-2 Express 路由與中間件", duration: 1440, description: "深入 Express 的路由系統與中間件機制" },
              { title: "2-3 資料庫設計與 ORM", duration: 1320, description: "使用 Drizzle ORM 操作資料庫" },
              { title: "2-4 認證授權（JWT + OAuth2）", duration: 1500, description: "實作完整的認證授權系統" },
            ],
          },
          {
            title: "第三章：進階主題",
            lessons: [
              { title: "3-1 錯誤處理與日誌系統", duration: 1080, description: "建構健壯的錯誤處理機制" },
              { title: "3-2 快取策略（Redis）", duration: 1200, description: "使用 Redis 實作快取提升效能" },
              { title: "3-3 Docker 容器化部署", duration: 1380, description: "將應用容器化並部署到雲端" },
            ],
          },
        ],
      },
      "chatgpt-ai-tools": {
        chapters: [
          {
            title: "第一章：AI 工具入門",
            lessons: [
              { title: "1-1 AI 時代的工作方式變革", duration: 600, isFreePreview: true, description: "了解 AI 如何改變各行業的工作方式" },
              { title: "1-2 ChatGPT 基礎操作與技巧", duration: 900, isFreePreview: true, description: "學習 ChatGPT 的基本使用方法" },
              { title: "1-3 Prompt Engineering 入門", duration: 1080, description: "掌握提示詞工程的基本原則" },
            ],
          },
          {
            title: "第二章：進階應用",
            lessons: [
              { title: "2-1 AI 輔助寫作與內容創作", duration: 1200, description: "用 AI 提升寫作效率與品質" },
              { title: "2-2 AI 輔助程式開發", duration: 1320, description: "用 AI 加速程式開發流程" },
              { title: "2-3 AI 圖像生成（Midjourney/DALL-E）", duration: 1080, description: "學習 AI 圖像生成工具的使用技巧" },
            ],
          },
        ],
      },
      "deep-learning-transformer": {
        chapters: [
          {
            title: "第一章：Transformer 架構",
            lessons: [
              { title: "1-1 Attention 注意力機制", duration: 1500, isFreePreview: true, description: "深入理解 Self-Attention 的數學原理" },
              { title: "1-2 Multi-Head Attention 與位置編碼", duration: 1320, description: "學習多頭注意力與位置編碼機制" },
              { title: "1-3 Encoder-Decoder 架構解析", duration: 1440, description: "完整解析 Transformer 的編碼器-解碼器結構" },
            ],
          },
          {
            title: "第二章：預訓練語言模型",
            lessons: [
              { title: "2-1 BERT 與遮罩語言模型", duration: 1380, description: "理解 BERT 的預訓練策略" },
              { title: "2-2 GPT 系列與自迴歸生成", duration: 1500, description: "解析 GPT 系列模型的演進" },
              { title: "2-3 模型微調與 LoRA", duration: 1620, description: "學習高效微調大語言模型的方法" },
            ],
          },
          {
            title: "第三章：實務應用",
            lessons: [
              { title: "3-1 RAG 檢索增強生成", duration: 1440, description: "實作 RAG 系統提升模型回答品質" },
              { title: "3-2 模型部署與推理優化", duration: 1200, description: "將模型部署到生產環境" },
              { title: "3-3 最新研究趨勢導讀", duration: 1080, description: "解讀最新的 AI 研究論文與趨勢" },
            ],
          },
        ],
      },
      "business-data-analytics": {
        chapters: [
          {
            title: "第一章：數據分析基礎",
            lessons: [
              { title: "1-1 數據分析思維框架", duration: 720, isFreePreview: true, description: "建立數據驅動的思維方式" },
              { title: "1-2 Excel 進階數據處理", duration: 1080, description: "掌握 Excel 的進階分析功能" },
            ],
          },
          {
            title: "第二章：視覺化與報告",
            lessons: [
              { title: "2-1 Tableau 資料視覺化", duration: 1320, description: "使用 Tableau 建立互動式儀表板" },
              { title: "2-2 商業報告撰寫技巧", duration: 960, description: "將數據分析結果轉化為有說服力的報告" },
            ],
          },
        ],
      },
    };

    let totalChapters = 0;
    let totalLessons = 0;

    for (const [slug, content] of Object.entries(courseContent)) {
      const courseId = courseMap[slug];
      if (!courseId) continue;

      let courseTotalDuration = 0;
      let courseTotalLessons = 0;

      for (let ci = 0; ci < content.chapters.length; ci++) {
        const ch = content.chapters[ci];
        const [chResult] = await connection.execute(
          "INSERT INTO chapters (courseId, title, sortOrder) VALUES (?, ?, ?)",
          [courseId, ch.title, ci + 1]
        );
        const chapterId = chResult.insertId;
        totalChapters++;

        for (let li = 0; li < ch.lessons.length; li++) {
          const lesson = ch.lessons[li];
          await connection.execute(
            "INSERT INTO lessons (chapterId, courseId, title, description, duration, sortOrder, isFreePreview) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [chapterId, courseId, lesson.title, lesson.description || null, lesson.duration, li + 1, lesson.isFreePreview ? 1 : 0]
          );
          courseTotalDuration += lesson.duration;
          courseTotalLessons++;
          totalLessons++;
        }
      }

      // 更新課程的總時長和總課時數
      await connection.execute(
        "UPDATE courses SET totalDuration = ?, totalLessons = ? WHERE id = ?",
        [courseTotalDuration, courseTotalLessons, courseId]
      );
    }
    console.log(`  ✅ 已插入 ${totalChapters} 個章節、${totalLessons} 個課時`);

    // ═══════════════════════════════════════════════════
    // 6. 插入優惠券 (5張)
    // ═══════════════════════════════════════════════════
    console.log("🎫 插入優惠券...");
    const couponsData = [
      {
        code: "WELCOME2024",
        discountType: "percentage",
        discountValue: "20.00",
        minOrderAmount: "1000.00",
        maxUses: 0,
        courseId: null,
        startsAt: "2024-01-01 00:00:00",
        expiresAt: "2027-12-31 23:59:59",
        isActive: true,
      },
      {
        code: "REACT500",
        discountType: "fixed",
        discountValue: "500.00",
        minOrderAmount: "2000.00",
        maxUses: 100,
        courseId: courseMap["react-18-complete-guide"],
        startsAt: "2024-06-01 00:00:00",
        expiresAt: "2027-06-30 23:59:59",
        isActive: true,
      },
      {
        code: "SUMMER30",
        discountType: "percentage",
        discountValue: "30.00",
        minOrderAmount: "1500.00",
        maxUses: 50,
        courseId: null,
        startsAt: "2024-06-01 00:00:00",
        expiresAt: "2027-08-31 23:59:59",
        isActive: true,
      },
      {
        code: "VIP1000",
        discountType: "fixed",
        discountValue: "1000.00",
        minOrderAmount: "3000.00",
        maxUses: 20,
        courseId: null,
        startsAt: null,
        expiresAt: null,
        isActive: true,
      },
      {
        code: "EXPIRED50",
        discountType: "percentage",
        discountValue: "50.00",
        minOrderAmount: "0.00",
        maxUses: 100,
        courseId: null,
        startsAt: "2023-01-01 00:00:00",
        expiresAt: "2023-12-31 23:59:59",
        isActive: false,
      },
    ];
    for (const coupon of couponsData) {
      await connection.execute(
        `INSERT INTO coupons (code, discountType, discountValue, minOrderAmount, maxUses, courseId, startsAt, expiresAt, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          coupon.code, coupon.discountType, coupon.discountValue, coupon.minOrderAmount,
          coupon.maxUses, coupon.courseId, coupon.startsAt, coupon.expiresAt, coupon.isActive ? 1 : 0,
        ]
      );
    }
    console.log(`  ✅ 已插入 ${couponsData.length} 張優惠券`);

    // ═══════════════════════════════════════════════════
    // 7. 插入通知模板 (4個)
    // ═══════════════════════════════════════════════════
    console.log("📨 插入通知模板...");
    const templatesData = [
      {
        templateKey: "welcome",
        templateName: "歡迎新會員",
        templateBody: "🎉 歡迎 {name} 加入 KDLuck！\n\n感謝您的註冊，現在就開始探索我們精心準備的線上課程吧！\n\n🎁 新會員優惠：使用優惠碼 WELCOME2024 可享全站課程 8 折優惠！",
        isActive: true,
      },
      {
        templateKey: "purchase_success",
        templateName: "購買成功通知",
        templateBody: "✅ {name} 您好！\n\n您已成功購買課程「{courseName}」\n訂單編號：{orderNo}\n\n現在就前往學習吧！祝您學習愉快 📚",
        isActive: true,
      },
      {
        templateKey: "new_course",
        templateName: "新課程上架通知",
        templateBody: "🆕 新課程上架通知！\n\n「{courseName}」已正式上線！\n\n立即前往了解課程詳情，早鳥優惠限時開放中！\n\n🎫 使用優惠碼 {couponCode} 享受額外折扣",
        isActive: true,
      },
      {
        templateKey: "promotion",
        templateName: "促銷活動通知",
        templateBody: "🔥 限時優惠活動！\n\n全站課程限時特惠中，最高可享 {couponCode} 折扣！\n\n活動期間有限，把握機會提升自己！\n\n👉 立即前往選購",
        isActive: true,
      },
    ];
    for (const tpl of templatesData) {
      await connection.execute(
        "INSERT INTO notification_templates (templateKey, templateName, templateBody, isActive) VALUES (?, ?, ?, ?)",
        [tpl.templateKey, tpl.templateName, tpl.templateBody, tpl.isActive ? 1 : 0]
      );
    }
    console.log(`  ✅ 已插入 ${templatesData.length} 個通知模板`);

    // ═══════════════════════════════════════════════════
    // 8. 插入網站配置
    // ═══════════════════════════════════════════════════
    console.log("⚙️ 插入網站配置...");
    const siteConfigData = [
      { key: "site_name", value: "KDLuck 知識付費平台" },
      { key: "site_description", value: "打開知識的大門，開啟無限可能。由頂尖講師精心打造的線上課程平台。" },
      { key: "site_logo", value: "" },
      { key: "contact_email", value: "support@kdluck.com" },
      { key: "contact_phone", value: "02-1234-5678" },
      { key: "seo_keywords", value: "線上課程,知識付費,程式開發,數據科學,設計,創業,AI" },
      { key: "footer_text", value: "© 2024-2026 KDLuck 知識付費平台. All rights reserved." },
      { key: "bank_name", value: "國泰世華銀行" },
      { key: "bank_code", value: "013" },
      { key: "bank_account", value: "012-345678901234" },
      { key: "bank_account_name", value: "KDLuck 有限公司" },
    ];
    for (const item of siteConfigData) {
      await connection.execute(
        "INSERT INTO site_config (configKey, configValue) VALUES (?, ?) ON DUPLICATE KEY UPDATE configValue = VALUES(configValue)",
        [item.key, item.value]
      );
    }
    console.log(`  ✅ 已插入 ${siteConfigData.length} 項網站配置`);

    // ═══════════════════════════════════════════════════
    // 9. 插入模擬用戶、訂單與評價
    // ═══════════════════════════════════════════════════
    console.log("👥 插入模擬用戶...");
    const testUsers = [
      { openId: "test_user_001", name: "李小明", email: "xiaoming@example.com", role: "user" },
      { openId: "test_user_002", name: "王小華", email: "xiaohua@example.com", role: "user" },
      { openId: "test_user_003", name: "張小美", email: "xiaomei@example.com", role: "user" },
      { openId: "test_user_004", name: "陳大偉", email: "dawei@example.com", role: "user" },
      { openId: "test_user_005", name: "林小芳", email: "xiaofang@example.com", role: "user" },
    ];
    for (const u of testUsers) {
      await connection.execute(
        "INSERT INTO users (openId, name, email, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)",
        [u.openId, u.name, u.email, u.role]
      );
    }
    const [userRows] = await connection.execute("SELECT id, openId FROM users WHERE openId LIKE 'test_user_%' ORDER BY id");
    const userMap = {};
    for (const row of userRows) userMap[row.openId] = row.id;
    console.log(`  ✅ 已插入 ${testUsers.length} 位模擬用戶`);

    console.log("🛒 插入模擬訂單...");
    const ordersData = [
      { userId: userMap["test_user_001"], courseSlug: "react-18-complete-guide", amount: "2980.00", originalAmount: "4500.00", method: "ecpay", status: "paid", orderNo: "KD20240601001" },
      { userId: userMap["test_user_001"], courseSlug: "nodejs-backend-api", amount: "3280.00", originalAmount: "3280.00", method: "ecpay", status: "paid", orderNo: "KD20240715002" },
      { userId: userMap["test_user_002"], courseSlug: "python-machine-learning", amount: "3680.00", originalAmount: "5200.00", method: "bank_transfer", status: "paid", orderNo: "KD20240620003" },
      { userId: userMap["test_user_002"], courseSlug: "chatgpt-ai-tools", amount: "0.00", originalAmount: "0.00", method: "free", status: "paid", orderNo: "KD20240701004" },
      { userId: userMap["test_user_003"], courseSlug: "figma-uiux-masterclass", amount: "2480.00", originalAmount: "3600.00", method: "ecpay", status: "paid", orderNo: "KD20240810005" },
      { userId: userMap["test_user_003"], courseSlug: "startup-masterclass", amount: "4280.00", originalAmount: "6000.00", method: "ecpay", status: "paid", orderNo: "KD20240825006" },
      { userId: userMap["test_user_004"], courseSlug: "deep-learning-transformer", amount: "5680.00", originalAmount: "7800.00", method: "ecpay", status: "paid", orderNo: "KD20240901007" },
      { userId: userMap["test_user_004"], courseSlug: "react-18-complete-guide", amount: "2480.00", originalAmount: "4500.00", method: "ecpay", status: "paid", orderNo: "KD20240915008", couponCode: "REACT500" },
      { userId: userMap["test_user_005"], courseSlug: "chatgpt-ai-tools", amount: "0.00", originalAmount: "0.00", method: "free", status: "paid", orderNo: "KD20241001009" },
      { userId: userMap["test_user_005"], courseSlug: "python-machine-learning", amount: "2576.00", originalAmount: "5200.00", method: "ecpay", status: "pending", orderNo: "KD20241015010", couponCode: "SUMMER30" },
      { userId: userMap["test_user_001"], courseSlug: "chatgpt-ai-tools", amount: "0.00", originalAmount: "0.00", method: "free", status: "paid", orderNo: "KD20241020011" },
      { userId: userMap["test_user_003"], courseSlug: "react-18-complete-guide", amount: "2980.00", originalAmount: "4500.00", method: "bank_transfer", status: "pending", orderNo: "KD20241101012" },
    ];

    for (const order of ordersData) {
      const courseId = courseMap[order.courseSlug];
      await connection.execute(
        `INSERT INTO orders (orderNo, userId, courseId, amount, originalAmount, paymentMethod, paymentStatus, couponCode, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.orderNo, order.userId, courseId, order.amount, order.originalAmount,
          order.method, order.status, order.couponCode || null,
          order.status === "paid" ? new Date() : null,
        ]
      );

      // 如果已付款，建立 enrollment
      if (order.status === "paid") {
        await connection.execute(
          "INSERT INTO enrollments (userId, courseId) VALUES (?, ?)",
          [order.userId, courseId]
        );
      }
    }
    console.log(`  ✅ 已插入 ${ordersData.length} 筆模擬訂單`);

    console.log("⭐ 插入模擬評價...");
    const reviewsData = [
      { userId: userMap["test_user_001"], courseSlug: "react-18-complete-guide", rating: 5, comment: "非常棒的課程！陳老師講解清晰，實戰專案很有幫助。從零基礎到能獨立開發 React 應用，這門課真的物超所值。" },
      { userId: userMap["test_user_001"], courseSlug: "nodejs-backend-api", rating: 5, comment: "搭配 React 課程一起學，前後端都通了！TypeScript 的整合教學特別實用。" },
      { userId: userMap["test_user_002"], courseSlug: "python-machine-learning", rating: 5, comment: "林老師的教學非常有深度，每個演算法都講得很透徹。實作練習的數據集也很貼近實際工作場景。" },
      { userId: userMap["test_user_002"], courseSlug: "chatgpt-ai-tools", rating: 4, comment: "免費課程品質很高！Prompt Engineering 的部分特別受用，已經在工作中實際應用了。" },
      { userId: userMap["test_user_003"], courseSlug: "figma-uiux-masterclass", rating: 5, comment: "王老師的設計課太讚了！從設計思維到 Figma 實操，每一步都很紮實。設計系統的章節是最大亮點。" },
      { userId: userMap["test_user_003"], courseSlug: "startup-masterclass", rating: 5, comment: "張老師的創業經驗分享非常寶貴，不是空談理論而是真實的實戰經驗。BMC 和融資簡報的章節特別有幫助。" },
      { userId: userMap["test_user_004"], courseSlug: "deep-learning-transformer", rating: 5, comment: "這是我上過最好的深度學習進階課程。Transformer 的數學推導講得非常清楚，LoRA 微調的實作也很實用。" },
      { userId: userMap["test_user_004"], courseSlug: "react-18-complete-guide", rating: 4, comment: "課程內容很全面，React 18 的新特性講解得很好。希望能增加更多 Next.js 的內容。" },
      { userId: userMap["test_user_005"], courseSlug: "chatgpt-ai-tools", rating: 5, comment: "完全免費還這麼有料！學會了很多 AI 工具的使用技巧，工作效率提升了不少。強烈推薦！" },
    ];
    for (const review of reviewsData) {
      const courseId = courseMap[review.courseSlug];
      await connection.execute(
        "INSERT INTO reviews (userId, courseId, rating, comment) VALUES (?, ?, ?, ?)",
        [review.userId, courseId, review.rating, review.comment]
      );
    }
    console.log(`  ✅ 已插入 ${reviewsData.length} 筆模擬評價`);

    // ═══════════════════════════════════════════════════
    // 10. 更新課程評分統計
    // ═══════════════════════════════════════════════════
    console.log("📊 更新課程評分統計...");
    await connection.execute(`
      UPDATE courses c SET
        avgRating = (SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.courseId = c.id),
        ratingCount = (SELECT COUNT(*) FROM reviews r WHERE r.courseId = c.id)
      WHERE EXISTS (SELECT 1 FROM reviews r WHERE r.courseId = c.id)
    `);

    console.log("\n🎉 所有測試資料已成功插入！");
    console.log("═══════════════════════════════════════════════════");
    console.log("📂 分類: 6 個");
    console.log("👨‍🏫 講師: 4 位");
    console.log(`📚 課程: ${coursesData.length} 門 (${coursesData.filter(c => c.status === 'published').length} 已發布, ${coursesData.filter(c => c.status === 'draft').length} 草稿)`);
    console.log(`📖 章節: ${totalChapters} 個`);
    console.log(`🎬 課時: ${totalLessons} 個`);
    console.log(`🎫 優惠券: ${couponsData.length} 張 (${couponsData.filter(c => c.isActive).length} 啟用, ${couponsData.filter(c => !c.isActive).length} 停用)`);
    console.log(`📨 通知模板: ${templatesData.length} 個`);
    console.log(`⚙️ 網站配置: ${siteConfigData.length} 項`);
    console.log(`👥 模擬用戶: ${testUsers.length} 位`);
    console.log(`🛒 模擬訂單: ${ordersData.length} 筆 (${ordersData.filter(o => o.status === 'paid').length} 已付款, ${ordersData.filter(o => o.status === 'pending').length} 待付款)`);
    console.log(`⭐ 模擬評價: ${reviewsData.length} 筆`);
    console.log("═══════════════════════════════════════════════════");

  } catch (error) {
    console.error("❌ 種子資料插入失敗:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
