import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BookOpen, Users, Award, Target } from "lucide-react";

export default function About() {
  const { data: config } = trpc.siteConfig.get.useQuery();
  const siteName = (config as any)?.siteName ?? "凱迪拉課";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center">
            <h1 className="text-4xl font-bold mb-4">關於 {siteName}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              我們致力於提供最優質的線上學習體驗，幫助每一位學員實現自我成長與職業發展。
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: BookOpen, title: "優質課程", desc: "精選業界專家授課，確保每門課程都具備實用價值與專業深度" },
                { icon: Users, title: "社群學習", desc: "建立學習社群，讓學員之間互相交流、共同成長" },
                { icon: Award, title: "專業認證", desc: "完成課程後獲得學習證明，為您的職涯加分" },
                { icon: Target, title: "實戰導向", desc: "課程內容注重實務應用，學完即可運用於工作中" },
              ].map((item, i) => (
                <Card key={i} className="bg-card border-border text-center">
                  <CardContent className="pt-8 pb-6">
                    <item.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-secondary/10">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">我們的使命</h2>
            <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground">
              <p>
                {siteName} 成立的初衷，是希望打破傳統教育的時空限制，讓每個人都能隨時隨地學習自己感興趣的知識與技能。
              </p>
              <p>
                我們與各領域的專業講師合作，精心設計每一門課程，從基礎入門到進階實戰，涵蓋程式開發、數據分析、商業管理、設計創意等多元領域。
              </p>
              <p>
                我們相信，學習不應該是一件孤獨的事。透過互動式的學習體驗、課程筆記功能、以及學員評價系統，我們打造了一個充滿活力的學習社群。
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16">
          <div className="container text-center">
            <h2 className="text-2xl font-bold mb-4">聯絡我們</h2>
            <p className="text-muted-foreground mb-6">有任何問題或建議，歡迎透過以下方式聯繫我們</p>
            <div className="flex justify-center gap-4">
              <a
                href="https://lin.ee/DW9MeU0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#06C755] text-white rounded-lg font-medium hover:bg-[#05b04d] transition-colors"
              >
                LINE 客服
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
