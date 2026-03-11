import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard, BookOpen, ShoppingCart, Users, Ticket, Settings, LogOut,
  ArrowLeft, CreditCard, FileText, Star, GraduationCap, FolderOpen, MessageSquare, Megaphone, Bell, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

const menuGroups = [
  {
    label: "總覽",
    items: [
      { icon: LayoutDashboard, label: "數據中心", path: "/admin" },
    ],
  },
  {
    label: "內容管理",
    items: [
      { icon: BookOpen, label: "課程管理", path: "/admin/courses" },
      { icon: FolderOpen, label: "分類管理", path: "/admin/categories" },
      { icon: GraduationCap, label: "講師管理", path: "/admin/instructors" },
      { icon: Star, label: "評價管理", path: "/admin/reviews" },
    ],
  },
  {
    label: "交易管理",
    items: [
      { icon: ShoppingCart, label: "訂單管理", path: "/admin/orders", badgeKey: "pendingReview" as const },
      { icon: CreditCard, label: "支付設定", path: "/admin/payment" },
      { icon: FileText, label: "發票管理", path: "/admin/invoices" },
      { icon: Ticket, label: "優惠券", path: "/admin/coupons" },
    ],
  },
  {
    label: "用戶與通知",
    items: [
      { icon: Users, label: "用戶管理", path: "/admin/users" },
      { icon: Bell, label: "通知推送", path: "/admin/notifications" },
      { icon: MessageSquare, label: "LINE 推播", path: "/admin/line-push" },
    ],
  },
  {
    label: "系統",
    items: [
      { icon: Megaphone, label: "公告管理", path: "/admin/announcements" },
      { icon: Settings, label: "系統設定", path: "/admin/settings" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 路由變更時自動關閉手機端選單
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // 查詢待審核憑證數量（每 30 秒自動刷新）
  const { data: pendingData } = trpc.order.pendingReviewCount.useQuery(undefined, {
    refetchInterval: 30_000,
    enabled: !!user && user.role === "admin",
  });
  const pendingReviewCount = pendingData?.count ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">請先登入</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>登入</Button>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">權限不足</h1>
          <p className="text-muted-foreground">您沒有管理員權限</p>
          <Button variant="outline" onClick={() => setLocation("/")}>返回首頁</Button>
        </div>
      </div>
    );
  }

  const getBadgeCount = (badgeKey?: string): number => {
    if (badgeKey === "pendingReview") return pendingReviewCount;
    return 0;
  };

  // 側邊欄導航內容（桌面和手機共用）
  const SidebarNav = () => (
    <>
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-4">
          {menuGroups.map(group => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = location === item.path || (item.path !== "/admin" && location.startsWith(item.path));
                  const badgeCount = getBadgeCount((item as any).badgeKey);
                  return (
                    <button
                      key={item.path}
                      onClick={() => setLocation(item.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[11px] font-bold text-white bg-red-500 rounded-full">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setLocation("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回前台
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className="text-xs">{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
              </Avatar>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium truncate">{user.name ?? "管理員"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email ?? ""}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 border-b border-border bg-sidebar">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border flex flex-col">
              <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gradient-orange">KDLuck</span>
                  <span className="text-xs text-muted-foreground">管理後台</span>
                </div>
              </div>
              <SidebarNav />
            </SheetContent>
          </Sheet>
          <span className="text-base font-bold text-gradient-orange">KDLuck</span>
          <span className="text-xs text-muted-foreground">管理後台</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingReviewCount > 0 && (
            <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0" onClick={() => setLocation("/admin/orders")}>
              <ShoppingCart className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                {pendingReviewCount > 99 ? "99+" : pendingReviewCount}
              </span>
            </Button>
          )}
          <Avatar className="h-8 w-8 border" onClick={() => setMobileOpen(true)}>
            <AvatarFallback className="text-xs">{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-sidebar flex-col shrink-0 sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <span className="text-lg font-bold text-gradient-orange">KDLuck</span>
          <span className="text-xs text-muted-foreground ml-2">管理後台</span>
        </div>
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
