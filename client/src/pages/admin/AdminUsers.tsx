import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.user.all.useQuery({ page, limit: 20 });

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => { utils.user.all.invalidate(); toast.success("角色已更新"); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">用戶管理</h1>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>登入方式</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>註冊時間</TableHead>
                <TableHead>最後登入</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">尚無用戶</TableCell></TableRow>
              ) : (
                data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">{user.name ?? "-"}</TableCell>
                    <TableCell>{user.email ?? "-"}</TableCell>
                    <TableCell>{user.loginMethod ?? "-"}</TableCell>
                    <TableCell><Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "管理員" : "學員"}</Badge></TableCell>
                    <TableCell className="text-xs">{new Date(user.createdAt).toLocaleString("zh-TW")}</TableCell>
                    <TableCell className="text-xs">{new Date(user.lastSignedIn).toLocaleString("zh-TW")}</TableCell>
                    <TableCell className="text-right">
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
