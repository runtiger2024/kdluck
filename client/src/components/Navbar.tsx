import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { BookOpen, User, ShoppingCart, LogOut, Settings, Menu, X, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

function getLineLoginUrl() {
  const origin = window.location.origin;
  const redirectUri = `${origin}/api/line/callback`;
  const state = btoa(JSON.stringify({ origin, returnPath: "/" }));
  return `/api/line/login?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "首頁", path: "/" },
    { label: "課程", path: "/courses" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <button onClick={() => setLocation("/")} className="flex items-center gap-2">
          <span className="text-xl font-black text-gradient-orange">KDLuck</span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => setLocation(link.path)}
              className={`text-sm font-medium transition-colors ${
                location === link.path ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{user.name ?? "用戶"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/member")}>
                  <User className="mr-2 h-4 w-4" />會員中心
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/member/courses")}>
                  <BookOpen className="mr-2 h-4 w-4" />我的課程
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/member/orders")}>
                  <ShoppingCart className="mr-2 h-4 w-4" />訂單紀錄
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/member/recommend")}>
                  <Sparkles className="mr-2 h-4 w-4" />AI 推薦
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setLocation("/admin")}>
                      <Settings className="mr-2 h-4 w-4" />管理後台
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              {/* LINE Login Button */}
              <Button
                size="sm"
                variant="outline"
                className="bg-[#06C755] hover:bg-[#05b64e] text-white border-[#06C755] hover:border-[#05b64e]"
                onClick={() => { window.location.href = getLineLoginUrl(); }}
              >
                <svg className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINE 登入
              </Button>
              {/* Standard Login */}
              <Button size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
                登入 / 註冊
              </Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background p-4 space-y-2">
          {navLinks.map(link => (
            <button
              key={link.path}
              onClick={() => { setLocation(link.path); setMobileOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 text-sm"
            >
              {link.label}
            </button>
          ))}
          {!user && (
            <>
              <button
                onClick={() => { window.location.href = getLineLoginUrl(); setMobileOpen(false); }}
                className="block w-full text-left px-3 py-2 rounded-lg bg-[#06C755] text-white text-sm"
              >
                LINE 登入
              </button>
              <button
                onClick={() => { window.location.href = getLoginUrl(); setMobileOpen(false); }}
                className="block w-full text-left px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
              >
                登入 / 註冊
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
