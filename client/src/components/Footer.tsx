import { trpc } from "@/lib/trpc";

export default function Footer() {
  const { data: config } = trpc.siteConfig.get.useQuery();

  return (
    <footer className="border-t border-border bg-card/30 py-12">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">聯絡我們</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              {config?.contact_email && <p>Email: {config.contact_email}</p>}
              {config?.contact_phone && <p>電話: {config.contact_phone}</p>}
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
