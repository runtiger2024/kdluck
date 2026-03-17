import { useEffect, useRef } from "react";

/**
 * 課程內容保護 Hook
 * - 禁止文字選取與複製
 * - 攔截危險鍵盤快捷鍵（Ctrl+S, Ctrl+U, Ctrl+P, F12, Ctrl+Shift+I 等）
 * - 禁用右鍵選單
 */
export function useContentProtection(enabled = true) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 攔截 Ctrl+S（儲存）、Ctrl+U（檢視原始碼）、Ctrl+P（列印）
      if (e.ctrlKey && ["s", "u", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      // 攔截 Ctrl+Shift+I / Ctrl+Shift+J（開發者工具）
      if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      // 攔截 F12（開發者工具）
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      // 攔截 Ctrl+A（全選）在課程內容區域
      if (e.ctrlKey && e.key.toLowerCase() === "a") {
        const target = e.target as HTMLElement;
        // 允許在輸入框和 textarea 中全選（如筆記區）
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // 只在課程內容容器內禁用右鍵
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      // 只在課程內容容器內禁止複製
      if (containerRef.current?.contains(e.target as Node)) {
        // 允許在輸入框和 textarea 中複製（如筆記區）
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
      }
    };

    const handleSelectStart = (e: Event) => {
      // 只在課程內容容器內禁止選取
      if (containerRef.current?.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("selectstart", handleSelectStart);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("selectstart", handleSelectStart);
    };
  }, [enabled]);

  return containerRef;
}
