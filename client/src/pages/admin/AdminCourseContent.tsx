import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Video, FileText, Upload, CheckCircle2, Image, HelpCircle } from "lucide-react";
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
  const { data: faqsList } = trpc.faq.byCourse.useQuery({ courseId });

  // FAQ dialog
  const [faqDialog, setFaqDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", sortOrder: 0 });
  const createFaq = trpc.faq.create.useMutation({ onSuccess: () => { utils.faq.byCourse.invalidate({ courseId }); setFaqDialog(false); toast.success("已新增 FAQ"); } });
  const updateFaq = trpc.faq.update.useMutation({ onSuccess: () => { utils.faq.byCourse.invalidate({ courseId }); setFaqDialog(false); toast.success("已更新 FAQ"); } });
  const deleteFaq = trpc.faq.delete.useMutation({ onSuccess: () => { utils.faq.byCourse.invalidate({ courseId }); toast.success("已刪除 FAQ"); } });

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
  const [uploadProgress, setUploadProgress] = useState("");

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
    if (file.size > 500 * 1024 * 1024) {
      toast.error("影片檔案不得超過 500MB");
      return;
    }
    setUploadProgress(`正在上傳 ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)...`);
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
        setUploadProgress("");
        toast.success("影片上傳成功");
      } catch {
        setUploadProgress("");
        toast.error("影片上傳失敗，請確認檔案大小並重試");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("附件檔案不得超過 50MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      try {
        const result = await uploadMutation.mutateAsync({
          key: `attachments/${courseId}/${Date.now()}-${file.name}`,
          base64Data: base64,
          contentType: file.type,
        });
        toast.success(`附件 ${file.name} 上傳成功，URL: ${result.url}`);
      } catch {
        toast.error("附件上傳失敗");
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

      {/* FAQ Section */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">常見問題 (FAQ)</CardTitle>
            <Badge variant="secondary">{faqsList?.length ?? 0} 題</Badge>
          </div>
          <Button size="sm" onClick={() => { setEditingFaq(null); setFaqForm({ question: "", answer: "", sortOrder: faqsList?.length ?? 0 }); setFaqDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" />新增
          </Button>
        </CardHeader>
        <CardContent>
          {faqsList?.length === 0 && <p className="text-center py-4 text-muted-foreground text-sm">尚未新增常見問題</p>}
          <div className="space-y-2">
            {faqsList?.map(faq => (
              <div key={faq.id} className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Q: {faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">A: {faq.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingFaq(faq); setFaqForm({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder }); setFaqDialog(true); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("確定刪除？")) deleteFaq.mutate({ id: faq.id }); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ Dialog */}
      <Dialog open={faqDialog} onOpenChange={setFaqDialog}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editingFaq ? "編輯 FAQ" : "新增 FAQ"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>問題 *</Label>
              <Input value={faqForm.question} onChange={e => setFaqForm(f => ({ ...f, question: e.target.value }))} placeholder="例：課程可以無限次觀看嗎？" />
            </div>
            <div>
              <Label>回答 *</Label>
              <Textarea value={faqForm.answer} onChange={e => setFaqForm(f => ({ ...f, answer: e.target.value }))} rows={4} placeholder="請輸入回答內容" />
            </div>
            <div>
              <Label>排序</Label>
              <Input type="number" value={faqForm.sortOrder} onChange={e => setFaqForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFaqDialog(false)}>取消</Button>
              <Button onClick={() => {
                if (!faqForm.question || !faqForm.answer) { toast.error("請填寫問題與回答"); return; }
                if (editingFaq) {
                  updateFaq.mutate({ id: editingFaq.id, ...faqForm });
                } else {
                  createFaq.mutate({ courseId, ...faqForm });
                }
              }}>
                {editingFaq ? "更新" : "建立"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Video className="h-4 w-4" />教學影片</Label>
              {lessonForm.videoUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm text-green-400 truncate flex-1">已上傳影片</span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setLessonForm(f => ({ ...f, videoUrl: "", videoKey: "" }))}>移除</Button>
                </div>
              ) : null}
              <Input value={lessonForm.videoUrl} onChange={e => setLessonForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="貼上影片 URL 或使用下方上傳" />
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">點擊或拖曳上傳影片（最大 500MB）</p>
                <Input type="file" accept="video/*" onChange={handleVideoUpload} className="cursor-pointer" />
                {uploadProgress && <p className="text-xs text-primary mt-2 animate-pulse">{uploadProgress}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />課程附件（選填）</Label>
              <p className="text-xs text-muted-foreground">可上傳 PDF、PPT、圖片等輔助教材（最大 50MB）</p>
              <Input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.png,.jpg,.jpeg" onChange={handleAttachmentUpload} />
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
