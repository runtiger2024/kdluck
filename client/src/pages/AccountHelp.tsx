import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle, Mail, Search, ArrowLeft, MessageCircle,
  Shield, KeyRound, UserCheck, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const loginMethodLabels: Record<string, string> = {
  manus: "Manus 帳號登入",
  line: "LINE 登入",
  google: "Google 登入",
};

export default function AccountHelp() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [searched, setSearched] = useState(false);
  const { data: siteConfig } = trpc.siteConfig.get.useQuery();

  const { data: lookupResult, isLoading, refetch } = trpc.user.lookupByEmail.useQuery(
    { email },
    { enabled: false }
  );

  const handleSearch = async () => {
    if (!email || !email.includes("@")) return;
    setSearched(true);
    refetch();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-3xl py-12">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首頁
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">帳號問題協助</h1>
          <p className="text-muted-foreground">
            無法登入或忘記帳號？我們可以幫助您找回帳號。
          </p>
        </div>

        {/* Step 1: Email Lookup */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              步驟一：查詢帳號
            </CardTitle>
            <CardDescription>
              輸入您註冊時使用的 Email 地址，我們會告訴您該帳號的登入方式。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="請輸入您的 Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isLoading || !email.includes("@")}>
                {isLoading ? "查詢中..." : "查詢"}
              </Button>
            </div>

            {searched && lookupResult && (
              <div className="mt-6">
                {lookupResult.found ? (
                  <div className="space-y-4">
                    <Alert className="border-green-500/30 bg-green-500/5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-400">
                        找到 {lookupResult.accounts.length} 個與此 Email 關聯的帳號
                      </AlertDescription>
                    </Alert>
                    {lookupResult.accounts.map((account, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border bg-secondary/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-primary" />
                            <span className="font-medium">{account.maskedName ?? "用戶"}</span>
                          </div>
                          <Badge variant="outline">
                            {loginMethodLabels[account.loginMethod] ?? account.loginMethod}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>LINE 綁定：{account.hasLineBinding ? "已綁定" : "未綁定"}</p>
                          <p>最後登入：{account.lastSignedIn ? new Date(account.lastSignedIn).toLocaleDateString("zh-TW") : "未知"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className="border-yellow-500/30 bg-yellow-500/5">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-400">
                      未找到與此 Email 關聯的帳號。您可能使用了其他 Email 註冊，或是透過 LINE 直接登入（未綁定 Email）。
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Login Method Guide */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              步驟二：根據登入方式操作
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Manus OAuth */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Manus 帳號登入</p>
                  <p className="text-xs text-muted-foreground">使用 Manus 平台帳號登入</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 ml-13">
                <p>如果您是使用 Manus 帳號登入，請嘗試以下步驟：</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>點擊首頁的「登入 / 註冊」按鈕</li>
                  <li>在 Manus 登入頁面選擇「忘記密碼」</li>
                  <li>按照 Manus 平台的指示重設密碼</li>
                  <li>使用新密碼登入即可</li>
                </ol>
              </div>
            </div>

            {/* LINE Login */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">LINE 登入</p>
                  <p className="text-xs text-muted-foreground">使用 LINE 帳號直接登入</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-2 ml-13">
                <p>如果您是使用 LINE 登入：</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>確認您的手機上已安裝並登入 LINE</li>
                  <li>點擊首頁的「LINE 登入」按鈕</li>
                  <li>LINE 會自動識別您的帳號，無需密碼</li>
                  <li>如果 LINE 帳號本身有問題，請至 LINE 官方客服處理</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Contact Support */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              步驟三：聯繫客服
            </CardTitle>
            <CardDescription>
              如果以上方法都無法解決您的問題，請透過以下方式聯繫我們的客服團隊。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* LINE Official */}
              <a
                href="https://lin.ee/DW9MeU0"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">LINE 官方客服</p>
                  <p className="text-xs text-muted-foreground">最快速的聯繫方式</p>
                </div>
              </a>

              {/* Email */}
              {siteConfig?.contact_email && (
                <a
                  href={`mailto:${siteConfig.contact_email}?subject=帳號問題協助&body=您好，我遇到帳號問題需要協助。%0A%0A我的 Email：%0A問題描述：`}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email 客服</p>
                    <p className="text-xs text-muted-foreground">{siteConfig.contact_email}</p>
                  </div>
                </a>
              )}
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">聯繫客服時，請提供以下資訊以加快處理速度：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>您的註冊 Email 或姓名</li>
                <li>您使用的登入方式（Manus / LINE / Google）</li>
                <li>遇到的具體問題描述</li>
                <li>如有截圖，請一併提供</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>常見問題</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-sm mb-1">Q: 我忘記用哪種方式登入了？</p>
              <p className="text-sm text-muted-foreground">
                A: 在上方輸入您的 Email 查詢，系統會顯示您的帳號使用的登入方式。
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm mb-1">Q: 我用 LINE 登入，但換了手機怎麼辦？</p>
              <p className="text-sm text-muted-foreground">
                A: 只要您在新手機上登入了相同的 LINE 帳號，就可以直接使用 LINE 登入本平台。LINE 帳號的轉移請參考 LINE 官方說明。
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm mb-1">Q: 我可以同時使用多種登入方式嗎？</p>
              <p className="text-sm text-muted-foreground">
                A: 可以。登入後在會員中心的「個人資料」頁面可以綁定 LINE 帳號。綁定後，您可以使用任一方式登入同一帳號。
              </p>
            </div>
            <Separator />
            <div>
              <p className="font-medium text-sm mb-1">Q: 我的課程和訂單會不見嗎？</p>
              <p className="text-sm text-muted-foreground">
                A: 不會。您的課程和訂單紀錄都與帳號綁定，只要成功登入就能看到所有資料。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
