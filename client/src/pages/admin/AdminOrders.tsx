import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Image, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    order: any | null;
    action: "approve" | "reject" | null;
  }>({ open: false, order: null, action: null });
  const [reviewNote, setReviewNote] = useState("");
  const [proofDialog, setProofDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.order.all.useQuery({ page, limit: 20, status: statusFilter });
  const { data: pendingReviews } = trpc.order.pendingReviews.useQuery({});

  const confirmPayment = trpc.order.confirmPayment.useMutation({
    onSuccess: () => { utils.order.all.invalidate(); utils.order.pendingReviews.invalidate(); toast.success("付款已確認，課程已開通"); },
    onError: (e) => toast.error(e.message),
  });

  const reviewProof = trpc.order.reviewProof.useMutation({
    onSuccess: (_, vars) => {
      utils.order.all.invalidate();
      utils.order.pendingReviews.invalidate();
      toast.success(vars.approved ? "憑證已通過，課程已開通" : "憑證已駁回");
      setReviewDialog({ open: false, order: null, action: null });
      setReviewNote("");
    },
    onError: (e) => toast.error(e.message),
  });

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待付款", variant: "outline" },
    paid: { label: "已付款", variant: "default" },
    failed: { label: "失敗", variant: "destructive" },
    refunded: { label: "已退款", variant: "secondary" },
  };

  const methodMap: Record<string, string> = {
    ecpay: "綠界 ECPay", bank_transfer: "銀行轉帳", free: "免費",
  };

  const reviewStatusBadge = (status: string) => {
    if (status === "pending_review") return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 text-xs"><Clock className="h-3 w-3 mr-1" />待審核</Badge>;
    if (status === "approved") return <Badge variant="default" className="bg-green-500 text-xs">已通過</Badge>;
    if (status === "rejected") return <Badge variant="destructive" className="text-xs">已駁回</Badge>;
    return <span className="text-xs text-muted-foreground">-</span>;
  };

  const renderOrderTable = (orders: any[] | undefined, loading: boolean, showReviewActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>訂單編號</TableHead>
          <TableHead>用戶 ID</TableHead>
          <TableHead>課程 ID</TableHead>
          <TableHead>金額</TableHead>
          <TableHead>付款方式</TableHead>
          <TableHead>狀態</TableHead>
          <TableHead>憑證</TableHead>
          <TableHead>建立時間</TableHead>
          <TableHead className="text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
        ) : !orders || orders.length === 0 ? (
          <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">尚無訂單</TableCell></TableRow>
        ) : (
          orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
              <TableCell>{order.userId}</TableCell>
              <TableCell>{order.courseId}</TableCell>
              <TableCell>NT$ {order.amount}</TableCell>
              <TableCell>{methodMap[order.paymentMethod] ?? order.paymentMethod}</TableCell>
              <TableCell><Badge variant={statusMap[order.paymentStatus]?.variant}>{statusMap[order.paymentStatus]?.label}</Badge></TableCell>
              <TableCell>
                {order.paymentProofUrl ? (
                  <div className="flex items-center gap-1.5">
                    {reviewStatusBadge(order.reviewStatus)}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setProofDialog({ open: true, order })}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-xs">{new Date(order.createdAt).toLocaleString("zh-TW")}</TableCell>
              <TableCell className="text-right space-x-1">
                {showReviewActions && order.reviewStatus === "pending_review" && (
                  <>
                    <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => {
                      setReviewDialog({ open: true, order, action: "approve" });
                    }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />通過
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => {
                      setReviewDialog({ open: true, order, action: "reject" });
                    }}>
                      <XCircle className="h-3.5 w-3.5 mr-1" />駁回
                    </Button>
                  </>
                )}
                {order.paymentStatus === "pending" && !order.paymentProofUrl && order.paymentMethod === "bank_transfer" && (
                  <Button size="sm" variant="outline" onClick={() => { if (confirm("確認此訂單已付款？將自動開通課程。")) confirmPayment.mutate({ orderNo: order.orderNo }); }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />手動確認
                  </Button>
                )}
                {order.paymentStatus === "pending" && order.paymentMethod !== "bank_transfer" && (
                  <Button size="sm" variant="outline" onClick={() => { if (confirm("確認此訂單已付款？將自動開通課程。")) confirmPayment.mutate({ orderNo: order.orderNo }); }}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />確認付款
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">訂單管理</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部訂單</TabsTrigger>
          <TabsTrigger value="pending_review" className="relative">
            待審核憑證
            {pendingReviews && pendingReviews.total > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {pendingReviews.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {renderOrderTable(data?.items, isLoading, true)}
            </CardContent>
          </Card>
          {data && data.total > 20 && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
              <span className="text-sm text-muted-foreground self-center">第 {page} 頁</span>
              <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>下一頁</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending_review" className="space-y-4">
          {pendingReviews && pendingReviews.total > 0 ? (
            <>
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>共有 <strong>{pendingReviews.total}</strong> 筆訂單的付款憑證等待審核</span>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {renderOrderTable(pendingReviews.items, false, true)}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">目前沒有待審核的付款憑證</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 憑證預覽對話框 */}
      <Dialog open={proofDialog.open} onOpenChange={(open) => setProofDialog({ open, order: open ? proofDialog.order : null })}>
        <DialogContent className="bg-card max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Image className="h-5 w-5" />付款憑證</DialogTitle></DialogHeader>
          {proofDialog.order && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <img
                  src={proofDialog.order.paymentProofUrl}
                  alt="付款憑證"
                  className="w-full max-h-96 object-contain bg-secondary/20"
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">訂單編號</span>
                  <span className="font-mono">{proofDialog.order.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">金額</span>
                  <span className="font-semibold">NT$ {proofDialog.order.amount}</span>
                </div>
                {proofDialog.order.paymentNote && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">用戶備註</span>
                    <span>{proofDialog.order.paymentNote}</span>
                  </div>
                )}
                {proofDialog.order.proofUploadedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">上傳時間</span>
                    <span>{new Date(proofDialog.order.proofUploadedAt).toLocaleString("zh-TW")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">審核狀態</span>
                  {reviewStatusBadge(proofDialog.order.reviewStatus)}
                </div>
                {proofDialog.order.reviewNote && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">審核備註</span>
                    <span>{proofDialog.order.reviewNote}</span>
                  </div>
                )}
              </div>
              {proofDialog.order.reviewStatus === "pending_review" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => {
                    setProofDialog({ open: false, order: null });
                    setReviewDialog({ open: true, order: proofDialog.order, action: "approve" });
                  }}>
                    <CheckCircle className="h-4 w-4 mr-1" />通過
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => {
                    setProofDialog({ open: false, order: null });
                    setReviewDialog({ open: true, order: proofDialog.order, action: "reject" });
                  }}>
                    <XCircle className="h-4 w-4 mr-1" />駁回
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 審核確認對話框 */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => {
        if (!open) { setReviewDialog({ open: false, order: null, action: null }); setReviewNote(""); }
      }}>
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === "approve" ? "確認通過付款憑證" : "駁回付款憑證"}
            </DialogTitle>
          </DialogHeader>
          {reviewDialog.order && (
            <div className="space-y-4">
              <div className="bg-secondary/20 rounded-lg p-3 text-sm space-y-1">
                <p>訂單：<span className="font-mono">{reviewDialog.order.orderNo}</span></p>
                <p>金額：<span className="font-semibold">NT$ {reviewDialog.order.amount}</span></p>
                {reviewDialog.order.paymentNote && <p>用戶備註：{reviewDialog.order.paymentNote}</p>}
              </div>
              {reviewDialog.action === "approve" ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm">
                  <p className="flex items-center gap-1.5 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    通過後將自動確認付款並開通課程
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>駁回原因（將通知用戶）</Label>
                  <Textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="例如：憑證模糊無法辨識、金額不符等"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReviewDialog({ open: false, order: null, action: null }); setReviewNote(""); }}>
              取消
            </Button>
            <Button
              variant={reviewDialog.action === "approve" ? "default" : "destructive"}
              className={reviewDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              disabled={reviewProof.isPending}
              onClick={() => {
                if (!reviewDialog.order) return;
                reviewProof.mutate({
                  orderNo: reviewDialog.order.orderNo,
                  approved: reviewDialog.action === "approve",
                  reviewNote: reviewNote || undefined,
                });
              }}
            >
              {reviewProof.isPending ? "處理中..." : reviewDialog.action === "approve" ? "確認通過" : "確認駁回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
