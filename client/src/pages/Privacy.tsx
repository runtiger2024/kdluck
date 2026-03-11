import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">隱私權政策</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">最後更新日期：2025 年 3 月</p>

            <h2 className="text-xl font-bold text-foreground">一、個人資料的蒐集</h2>
            <p>當您註冊帳號、購買課程或使用本平台服務時，我們可能會蒐集以下個人資料：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>姓名、電子郵件地址</li>
              <li>電話號碼、通訊地址</li>
              <li>付款資訊（透過第三方支付處理，本平台不直接儲存信用卡資訊）</li>
              <li>學習紀錄與偏好</li>
              <li>裝置資訊與瀏覽紀錄</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">二、個人資料的使用</h2>
            <p>我們蒐集的個人資料將用於以下目的：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>提供、維護及改善我們的服務</li>
              <li>處理您的訂單與付款</li>
              <li>發送課程相關通知與更新</li>
              <li>提供個人化的學習推薦</li>
              <li>回應您的客服需求</li>
              <li>遵守法律義務</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">三、個人資料的保護</h2>
            <p>
              我們採取適當的技術與組織措施來保護您的個人資料，包括資料加密、存取控制、以及定期安全稽核。
              然而，網際網路傳輸無法保證百分之百安全，我們將盡最大努力保護您的資料安全。
            </p>

            <h2 className="text-xl font-bold text-foreground">四、Cookie 使用</h2>
            <p>
              本平台使用 Cookie 及類似技術來提升您的使用體驗、分析網站流量、以及提供個人化內容。
              您可以透過瀏覽器設定管理 Cookie 偏好。
            </p>

            <h2 className="text-xl font-bold text-foreground">五、第三方服務</h2>
            <p>
              我們可能使用第三方服務（如支付處理、數據分析）來協助提供服務。
              這些第三方服務商有各自的隱私政策，我們建議您查閱相關條款。
            </p>

            <h2 className="text-xl font-bold text-foreground">六、您的權利</h2>
            <p>您有權：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>查詢、閱覽您的個人資料</li>
              <li>請求更正或補充您的個人資料</li>
              <li>請求刪除您的個人資料</li>
              <li>撤回您的同意</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">七、聯絡方式</h2>
            <p>
              如您對本隱私權政策有任何疑問，請透過{" "}
              <a href="https://lin.ee/DW9MeU0" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                LINE 客服
              </a>{" "}
              與我們聯繫。
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
