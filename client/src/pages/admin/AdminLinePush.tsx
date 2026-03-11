import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquare, Send, History, Users } from "lucide-react";
import { useState } from "react";

export default function AdminLinePush() {
  const [page, setPage] = useState(1);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [targetType, setTargetType] = useState<"all" | "user" | "enrolled">("all");
  const [targetUserId, setTargetUserId] = useState<number | undefined>();
  const [messageContent, setMessageContent] = useState("");

  const { data: history, isLoading } = trpc.linePush.history.useQuery({ page, limit: 20 });
  const { data: templates } = trpc.notification.templates.useQuery();
  const { data: lineUsers } = trpc.linePush.lineUsers.useQuery();
  const sendMutation = trpc.linePush.send.useMutation();
  const utils = trpc.useUtils();

  const handleSend = async () => {
    if (!messageContent.trim()) {
      toast.error("請輸入訊息內容");
      return;
    }
    try {
      const result = await sendMutation.mutateAsync({
        targetType,
        targetUserId,
        messageContent: messageContent.trim(),
      });
      if (result.success) {
        toast.success(`推播成功：${result.sentCount} 筆已發送`);
        setSendDialogOpen(false);
        setMessageContent("");
        utils.linePush.history.invalidate();
      } else {
        toast.error(`推播失敗：${result.error}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const applyTemplate = (body: string) => {
    setMessageContent(body);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      pending: { label: "待發送", variant: "secondary" },
      sent: { label: "已發送", variant: "default" },
      failed: { label: "失敗", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const targetLabel = (type: string) => {
    const map: Record<string, string> = { all: "全部用戶", user: "指定用戶", enrolled: "已購課用戶" };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">LINE 推播</h1>
          <p className="text-muted-foreground mt-1">透過 LINE Messaging API 發送推播通知</p>
        </div>
        <Button onClick={() => setSendDialogOpen(true)}>
          <Send className="h-4 w-4 mr-2" />發送推播
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LINE 綁定用戶</CardDescription>
            <CardTitle className="text-2xl">{lineUsers?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總推播次數</CardDescription>
            <CardTitle className="text-2xl">{history?.total ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>通知模板</CardDescription>
            <CardTitle className="text-2xl">{templates?.length ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">LINE Messaging API 設定說明</p>
        <p>請至 <a href="/admin/payment" className="text-primary underline font-medium">支付與 API 設定</a> 頁面設定 LINE Messaging API 的 <strong>Channel Access Token</strong>。</p>
        <p className="mt-2">取得方式：前往 <a href="https://developers.line.biz/console/" target="_blank" rel="noopener" className="text-primary underline">LINE Developers Console</a> → 選擇 Messaging API Channel → Channel Access Token</p>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-1" />推播歷史</TabsTrigger>
          <TabsTrigger value="templates"><MessageSquare className="h-4 w-4 mr-1" />通知模板</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />LINE 用戶</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">載入中...</div>
              ) : !history?.items.length ? (
                <div className="text-center py-8 text-muted-foreground">尚無推播記錄</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>對象</TableHead>
                        <TableHead>訊息內容</TableHead>
                        <TableHead>狀態</TableHead>
                        <TableHead>發送數</TableHead>
                        <TableHead>時間</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{targetLabel(item.targetType)}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-sm">{item.messageContent}</TableCell>
                          <TableCell>{statusBadge(item.status)}</TableCell>
                          <TableCell>{item.sentCount ?? "-"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString("zh-TW")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {history.total > 20 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
                      <span className="text-sm text-muted-foreground py-2">第 {page} 頁</span>
                      <Button variant="outline" size="sm" disabled={history.items.length < 20} onClick={() => setPage(p => p + 1)}>下一頁</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardContent className="pt-6">
              {!templates?.length ? (
                <div className="text-center py-8 text-muted-foreground">尚無模板</div>
              ) : (
                <div className="space-y-3">
                  {templates.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{t.templateName}</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[400px] truncate">{t.templateBody}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={t.isActive ? "default" : "secondary"}>{t.isActive ? "啟用" : "停用"}</Badge>
                        <Button variant="outline" size="sm" onClick={() => { applyTemplate(t.templateBody); setSendDialogOpen(true); }}>
                          使用此模板
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">模板可在「系統設定」頁面中編輯</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              {!lineUsers?.length ? (
                <div className="text-center py-8 text-muted-foreground">尚無 LINE 綁定用戶</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用戶名稱</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>LINE User ID</TableHead>
                      <TableHead>註冊時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineUsers.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name || "-"}</TableCell>
                        <TableCell className="text-sm">{u.email || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{u.lineUserId}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("zh-TW")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 發送推播 Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>發送 LINE 推播</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>推播對象</Label>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部用戶（廣播）</SelectItem>
                  <SelectItem value="enrolled">已購課用戶</SelectItem>
                  <SelectItem value="user">指定用戶</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {targetType === "user" && (
              <div className="space-y-2">
                <Label>用戶 ID</Label>
                <Input type="number" value={targetUserId || ""} onChange={e => setTargetUserId(parseInt(e.target.value) || undefined)} placeholder="輸入用戶 ID" />
              </div>
            )}
            <div className="space-y-2">
              <Label>訊息內容</Label>
              <Textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={5} placeholder="輸入推播訊息..." />
              <p className="text-xs text-muted-foreground">支援變數：{"{{name}}"} 用戶名稱</p>
            </div>
            {templates && templates.length > 0 && (
              <div className="space-y-2">
                <Label>快速套用模板</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.filter((t: any) => t.isActive).map((t: any) => (
                    <Button key={t.id} variant="outline" size="sm" onClick={() => applyTemplate(t.templateBody)}>
                      {t.templateName}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button onClick={handleSend} disabled={sendMutation.isPending}>
              <Send className="h-4 w-4 mr-2" />
              {sendMutation.isPending ? "發送中..." : "發送推播"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
