import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { GraduationCap, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AdminInstructors() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", title: "", bio: "", avatarUrl: "" });

  const { data: instructors, isLoading } = trpc.instructor.list.useQuery();
  const createMutation = trpc.instructor.create.useMutation();
  const updateMutation = trpc.instructor.update.useMutation();
  const deleteMutation = trpc.instructor.delete.useMutation();
  const uploadMutation = trpc.upload.uploadFile.useMutation();
  const utils = trpc.useUtils();

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: "", title: "", bio: "", avatarUrl: "" });
    setDialogOpen(true);
  };

  const openEdit = (inst: any) => {
    setEditTarget(inst);
    setForm({ name: inst.name, title: inst.title || "", bio: inst.bio || "", avatarUrl: inst.avatarUrl || "" });
    setDialogOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          key: `instructors/${Date.now()}-${file.name}`,
          base64Data: base64,
          contentType: file.type,
        });
        setForm(f => ({ ...f, avatarUrl: result.url }));
        toast.success("頭像已上傳");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("上傳失敗");
    }
  };

  const handleSave = async () => {
    try {
      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, ...form });
        toast.success("講師已更新");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("講師已建立");
      }
      setDialogOpen(false);
      utils.instructor.list.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      toast.success("講師已刪除");
      setDeleteTarget(null);
      utils.instructor.list.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">講師管理</h1>
          <p className="text-muted-foreground mt-1">管理平台講師資料</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新增講師</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" />講師列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : !instructors?.length ? (
            <div className="text-center py-8 text-muted-foreground">尚無講師，請新增</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>頭像</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>職稱</TableHead>
                  <TableHead>簡介</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((inst: any) => (
                  <TableRow key={inst.id}>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={inst.avatarUrl} />
                        <AvatarFallback>{inst.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{inst.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inst.title || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[250px] truncate">{inst.bio || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(inst)}>
                          <Pencil className="h-3 w-3 mr-1" />編輯
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(inst)}>
                          <Trash2 className="h-3 w-3 mr-1" />刪除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯 Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? "編輯講師" : "新增講師"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={form.avatarUrl} />
                <AvatarFallback className="text-lg">{form.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar-upload" className="cursor-pointer text-sm text-primary hover:underline">
                  上傳頭像
                </Label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>職稱</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：資深前端工程師" />
            </div>
            <div className="space-y-2">
              <Label>簡介</Label>
              <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>確認刪除</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">確定要刪除講師「{deleteTarget?.name}」嗎？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>確認刪除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
