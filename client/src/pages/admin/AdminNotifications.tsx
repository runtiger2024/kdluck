import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, Bell, Mail, MessageSquare, History, Loader2 } from "lucide-react";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"system" | "course" | "order" | "review" | "promotion" | "certificate">("system");
  const [link, setLink] = useState("");
  const [channels, setChannels] = useState({ inApp: true, line: false, email: false });
  const [targetType, setTargetType] = useState<"all" | "specific">("all");
  const [targetUserIds, setTargetUserIds] = useState("");

  const { data: logs, refetch: refetchLogs } = trpc.adminNotify.logs.useQuery({ page: 1, limit: 20 });
  const sendNotif = trpc.adminNotify.send.useMutation({
    onSuccess: (result) => {
      const totalSent = result.results.reduce((sum, r) => sum + (r.success ? r.count : 0), 0);
      toast.success(`通知已發送！成功 ${totalSent} 筆`);
      setTitle("");
      setContent("");
      setLink("");
      refetchLogs();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSend = () => {
    if (!title.trim()) return toast.error("請輸入通知標題");
    if (!content.trim()) return toast.error("請輸入通知內容");

    const channelList: ("in_app" | "line" | "email")[] = [];
    if (channels.inApp) channelList.push("in_app");
    if (channels.line) channelList.push("line");
    if (channels.email) channelList.push("email");

    if (channelList.length === 0) return toast.error("請至少選擇一個發送管道");

    sendNotif.mutate({
      title: title.trim(),
      content: content.trim(),
      type,
      link: link.trim() || undefined,
      channels: channelList,
      targetType: targetType === "all" ? "all" as const : "user" as const,
      targetUserId: targetType === "specific" && targetUserIds.trim()
        ? parseInt(targetUserIds.split(",")[0].trim()) || undefined
        : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">通知推送</h1>
        <p className="text-muted-foreground text-sm mt-1">向用戶發送站內通知、LINE 推播或 Email</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" />
              發送通知
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>通知類型</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">🔔 系統通知</SelectItem>
                  <SelectItem value="order">🛒 訂單通知</SelectItem>
                  <SelectItem value="course">📚 課程通知</SelectItem>
                  <SelectItem value="promotion">🏷️ 優惠活動</SelectItem>
                  <SelectItem value="review">⭐ 評價通知</SelectItem>
                  <SelectItem value="certificate">🎓 證書通知</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>標題 *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="輸入通知標題"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>內容 *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="輸入通知內容"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{content.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label>連結（選填）</Label>
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="例如：/courses/1 或 https://..."
              />
            </div>

            <div className="space-y-3">
              <Label>發送管道</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={channels.inApp}
                    onCheckedChange={(v) => setChannels(c => ({ ...c, inApp: !!v }))}
                  />
                  <Bell className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">站內通知</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={channels.line}
                    onCheckedChange={(v) => setChannels(c => ({ ...c, line: !!v }))}
                  />
                  <MessageSquare className="h-4 w-4 text-green-500" />
                  <span className="text-sm">LINE 推播</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={channels.email}
                    onCheckedChange={(v) => setChannels(c => ({ ...c, email: !!v }))}
                  />
                  <Mail className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Email</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <Label>發送對象</Label>
              <Select value={targetType} onValueChange={(v: "all" | "specific") => setTargetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部用戶</SelectItem>
                  <SelectItem value="specific">指定用戶 ID</SelectItem>
                </SelectContent>
              </Select>
              {targetType === "specific" && (
                <Input
                  value={targetUserIds}
                  onChange={(e) => setTargetUserIds(e.target.value)}
                  placeholder="輸入用戶 ID，以逗號分隔（例如：1,2,3）"
                />
              )}
            </div>

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={sendNotif.isPending}
            >
              {sendNotif.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />發送中...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />發送通知</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Send History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              發送紀錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!logs?.items?.length ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                尚無發送紀錄
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {logs.items.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {log.channel === "inApp" ? "站內" : log.channel === "line" ? "LINE" : "Email"}
                      </Badge>
                      <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-xs">
                        {log.status === "sent" ? "已發送" : log.status === "failed" ? "失敗" : "待發送"}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(log.createdAt).toLocaleString("zh-TW")}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{log.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.content}</p>
                    {log.error && (
                      <p className="text-xs text-destructive mt-1">錯誤：{log.error}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
