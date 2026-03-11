import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, BookOpen, ShoppingCart, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.analytics.stats.useQuery();
  const { data: monthlySales } = trpc.analytics.monthlySales.useQuery();
  const { data: userGrowth } = trpc.analytics.userGrowth.useQuery();

  const statCards = [
    { title: "總營收", value: stats ? `NT$ ${Number(stats.totalRevenue).toLocaleString()}` : "-", icon: DollarSign, color: "text-primary" },
    { title: "總訂單", value: stats?.totalOrders ?? "-", icon: ShoppingCart, color: "text-accent" },
    { title: "已付款訂單", value: stats?.paidOrders ?? "-", icon: TrendingUp, color: "text-green-400" },
    { title: "總用戶", value: stats?.totalUsers ?? "-", icon: Users, color: "text-blue-400" },
    { title: "總課程", value: stats?.totalCourses ?? "-", icon: BookOpen, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">數據中心</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">月度銷售額</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlySales && monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[...monthlySales].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 195)" />
                  <XAxis dataKey="month" stroke="oklch(0.65 0.015 195)" fontSize={12} />
                  <YAxis stroke="oklch(0.65 0.015 195)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.17 0.02 195)", border: "1px solid oklch(0.28 0.02 195)", borderRadius: "8px", color: "oklch(0.93 0.005 90)" }}
                  />
                  <Bar dataKey="revenue" fill="oklch(0.72 0.17 55)" radius={[4, 4, 0, 0]} name="營收" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">尚無銷售數據</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">用戶增長趨勢</CardTitle>
          </CardHeader>
          <CardContent>
            {userGrowth && userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[...userGrowth].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.02 195)" />
                  <XAxis dataKey="month" stroke="oklch(0.65 0.015 195)" fontSize={12} />
                  <YAxis stroke="oklch(0.65 0.015 195)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "oklch(0.17 0.02 195)", border: "1px solid oklch(0.28 0.02 195)", borderRadius: "8px", color: "oklch(0.93 0.005 90)" }}
                  />
                  <Line type="monotone" dataKey="userCount" stroke="oklch(0.55 0.12 195)" strokeWidth={2} dot={{ fill: "oklch(0.55 0.12 195)" }} name="新增用戶" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">尚無用戶數據</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
