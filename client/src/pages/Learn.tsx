import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, CheckCircle, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { getLoginUrl } from "@/const";

export default function Learn() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  const { data: course } = trpc.course.getBySlug.useQuery({ slug: params.slug ?? "" });
  const { data: enrollment } = trpc.enrollment.check.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course && !!user });
  const { data: chapters } = trpc.chapter.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: lessons } = trpc.lesson.listByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course });
  const { data: progressData } = trpc.progress.getByCourse.useQuery({ courseId: course?.id ?? 0 }, { enabled: !!course && !!user });
  const { data: signedUrl } = trpc.lesson.getSignedUrl.useQuery({ lessonId: currentLessonId ?? 0 }, { enabled: !!currentLessonId && !!user });
  const { data: currentProgress } = trpc.progress.getByLesson.useQuery({ lessonId: currentLessonId ?? 0 }, { enabled: !!currentLessonId && !!user });

  const updateProgress = trpc.progress.update.useMutation();

  // Auto-select first lesson
  useEffect(() => {
    if (lessons && lessons.length > 0 && !currentLessonId) {
      const sorted = [...lessons].sort((a, b) => a.sortOrder - b.sortOrder);
      setCurrentLessonId(sorted[0].id);
      // Expand all chapters by default
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
    const interval = setInterval(saveProgress, 15000); // Save every 15s
    return () => clearInterval(interval);
  }, [saveProgress]);

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
    <div className="h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => { saveProgress(); setLocation(`/courses/${params.slug}`); }}>
          <ArrowLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <span className="font-medium truncate">{course?.title}</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{completedLessons}/{totalLessons} 完成</span>
          <Progress value={progressPercent} className="w-32 h-2" />
          <span className="text-xs font-medium text-primary">{progressPercent}%</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Video player */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-black flex items-center justify-center">
            {signedUrl?.url ? (
              <video
                ref={videoRef}
                key={signedUrl.url}
                src={signedUrl.url}
                controls
                controlsList="nodownload"
                onContextMenu={e => e.preventDefault()}
                onEnded={saveProgress}
                onPause={saveProgress}
                className="w-full h-full"
              />
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
              {currentLesson.description && <p className="text-sm text-muted-foreground mt-1">{currentLesson.description}</p>}
            </div>
          )}
        </div>

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
