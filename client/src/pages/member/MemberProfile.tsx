import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MemberProfile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">個人資料</h1>
      <Card className="bg-card border-border">
        <CardHeader><CardTitle>基本資訊</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">名稱</p>
              <p className="font-medium">{user.name ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">角色</p>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role === "admin" ? "管理員" : "學員"}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">登入方式</p>
              <p className="font-medium">{user.loginMethod ?? "Manus OAuth"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
