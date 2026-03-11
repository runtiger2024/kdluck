import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Star, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Courses() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const params = useMemo(() => new URLSearchParams(searchParams), [searchParams]);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [categoryId, setCategoryId] = useState(params.get("category") ?? "all");
  const [page, setPage] = useState(1);

  const { data: categoriesList } = trpc.category.list.useQuery();
  const { data, isLoading } = trpc.course.published.useQuery({
    search: search || undefined,
    categoryId: categoryId !== "all" ? parseInt(categoryId) : undefined,
    page,
    limit: 12,
  });

  const levelLabel: Record<string, string> = { beginner: "入門", intermediate: "中級", advanced: "高級" };

  useEffect(() => {
    const catParam = params.get("category");
    if (catParam) setCategoryId(catParam);
  }, [params]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="py-12 bg-cinematic-hero">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">課程目錄</h1>
          <p className="text-muted-foreground">探索所有課程，找到最適合您的學習路徑</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋課程..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Select value={categoryId} onValueChange={v => { setCategoryId(v); setPage(1); }}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="所有分類" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分類</SelectItem>
                {categoriesList?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <div className="aspect-video bg-secondary/50" />
                  <CardContent className="p-5 space-y-3">
                    <div className="h-5 bg-secondary/50 rounded w-3/4" />
                    <div className="h-4 bg-secondary/50 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">沒有找到符合條件的課程</p>
              <Button variant="link" className="mt-2 text-primary" onClick={() => { setSearch(""); setCategoryId("all"); }}>清除篩選</Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">共 {data?.total ?? 0} 門課程</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.items.map(course => (
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
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                      {course.subtitle && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.subtitle}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {course.avgRating && parseFloat(course.avgRating) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              <span className="text-sm font-medium">{course.avgRating}</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">{course.enrollmentCount} 人</span>
                        </div>
                        <div>
                          {parseFloat(course.price) === 0 ? (
                            <span className="text-lg font-bold text-primary">免費</span>
                          ) : (
                            <span className="text-lg font-bold text-primary">NT$ {course.price}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {data && data.total > 12 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
                  <span className="text-sm text-muted-foreground self-center">第 {page} 頁</span>
                  <Button variant="outline" size="sm" disabled={page * 12 >= data.total} onClick={() => setPage(p => p + 1)}>下一頁</Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
