import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '../../utils/classNames.js';

export default function VirtualizedMessageList({
  messages,
  renderMessage,
  hasMore,
  onLoadMore,
  loading,
  emptyState,
  className,
}) {
  const containerRef = useRef(null);
  const topSentinelRef = useRef(null);
  const previousLengthRef = useRef(messages.length);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || !onLoadMore || loadingMore) {
      return;
    }

    const container = containerRef.current;
    const previousHeight = container?.scrollHeight ?? 0;
    const previousTop = container?.scrollTop ?? 0;

    setLoadingMore(true);
    try {
      await onLoadMore();
      if (!container) {
        return;
      }
      requestAnimationFrame(() => {
        const newHeight = container.scrollHeight;
        const delta = newHeight - previousHeight;
        if (delta > 0) {
          container.scrollTop = previousTop + delta;
        }
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, onLoadMore, loadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    if (loading) {
      return;
    }
    const previousLength = previousLengthRef.current;
    previousLengthRef.current = messages.length;
    if (messages.length === 0) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    if (messages.length <= previousLength) {
      return;
    }
    const distanceFromBottom = container.scrollHeight - (container.scrollTop + container.clientHeight);
    if (distanceFromBottom < 160) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!hasMore || !onLoadMore) {
      return () => {};
    }
    const sentinel = topSentinelRef.current;
    const container = containerRef.current;
    if (!sentinel || !container) {
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      { root: container, threshold: 1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, onLoadMore]);

  const content = useMemo(() => {
    if (!messages.length && !loading) {
      return emptyState ?? null;
    }
    return messages.map((message) => renderMessage(message));
  }, [messages, renderMessage, emptyState, loading]);

  return (
    <div
      ref={containerRef}
      className={classNames('relative max-h-[32rem] space-y-4 overflow-y-auto pr-2', className)}
      role="log"
      aria-live="polite"
    >
      <div ref={topSentinelRef} aria-hidden="true" />
      {hasMore ? (
        <div className="flex justify-center py-2 text-[11px] text-slate-400" aria-hidden="true">
          {loadingMore ? 'Loading earlier messages…' : 'Scroll up to load earlier messages'}
        </div>
      ) : null}
      {content}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-16 rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}
    </div>
  );
}
