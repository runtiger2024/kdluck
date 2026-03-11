import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock, ArrowLeft, Play, Upload, Building2, Copy, Image, Loader2, AlertCircle } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PaymentResult() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderNo = params.get("orderNo") ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [paymentNote, setPaymentNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: order, isLoading } = trpc.order.getByNo.useQuery(
    { orderNo },
    { enabled: !!orderNo && !!user, refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.paymentStatus === "pending") return 5000;
      return false;
    }}
  );

  const { data: bankInfo } = trpc.siteConfig.getBankInfo.useQuery(undefined, {
    enabled: !!order && order.paymentMethod === "bank_transfer",
  });

  const uploadProof = trpc.order.uploadProof.useMutation();
  const utils = trpc.useUtils();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("請上傳圖片檔案（JPG、PNG 等）");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("檔案大小不能超過 10MB");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !order) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      await uploadProof.mutateAsync({
        orderNo: order.orderNo,
        base64Data: base64,
        contentType: selectedFile.type,
        fileName: selectedFile.name,
        note: paymentNote || undefined,
      });

      toast.success("付款憑證已上傳，等待管理員審核");
      utils.order.getByNo.invalidate({ orderNo });
      setSelectedFile(null);
      setPreviewUrl(null);
      setPaymentNote("");
    } catch (e: any) {
      toast.error(e.message || "上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已複製${label}`);
  };

  const isBankTransfer = order?.paymentMethod === "bank_transfer";
  const isPending = order?.paymentStatus === "pending";
  const hasProof = !!order?.paymentProofUrl;
  const reviewStatus = order?.reviewStatus ?? "none";

  const statusConfig = {
    paid: {
      icon: <CheckCircle className="h-16 w-16 text-green-400" />,
      title: "付款成功！",
      description: "您的課程已自動開通，現在就可以開始學習。",
      color: "text-green-400",
    },
    pending: {
      icon: <Clock className="h-16 w-16 text-yellow-400" />,
      title: isBankTransfer ? "請完成轉帳並上傳憑證" : "等待付款確認",
      description: isBankTransfer
        ? "請依照下方銀行資訊完成轉帳，並上傳付款憑證以加速審核。"
        : "您的訂單已建立，正在等待付款確認。如果您已完成付款，系統將在幾分鐘內自動確認。",
      color: "text-yellow-400",
    },
    failed: {
      icon: <XCircle className="h-16 w-16 text-red-400" />,
      title: "付款失敗",
      description: "很抱歉，您的付款未成功。請重新嘗試或選擇其他付款方式。",
      color: "text-red-400",
    },
    refunded: {
      icon: <XCircle className="h-16 w-16 text-muted-foreground" />,
      title: "已退款",
      description: "此訂單已退款處理。",
      color: "text-muted-foreground",
    },
  };

  const status = order ? statusConfig[order.paymentStatus as keyof typeof statusConfig] : null;

  const reviewBadge = () => {
    if (reviewStatus === "pending_review") return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">審核中</Badge>;
    if (reviewStatus === "approved") return <Badge variant="default" className="bg-green-500">已通過</Badge>;
    if (reviewStatus === "rejected") return <Badge variant="destructive">已駁回</Badge>;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-12">
        {isLoading ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">查詢訂單狀態中...</p>
            </CardContent>
          </Card>
        ) : !order ? (
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center space-y-4">
              <XCircle className="h-16 w-16 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-bold">找不到訂單</h2>
              <p className="text-muted-foreground">請確認訂單編號是否正確，或前往會員中心查看。</p>
              <Button onClick={() => setLocation("/member/orders")}>查看我的訂單</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 訂單狀態 */}
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">{status?.icon}</div>
                <h2 className={`text-2xl font-bold ${status?.color}`}>{status?.title}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">{status?.description}</p>
              </CardContent>
            </Card>

            {/* 訂單資訊 */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-base">訂單資訊</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">訂單編號</span>
                  <span className="font-mono">{order.orderNo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">金額</span>
                  <span className="font-semibold text-primary">NT$ {order.amount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">付款方式</span>
                  <span>
                    {order.paymentMethod === "ecpay" ? "綠界 ECPay" :
                     order.paymentMethod === "bank_transfer" ? "銀行轉帳" :
                     order.paymentMethod === "free" ? "免費" : order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">訂單狀態</span>
                  <Badge variant={order.paymentStatus === "paid" ? "default" : order.paymentStatus === "pending" ? "outline" : "destructive"}>
                    {order.paymentStatus === "paid" ? "已付款" : order.paymentStatus === "pending" ? "待付款" : order.paymentStatus === "failed" ? "失敗" : "已退款"}
                  </Badge>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">付款時間</span>
                    <span>{new Date(order.paidAt).toLocaleString("zh-TW")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 銀行轉帳資訊 */}
            {isBankTransfer && isPending && bankInfo?.enabled && (
              <Card className="bg-card border-border border-primary/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    轉帳資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                    {[
                      { label: "銀行名稱", value: bankInfo.bankName ?? "" },
                      { label: "銀行代碼", value: bankInfo.bankCode ?? "" },
                      { label: "帳號", value: bankInfo.bankAccount ?? "" },
                      { label: "戶名", value: bankInfo.bankHolder ?? "" },
                      { label: "轉帳金額", value: `NT$ ${order.amount}` },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <p className="font-medium font-mono">{item.value}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.value, item.label)}
                          className="shrink-0"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                    <p className="flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                      請務必轉帳正確金額，並於轉帳完成後上傳付款憑證（截圖或照片），以加速審核流程。
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 付款憑證上傳 / 狀態 */}
            {isBankTransfer && (
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    付款憑證
                    {reviewBadge()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 已上傳的憑證 */}
                  {hasProof && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border overflow-hidden">
                        <img
                          src={order.paymentProofUrl!}
                          alt="付款憑證"
                          className="w-full max-h-80 object-contain bg-secondary/20"
                        />
                      </div>
                      {order.paymentNote && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">備註：</span>
                          <span>{order.paymentNote}</span>
                        </div>
                      )}
                      {order.proofUploadedAt && (
                        <p className="text-xs text-muted-foreground">
                          上傳時間：{new Date(order.proofUploadedAt).toLocaleString("zh-TW")}
                        </p>
                      )}
                      {reviewStatus === "rejected" && order.reviewNote && (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                          <p className="text-destructive font-medium mb-1">審核未通過</p>
                          <p className="text-muted-foreground">{order.reviewNote}</p>
                        </div>
                      )}
                      {reviewStatus === "pending_review" && (
                        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-muted-foreground">
                          <p className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            憑證審核中，請耐心等候。審核通過後將自動開通課程。
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 上傳區域（待付款 + 尚未上傳 或 被駁回可重新上傳） */}
                  {isPending && (!hasProof || reviewStatus === "rejected") && (
                    <div className="space-y-4">
                      {hasProof && reviewStatus === "rejected" && (
                        <Separator />
                      )}
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/10 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {previewUrl ? (
                          <div className="space-y-3">
                            <img src={previewUrl} alt="預覽" className="max-h-48 mx-auto rounded-lg" />
                            <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                            <p className="text-xs text-primary">點擊重新選擇</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                            <p className="font-medium">{reviewStatus === "rejected" ? "重新上傳付款憑證" : "上傳付款憑證"}</p>
                            <p className="text-xs text-muted-foreground">支援 JPG、PNG 格式，最大 10MB</p>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>備註（選填）</Label>
                        <Textarea
                          value={paymentNote}
                          onChange={e => setPaymentNote(e.target.value)}
                          placeholder="例如：轉帳帳號後五碼 12345"
                          rows={2}
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                      >
                        {uploading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />上傳中...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-2" />上傳付款憑證</>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* 未上傳且非銀行轉帳待付款 */}
                  {!hasProof && !isPending && (
                    <p className="text-center text-muted-foreground py-4">無付款憑證</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 操作按鈕 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {order.paymentStatus === "paid" && (
                <Button onClick={() => setLocation("/member/courses")} className="glow-orange">
                  <Play className="h-4 w-4 mr-2" />開始學習
                </Button>
              )}
              <Button variant="outline" onClick={() => setLocation("/member/orders")}>
                <ArrowLeft className="h-4 w-4 mr-2" />查看訂單紀錄
              </Button>
              <Button variant="outline" onClick={() => setLocation("/courses")}>
                瀏覽更多課程
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
