// Reworked from useClaudeScrollPinning (MIT); observes actual content height and respects user reading position.
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function usePinnedScroll() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const jumpToLatest = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    pinned.current = true; setShowJump(false);
    // Immediate alignment avoids a race between streaming updates and an in-flight smooth scroll.
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' });
  }, []);
  useEffect(() => {
    const el = viewportRef.current, content = contentRef.current;
    if (!el || !content) return;
    function scroll() {
      if (!el) return;
      pinned.current = el.scrollHeight - el.clientHeight - el.scrollTop <= 24;
      setShowJump(!pinned.current);
    }
    function unpin(e: WheelEvent) { if (e.deltaY < 0) pinned.current = false; }
    const observer = new ResizeObserver(() => {
      if (pinned.current) el.scrollTop = el.scrollHeight;
      else setShowJump(el.scrollHeight - el.clientHeight - el.scrollTop > 24);
    });
    el.addEventListener('scroll', scroll, { passive: true });
    el.addEventListener('wheel', unpin, { passive: true });
    observer.observe(content); observer.observe(el);
    el.scrollTop = el.scrollHeight;
    return () => { observer.disconnect(); el.removeEventListener('scroll', scroll); el.removeEventListener('wheel', unpin); };
  }, []);
  return { viewportRef, contentRef, showJump, jumpToLatest };
}
