import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AdminReviews() {
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data, isLoading } = trpc.reviewAdmin.all.useQuery({ page, limit: 20 });
  const deleteMutation = trpc.reviewAdmin.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      toast.success("評價已刪除");
      setDeleteTarget(null);
      utils.reviewAdmin.all.invalidate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">評價管理</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">查看與管理學員課程評價</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" />所有評價</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : !data?.items.length ? (
            <div className="text-center py-8 text-muted-foreground">尚無評價</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>用戶</TableHead>
                      <TableHead>課程</TableHead>
                      <TableHead>評分</TableHead>
                      <TableHead>評論</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((review: any) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.userName || `用戶 #${review.userId}`}</TableCell>
                        <TableCell>{review.courseTitle || `課程 #${review.courseId}`}</TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{review.comment || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("zh-TW")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(review)}><Trash2 className="h-3 w-3 mr-1" />刪除</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {data.items.map((review: any) => (
                  <div key={review.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{review.userName || `用戶 #${review.userId}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{review.courseTitle || `課程 #${review.courseId}`}</p>
                      </div>
                      <div className="shrink-0">{renderStars(review.rating)}</div>
                    </div>
                    {review.comment && <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("zh-TW")}</span>
                      <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => setDeleteTarget(review)}><Trash2 className="h-3 w-3 mr-1" />刪除</Button>
                    </div>
                  </div>
                ))}
              </div>
              {data.total > 20 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一頁</Button>
                  <span className="text-sm text-muted-foreground py-2">第 {page} 頁</span>
                  <Button variant="outline" size="sm" disabled={data.items.length < 20} onClick={() => setPage(p => p + 1)}>下一頁</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-full">
          <DialogHeader><DialogTitle>確認刪除評價</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">
            確定要刪除此評價嗎？此操作無法復原。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
