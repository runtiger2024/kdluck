import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, Building, FileText, MessageCircle, Eye, EyeOff, Shield } from "lucide-react";
import { useState, useEffect } from "react";

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default function AdminPayment() {
  const { data: config, isLoading } = trpc.siteConfig.get.useQuery();
  const updateBatch = trpc.siteConfig.updateBatch.useMutation();
  const utils = trpc.useUtils();

  // 綠界
  const [ecpayEnabled, setEcpayEnabled] = useState(false);
  const [ecpayMerchantId, setEcpayMerchantId] = useState("");
  const [ecpayHashKey, setEcpayHashKey] = useState("");
  const [ecpayHashIv, setEcpayHashIv] = useState("");
  const [ecpayIsProduction, setEcpayIsProduction] = useState("false");

  // 銀行轉帳
  const [bankEnabled, setBankEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  // 光貿發票
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [amegoInvoiceNumber, setAmegoInvoiceNumber] = useState("");
  const [amegoAppKey, setAmegoAppKey] = useState("");

  // LINE
  const [lineLoginEnabled, setLineLoginEnabled] = useState(false);
  const [lineChannelId, setLineChannelId] = useState("");
  const [lineChannelSecret, setLineChannelSecret] = useState("");
  const [lineMessagingToken, setLineMessagingToken] = useState("");

  useEffect(() => {
    if (config) {
      setEcpayEnabled(config.ecpay_enabled === "true");
      setEcpayMerchantId(config.ecpay_merchant_id || "");
      setEcpayHashKey(config.ecpay_hash_key || "");
      setEcpayHashIv(config.ecpay_hash_iv || "");
      setEcpayIsProduction(config.ecpay_is_production || "false");
      setBankEnabled(config.bank_transfer_enabled === "true");
      setBankName(config.bank_name || "");
      setBankCode(config.bank_code || "");
      setBankAccount(config.bank_account || "");
      setBankHolder(config.bank_holder || "");
      setInvoiceEnabled(config.invoice_enabled === "true");
      setAmegoInvoiceNumber(config.amego_invoice_number || "");
      setAmegoAppKey(config.amego_app_key || "");
      setLineLoginEnabled(config.line_login_enabled === "true");
      setLineChannelId(config.line_channel_id || "");
      setLineChannelSecret(config.line_channel_secret || "");
      setLineMessagingToken(config.line_messaging_token || "");
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateBatch.mutateAsync([
        { key: "ecpay_enabled", value: ecpayEnabled ? "true" : "false" },
        { key: "ecpay_merchant_id", value: ecpayMerchantId },
        { key: "ecpay_hash_key", value: ecpayHashKey },
        { key: "ecpay_hash_iv", value: ecpayHashIv },
        { key: "ecpay_is_production", value: ecpayIsProduction },
        { key: "bank_transfer_enabled", value: bankEnabled ? "true" : "false" },
        { key: "bank_name", value: bankName },
        { key: "bank_code", value: bankCode },
        { key: "bank_account", value: bankAccount },
        { key: "bank_holder", value: bankHolder },
        { key: "invoice_enabled", value: invoiceEnabled ? "true" : "false" },
        { key: "amego_invoice_number", value: amegoInvoiceNumber },
        { key: "amego_app_key", value: amegoAppKey },
        { key: "line_login_enabled", value: lineLoginEnabled ? "true" : "false" },
        { key: "line_channel_id", value: lineChannelId },
        { key: "line_channel_secret", value: lineChannelSecret },
        { key: "line_messaging_token", value: lineMessagingToken },
      ]);
      utils.siteConfig.get.invalidate();
      toast.success("所有設定已儲存");
    } catch {
      toast.error("儲存失敗");
    }
  };

  if (isLoading) return <div className="animate-pulse text-muted-foreground p-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支付與 API 設定</h1>
        <p className="text-muted-foreground mt-1">管理平台的支付方式、第三方 API 金鑰與 LINE 整合設定</p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium mb-1">
          <Shield className="h-4 w-4" />
          安全提醒
        </div>
        <p className="text-muted-foreground">
          所有 API 金鑰均以加密方式儲存於資料庫中。請確保只有管理員能存取此頁面。
          金鑰欄位預設以密碼遮罩顯示，點擊眼睛圖示可切換顯示。
        </p>
      </div>

      {/* ─── 綠界 ECPay ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-lg">綠界 ECPay</CardTitle>
                <CardDescription>信用卡、ATM、超商代碼等線上付款</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ecpayEnabled ? "default" : "secondary"}>
                {ecpayEnabled ? "已啟用" : "未啟用"}
              </Badge>
              <Switch checked={ecpayEnabled} onCheckedChange={setEcpayEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>特店編號 (MerchantID)</Label>
              <Input
                value={ecpayMerchantId}
                onChange={e => setEcpayMerchantId(e.target.value)}
                placeholder="例：3002607（測試環境）"
              />
            </div>
            <div className="space-y-2">
              <Label>環境模式</Label>
              <Select value={ecpayIsProduction} onValueChange={setEcpayIsProduction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">測試環境 (Staging)</SelectItem>
                  <SelectItem value="true">正式環境 (Production)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HashKey</Label>
              <SecretInput
                value={ecpayHashKey}
                onChange={setEcpayHashKey}
                placeholder="綠界提供的 HashKey"
              />
            </div>
            <div className="space-y-2">
              <Label>HashIV</Label>
              <SecretInput
                value={ecpayHashIv}
                onChange={setEcpayHashIv}
                placeholder="綠界提供的 HashIV"
              />
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>測試環境預設值：MerchantID = <code className="bg-muted px-1 py-0.5 rounded">3002607</code>、
            HashKey = <code className="bg-muted px-1 py-0.5 rounded">pwFHCqoQZGmho4w6</code>、
            HashIV = <code className="bg-muted px-1 py-0.5 rounded">EkRm7iFT261dpevs</code></p>
          </div>
        </CardContent>
      </Card>

      {/* ─── 銀行轉帳 ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">銀行轉帳</CardTitle>
                <CardDescription>線下匯款，管理員手動確認</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={bankEnabled ? "default" : "secondary"}>
                {bankEnabled ? "已啟用" : "未啟用"}
              </Badge>
              <Switch checked={bankEnabled} onCheckedChange={setBankEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>銀行名稱</Label>
              <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="例：中國信託商業銀行" />
            </div>
            <div className="space-y-2">
              <Label>銀行代碼</Label>
              <Input value={bankCode} onChange={e => setBankCode(e.target.value)} placeholder="例：822" />
            </div>
            <div className="space-y-2">
              <Label>帳號</Label>
              <Input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="銀行帳號" />
            </div>
            <div className="space-y-2">
              <Label>戶名</Label>
              <Input value={bankHolder} onChange={e => setBankHolder(e.target.value)} placeholder="帳戶持有人姓名" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 光貿電子發票 ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">光貿電子發票</CardTitle>
                <CardDescription>自動開立電子發票（光貿 Amego API）</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={invoiceEnabled ? "default" : "secondary"}>
                {invoiceEnabled ? "已啟用" : "未啟用"}
              </Badge>
              <Switch checked={invoiceEnabled} onCheckedChange={setInvoiceEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>發票字軌號碼 (Invoice Number)</Label>
              <Input
                value={amegoInvoiceNumber}
                onChange={e => setAmegoInvoiceNumber(e.target.value)}
                placeholder="光貿提供的發票字軌號碼"
              />
            </div>
            <div className="space-y-2">
              <Label>APP Key</Label>
              <SecretInput
                value={amegoAppKey}
                onChange={setAmegoAppKey}
                placeholder="光貿提供的 APP Key"
              />
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>請至 <a href="https://invoice.amego.tw" target="_blank" rel="noopener noreferrer" className="text-primary underline">光貿電子發票平台</a> 申請帳號並取得 API 金鑰。</p>
          </div>
        </CardContent>
      </Card>

      {/* ─── LINE 整合 ─── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">LINE 整合</CardTitle>
                <CardDescription>LINE Login 登入 + LINE Messaging API 推播通知</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={lineLoginEnabled ? "default" : "secondary"}>
                {lineLoginEnabled ? "已啟用" : "未啟用"}
              </Badge>
              <Switch checked={lineLoginEnabled} onCheckedChange={setLineLoginEnabled} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LINE Login */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">LINE Login（一鍵登入）</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channel ID</Label>
                <Input
                  value={lineChannelId}
                  onChange={e => setLineChannelId(e.target.value)}
                  placeholder="LINE Login Channel ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel Secret</Label>
                <SecretInput
                  value={lineChannelSecret}
                  onChange={setLineChannelSecret}
                  placeholder="LINE Login Channel Secret"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* LINE Messaging API */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">LINE Messaging API（推播通知）</h3>
            <div className="space-y-2">
              <Label>Channel Access Token</Label>
              <SecretInput
                value={lineMessagingToken}
                onChange={setLineMessagingToken}
                placeholder="LINE Messaging API Channel Access Token (長效)"
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p>1. 前往 <a href="https://developers.line.biz/console/" target="_blank" rel="noopener noreferrer" className="text-primary underline">LINE Developers Console</a> 建立 Provider 與 Channel。</p>
            <p>2. LINE Login Channel：啟用 <strong>Email address permission</strong>，Callback URL 設為 <code className="bg-muted px-1 py-0.5 rounded">{`{您的網站網址}/api/line/callback`}</code></p>
            <p>3. LINE Messaging API Channel：在 Messaging API 設定中產生 <strong>Channel Access Token (long-lived)</strong>。</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateBatch.isPending} size="lg" className="min-w-[140px]">
          {updateBatch.isPending ? "儲存中..." : "儲存所有設定"}
        </Button>
      </div>
    </div>
  );
}
