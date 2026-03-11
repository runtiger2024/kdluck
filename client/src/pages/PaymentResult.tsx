import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, ArrowLeft, Play } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PaymentResult() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderNo = params.get("orderNo") ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const { data: order, isLoading } = trpc.order.getByNo.useQuery(
    { orderNo },
    { enabled: !!orderNo && !!user, refetchInterval: (query) => {
      // 如果訂單還在 pending 狀態，每 3 秒輪詢一次
      const data = query.state.data;
      if (data && data.paymentStatus === "pending") return 3000;
      return false;
    }}
  );

  const statusConfig = {
    paid: {
      icon: <CheckCircle className="h-16 w-16 text-green-400" />,
      title: "付款成功！",
      description: "您的課程已自動開通，現在就可以開始學習。",
      color: "text-green-400",
    },
    pending: {
      icon: <Clock className="h-16 w-16 text-yellow-400" />,
      title: "等待付款確認",
      description: "您的訂單已建立，正在等待付款確認。如果您已完成付款，系統將在幾分鐘內自動確認。",
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-lg py-20">
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
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center space-y-6">
              <div className="flex justify-center">{status?.icon}</div>
              <h2 className={`text-2xl font-bold ${status?.color}`}>{status?.title}</h2>
              <p className="text-muted-foreground">{status?.description}</p>

              <div className="bg-secondary/20 rounded-lg p-4 text-sm space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">訂單編號</span>
                  <span className="font-mono">{order.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">金額</span>
                  <span className="font-semibold">NT$ {order.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">付款方式</span>
                  <span>
                    {order.paymentMethod === "ecpay" ? "綠界" :
                     order.paymentMethod === "bank_transfer" ? "銀行轉帳" :
                     order.paymentMethod === "free" ? "免費" : order.paymentMethod}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">付款時間</span>
                    <span>{new Date(order.paidAt).toLocaleString("zh-TW")}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
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
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
