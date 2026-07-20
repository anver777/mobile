"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  color?: string;
}

export function PullToRefresh({ onRefresh, children, color = "#00ffa3" }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleTouchStart(e: TouchEvent) {
      if (window.scrollY === 0 && !refreshing) {
        startY.current = e.touches[0].clientY;
        setPulling(true);
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!pulling || refreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = Math.max(0, currentY - startY.current);
      const resistance = diff * 0.5;
      setPullDistance(Math.min(resistance, 120));
    }

    function handleTouchEnd() {
      if (!pulling) return;
      setPulling(false);
      if (pullDistance >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          setRefreshing(false);
          setPullDistance(0);
        });
      } else {
        setPullDistance(0);
      }
    }

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: true });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, refreshing, pullDistance, onRefresh]);

  const showIndicator = pullDistance > 0 || refreshing;
  const rotation = refreshing ? 360 : pullDistance * 3;

  return (
    <div ref={containerRef} className="relative">
      {showIndicator && (
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
          style={{
            top: `${Math.max(-60, pullDistance - 60)}px`,
            transition: pulling ? "none" : "top 0.3s ease",
          }}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xl"
            style={{
              background: "rgba(10,10,26,0.9)",
              border: `2px solid ${color}`,
              boxShadow: `0 0 16px ${color}`,
              transform: `rotate(${rotation}deg)`,
              transition: refreshing ? "transform 1s linear" : "none",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
      )}
      <div
        style={{
          transform: `translateY(${pulling || refreshing ? pullDistance * 0.3 : 0}px)`,
          transition: pulling ? "none" : "transform 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
