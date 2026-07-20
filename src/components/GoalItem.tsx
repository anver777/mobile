import { useEffect, useRef, useState } from "react";
import type { Goal } from "@/db/schema";
import type { TimeframeConfig } from "@/lib/timeframes";

interface GoalItemProps {
  goal: Goal;
  tf: TimeframeConfig;
  onToggle: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
  style?: React.CSSProperties;
}

export function GoalItem({
  goal,
  tf,
  onToggle,
  onEdit,
  onDelete,
  style,
}: GoalItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [hover, setHover] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  function handleDelete() {
    if (confirming) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      onDelete(goal);
    } else {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
    }
  }

  const glowSoft = `rgba(${tf.glowRgb},0.18)`;
  const glowMed = `rgba(${tf.glowRgb},0.45)`;
  const borderOn = `rgba(${tf.glowRgb},0.55)`;
  const borderOff = "rgba(255,255,255,0.08)";

  return (
    <div
      className="group relative flex items-start gap-3 rounded-2xl border p-3.5 backdrop-blur-sm transition-all duration-300"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: goal.completed ? borderOn : hover ? borderOff : "rgba(255,255,255,0.06)",
        boxShadow: goal.completed
          ? `0 0 20px ${glowSoft}, inset 0 0 16px rgba(${tf.glowRgb},0.04)`
          : hover
            ? `0 0 18px rgba(255,255,255,0.05)`
            : "none",
        ...style,
      }}
    >
      {/* checkbox */}
      <button
        type="button"
        onClick={() => onToggle(goal)}
        aria-label={goal.completed ? "Снять отметку" : "Отметить выполненным"}
        className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-75"
        style={{
          borderColor: goal.completed ? tf.accent : "rgba(255,255,255,0.25)",
          backgroundColor: goal.completed ? tf.accent : "transparent",
          boxShadow: goal.completed ? `0 0 14px ${glowMed}` : "none",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 transition-all duration-200 ${
            goal.completed ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          fill="none"
          stroke="#05050f"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* content */}
      <button
        type="button"
        onClick={() => onEdit(goal)}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{goal.emoji}</span>
          <span
            className="truncate text-[15px] font-semibold leading-snug transition-all duration-300"
            style={{
              color: goal.completed ? tf.accent : "#e8e8ff",
              textShadow: goal.completed
                ? `0 0 12px ${glowMed}`
                : "none",
              textDecoration: goal.completed ? "line-through" : "none",
              opacity: goal.completed ? 0.85 : 1,
            }}
          >
            {goal.title}
          </span>
        </div>
        {goal.notes ? (
          <p
            className="mt-1 line-clamp-2 text-[13px] leading-snug transition-colors duration-300"
            style={{ color: "rgba(232,232,255,0.45)" }}
          >
            {goal.notes}
          </p>
        ) : null}
      </button>

      {/* actions */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label="Редактировать"
          className="flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90"
          style={{ color: "rgba(232,232,255,0.5)" }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Удалить"
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90 ${
            confirming ? "" : "hover:scale-110"
          }`}
          style={
            confirming
              ? {
                  background: "#ff2d6f",
                  color: "#05050f",
                  boxShadow: "0 0 14px rgba(255,45,111,0.6)",
                }
              : { color: "rgba(232,232,255,0.5)" }
          }
        >
          {confirming ? (
            <span className="text-[10px] font-bold">OK?</span>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
