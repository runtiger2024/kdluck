import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";

const typeIcons: Record<string, string> = {
  system: "🔔",
  order: "🛒",
  course: "📚",
  promotion: "🏷️",
  review: "⭐",
  certificate: "🎓",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const { data: unreadCount = 0 } = trpc.inAppNotif.unreadCount.useQuery(undefined, {
    refetchInterval: 30000, // 每 30 秒刷新
  });

  const { data: notifData, refetch } = trpc.inAppNotif.list.useQuery(
    { page: 1, limit: 10 },
    { enabled: open }
  );

  const markRead = trpc.inAppNotif.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllRead = trpc.inAppNotif.markAllRead.useMutation({
    onSuccess: () => refetch(),
  });
  const deleteNotif = trpc.inAppNotif.delete.useMutation({
    onSuccess: () => refetch(),
  });

  // 點擊外部關閉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const notifications = notifData?.items ?? [];

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs bg-red-500 text-white border-0">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-popover text-popover-foreground border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">通知中心</h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => markAllRead.mutate()}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  全部已讀
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => { setOpen(false); navigate("/member/notifications"); }}
              >
                查看全部
              </Button>
            </div>
          </div>

          {/* Notification List */}
          <ScrollArea className="max-h-96">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                暫無通知
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group ${
                      !n.isRead ? "bg-orange-500/5" : ""
                    }`}
                    onClick={() => {
                      if (!n.isRead) markRead.mutate({ id: n.id });
                      if (n.link) {
                        setOpen(false);
                        if (n.link.startsWith("http")) {
                          window.open(n.link, "_blank");
                        } else {
                          navigate(n.link);
                        }
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleString("zh-TW")}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {n.link && (
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotif.mutate({ id: n.id });
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
