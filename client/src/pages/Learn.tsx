import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { VideoWatermark } from "@/components/VideoWatermark";
import { useContentProtection } from "@/hooks/useContentProtection";
import { ArrowLeft, Play, CheckCircle, Lock, ChevronDown, ChevronUp, StickyNote, Plus, Trash2, Clock, X } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Learn() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  // ── 內容保護 ──────────────────────────────────────────
  const protectedContainerRef = useContentProtection(true);

  const { data: course } = trpc.course.getBySlug.useQuery({ slug: params.slug ?? "" });
  const { data: enrollment } = trpc.enrollment.check.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course && !!user });
  const { data: chapters } = trpc.chapter.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: lessons } = trpc.lesson.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: progressData } = trpc.progress.getByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course && !!user });
  const { data: signedUrl } = trpc.lesson.getSignedUrl.useQuery({ lessonId: currentLessonId ?? 0 }, { enabled: !!currentLessonId && !!user });
  const { data: currentProgress } = trpc.progress.getByLesson.useQuery({ lessonId: currentLessonId ?? 0 }, { enabled: !!currentLessonId && !!user });
  const { data: lessonNotes, refetch: refetchNotes } = trpc.note.byLesson.useQuery({ lessonId: currentLessonId ?? 0 }, { enabled: !!currentLessonId && !!user && showNotes });

  const updateProgress = trpc.progress.update.useMutation();
  const createNote = trpc.note.create.useMutation({ onSuccess: () => { refetchNotes(); setNoteContent(""); toast.success("筆記已儲存"); } });
  const updateNote = trpc.note.update.useMutation({ onSuccess: () => { refetchNotes(); setEditingNoteId(null); setNoteContent(""); toast.success("筆記已更新"); } });
  const deleteNote = trpc.note.delete.useMutation({ onSuccess: () => { refetchNotes(); toast.success("筆記已刪除"); } });

  // Auto-select first lesson
  useEffect(() => {
    if (lessons && lessons.length > 0 && !currentLessonId) {
      const sorted = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder);
      setCurrentLessonId(sorted[0].id);
      if (chapters) {
        setExpandedChapters(new Set(chapters.map(c => c.id)));
      }
    }
  }, [lessons, chapters, currentLessonId]);

  // Restore progress
  useEffect(() => {
    if (videoRef.current && currentProgress && currentProgress.progressSeconds > 0) {
      videoRef.current.currentTime = currentProgress.progressSeconds;
    }
  }, [currentProgress, signedUrl]);

  // Save progress periodically
  const saveProgress = useCallback(() => {
    if (videoRef.current && currentLessonId && course) {
      const seconds = Math.floor(videoRef.current.currentTime);
      const completed = videoRef.current.ended || (videoRef.current.duration > 0 && seconds >= videoRef.current.duration - 5);
      updateProgress.mutate({
        lessonId: currentLessonId,
        courseId: course.id,
        progressSeconds: seconds,
        completed,
      });
    }
  }, [currentLessonId, course]);

  useEffect(() => {
    const interval = setInterval(saveProgress, 15000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  // ── 影片額外保護：禁止拖曳 ──────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const preventDrag = (e: DragEvent) => e.preventDefault();
    video.addEventListener("dragstart", preventDrag);
    return () => video.removeEventListener("dragstart", preventDrag);
  }, [signedUrl?.url]);

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !currentLessonId || !course) return;
    const timestamp = videoRef.current ? Math.floor(videoRef.current.currentTime) : undefined;
    if (editingNoteId) {
      updateNote.mutate({ id: editingNoteId, content: noteContent });
    } else {
      createNote.mutate({ courseId: course.id, lessonId: currentLessonId, content: noteContent, videoTimestamp: timestamp });
    }
  };

  const handleEditNote = (note: { id: number; content: string }) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
  };

  const handleJumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">請先登入</h1>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>登入</Button>
        </div>
      </div>
    );
  }

  if (course && !enrollment?.enrolled && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">尚未購買此課程</h1>
          <Button onClick={() => setLocation(`/courses/${params.slug}`)}>前往購買</Button>
        </div>
      </div>
    );
  }

  const currentLesson = lessons?.find(l => l.id === currentLessonId);
  const completedLessons = progressData?.filter(p => p.completed).length ?? 0;
  const totalLessons = lessons?.length ?? 0;
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const completedSet = new Set(progressData?.filter(p => p.completed).map(p => p.lessonId));

  const toggleChapter = (id: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    // ── 保護容器：禁止選取文字 ────────────────────────────
    <div
      ref={protectedContainerRef}
      className="h-screen bg-background flex flex-col"
      style={{ userSelect: "none", WebkitUserSelect: "none" } as React.CSSProperties}
    >
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => { saveProgress(); setLocation(`/courses/${params.slug}`); }}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <span className="font-medium truncate">{course?.title}</span>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant={showNotes ? "default" : "outline"}
            size="sm"
            onClick={() => setShowNotes(!showNotes)}
            className="gap-1"
          >
            <StickyNote className="h-4 w-4" />
            <span className="hidden sm:inline">筆記</span>
          </Button>
          <span className="text-xs text-muted-foreground">{completedLessons}/{totalLessons} 完成</span>
          <Progress value={progressPercent} className="w-32 h-2" />
          <span className="text-xs font-medium text-primary">{progressPercent}%</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video player */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black flex items-center justify-center relative">
            {signedUrl?.url ? (
              <>
                <video
                  ref={videoRef}
                  key={signedUrl.url}
                  src={signedUrl.url}
                  controls
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  onEnded={saveProgress}
                  onPause={saveProgress}
                  className="w-full h-full"
                  style={{ pointerEvents: "auto" }}
                />
                {/* 浮水印 */}
                <VideoWatermark enabled={true} />
              </>
            ) : (
              <div className="text-muted-foreground text-center">
                <Play className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>選擇課時開始學習</p>
              </div>
            )}
          </div>
          {currentLesson && (
            <div className="p-4 border-t border-border bg-card/30">
              <h2 className="font-bold text-lg">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-sm text-muted-foreground mt-1">{currentLesson.description}</p>
              )}
            </div>
          )}
        </div>

        {/* Notes Panel — 筆記區允許文字選取 */}
        {showNotes && (
          <aside
            className="w-80 border-l border-border bg-card/30 shrink-0 flex flex-col"
            style={{ userSelect: "text", WebkitUserSelect: "text" } as React.CSSProperties}
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4" />課堂筆記
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotes(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* Note input */}
            <div className="p-3 border-b border-border space-y-2">
              <Textarea
                placeholder="在此記錄筆記... 會自動標記當前影片時間"
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                className="min-h-[80px] text-sm resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || createNote.isPending || updateNote.isPending}
                  className="flex-1"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {editingNoteId ? "更新筆記" : "新增筆記"}
                </Button>
                {editingNoteId && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingNoteId(null); setNoteContent(""); }}>
                    取消
                  </Button>
                )}
              </div>
            </div>
            {/* Notes list */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {lessonNotes?.map(note => (
                  <div key={note.id} className="p-3 rounded-lg bg-secondary/20 border border-border text-sm space-y-2">
                    {note.videoTimestamp != null && (
                      <button
                        onClick={() => handleJumpToTimestamp(note.videoTimestamp!)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(note.videoTimestamp)}
                      </button>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleEditNote(note)} className="text-xs text-muted-foreground hover:text-foreground">
                        編輯
                      </button>
                      <button
                        onClick={() => { if (confirm("確定刪除此筆記？")) deleteNote.mutate({ id: note.id }); }}
                        className="text-xs text-destructive hover:text-destructive/80"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))}
                {(!lessonNotes || lessonNotes.length === 0) && (
                  <p className="text-center py-8 text-muted-foreground text-sm">尚無筆記，開始記錄吧！</p>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Sidebar - lesson list */}
        <aside className="w-80 border-l border-border bg-card/30 shrink-0 hidden lg:flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold">課程內容</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {chapters?.map(ch => {
                const chLessons = lessons?.filter(l => l.chapterId === ch.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
                const isExpanded = expandedChapters.has(ch.id);
                return (
                  <div key={ch.id} className="mb-1">
                    <button
                      onClick={() => toggleChapter(ch.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors text-sm"
                    >
                      <span className="font-medium truncate">{ch.title}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="ml-2 space-y-0.5">
                        {chLessons.map(lesson => {
                          const isActive = lesson.id === currentLessonId;
                          const isCompleted = completedSet.has(lesson.id);
                          return (
                            <button
                              key={lesson.id}
                              onClick={() => { saveProgress(); setCurrentLessonId(lesson.id); }}
                              className={`w-full flex items-center gap-2 p-2.5 rounded-lg text-sm transition-colors ${
                                isActive ? "bg-primary/10 text-primary" : "hover:bg-secondary/30"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                              ) : isActive ? (
                                <Play className="h-4 w-4 text-primary shrink-0" />
                              ) : (
                                <Play className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="truncate text-left">{lesson.title}</span>
                              {lesson.isFreePreview && <Badge variant="outline" className="text-[10px] shrink-0">試看</Badge>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
