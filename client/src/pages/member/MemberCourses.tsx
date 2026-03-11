import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play } from "lucide-react";
import { useLocation } from "wouter";

export default function MemberCourses() {
  const [, setLocation] = useLocation();
  const { data: courses, isLoading } = trpc.enrollment.myCourses.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">我的課程</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-5"><div className="h-20 bg-secondary/50 rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-4">您尚未購買任何課程</p>
          <Button onClick={() => setLocation("/courses")}>探索課程</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses?.map(course => (
            <Card key={course.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer" onClick={() => setLocation(`/learn/${course.slug}`)}>
              <CardContent className="p-5 flex gap-4">
                <div className="w-32 h-20 rounded-lg bg-secondary/50 overflow-hidden shrink-0">
                  {course.coverImageUrl ? (
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <BookOpen className="h-8 w-8 text-primary/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{course.totalLessons} 堂課</p>
                  <Button size="sm" className="mt-2" variant="outline">
                    <Play className="h-3 w-3 mr-1" />繼續學習
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
