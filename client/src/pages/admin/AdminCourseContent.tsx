import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Video, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation, useParams } from "wouter";

export default function AdminCourseContent() {
  const params = useParams<{ courseId: string }>();
  const courseId = parseInt(params.courseId ?? "0");
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const { data: course } = trpc.course.getById.useQuery({ id: courseId });
  const { data: chaptersList } = trpc.chapter.listByCourse.useQuery({ courseId });
  const { data: lessonsList } = trpc.lesson.listByCourse.useQuery({ courseId });

  // Chapter dialog
  const [chapterDialog, setChapterDialog] = useState(false);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [chapterForm, setChapterForm] = useState({ title: "", sortOrder: 0 });

  // Lesson dialog
  const [lessonDialog, setLessonDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonChapterId, setLessonChapterId] = useState(0);
  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", videoUrl: "", videoKey: "", duration: 0, sortOrder: 0, isFreePreview: false,
  });

  const createChapter = trpc.chapter.create.useMutation({
    onSuccess: () => { utils.chapter.listByCourse.invalidate({ courseId }); setChapterDialog(false); toast.success("章節已建立"); },
  });
  const updateChapter = trpc.chapter.update.useMutation({
    onSuccess: () => { utils.chapter.listByCourse.invalidate({ courseId }); setChapterDialog(false); toast.success("章節已更新"); },
  });
  const deleteChapter = trpc.chapter.delete.useMutation({
    onSuccess: () => { utils.chapter.listByCourse.invalidate({ courseId }); utils.lesson.listByCourse.invalidate({ courseId }); toast.success("章節已刪除"); },
  });

  const createLesson = trpc.lesson.create.useMutation({
    onSuccess: () => { utils.lesson.listByCourse.invalidate({ courseId }); setLessonDialog(false); toast.success("課時已建立"); },
  });
  const updateLesson = trpc.lesson.update.useMutation({
    onSuccess: () => { utils.lesson.listByCourse.invalidate({ courseId }); setLessonDialog(false); toast.success("課時已更新"); },
  });
  const deleteLesson = trpc.lesson.delete.useMutation({
    onSuccess: () => { utils.lesson.listByCourse.invalidate({ courseId }); toast.success("課時已刪除"); },
  });

  // File upload for video
  const uploadMutation = trpc.upload.uploadFile.useMutation();

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await uploadMutation.mutateAsync({
          key: `videos/${courseId}/${Date.now()}-${file.name}`,
          base64Data: base64,
          contentType: file.type,
        });
        setLessonForm(f => ({ ...f, videoUrl: result.url, videoKey: result.key }));
        toast.success("影片上傳成功");
      } catch {
        toast.error("影片上傳失敗");
      }
    };
    reader.readAsDataURL(file);
  };

  const openChapterCreate = () => {
    setEditingChapter(null);
    setChapterForm({ title: "", sortOrder: (chaptersList?.length ?? 0) });
    setChapterDialog(true);
  };

  const openChapterEdit = (ch: any) => {
    setEditingChapter(ch);
    setChapterForm({ title: ch.title, sortOrder: ch.sortOrder });
    setChapterDialog(true);
  };

  const openLessonCreate = (chId: number) => {
    setEditingLesson(null);
    setLessonChapterId(chId);
    const chLessons = lessonsList?.filter(l => l.chapterId === chId) ?? [];
    setLessonForm({ title: "", description: "", videoUrl: "", videoKey: "", duration: 0, sortOrder: chLessons.length, isFreePreview: false });
    setLessonDialog(true);
  };

  const openLessonEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setLessonChapterId(lesson.chapterId);
    setLessonForm({
      title: lesson.title, description: lesson.description ?? "", videoUrl: lesson.videoUrl ?? "",
      videoKey: lesson.videoKey ?? "", duration: lesson.duration, sortOrder: lesson.sortOrder,
      isFreePreview: lesson.isFreePreview,
    });
    setLessonDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/courses")}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course?.title ?? "課程內容管理"}</h1>
          <p className="text-sm text-muted-foreground">管理章節與課時</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openChapterCreate}><Plus className="h-4 w-4 mr-2" />新增章節</Button>
      </div>

      {chaptersList?.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            尚無章節，請點擊「新增章節」開始建立課程內容
          </CardContent>
        </Card>
      )}

      {chaptersList?.map((chapter) => {
        const chLessons = lessonsList?.filter(l => l.chapterId === chapter.id) ?? [];
        return (
          <Card key={chapter.id} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                <Badge variant="secondary">{chLessons.length} 課時</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openLessonCreate(chapter.id)}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openChapterEdit(chapter)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除此章節？")) deleteChapter.mutate({ id: chapter.id }); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {chLessons.length > 0 && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {chLessons.sort((a, b) => a.sortOrder - b.sortOrder).map((lesson) => (
                    <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                      <div className="flex items-center gap-3">
                        {lesson.videoUrl ? <Video className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-medium">{lesson.title}</span>
                        {lesson.isFreePreview && <Badge variant="outline" className="text-xs">免費試看</Badge>}
                        {lesson.duration > 0 && <span className="text-xs text-muted-foreground">{Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, "0")}</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openLessonEdit(lesson)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除？")) deleteLesson.mutate({ id: lesson.id, courseId }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Chapter Dialog */}
      <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editingChapter ? "編輯章節" : "新增章節"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>章節標題 *</Label>
              <Input value={chapterForm.title} onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))} placeholder="例：第一章 基礎概念" />
            </div>
            <div>
              <Label>排序</Label>
              <Input type="number" value={chapterForm.sortOrder} onChange={e => setChapterForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setChapterDialog(false)}>取消</Button>
              <Button onClick={() => {
                if (!chapterForm.title) { toast.error("請填寫章節標題"); return; }
                if (editingChapter) {
                  updateChapter.mutate({ id: editingChapter.id, ...chapterForm });
                } else {
                  createChapter.mutate({ courseId, ...chapterForm });
                }
              }}>
                {editingChapter ? "更新" : "建立"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialog} onOpenChange={setLessonDialog}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader><DialogTitle>{editingLesson ? "編輯課時" : "新增課時"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>課時標題 *</Label>
              <Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>描述</Label>
              <Textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>影片 URL</Label>
              <Input value={lessonForm.videoUrl} onChange={e => setLessonForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>或上傳影片</Label>
              <Input type="file" accept="video/*" onChange={handleVideoUpload} />
              {uploadMutation.isPending && <p className="text-xs text-muted-foreground mt-1">上傳中...</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>時長 (秒)</Label>
                <Input type="number" value={lessonForm.duration} onChange={e => setLessonForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>排序</Label>
                <Input type="number" value={lessonForm.sortOrder} onChange={e => setLessonForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={lessonForm.isFreePreview} onCheckedChange={v => setLessonForm(f => ({ ...f, isFreePreview: v }))} />
              <Label>免費試看</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLessonDialog(false)}>取消</Button>
              <Button onClick={() => {
                if (!lessonForm.title) { toast.error("請填寫課時標題"); return; }
                if (editingLesson) {
                  updateLesson.mutate({ id: editingLesson.id, ...lessonForm });
                } else {
                  createLesson.mutate({ chapterId: lessonChapterId, courseId, ...lessonForm });
                }
              }}>
                {editingLesson ? "更新" : "建立"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
