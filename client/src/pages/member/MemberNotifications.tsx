import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Trash2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

const typeLabels: Record<string, string> = {
  system: "系統通知",
  order: "訂單通知",
  course: "課程通知",
  promotion: "優惠活動",
  review: "評價通知",
  certificate: "證書通知",
};

const typeColors: Record<string, string> = {
  system: "bg-blue-500/10 text-blue-500",
  order: "bg-green-500/10 text-green-500",
  course: "bg-purple-500/10 text-purple-500",
  promotion: "bg-orange-500/10 text-orange-500",
  review: "bg-yellow-500/10 text-yellow-500",
  certificate: "bg-emerald-500/10 text-emerald-500",
};

export default function MemberNotifications() {
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();
  const limit = 20;

  const { data, isLoading, refetch } = trpc.inAppNotif.list.useQuery({ page, limit });
  const { data: unreadCount = 0 } = trpc.inAppNotif.unreadCount.useQuery();

  const markRead = trpc.inAppNotif.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.inAppNotif.markAllRead.useMutation({ onSuccess: () => refetch() });
  const deleteNotif = trpc.inAppNotif.delete.useMutation({ onSuccess: () => refetch() });

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">通知中心</h1>
          <p className="text-muted-foreground text-sm mt-1">
            共 {total} 則通知，{unreadCount} 則未讀
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-2" />
            全部標為已讀
          </Button>
        )}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">暫無通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Card
              key={n.id}
              className={`transition-all hover:shadow-md cursor-pointer group ${
                !n.isRead ? "border-orange-500/30 bg-orange-500/5" : ""
              }`}
              onClick={() => {
                if (!n.isRead) markRead.mutate({ id: n.id });
                if (n.link) {
                  if (n.link.startsWith("http")) {
                    window.open(n.link, "_blank");
                  } else {
                    navigate(n.link);
                  }
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Unread indicator */}
                  <div className="mt-1.5">
                    {!n.isRead ? (
                      <span className="h-2.5 w-2.5 rounded-full bg-orange-500 block" />
                    ) : (
                      <span className="h-2.5 w-2.5 rounded-full bg-transparent block" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={`text-xs ${typeColors[n.type] || ""}`}>
                        {typeLabels[n.type] || n.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("zh-TW")}
                      </span>
                    </div>
                    <h3 className={`text-sm font-medium ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{n.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {n.link && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotif.mutate({ id: n.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 頁
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
