import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Upload, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function MemberOrders() {
  const { data, isLoading } = trpc.order.myOrders.useQuery({});
  const [, setLocation] = useLocation();

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待付款", variant: "outline" },
    paid: { label: "已付款", variant: "default" },
    failed: { label: "失敗", variant: "destructive" },
    refunded: { label: "已退款", variant: "secondary" },
  };

  const methodMap: Record<string, string> = {
    ecpay: "綠界 ECPay", bank_transfer: "銀行轉帳", free: "免費",
  };

  const reviewStatusIcon = (reviewStatus: string) => {
    if (reviewStatus === "pending_review") return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 text-xs"><Clock className="h-3 w-3 mr-1" />審核中</Badge>;
    if (reviewStatus === "approved") return <Badge variant="default" className="bg-green-500 text-xs"><CheckCircle className="h-3 w-3 mr-1" />已通過</Badge>;
    if (reviewStatus === "rejected") return <Badge variant="destructive" className="text-xs"><XCircle className="h-3 w-3 mr-1" />已駁回</Badge>;
    return null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">訂單紀錄</h1>

      {isLoading ? (
        <Card className="bg-card border-border animate-pulse"><CardContent className="p-8"><div className="h-32 bg-secondary/50 rounded" /></CardContent></Card>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">尚無訂單紀錄</p>
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>憑證</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map(order => {
                  const isBankPending = order.paymentMethod === "bank_transfer" && order.paymentStatus === "pending";
                  const hasProof = !!(order as any).paymentProofUrl;
                  const reviewStatus = (order as any).reviewStatus ?? "none";
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                      <TableCell>NT$ {order.amount}</TableCell>
                      <TableCell>{methodMap[order.paymentMethod] ?? order.paymentMethod}</TableCell>
                      <TableCell><Badge variant={statusMap[order.paymentStatus]?.variant}>{statusMap[order.paymentStatus]?.label}</Badge></TableCell>
                      <TableCell>
                        {order.paymentMethod === "bank_transfer" ? (
                          hasProof ? reviewStatusIcon(reviewStatus) : (
                            isBankPending ? <span className="text-xs text-muted-foreground">未上傳</span> : <span className="text-xs text-muted-foreground">-</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(order.createdAt).toLocaleString("zh-TW")}</TableCell>
                      <TableCell className="text-right">
                        {isBankPending && !hasProof && (
                          <Button size="sm" variant="outline" onClick={() => setLocation(`/payment/result?orderNo=${order.orderNo}`)}>
                            <Upload className="h-3.5 w-3.5 mr-1" />上傳憑證
                          </Button>
                        )}
                        {isBankPending && hasProof && reviewStatus === "rejected" && (
                          <Button size="sm" variant="outline" onClick={() => setLocation(`/payment/result?orderNo=${order.orderNo}`)}>
                            <Upload className="h-3.5 w-3.5 mr-1" />重新上傳
                          </Button>
                        )}
                        {(hasProof || order.paymentStatus === "paid") && (
                          <Button size="sm" variant="ghost" onClick={() => setLocation(`/payment/result?orderNo=${order.orderNo}`)}>
                            <Eye className="h-3.5 w-3.5 mr-1" />查看
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
