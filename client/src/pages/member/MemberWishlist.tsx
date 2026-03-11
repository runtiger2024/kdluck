import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Heart, Trash2, Star } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function MemberWishlist() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.wishlist.list.useQuery();
  const removeMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      utils.wishlist.list.invalidate();
      toast.success("已從願望清單移除");
    },
  });

  const levelLabel: Record<string, string> = { beginner: "入門", intermediate: "中級", advanced: "高級" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">願望清單</h1>
        <span className="text-sm text-muted-foreground">{items?.length ?? 0} 門課程</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card border-border animate-pulse">
              <CardContent className="p-4 flex gap-4">
                <div className="w-32 h-20 bg-secondary/50 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary/50 rounded w-3/4" />
                  <div className="h-3 bg-secondary/50 rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg mb-2">願望清單是空的</p>
          <p className="text-sm mb-4">瀏覽課程目錄，將感興趣的課程加入願望清單</p>
          <Button onClick={() => setLocation("/courses")}>瀏覽課程</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => (
            <Card key={item.id} className="bg-card border-border hover:border-primary/30 transition-all overflow-hidden group">
              <CardContent className="p-0">
                <div className="flex">
                  <div
                    className="w-36 h-24 shrink-0 bg-secondary/50 overflow-hidden cursor-pointer"
                    onClick={() => setLocation(`/courses/${item.courseSlug}`)}
                  >
                    {item.coverImageUrl ? (
                      <img src={item.coverImageUrl} alt={item.courseTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                        <BookOpen className="h-8 w-8 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <h3
                        className="font-semibold text-sm line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setLocation(`/courses/${item.courseSlug}`)}
                      >
                        {item.courseTitle}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{levelLabel[item.level] ?? item.level}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-primary">
                        {parseFloat(item.price) === 0 ? "免費" : `NT$ ${item.price}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive h-7 px-2"
                        onClick={() => removeMutation.mutate({ courseId: item.courseId })}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />移除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
