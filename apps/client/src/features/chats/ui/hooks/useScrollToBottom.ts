import React from 'react';

/** How far from the end can still count as "at the bottom". */
const THRESHOLD_PX = 80;

/**
 * The thread follows new messages only if you were already at the bottom. If
 * you scrolled up to read, it does not drag you: it counts the new ones to show
 * them on the scroll-down button.
 */
export function useScrollToBottom(messageCount: number) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const atBottomRef = React.useRef(true);
  const previousCountRef = React.useRef(0);
  const [atBottom, setAtBottom] = React.useState(true);
  const [newOnes, setNewOnes] = React.useState(0);

  const scrollToBottom = React.useCallback((smooth = true): void => {
    const container = containerRef.current;
    container?.scrollTo?.({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    atBottomRef.current = true;
    setAtBottom(true);
    setNewOnes(0);
  }, []);

  const onScroll = React.useCallback((): void => {
    const container = containerRef.current;
    if (!container) return;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAtBottom = distance < THRESHOLD_PX;
    atBottomRef.current = isAtBottom;
    setAtBottom(isAtBottom);
    if (isAtBottom) setNewOnes(0);
  }, []);

  React.useEffect(() => {
    const added = messageCount - previousCountRef.current;
    const firstLoad = previousCountRef.current === 0;
    previousCountRef.current = messageCount;
    if (added <= 0) return;
    if (firstLoad) scrollToBottom(false);
    else if (atBottomRef.current) scrollToBottom();
    else setNewOnes((n) => n + added);
  }, [messageCount, scrollToBottom]);

  return { containerRef, atBottom, newOnes, onScroll, scrollToBottom };
}
