import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye, Upload, Image, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function AdminCourses() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.course.all.useQuery({ page, limit: 20 });
  const { data: categoriesList } = trpc.category.list.useQuery();
  const { data: instructorsList } = trpc.instructor.list.useQuery();

  const createMutation = trpc.course.create.useMutation({
    onSuccess: () => { utils.course.all.invalidate(); setDialogOpen(false); toast.success("課程已建立"); },
  });
  const updateMutation = trpc.course.update.useMutation({
    onSuccess: () => { utils.course.all.invalidate(); setDialogOpen(false); toast.success("課程已更新"); },
  });
  const deleteMutation = trpc.course.delete.useMutation({
    onSuccess: () => { utils.course.all.invalidate(); toast.success("課程已刪除"); },
  });

  const uploadMutation = trpc.upload.uploadFile.useMutation();
  const [coverUploading, setCoverUploading] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("圖片不得超過 10MB"); return; }
    setCoverUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await uploadMutation.mutateAsync({
          key: `covers/${Date.now()}-${file.name}`,
          base64Data: base64,
          contentType: file.type,
        });
        setForm(f => ({ ...f, coverImageUrl: result.url }));
        toast.success("封面上傳成功");
      } catch {
        toast.error("封面上傳失敗");
      }
      setCoverUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const [form, setForm] = useState({
    title: "", slug: "", subtitle: "", description: "", price: "0", originalPrice: "",
    categoryId: undefined as number | undefined, instructorId: undefined as number | undefined,
    status: "draft" as "draft" | "published" | "archived",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    coverImageUrl: "", previewVideoUrl: "", seoTitle: "", seoDescription: "",
  });

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: "", slug: "", subtitle: "", description: "", price: "0", originalPrice: "", categoryId: undefined, instructorId: undefined, status: "draft", level: "beginner", coverImageUrl: "", previewVideoUrl: "", seoTitle: "", seoDescription: "" });
    setDialogOpen(true);
  };

  const openEdit = (course: any) => {
    setEditingCourse(course);
    setForm({
      title: course.title, slug: course.slug, subtitle: course.subtitle ?? "", description: course.description ?? "",
      price: course.price, originalPrice: course.originalPrice ?? "",
      categoryId: course.categoryId ?? undefined, instructorId: course.instructorId ?? undefined,
      status: course.status, level: course.level,
      coverImageUrl: course.coverImageUrl ?? "", previewVideoUrl: course.previewVideoUrl ?? "",
      seoTitle: course.seoTitle ?? "", seoDescription: course.seoDescription ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.slug) { toast.error("請填寫課程名稱與 Slug"); return; }
    const payload = {
      ...form,
      categoryId: form.categoryId || undefined,
      instructorId: form.instructorId || undefined,
      originalPrice: form.originalPrice || undefined,
    };
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    draft: { label: "草稿", variant: "secondary" },
    published: { label: "已發布", variant: "default" },
    archived: { label: "已封存", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">課程管理</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />新增課程</Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>課程名稱</TableHead>
                <TableHead>價格</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>學員數</TableHead>
                <TableHead>評分</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">尚無課程</TableCell></TableRow>
              ) : (
                data?.items.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>NT$ {course.price}</TableCell>
                    <TableCell><Badge variant={statusMap[course.status]?.variant}>{statusMap[course.status]?.label}</Badge></TableCell>
                    <TableCell>{course.enrollmentCount}</TableCell>
                    <TableCell>{course.avgRating ? `${course.avgRating} (${course.ratingCount})` : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/courses/${course.id}/content`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除此課程？")) deleteMutation.mutate({ id: course.id }); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "編輯課程" : "新增課程"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>課程名稱 *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="例：Python 入門到精通" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="python-mastery" />
            </div>
            <div>
              <Label>副標題</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div>
              <Label>售價 (NT$)</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <Label>原價 (NT$)</Label>
              <Input type="number" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} />
            </div>
            <div>
              <Label>分類</Label>
              <Select value={form.categoryId?.toString() ?? ""} onValueChange={v => setForm(f => ({ ...f, categoryId: v ? parseInt(v) : undefined }))}>
                <SelectTrigger><SelectValue placeholder="選擇分類" /></SelectTrigger>
                <SelectContent>
                  {categoriesList?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>講師</Label>
              <Select value={form.instructorId?.toString() ?? ""} onValueChange={v => setForm(f => ({ ...f, instructorId: v ? parseInt(v) : undefined }))}>
                <SelectTrigger><SelectValue placeholder="選擇講師" /></SelectTrigger>
                <SelectContent>
                  {instructorsList?.map(i => <SelectItem key={i.id} value={i.id.toString()}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>狀態</Label>
              <Select value={form.status} onValueChange={(v: any) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="published">已發布</SelectItem>
                  <SelectItem value="archived">已封存</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>難度</Label>
              <Select value={form.level} onValueChange={(v: any) => setForm(f => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">入門</SelectItem>
                  <SelectItem value="intermediate">中級</SelectItem>
                  <SelectItem value="advanced">高級</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>課程描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} />
            </div>
            <div className="col-span-2">
              <Label className="flex items-center gap-2 mb-2"><Image className="h-4 w-4" />課程封面圖片</Label>
              {form.coverImageUrl ? (
                <div className="mb-2 relative group">
                  <img src={form.coverImageUrl} alt="封面預覽" className="w-full max-h-48 object-cover rounded-lg border border-border" />
                  <Button variant="destructive" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 text-xs" onClick={() => setForm(f => ({ ...f, coverImageUrl: "" }))}>移除</Button>
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input value={form.coverImageUrl} onChange={e => setForm(f => ({ ...f, coverImageUrl: e.target.value }))} placeholder="貼上圖片 URL 或使用右側上傳" className="flex-1" />
                <div className="relative">
                  <Button variant="outline" disabled={coverUploading} className="relative">
                    <Upload className="h-4 w-4 mr-1" />{coverUploading ? "上傳中..." : "上傳圖片"}
                  </Button>
                  <input type="file" accept="image/*" onChange={handleCoverUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">建議尺寸 1280x720，最大 10MB，支援 JPG/PNG/WebP</p>
            </div>
            <div className="col-span-2">
              <Label>預覽影片 URL</Label>
              <Input value={form.previewVideoUrl} onChange={e => setForm(f => ({ ...f, previewVideoUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>SEO 標題</Label>
              <Input value={form.seoTitle} onChange={e => setForm(f => ({ ...f, seoTitle: e.target.value }))} />
            </div>
            <div>
              <Label>SEO 描述</Label>
              <Input value={form.seoDescription} onChange={e => setForm(f => ({ ...f, seoDescription: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingCourse ? "更新" : "建立"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
