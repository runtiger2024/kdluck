import { trpc } from "@/lib/trpc";
import { MessageCircle } from "lucide-react";

export default function Footer() {
  const { data: config } = trpc.siteConfig.get.useQuery();

  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <span className="text-xl font-black text-gradient-orange">KDLuck</span>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              {config?.site_description || "打開知識的大門，開啟無限可能"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">快速連結</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="/courses" className="block hover:text-foreground transition-colors">課程目錄</a>
              <a href="/member" className="block hover:text-foreground transition-colors">會員中心</a>
              <a href="/member/wishlist" className="block hover:text-foreground transition-colors">願望清單</a>
              <a href="/member/orders" className="block hover:text-foreground transition-colors">我的訂單</a>
              <a href="/account-help" className="block hover:text-foreground transition-colors">帳號問題協助</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">聯絡我們</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {config?.contact_email && <p>Email: {config.contact_email}</p>}
              {config?.contact_phone && <p>電話: {config.contact_phone}</p>}
              <a
                href="https://lin.ee/DW9MeU0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#06C755] hover:text-[#06C755]/80 transition-colors font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                LINE 官方客服
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">關於平台</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="/about" className="block hover:text-foreground transition-colors">關於我們</a>
              <a href="/privacy" className="block hover:text-foreground transition-colors">隱私權政策</a>
              <a href="/terms" className="block hover:text-foreground transition-colors">服務條款</a>
              {config?.company_tax_id && <p className="text-xs">統一編號：{config.company_tax_id}</p>}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
          {config?.footer_text || `© ${new Date().getFullYear()} KDLuck. All rights reserved.`}
        </div>
      </div>
    </footer>
  );
}
