import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-16">
        <div className="container max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">服務條款</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-sm">最後更新日期：2025 年 3 月</p>

            <h2 className="text-xl font-bold text-foreground">一、服務說明</h2>
            <p>
              凱迪拉課（以下簡稱「本平台」）提供線上課程學習服務。使用本平台前，請詳細閱讀以下條款。
              當您註冊帳號或使用本平台服務時，即表示您已閱讀、理解並同意遵守本服務條款。
            </p>

            <h2 className="text-xl font-bold text-foreground">二、帳號註冊與管理</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>您須提供真實、正確的個人資料進行註冊</li>
              <li>您有責任妥善保管帳號密碼，不得將帳號轉讓或借予他人使用</li>
              <li>如發現帳號遭盜用，請立即通知本平台</li>
              <li>本平台保留在違反條款時停用或刪除帳號的權利</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">三、課程購買與退款</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>課程一經購買，即可無限期觀看（除非另有說明）</li>
              <li>課程價格以購買當下顯示為準</li>
              <li>退款政策：購買後 7 天內，若觀看進度未超過 30%，可申請全額退款</li>
              <li>免費課程與已使用優惠券的訂單，退款政策可能有所不同</li>
              <li>退款申請請透過客服管道提出</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">四、智慧財產權</h2>
            <p>
              本平台上所有課程內容（包括但不限於影片、文字、圖片、教材）均受著作權法保護。
              未經授權，您不得：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>複製、錄製、下載或散佈課程內容</li>
              <li>將課程內容用於商業用途</li>
              <li>分享帳號讓他人觀看已購課程</li>
              <li>使用任何技術手段繞過平台的內容保護機制</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">五、使用者行為規範</h2>
            <p>使用本平台時，您同意不會：</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>發布不實、誹謗或違法的內容</li>
              <li>干擾或破壞平台的正常運作</li>
              <li>利用平台進行任何非法活動</li>
              <li>在評價中發布與課程無關的廣告或垃圾訊息</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">六、免責聲明</h2>
            <p>
              本平台盡力確保課程內容的正確性與品質，但不對以下情況承擔責任：
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>因網路問題導致的服務中斷</li>
              <li>因不可抗力因素造成的損失</li>
              <li>學員依據課程內容做出的決策所產生的結果</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">七、條款修改</h2>
            <p>
              本平台保留隨時修改本服務條款的權利。修改後的條款將公布於本頁面，
              繼續使用本平台即表示您同意修改後的條款。
            </p>

            <h2 className="text-xl font-bold text-foreground">八、聯絡方式</h2>
            <p>
              如您對本服務條款有任何疑問，請透過{" "}
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
