import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.order.all.useQuery({ page, limit: 20, status: statusFilter });

  const confirmPayment = trpc.order.confirmPayment.useMutation({
    onSuccess: () => { utils.order.all.invalidate(); toast.success("付款已確認，課程已開通"); },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">訂單管理</h1>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>訂單編號</TableHead>
                <TableHead>用戶 ID</TableHead>
                <TableHead>課程 ID</TableHead>
                <TableHead>金額</TableHead>
                <TableHead>付款方式</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>優惠券</TableHead>
                <TableHead>建立時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">尚無訂單</TableCell></TableRow>
              ) : (
                data?.items.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                    <TableCell>{order.userId}</TableCell>
                    <TableCell>{order.courseId}</TableCell>
                    <TableCell>NT$ {order.amount}</TableCell>
                    <TableCell>{methodMap[order.paymentMethod] ?? order.paymentMethod}</TableCell>
                    <TableCell><Badge variant={statusMap[order.paymentStatus]?.variant}>{statusMap[order.paymentStatus]?.label}</Badge></TableCell>
                    <TableCell>{order.couponCode ?? "-"}</TableCell>
                    <TableCell className="text-xs">{new Date(order.createdAt).toLocaleString("zh-TW")}</TableCell>
                    <TableCell className="text-right">
                      {order.paymentStatus === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => { if (confirm("確認此訂單已付款？將自動開通課程。")) confirmPayment.mutate({ orderNo: order.orderNo }); }}>
                          <CheckCircle className="h-4 w-4 mr-1" />確認付款
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
          <span className="text-sm text-muted-foreground self-center">第 {page} 頁</span>
          <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>下一頁</Button>
        </div>
      )}
    </div>
  );
}
