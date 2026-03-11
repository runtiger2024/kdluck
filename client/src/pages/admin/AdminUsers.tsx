import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";
import {
  Search, User, Mail, Phone, Link2, ShoppingCart, BookOpen, Clock, Shield,
} from "lucide-react";

const loginMethodLabels: Record<string, string> = {
  manus: "Manus",
  line: "LINE",
  google: "Google",
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data, isLoading } = activeSearch
    ? trpc.user.search.useQuery({ query: activeSearch, page, limit: 20 })
    : trpc.user.all.useQuery({ page, limit: 20 });

  const { data: userDetail, isLoading: detailLoading } = trpc.user.accountDetail.useQuery(
    { userId: selectedUserId! },
    { enabled: !!selectedUserId }
  );

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      utils.user.all.invalidate();
      utils.user.search.invalidate();
      toast.success("角色已更新");
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
      setPage(1);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">用戶管理</h1>
        <Badge variant="secondary">{data?.total ?? 0} 位用戶</Badge>
      </div>

      {/* Search Bar */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋用戶（姓名、Email、電話、ID）"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 sm:flex-none" onClick={handleSearch} disabled={!searchQuery.trim()}>搜尋</Button>
              {activeSearch && (
                <Button variant="outline" className="flex-1 sm:flex-none" onClick={clearSearch}>清除</Button>
              )}
            </div>
          </div>
          {activeSearch && (
            <p className="text-xs text-muted-foreground mt-2">
              搜尋「{activeSearch}」的結果，共 {data?.total ?? 0} 筆
            </p>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>名稱</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>登入方式</TableHead>
                  <TableHead>LINE</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>最後登入</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
                ) : data?.items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {activeSearch ? "未找到符合的用戶" : "尚無用戶"}
                  </TableCell></TableRow>
                ) : (
                  data?.items.map((user) => (
                    <TableRow key={user.id} className="cursor-pointer hover:bg-secondary/30" onClick={() => setSelectedUserId(user.id)}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                      <TableCell className="text-xs">{user.email ?? "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {loginMethodLabels[user.loginMethod ?? ""] ?? user.loginMethod ?? "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lineUserId ? (
                          <Badge className="bg-[#06C755]/10 text-[#06C755] border-0 text-xs">已綁定</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "管理員" : "學員"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(user.lastSignedIn).toLocaleString("zh-TW")}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Select value={user.role} onValueChange={(v: "user" | "admin") => updateRole.mutate({ userId: user.id, role: v })}>
                          <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">學員</SelectItem>
                            <SelectItem value="admin">管理員</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">載入中...</div>
            ) : data?.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeSearch ? "未找到符合的用戶" : "尚無用戶"}
              </div>
            ) : (
              data?.items.map((user) => (
                <div key={user.id} className="p-4 space-y-2 cursor-pointer active:bg-secondary/20" onClick={() => setSelectedUserId(user.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{user.name ?? "-"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email ?? "-"}</p>
                    </div>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"} className="shrink-0">
                      {user.role === "admin" ? "管理員" : "學員"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {loginMethodLabels[user.loginMethod ?? ""] ?? user.loginMethod ?? "-"}
                    </Badge>
                    {user.lineUserId && (
                      <Badge className="bg-[#06C755]/10 text-[#06C755] border-0 text-xs">LINE 已綁定</Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(user.lastSignedIn).toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select value={user.role} onValueChange={(v: "user" | "admin") => updateRole.mutate({ userId: user.id, role: v })}>
                      <SelectTrigger className="w-full h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">學員</SelectItem>
                        <SelectItem value="admin">管理員</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
          <span className="text-sm text-muted-foreground self-center">第 {page} 頁</span>
          <Button variant="outline" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage(p => p + 1)}>下一頁</Button>
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUserId} onOpenChange={(open) => { if (!open) setSelectedUserId(null); }}>
        <DialogContent className="max-w-lg w-[calc(100vw-2rem)] sm:w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              用戶帳號詳情
            </DialogTitle>
            <DialogDescription>查看用戶的完整帳號資訊和活動概覽</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-8 text-center text-muted-foreground">載入中...</div>
          ) : userDetail ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">用戶 ID</p>
                  <p className="text-sm font-medium">{userDetail.id}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">姓名</p>
                  <p className="text-sm font-medium">{userDetail.name ?? "-"}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{userDetail.email ?? "未設定"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">電話</p>
                    <p className="text-sm">{userDetail.phone ?? "未設定"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Status */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />帳號狀態
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 rounded border border-border">
                    <span className="text-xs text-muted-foreground">登入方式</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {loginMethodLabels[userDetail.loginMethod] ?? userDetail.loginMethod}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded border border-border">
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">LINE</span>
                    {userDetail.hasLineBinding ? (
                      <Badge className="bg-[#06C755]/10 text-[#06C755] border-0 text-xs ml-auto">已綁定</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs ml-auto">未綁定</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Activity Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg border border-border">
                  <ShoppingCart className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{userDetail.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">訂單數</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-border">
                  <BookOpen className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-lg font-bold">{userDetail.enrolledCourseCount}</p>
                  <p className="text-xs text-muted-foreground">已購課程</p>
                </div>
                <div className="text-center p-3 rounded-lg border border-border">
                  <span className="text-muted-foreground text-xs">NT$</span>
                  <p className="text-lg font-bold">{parseFloat(userDetail.totalSpent).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">消費金額</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">註冊時間</p>
                  </div>
                  <p className="text-xs">{new Date(userDetail.createdAt).toLocaleString("zh-TW")}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">最後登入</p>
                  </div>
                  <p className="text-xs">{new Date(userDetail.lastSignedIn).toLocaleString("zh-TW")}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">找不到用戶資訊</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
