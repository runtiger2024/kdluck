import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, Building, Shield, FileText } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminPayment() {
  const { data: config, isLoading } = trpc.siteConfig.get.useQuery();
  const updateBatch = trpc.siteConfig.updateBatch.useMutation();
  const utils = trpc.useUtils();

  const [ecpayEnabled, setEcpayEnabled] = useState(false);
  const [bankEnabled, setBankEnabled] = useState(false);
  const [invoiceEnabled, setInvoiceEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  useEffect(() => {
    if (config) {
      setEcpayEnabled(config.ecpay_enabled === "true");
      setBankEnabled(config.bank_transfer_enabled === "true");
      setInvoiceEnabled(config.invoice_enabled === "true");
      setBankName(config.bank_name || "");
      setBankCode(config.bank_code || "");
      setBankAccount(config.bank_account || "");
      setBankHolder(config.bank_holder || "");
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateBatch.mutateAsync([
        { key: "ecpay_enabled", value: ecpayEnabled ? "true" : "false" },
        { key: "bank_transfer_enabled", value: bankEnabled ? "true" : "false" },
        { key: "invoice_enabled", value: invoiceEnabled ? "true" : "false" },
        { key: "bank_name", value: bankName },
        { key: "bank_code", value: bankCode },
        { key: "bank_account", value: bankAccount },
        { key: "bank_holder", value: bankHolder },
      ]);
      utils.siteConfig.get.invalidate();
      toast.success("支付設定已儲存");
    } catch {
      toast.error("儲存失敗");
    }
  };

  if (isLoading) return <div className="animate-pulse text-muted-foreground p-8">載入中...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">支付設定</h1>
        <p className="text-muted-foreground mt-1">管理平台的支付方式與金流 API 設定</p>
      </div>

      {/* 綠界 ECPay */}
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
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">設定說明</p>
            <p>綠界 API 金鑰需在專案的 <strong>Settings → Secrets</strong> 中設定以下環境變數：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ECPAY_MERCHANT_ID</code> — 特店編號</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ECPAY_HASH_KEY</code> — HashKey</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ECPAY_HASH_IV</code> — HashIV</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">ECPAY_IS_PRODUCTION</code> — 設為 <code>true</code> 啟用正式環境</li>
            </ul>
            <p className="mt-2">測試環境 MerchantID: <code className="text-xs bg-muted px-1 py-0.5 rounded">3002607</code></p>
          </div>
        </CardContent>
      </Card>

      {/* 銀行轉帳 */}
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
          <div className="grid grid-cols-2 gap-4">
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

      {/* 光貿電子發票 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-lg">光貿電子發票</CardTitle>
                <CardDescription>自動開立電子發票</CardDescription>
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
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">設定說明</p>
            <p>光貿發票 API 金鑰需在專案的 <strong>Settings → Secrets</strong> 中設定以下環境變數：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">AMEGO_INVOICE_NUMBER</code> — 發票字軌號碼</li>
              <li><code className="text-xs bg-muted px-1 py-0.5 rounded">AMEGO_APP_KEY</code> — APP Key</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateBatch.isPending} className="min-w-[120px]">
          {updateBatch.isPending ? "儲存中..." : "儲存設定"}
        </Button>
      </div>
    </div>
  );
}
