import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Eye, Image, Clock, AlertTriangle, Download, ListChecks } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

// CSV 匯出工具
function exportToCSV(data: any[], filename: string) {
  if (!data.length) { toast.error("沒有可匯出的資料"); return; }
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const v = row[h];
      if (v == null) return "";
      const s = v instanceof Date ? v.toLocaleString("zh-TW") : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")
  );
  const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

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

  // 批量審核狀態
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [batchDialog, setBatchDialog] = useState<{ open: boolean; action: "approve" | "reject" | null }>({ open: false, action: null });
  const [batchNote, setBatchNote] = useState("");

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.order.all.useQuery({ page, limit: 20, status: statusFilter });
  const { data: pendingReviews } = trpc.order.pendingReviews.useQuery({});
  const { data: exportData, refetch: refetchExport } = trpc.order.exportOrders.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter },
    { enabled: false }
  );

  const confirmPayment = trpc.order.confirmPayment.useMutation({
    onSuccess: () => { utils.order.all.invalidate(); utils.order.pendingReviews.invalidate(); utils.order.pendingReviewCount.invalidate(); toast.success("付款已確認，課程已開通"); },
    onError: (e) => toast.error(e.message),
  });

  const reviewProof = trpc.order.reviewProof.useMutation({
    onSuccess: (_, vars) => {
      utils.order.all.invalidate();
      utils.order.pendingReviews.invalidate();
      utils.order.pendingReviewCount.invalidate();
      toast.success(vars.approved ? "憑證已通過，課程已開通" : "憑證已駁回");
      setReviewDialog({ open: false, order: null, action: null });
      setReviewNote("");
    },
    onError: (e) => toast.error(e.message),
  });

  const batchReview = trpc.order.batchReview.useMutation({
    onSuccess: (result) => {
      utils.order.all.invalidate();
      utils.order.pendingReviews.invalidate();
      utils.order.pendingReviewCount.invalidate();
      setSelectedOrders(new Set());
      setBatchDialog({ open: false, action: null });
      setBatchNote("");
      toast.success(`批量審核完成：${result.success} 筆成功${result.failed > 0 ? `，${result.failed} 筆失敗` : ""}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleExport = useCallback(async () => {
    const result = await refetchExport();
    if (result.data && result.data.length > 0) {
      const rows = result.data.map((o: any) => ({
        訂單編號: o.orderNo,
        用戶ID: o.userId,
        課程ID: o.courseId,
        金額: o.amount,
        付款方式: o.paymentMethod,
        付款狀態: o.paymentStatus,
        審核狀態: o.reviewStatus ?? "",
        建立時間: o.createdAt ? new Date(o.createdAt).toLocaleString("zh-TW") : "",
        付款時間: o.paidAt ? new Date(o.paidAt).toLocaleString("zh-TW") : "",
      }));
      exportToCSV(rows, `訂單匯出_${new Date().toLocaleDateString("zh-TW").replace(/\//g, "-")}.csv`);
    } else {
      toast.error("沒有可匯出的資料");
    }
  }, [refetchExport]);

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
    return null;
  };

  const pendingList = pendingReviews?.items ?? [];
  const allPendingSelected = pendingList.length > 0 && pendingList.every((o: any) => selectedOrders.has(o.orderNo));
  const somePendingSelected = selectedOrders.size > 0;

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(pendingList.map((o: any) => o.orderNo)));
    }
  };

  const toggleSelect = (orderNo: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderNo)) next.delete(orderNo);
      else next.add(orderNo);
      return next;
    });
  };

  // 手機端卡片式訂單項目
  const OrderCard = ({ order, showReviewActions, showCheckbox }: { order: any; showReviewActions: boolean; showCheckbox?: boolean }) => (
    <div className="p-4 border-b border-border last:border-b-0 space-y-3">
      <div className="flex items-start gap-3">
        {showCheckbox && order.reviewStatus === "pending_review" && (
          <Checkbox
            checked={selectedOrders.has(order.orderNo)}
            onCheckedChange={() => toggleSelect(order.orderNo)}
            className="mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-mono text-xs text-muted-foreground truncate">{order.orderNo}</p>
              <p className="text-sm font-medium mt-0.5">NT$ {order.amount}</p>
            </div>
            <Badge variant={statusMap[order.paymentStatus]?.variant} className="shrink-0">
              {statusMap[order.paymentStatus]?.label}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
            <span>用戶 ID: {order.userId}</span>
            <span>課程 ID: {order.courseId}</span>
            <span>{methodMap[order.paymentMethod] ?? order.paymentMethod}</span>
            <span>{new Date(order.createdAt).toLocaleDateString("zh-TW")}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              {order.paymentProofUrl ? (
                <>
                  {reviewStatusBadge(order.reviewStatus)}
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setProofDialog({ open: true, order })}>
                    <Eye className="h-3.5 w-3.5 mr-1" />查看
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">無憑證</span>
              )}
            </div>
            <div className="flex gap-1.5">
              {showReviewActions && order.reviewStatus === "pending_review" && (
                <>
                  <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-xs px-2" onClick={() => setReviewDialog({ open: true, order, action: "approve" })}>
                    <CheckCircle className="h-3 w-3 mr-1" />通過
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => setReviewDialog({ open: true, order, action: "reject" })}>
                    <XCircle className="h-3 w-3 mr-1" />駁回
                  </Button>
                </>
              )}
              {order.paymentStatus === "pending" && !order.paymentProofUrl && order.paymentMethod === "bank_transfer" && (
                <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => { if (confirm("確認此訂單已付款？")) confirmPayment.mutate({ orderNo: order.orderNo }); }}>
                  <CheckCircle className="h-3 w-3 mr-1" />手動確認
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 桌面端表格（待審核頁籤，含 checkbox）
  const renderPendingTable = (orders: any[] | undefined) => (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allPendingSelected}
                onCheckedChange={toggleSelectAll}
                aria-label="全選"
              />
            </TableHead>
            <TableHead>訂單編號</TableHead>
            <TableHead>用戶 ID</TableHead>
            <TableHead>課程 ID</TableHead>
            <TableHead>金額</TableHead>
            <TableHead>付款方式</TableHead>
            <TableHead>上傳時間</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!orders || orders.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">尚無待審核訂單</TableCell></TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className={selectedOrders.has(order.orderNo) ? "bg-muted/30" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.has(order.orderNo)}
                    onCheckedChange={() => toggleSelect(order.orderNo)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                <TableCell>{order.userId}</TableCell>
                <TableCell>{order.courseId}</TableCell>
                <TableCell>NT$ {order.amount}</TableCell>
                <TableCell>{methodMap[order.paymentMethod] ?? order.paymentMethod}</TableCell>
                <TableCell className="text-xs">
                  {order.proofUploadedAt ? new Date(order.proofUploadedAt).toLocaleString("zh-TW") : "-"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {order.paymentProofUrl && (
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setProofDialog({ open: true, order })}>
                      <Eye className="h-3.5 w-3.5 mr-1" />查看
                    </Button>
                  )}
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setReviewDialog({ open: true, order, action: "approve" })}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />通過
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setReviewDialog({ open: true, order, action: "reject" })}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />駁回
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // 桌面端表格（全部訂單）
  const renderDesktopTable = (orders: any[] | undefined, loading: boolean) => (
    <div className="hidden md:block">
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
                  {order.paymentStatus === "pending" && !order.paymentProofUrl && order.paymentMethod === "bank_transfer" && (
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("確認此訂單已付款？")) confirmPayment.mutate({ orderNo: order.orderNo }); }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />手動確認
                    </Button>
                  )}
                  {order.paymentStatus === "pending" && order.paymentMethod !== "bank_transfer" && (
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("確認此訂單已付款？")) confirmPayment.mutate({ orderNo: order.orderNo }); }}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />確認付款
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // 手機端卡片列表
  const renderMobileCards = (orders: any[] | undefined, loading: boolean, showReviewActions: boolean, showCheckbox?: boolean) => (
    <div className="md:hidden">
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">載入中...</div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">尚無訂單</div>
      ) : (
        orders.map((order) => <OrderCard key={order.id} order={order} showReviewActions={showReviewActions} showCheckbox={showCheckbox} />)
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">訂單管理</h1>
        <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">匯出 CSV</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedOrders(new Set()); }}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">全部訂單</TabsTrigger>
          <TabsTrigger value="pending_review" className="flex-1 sm:flex-none relative">
            待審核憑證
            {pendingReviews && pendingReviews.total > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {pendingReviews.total}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 sm:w-40"><SelectValue /></SelectTrigger>
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
              {renderDesktopTable(data?.items, isLoading)}
              {renderMobileCards(data?.items, isLoading, false)}
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm flex items-center gap-2 flex-1">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>共有 <strong>{pendingReviews.total}</strong> 筆待審核</span>
                </div>
                {somePendingSelected && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground">已選 {selectedOrders.size} 筆</span>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setBatchDialog({ open: true, action: "approve" })}>
                      <ListChecks className="h-4 w-4 mr-1" />批量通過
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setBatchDialog({ open: true, action: "reject" })}>
                      <XCircle className="h-4 w-4 mr-1" />批量駁回
                    </Button>
                  </div>
                )}
              </div>
              {/* 手機端全選 */}
              <div className="md:hidden flex items-center gap-2 px-1">
                <Checkbox
                  checked={allPendingSelected}
                  onCheckedChange={toggleSelectAll}
                  id="select-all-mobile"
                />
                <label htmlFor="select-all-mobile" className="text-sm cursor-pointer">全選</label>
              </div>
              <Card className="bg-card border-border">
                <CardContent className="p-0">
                  {renderPendingTable(pendingReviews.items)}
                  {renderMobileCards(pendingReviews.items, false, true, true)}
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
        <DialogContent className="bg-card max-w-lg w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Image className="h-5 w-5" />付款憑證</DialogTitle></DialogHeader>
          {proofDialog.order && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-hidden">
                <img src={proofDialog.order.paymentProofUrl} alt="付款憑證" className="w-full max-h-72 sm:max-h-96 object-contain bg-secondary/20" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">訂單編號</span><span className="font-mono text-xs">{proofDialog.order.orderNo}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">金額</span><span className="font-semibold">NT$ {proofDialog.order.amount}</span></div>
                {proofDialog.order.paymentNote && <div className="flex justify-between"><span className="text-muted-foreground">用戶備註</span><span>{proofDialog.order.paymentNote}</span></div>}
                {proofDialog.order.proofUploadedAt && <div className="flex justify-between"><span className="text-muted-foreground">上傳時間</span><span className="text-xs">{new Date(proofDialog.order.proofUploadedAt).toLocaleString("zh-TW")}</span></div>}
                <div className="flex justify-between items-center"><span className="text-muted-foreground">審核狀態</span>{reviewStatusBadge(proofDialog.order.reviewStatus)}</div>
                {proofDialog.order.reviewNote && <div className="flex justify-between"><span className="text-muted-foreground">審核備註</span><span>{proofDialog.order.reviewNote}</span></div>}
              </div>
              {proofDialog.order.reviewStatus === "pending_review" && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setProofDialog({ open: false, order: null }); setReviewDialog({ open: true, order: proofDialog.order, action: "approve" }); }}>
                    <CheckCircle className="h-4 w-4 mr-1" />通過
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { setProofDialog({ open: false, order: null }); setReviewDialog({ open: true, order: proofDialog.order, action: "reject" }); }}>
                    <XCircle className="h-4 w-4 mr-1" />駁回
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 單筆審核確認對話框 */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => { if (!open) { setReviewDialog({ open: false, order: null, action: null }); setReviewNote(""); } }}>
        <DialogContent className="bg-card w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle>{reviewDialog.action === "approve" ? "確認通過付款憑證" : "駁回付款憑證"}</DialogTitle>
          </DialogHeader>
          {reviewDialog.order && (
            <div className="space-y-4">
              <div className="bg-secondary/20 rounded-lg p-3 text-sm space-y-1">
                <p>訂單：<span className="font-mono text-xs">{reviewDialog.order.orderNo}</span></p>
                <p>金額：<span className="font-semibold">NT$ {reviewDialog.order.amount}</span></p>
                {reviewDialog.order.paymentNote && <p>用戶備註：{reviewDialog.order.paymentNote}</p>}
              </div>
              {reviewDialog.action === "approve" ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-sm">
                  <p className="flex items-center gap-1.5 text-green-500"><CheckCircle className="h-4 w-4" />通過後將自動確認付款並開通課程</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>駁回原因（將通知用戶）</Label>
                  <Textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="例如：憑證模糊無法辨識、金額不符等" rows={3} />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setReviewDialog({ open: false, order: null, action: null }); setReviewNote(""); }}>取消</Button>
            <Button
              variant={reviewDialog.action === "approve" ? "default" : "destructive"}
              className={`w-full sm:w-auto ${reviewDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}`}
              disabled={reviewProof.isPending}
              onClick={() => {
                if (!reviewDialog.order) return;
                reviewProof.mutate({ orderNo: reviewDialog.order.orderNo, approved: reviewDialog.action === "approve", reviewNote: reviewNote || undefined });
              }}
            >
              {reviewProof.isPending ? "處理中..." : reviewDialog.action === "approve" ? "確認通過" : "確認駁回"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量審核確認對話框 */}
      <Dialog open={batchDialog.open} onOpenChange={(open) => { if (!open) { setBatchDialog({ open: false, action: null }); setBatchNote(""); } }}>
        <DialogContent className="bg-card w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              批量{batchDialog.action === "approve" ? "通過" : "駁回"} {selectedOrders.size} 筆憑證
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary/20 rounded-lg p-3 text-sm">
              <p>即將{batchDialog.action === "approve" ? "通過" : "駁回"} <strong>{selectedOrders.size}</strong> 筆待審核憑證</p>
              {batchDialog.action === "approve" && (
                <p className="text-muted-foreground mt-1">通過後將自動開通對應課程</p>
              )}
            </div>
            {batchDialog.action === "reject" && (
              <div className="space-y-2">
                <Label>駁回原因（將通知所有被駁回的用戶）</Label>
                <Textarea value={batchNote} onChange={e => setBatchNote(e.target.value)} placeholder="例如：憑證模糊無法辨識、金額不符等" rows={3} />
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setBatchDialog({ open: false, action: null }); setBatchNote(""); }}>取消</Button>
            <Button
              variant={batchDialog.action === "approve" ? "default" : "destructive"}
              className={`w-full sm:w-auto ${batchDialog.action === "approve" ? "bg-green-600 hover:bg-green-700" : ""}`}
              disabled={batchReview.isPending}
              onClick={() => {
                batchReview.mutate({
                  orderNos: Array.from(selectedOrders),
                  approved: batchDialog.action === "approve",
                  reviewNote: batchNote || undefined,
                });
              }}
            >
              {batchReview.isPending ? "處理中..." : `確認批量${batchDialog.action === "approve" ? "通過" : "駁回"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
