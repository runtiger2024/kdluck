import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Shield, KeyRound, Mail, Phone, Link2, Clock,
  CheckCircle2, AlertTriangle, Info,
} from "lucide-react";
import { toast } from "sonner";

const loginMethodLabels: Record<string, { label: string; color: string }> = {
  manus: { label: "Manus 帳號", color: "bg-primary/10 text-primary" },
  line: { label: "LINE 登入", color: "bg-[#06C755]/10 text-[#06C755]" },
  google: { label: "Google 登入", color: "bg-blue-500/10 text-blue-500" },
};

export default function MemberSecurity() {
  const { user } = useAuth();
  const { data: security, isLoading } = trpc.user.accountSecurity.useQuery();
  const { data: siteConfig } = trpc.siteConfig.get.useQuery();
  const lineLoginEnabled = siteConfig?.line_login_enabled === "true" && siteConfig?.line_channel_id;

  function getLineBindUrl() {
    const origin = window.location.origin;
    return `/api/line/login?origin=${encodeURIComponent(origin)}&returnPath=${encodeURIComponent("/member/security")}&mode=bind`;
  }

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">帳號安全</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-muted rounded-lg" />
          <div className="h-40 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  const securityScore = [
    security?.hasEmail,
    security?.hasPhone,
    security?.hasLineBinding,
  ].filter(Boolean).length;

  const scoreLabel = securityScore >= 3 ? "高" : securityScore >= 2 ? "中" : "低";
  const scoreColor = securityScore >= 3 ? "text-green-500" : securityScore >= 2 ? "text-yellow-500" : "text-red-500";
  const scoreBg = securityScore >= 3 ? "bg-green-500/10" : securityScore >= 2 ? "bg-yellow-500/10" : "bg-red-500/10";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">帳號安全</h1>

      {/* Security Score */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-full ${scoreBg} flex items-center justify-center shrink-0`}>
              <Shield className={`h-10 w-10 ${scoreColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">帳號安全等級</h2>
                <Badge className={scoreBg + " " + scoreColor + " border-0"}>
                  {scoreLabel}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {securityScore >= 3
                  ? "您的帳號安全設定完善，所有驗證方式都已啟用。"
                  : securityScore >= 2
                  ? "建議補充更多驗證方式以提高帳號安全性。"
                  : "您的帳號安全性較低，建議盡快綁定更多驗證方式。"}
              </p>
              <div className="flex gap-1 mt-3">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-2 flex-1 rounded-full ${
                      level <= securityScore
                        ? securityScore >= 3 ? "bg-green-500" : securityScore >= 2 ? "bg-yellow-500" : "bg-red-500"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Login Method */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            登入方式
          </CardTitle>
          <CardDescription>您目前使用的主要登入方式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                loginMethodLabels[security?.loginMethod ?? "manus"]?.color ?? "bg-primary/10"
              }`}>
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {loginMethodLabels[security?.loginMethod ?? "manus"]?.label ?? security?.loginMethod}
                </p>
                <p className="text-xs text-muted-foreground">主要登入方式</p>
              </div>
            </div>
            <Badge variant="default">使用中</Badge>
          </div>

          {security?.loginMethod === "manus" && (
            <Alert className="mt-4 border-blue-500/20 bg-blue-500/5">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-400 text-sm">
                如需修改 Manus 帳號密碼，請至 Manus 平台的帳號設定頁面操作。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            驗證狀態
          </CardTitle>
          <CardDescription>完善驗證資訊可提高帳號安全性，並在帳號遇到問題時幫助找回</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                security?.hasEmail ? "bg-green-500/10" : "bg-muted"
              }`}>
                <Mail className={`h-5 w-5 ${security?.hasEmail ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-xs text-muted-foreground">
                  {security?.hasEmail ? security.email : "未設定"}
                </p>
              </div>
            </div>
            {security?.hasEmail ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Button size="sm" variant="outline" onClick={() => toast.info("請至「個人資料」頁面編輯 Email")}>
                設定
              </Button>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                security?.hasPhone ? "bg-green-500/10" : "bg-muted"
              }`}>
                <Phone className={`h-5 w-5 ${security?.hasPhone ? "text-green-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-sm">手機號碼</p>
                <p className="text-xs text-muted-foreground">
                  {security?.hasPhone ? security.phone : "未設定"}
                </p>
              </div>
            </div>
            {security?.hasPhone ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Button size="sm" variant="outline" onClick={() => toast.info("請至「個人資料」頁面編輯手機號碼")}>
                設定
              </Button>
            )}
          </div>

          {/* LINE Binding */}
          <div className="flex items-center justify-between p-4 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                security?.hasLineBinding ? "bg-[#06C755]/10" : "bg-muted"
              }`}>
                <Link2 className={`h-5 w-5 ${security?.hasLineBinding ? "text-[#06C755]" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-medium text-sm">LINE 帳號綁定</p>
                <p className="text-xs text-muted-foreground">
                  {security?.hasLineBinding ? "已綁定" : "未綁定"}
                </p>
              </div>
            </div>
            {security?.hasLineBinding ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : lineLoginEnabled ? (
              <Button
                size="sm"
                variant="outline"
                className="bg-[#06C755] hover:bg-[#05b64e] text-white border-[#06C755]"
                onClick={() => { window.location.href = getLineBindUrl(); }}
              >
                綁定 LINE
              </Button>
            ) : (
              <Badge variant="secondary">未開放</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            帳號資訊
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">帳號建立時間</p>
              <p className="text-sm font-medium">
                {security?.createdAt ? new Date(security.createdAt).toLocaleString("zh-TW") : "-"}
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">最後登入時間</p>
              <p className="text-sm font-medium">
                {security?.lastSignedIn ? new Date(security.lastSignedIn).toLocaleString("zh-TW") : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            安全建議
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            {!security?.hasEmail && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p>建議設定 Email，以便在帳號出現問題時能夠找回。</p>
              </div>
            )}
            {!security?.hasPhone && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p>建議設定手機號碼，提供額外的帳號驗證方式。</p>
              </div>
            )}
            {!security?.hasLineBinding && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <p>建議綁定 LINE 帳號，可以使用 LINE 快速登入，也能接收重要通知。</p>
              </div>
            )}
            {securityScore >= 3 && (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <p>您的帳號安全設定已經很完善了！請妥善保管您的登入資訊。</p>
              </div>
            )}
            <Separator />
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p>如遇到帳號問題，請前往<a href="/account-help" className="text-primary hover:underline">帳號問題協助</a>頁面，或聯繫我們的客服團隊。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
