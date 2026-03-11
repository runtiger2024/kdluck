import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Star, Sparkles, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function MemberRecommend() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.recommend.getCourseRecommendations.useQuery();

  const levelLabel: Record<string, string> = { beginner: "入門", intermediate: "中級", advanced: "高級" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI 推薦課程
        </h1>
        <p className="text-muted-foreground mt-1">根據您的學習歷史，AI 為您精選推薦</p>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">AI 正在分析您的學習偏好...</p>
        </div>
      ) : (
        <>
          {data?.reason && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="text-sm"><Sparkles className="h-4 w-4 inline mr-1 text-primary" />{data.reason}</p>
              </CardContent>
            </Card>
          )}

          {data?.recommendations.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">{data?.reason || "暫無推薦"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.recommendations.map(course => (
                <Card key={course.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer" onClick={() => setLocation(`/courses/${course.slug}`)}>
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{levelLabel[course.level] ?? course.level}</Badge>
                        {course.avgRating && parseFloat(course.avgRating) > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            <span className="text-xs">{course.avgRating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-primary font-bold mt-2">
                        {parseFloat(course.price) === 0 ? "免費" : `NT$ ${course.price}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
