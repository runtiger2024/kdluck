import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart } from "lucide-react";

export default function MemberOrders() {
  const { data, isLoading } = trpc.order.myOrders.useQuery({});

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待付款", variant: "outline" },
    paid: { label: "已付款", variant: "default" },
    failed: { label: "失敗", variant: "destructive" },
    refunded: { label: "已退款", variant: "secondary" },
  };

  const methodMap: Record<string, string> = {
    stripe: "Stripe", ecpay: "綠界", bank_transfer: "銀行轉帳", free: "免費",
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
                  <TableHead>日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">{order.orderNo}</TableCell>
                    <TableCell>NT$ {order.amount}</TableCell>
                    <TableCell>{methodMap[order.paymentMethod] ?? order.paymentMethod}</TableCell>
                    <TableCell><Badge variant={statusMap[order.paymentStatus]?.variant}>{statusMap[order.paymentStatus]?.label}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(order.createdAt).toLocaleString("zh-TW")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
