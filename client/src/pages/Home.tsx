import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { BookOpen, Play, Star, Users, ChevronRight, Sparkles, Megaphone, AlertTriangle, Tag, Wrench, X } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: coursesData } = trpc.course.published.useQuery({ limit: 6 });
  const { data: categoriesList } = trpc.category.list.useQuery();
  const { data: siteConfig } = trpc.siteConfig.get.useQuery();
  const { data: activeAnnouncements } = trpc.announcement.active.useQuery();
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>([]);

  const levelLabel: Record<string, string> = { beginner: "入門", intermediate: "中級", advanced: "高級" };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Announcements Banner */}
      {activeAnnouncements && activeAnnouncements.length > 0 && (
        <div className="bg-card border-b border-border">
          <div className="container py-2 space-y-1">
            {activeAnnouncements.filter(a => !dismissedAnnouncements.includes(a.id)).slice(0, 3).map(a => {
              const typeIcon: Record<string, React.ReactNode> = {
                info: <Megaphone className="h-4 w-4 text-blue-400" />,
                warning: <AlertTriangle className="h-4 w-4 text-yellow-400" />,
                promotion: <Tag className="h-4 w-4 text-green-400" />,
                maintenance: <Wrench className="h-4 w-4 text-orange-400" />,
              };
              return (
                <div key={a.id} className="flex items-center gap-3 text-sm py-1">
                  {typeIcon[a.type] ?? typeIcon.info}
                  <span className="font-medium">{a.title}</span>
                  <span className="text-muted-foreground line-clamp-1 flex-1">{a.content}</span>
                  <button onClick={() => setDismissedAnnouncements(prev => [...prev, a.id])} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-cinematic-hero min-h-[80vh] flex items-center">
        {/* Geometric decorations */}
        <div className="absolute top-20 left-10 w-32 h-32 border border-accent/20 rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/20 rotate-45" />
        <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-primary rounded-full animate-ping" />
        <div className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-accent rounded-full opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        <div className="container relative z-10 py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="border-primary/30 text-primary px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-1" />
              {siteConfig?.site_description || "打開知識的大門，開啟無限可能"}
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
              <span className="text-foreground">探索</span>
              <span className="text-gradient-orange">無限</span>
              <br />
              <span className="text-foreground">學習可能</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              由頂尖講師精心打造的線上課程，從入門到精通，
              讓每一次學習都成為改變人生的契機。
            </p>

            <div className="flex items-center justify-center gap-4">
              <Button size="lg" className="px-8 py-6 text-lg font-semibold glow-orange" onClick={() => setLocation("/courses")}>
                <Play className="h-5 w-5 mr-2" />
                探索課程
              </Button>
              {!user && (
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-accent/30 hover:bg-accent/10" onClick={() => { window.location.href = getLoginUrl(); }}>
                  免費註冊
                </Button>
              )}
            </div>

            <div className="flex items-center justify-center gap-8 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /><span>精選課程</span></div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" /><span>專業講師</span></div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><span>終身學習</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categoriesList && categoriesList.length > 0 && (
        <section className="py-20 bg-cinematic">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">課程分類</h2>
              <p className="text-muted-foreground">選擇您感興趣的領域，開始學習之旅</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categoriesList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setLocation(`/courses?category=${cat.id}`)}
                  className="group p-6 rounded-xl bg-card/50 border border-border hover:border-primary/30 hover:bg-card transition-all text-center"
                >
                  <div className="text-3xl mb-3">{cat.iconUrl || "📚"}</div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.name}</h3>
                  {cat.description && <p className="text-xs text-muted-foreground mt-1">{cat.description}</p>}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">精選課程</h2>
              <p className="text-muted-foreground">最受歡迎的課程，助您快速成長</p>
            </div>
            <Button variant="ghost" className="text-primary" onClick={() => setLocation("/courses")}>
              查看全部 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesData?.items.map(course => (
              <Card
                key={course.id}
                className="group bg-card border-border hover:border-primary/30 transition-all overflow-hidden cursor-pointer"
                onClick={() => setLocation(`/courses/${course.slug}`)}
              >
                <div className="aspect-video bg-secondary/50 relative overflow-hidden">
                  {course.coverImageUrl ? (
                    <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                      <BookOpen className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">{levelLabel[course.level] ?? course.level}</Badge>
                  </div>
                  {course.originalPrice && parseFloat(course.originalPrice) > parseFloat(course.price) && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-destructive">優惠中</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                  {course.subtitle && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.subtitle}</p>}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {course.avgRating && parseFloat(course.avgRating) > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="text-sm font-medium">{course.avgRating}</span>
                          <span className="text-xs text-muted-foreground">({course.ratingCount})</span>
                        </div>
                      ) : null}
                      <span className="text-xs text-muted-foreground">{course.enrollmentCount} 人學習</span>
                    </div>
                    <div className="text-right">
                      {parseFloat(course.price) === 0 ? (
                        <span className="text-lg font-bold text-primary">免費</span>
                      ) : (
                        <div>
                          {course.originalPrice && parseFloat(course.originalPrice) > parseFloat(course.price) && (
                            <span className="text-xs text-muted-foreground line-through mr-2">NT$ {course.originalPrice}</span>
                          )}
                          <span className="text-lg font-bold text-primary">NT$ {course.price}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!coursesData?.items || coursesData.items.length === 0) && (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">課程即將上架，敬請期待</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-cinematic-hero">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">準備好開始學習了嗎？</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">加入我們，與數千名學員一起探索知識的無限可能</p>
          <Button size="lg" className="px-10 py-6 text-lg font-semibold glow-orange" onClick={() => setLocation("/courses")}>
            立即開始
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
