import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Plus, Ban } from "lucide-react";
import { useState } from "react";

export default function AdminInvoices() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [issueForm, setIssueForm] = useState({
    orderNo: "", orderId: 0, itemName: "", amount: 0,
    buyerIdentifier: "", buyerName: "", buyerEmail: "",
    carrierType: "", carrierId: "", npoban: "",
  });

  const { data, isLoading } = trpc.invoice.all.useQuery({ page, limit: 20, status: statusFilter });
  const issueMutation = trpc.invoice.issue.useMutation();
  const voidMutation = trpc.invoice.void.useMutation();
  const utils = trpc.useUtils();

  const handleIssue = async () => {
    try {
      const result = await issueMutation.mutateAsync({
        orderId: issueForm.orderId,
        orderNo: issueForm.orderNo,
        buyerIdentifier: issueForm.buyerIdentifier || undefined,
        buyerName: issueForm.buyerName || undefined,
        buyerEmail: issueForm.buyerEmail || undefined,
        carrierType: issueForm.carrierType || undefined,
        carrierId: issueForm.carrierId || undefined,
        npoban: issueForm.npoban || undefined,
        itemName: issueForm.itemName,
        amount: issueForm.amount,
      });
      if (result.success) {
        toast.success(`發票開立成功：${result.invoiceNumber}`);
        setIssueDialogOpen(false);
        utils.invoice.all.invalidate();
      } else {
        toast.error(`開立失敗：${result.error}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleVoid = async () => {
    if (!selectedInvoice) return;
    try {
      const result = await voidMutation.mutateAsync({
        id: selectedInvoice.id,
        invoiceNumber: selectedInvoice.invoiceNumber,
        invoiceDate: selectedInvoice.invoiceDate,
        reason: "管理員作廢",
      });
      if (result.success) {
        toast.success("發票已作廢");
        setVoidDialogOpen(false);
        utils.invoice.all.invalidate();
      } else {
        toast.error(`作廢失敗：${result.error}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "待開立", variant: "secondary" },
      issued: { label: "已開立", variant: "default" },
      voided: { label: "已作廢", variant: "destructive" },
      failed: { label: "失敗", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">發票管理</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">光貿電子發票開立與管理</p>
        </div>
        <Button size="sm" className="sm:size-default" onClick={() => setIssueDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1 sm:mr-2" />開立
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />發票列表</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="pending">待開立</SelectItem>
                <SelectItem value="issued">已開立</SelectItem>
                <SelectItem value="voided">已作廢</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : !data?.items.length ? (
            <div className="text-center py-8 text-muted-foreground">尚無發票記錄</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>訂單編號</TableHead>
                      <TableHead>發票號碼</TableHead>
                      <TableHead>買方</TableHead>
                      <TableHead>金額</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.orderNo}</TableCell>
                        <TableCell className="font-mono">{inv.invoiceNumber || "-"}</TableCell>
                        <TableCell>{inv.buyerName}</TableCell>
                        <TableCell>${inv.totalAmount}</TableCell>
                        <TableCell>{statusBadge(inv.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("zh-TW")}</TableCell>
                        <TableCell>
                          {inv.status === "issued" && (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setSelectedInvoice(inv); setVoidDialogOpen(true); }}><Ban className="h-3 w-3 mr-1" />作廢</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {data.items.map((inv: any) => (
                  <div key={inv.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-muted-foreground">{inv.orderNo}</p>
                        <p className="text-sm font-medium mt-0.5">{inv.invoiceNumber || "待開立"}</p>
                      </div>
                      {statusBadge(inv.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{inv.buyerName}</span>
                      <span className="font-medium">${inv.totalAmount}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString("zh-TW")}</span>
                      {inv.status === "issued" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => { setSelectedInvoice(inv); setVoidDialogOpen(true); }}><Ban className="h-3 w-3 mr-1" />作廢</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {data.total > 20 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
                  <span className="text-sm text-muted-foreground py-2">第 {page} 頁</span>
                  <Button variant="outline" size="sm" disabled={data.items.length < 20} onClick={() => setPage(p => p + 1)}>下一頁</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 開立發票 Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>手動開立發票</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>訂單編號</Label>
                <Input value={issueForm.orderNo} onChange={e => setIssueForm(f => ({ ...f, orderNo: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>訂單 ID</Label>
                <Input type="number" value={issueForm.orderId || ""} onChange={e => setIssueForm(f => ({ ...f, orderId: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>品名</Label>
                <Input value={issueForm.itemName} onChange={e => setIssueForm(f => ({ ...f, itemName: e.target.value }))} placeholder="線上課程" />
              </div>
              <div className="space-y-2">
                <Label>金額</Label>
                <Input type="number" value={issueForm.amount || ""} onChange={e => setIssueForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>買方統編</Label>
                <Input value={issueForm.buyerIdentifier} onChange={e => setIssueForm(f => ({ ...f, buyerIdentifier: e.target.value }))} placeholder="個人免填" />
              </div>
              <div className="space-y-2">
                <Label>買方名稱</Label>
                <Input value={issueForm.buyerName} onChange={e => setIssueForm(f => ({ ...f, buyerName: e.target.value }))} placeholder="消費者" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>買方 Email</Label>
              <Input value={issueForm.buyerEmail} onChange={e => setIssueForm(f => ({ ...f, buyerEmail: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label>載具類別</Label>
                <Select value={issueForm.carrierType} onValueChange={v => setIssueForm(f => ({ ...f, carrierType: v }))}>
                  <SelectTrigger><SelectValue placeholder="選擇載具" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">無</SelectItem>
                    <SelectItem value="3J0002">手機條碼</SelectItem>
                    <SelectItem value="CQ0001">自然人憑證</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>載具號碼</Label>
                <Input value={issueForm.carrierId} onChange={e => setIssueForm(f => ({ ...f, carrierId: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>捐贈碼</Label>
              <Input value={issueForm.npoban} onChange={e => setIssueForm(f => ({ ...f, npoban: e.target.value }))} placeholder="選填" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>取消</Button>
            <Button onClick={handleIssue} disabled={issueMutation.isPending}>
              {issueMutation.isPending ? "開立中..." : "開立發票"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 作廢確認 Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>確認作廢發票</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            確定要作廢發票 <strong>{selectedInvoice?.invoiceNumber}</strong> 嗎？此操作無法復原。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={voidMutation.isPending}>
              {voidMutation.isPending ? "作廢中..." : "確認作廢"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
