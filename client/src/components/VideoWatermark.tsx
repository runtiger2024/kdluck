import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";

interface VideoWatermarkProps {
  /** 是否顯示浮水印 */
  enabled?: boolean;
}

/**
 * 影片浮水印元件
 * - 顯示用戶 Email/ID 防止截圖外流
 * - 位置每 8 秒隨機移動，增加截圖難度
 * - 半透明低調設計，不影響觀看體驗
 */
export function VideoWatermark({ enabled = true }: VideoWatermarkProps) {
  const { user } = useAuth();
  const [position, setPosition] = useState({ top: "10%", left: "10%" });

  // 每 8 秒隨機移動浮水印位置
  useEffect(() => {
    if (!enabled) return;
    const positions = [
      { top: "8%", left: "8%" },
      { top: "8%", left: "60%" },
      { top: "75%", left: "8%" },
      { top: "75%", left: "60%" },
      { top: "40%", left: "35%" },
    ];
    let idx = 0;
    setPosition(positions[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setPosition(positions[idx]);
    }, 8000);
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || !user) return null;

  const displayText = user.email
    ? user.email.replace(/(.{3}).*(@.*)/, "$1***$2")
    : `ID:${user.id}`;

  return (
    <div
      className="absolute pointer-events-none z-10 transition-all duration-1000"
      style={{ top: position.top, left: position.left }}
    >
      <span
        className="text-white/20 text-xs font-mono select-none"
        style={{
          textShadow: "0 0 2px rgba(0,0,0,0.5)",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {displayText}
      </span>
    </div>
  );
}
