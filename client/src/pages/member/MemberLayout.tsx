import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { User, BookOpen, ShoppingCart, Sparkles, Heart, StickyNote, Award, Bell, Shield } from "lucide-react";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const menuItems = [
  { icon: User, label: "個人資料", path: "/member" },
  { icon: BookOpen, label: "我的課程", path: "/member/courses" },
  { icon: ShoppingCart, label: "訂單紀錄", path: "/member/orders" },
  { icon: Heart, label: "願望清單", path: "/member/wishlist" },
  { icon: StickyNote, label: "我的筆記", path: "/member/notes" },
  { icon: Award, label: "我的證書", path: "/member/certificates" },
  { icon: Bell, label: "通知中心", path: "/member/notifications" },
  { icon: Shield, label: "帳號安全", path: "/member/security" },
  { icon: Sparkles, label: "推薦課程", path: "/member/recommend" },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center text-muted-foreground">載入中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center space-y-4">
          <h1 className="text-2xl font-bold">請先登入</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>登入 / 註冊</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container flex-1 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-56 shrink-0">
            <div className="mb-6">
              <Avatar className="h-16 w-16 border-2 border-border mb-3">
                <AvatarImage src={user.avatarUrl ?? undefined} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-bold text-lg">{user.name ?? "用戶"}</h2>
              <p className="text-xs text-muted-foreground">{user.email ?? ""}</p>
            </div>
            <nav className="space-y-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => setLocation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
