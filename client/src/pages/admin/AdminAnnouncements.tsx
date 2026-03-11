import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Plus, Pencil, Trash2, Pin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const typeLabels: Record<string, string> = {
  info: "一般公告", warning: "注意事項", promotion: "優惠活動", maintenance: "系統維護",
};
const typeBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  info: "secondary", warning: "destructive", promotion: "default", maintenance: "outline",
};

export default function AdminAnnouncements() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.announcement.all.useQuery();
  const createMutation = trpc.announcement.create.useMutation({
    onSuccess: () => { utils.announcement.all.invalidate(); toast.success("公告已建立"); setDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.announcement.update.useMutation({
    onSuccess: () => { utils.announcement.all.invalidate(); toast.success("公告已更新"); setDialogOpen(false); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.announcement.delete.useMutation({
    onSuccess: () => { utils.announcement.all.invalidate(); toast.success("公告已刪除"); },
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", type: "info" as string, isPinned: false, startAt: "", endAt: "" });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", content: "", type: "info", isPinned: false, startAt: "", endAt: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      content: item.content,
      type: item.type,
      isPinned: item.isPinned,
      startAt: item.startAt ? new Date(item.startAt).toISOString().slice(0, 16) : "",
      endAt: item.endAt ? new Date(item.endAt).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId, title: form.title, content: form.content,
        type: form.type as any, isPinned: form.isPinned,
        startAt: form.startAt || null, endAt: form.endAt || null,
      });
    } else {
      createMutation.mutate({
        title: form.title, content: form.content,
        type: form.type as any, isPinned: form.isPinned,
        startAt: form.startAt || undefined, endAt: form.endAt || undefined,
      });
    }
  };

  const toggleActive = (item: any) => {
    updateMutation.mutate({ id: item.id, isActive: !item.isActive });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6" />公告管理</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新增公告</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Card key={i} className="bg-card border-border animate-pulse"><CardContent className="p-4 h-20" /></Card>)}</div>
      ) : !data?.items.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Megaphone className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>尚無公告</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map(item => (
            <Card key={item.id} className={`bg-card border-border ${!item.isActive ? "opacity-50" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                      <h3 className="font-semibold">{item.title}</h3>
                      <Badge variant={typeBadgeVariant[item.type] ?? "secondary"}>{typeLabels[item.type] ?? item.type}</Badge>
                      {!item.isActive && <Badge variant="outline">已停用</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      建立時間：{new Date(item.createdAt).toLocaleString("zh-TW")}
                      {item.startAt && ` · 開始：${new Date(item.startAt).toLocaleString("zh-TW")}`}
                      {item.endAt && ` · 結束：${new Date(item.endAt).toLocaleString("zh-TW")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={item.isActive} onCheckedChange={() => toggleActive(item)} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除此公告？")) deleteMutation.mutate({ id: item.id }); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "編輯公告" : "新增公告"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>標題</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="公告標題" /></div>
            <div><Label>內容</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4} placeholder="公告內容..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>類型</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">一般公告</SelectItem>
                    <SelectItem value="warning">注意事項</SelectItem>
                    <SelectItem value="promotion">優惠活動</SelectItem>
                    <SelectItem value="maintenance">系統維護</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Switch checked={form.isPinned} onCheckedChange={v => setForm(f => ({ ...f, isPinned: v }))} />
                  <Label>置頂</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>開始時間（選填）</Label><Input type="datetime-local" value={form.startAt} onChange={e => setForm(f => ({ ...f, startAt: e.target.value }))} /></div>
              <div><Label>結束時間（選填）</Label><Input type="datetime-local" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.content || createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
