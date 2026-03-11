import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StickyNote, Clock, BookOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function MemberNotes() {
  const [, setLocation] = useLocation();
  const { data: notes, refetch } = trpc.note.all.useQuery();
  const { data: courses } = trpc.enrollment.myCourses.useQuery();
  const deleteNote = trpc.note.delete.useMutation({ onSuccess: () => { refetch(); toast.success("筆記已刪除"); } });

  const formatTimestamp = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCourseTitle = (courseId: number) => {
    const course = courses?.find(c => c.id === courseId);
    return course?.title ?? "未知課程";
  };

  const getCourseSlug = (courseId: number) => {
    const course = courses?.find(c => c.id === courseId);
    return course?.slug;
  };

  // Group notes by course
  const grouped = notes?.reduce((acc, note) => {
    if (!acc[note.courseId]) acc[note.courseId] = [];
    acc[note.courseId].push(note);
    return acc;
  }, {} as Record<number, typeof notes>) ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">我的筆記</h1>
        <p className="text-muted-foreground mt-1">在學習過程中記錄的所有筆記</p>
      </div>

      {(!notes || notes.length === 0) && (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">尚無筆記</p>
            <p className="text-sm text-muted-foreground mt-1">在學習課程時，點擊「筆記」按鈕即可開始記錄</p>
          </CardContent>
        </Card>
      )}

      {Object.entries(grouped).map(([courseIdStr, courseNotes]) => {
        const courseId = parseInt(courseIdStr);
        const slug = getCourseSlug(courseId);
        return (
          <Card key={courseId} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{getCourseTitle(courseId)}</CardTitle>
                <Badge variant="secondary">{courseNotes?.length ?? 0} 則</Badge>
              </div>
              {slug && (
                <Button variant="outline" size="sm" onClick={() => setLocation(`/learn/${slug}`)}>
                  前往學習
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {courseNotes?.map(note => (
                <div key={note.id} className="p-3 rounded-lg bg-secondary/20 border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      {note.videoTimestamp != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(note.videoTimestamp)}
                        </span>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(note.createdAt).toLocaleDateString("zh-TW")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive shrink-0"
                      onClick={() => { if (confirm("確定刪除此筆記？")) deleteNote.mutate({ id: note.id }); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
