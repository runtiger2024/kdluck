import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import { BookOpen, User, ShoppingCart, LogOut, Settings, Menu, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

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
            <Button size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
              登入 / 註冊
            </Button>
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
        </div>
      )}
    </header>
  );
}
