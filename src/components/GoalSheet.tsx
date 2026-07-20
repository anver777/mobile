import { useEffect, useState } from "react";
import type { Goal } from "@/db/schema";
import {
  TIMEFRAMES,
  type TimeframeValue,
  type TimeframeConfig,
} from "@/lib/timeframes";

const EMOJIS = [
  "🎯", "💪", "📚", "🏃", "🧘", "💧", "🥗", "😴",
  "💼", "💰", "✍️", "🎨", "🎸", "🧠", "❤️", "🌱",
  "🏆", "🔥", "⭐", "🚀", "📖", "💻", "🏋️", "🚴",
  "🍎", "🥦", "🧹", "📅", "🗣️", "🌍", "✈️", "🎓",
];

export interface GoalDraft {
  title: string;
  notes: string;
  emoji: string;
  timeframe: TimeframeValue;
}

interface GoalSheetProps {
  open: boolean;
  editing: Goal | null;
  defaultTimeframe: TimeframeValue;
  tf: TimeframeConfig;
  onClose: () => void;
  onSubmit: (draft: GoalDraft) => void;
}

export function GoalSheet({
  open,
  editing,
  defaultTimeframe,
  tf,
  onClose,
  onSubmit,
}: GoalSheetProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [timeframe, setTimeframe] = useState<TimeframeValue>(defaultTimeframe);

  useEffect(() => {
    if (open) {
      if (editing) {
        setTitle(editing.title);
        setNotes(editing.notes ?? "");
        setEmoji(editing.emoji);
        setTimeframe(editing.timeframe as TimeframeValue);
      } else {
        setTitle("");
        setNotes("");
        setEmoji("🎯");
        setTimeframe(defaultTimeframe);
      }
    }
  }, [open, editing, defaultTimeframe]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = title.trim().length > 0;
  const glowMed = `rgba(${tf.glowRgb},0.5)`;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ title: title.trim(), notes: notes.trim(), emoji, timeframe });
  }

  const inputClass =
    "min-w-0 flex-1 rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3.5 text-[15px] font-medium text-slate-50 outline-none transition-colors placeholder:text-slate-500 focus:bg-[rgba(255,255,255,0.07)]";

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-[#04040c]/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* sheet */}
      <form
        onSubmit={handleSubmit}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl max-h-[92%] overflow-y-auto rounded-t-[28px] border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a18]/95 px-5 pb-8 pt-3 backdrop-blur-xl sm:pb-8"
        style={{
          animation: "sheetUp 0.32s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 -2px 30px ${glowMed}`,
        }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="mb-5 flex items-center justify-between">
          <h2
            className="text-lg font-bold text-white"
            style={{ textShadow: `0 0 16px ${glowMed}` }}
          >
            {editing ? "Редактировать цель" : "Новая цель"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20"
            aria-label="Закрыть"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* emoji + title */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[rgba(255,255,255,0.05)] text-3xl ring-1 ring-[rgba(255,255,255,0.1)]"
            style={{ boxShadow: `0 0 18px rgba(${tf.glowRgb},0.25)` }}
          >
            {emoji}
          </div>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Что хотите достичь?"
            className={inputClass}
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* emoji picker */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Иконка
          </p>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJIS.map((em) => {
              const active = emoji === em;
              return (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className="flex h-9 items-center justify-center rounded-xl text-xl transition-all active:scale-90"
                  style={
                    active
                      ? {
                          background: `rgba(${tf.glowRgb},0.18)`,
                          boxShadow: `0 0 12px ${glowMed}`,
                          border: `1px solid ${tf.accent}`,
                        }
                      : { background: "rgba(255,255,255,0.04)" }
                  }
                >
                  {em}
                </button>
              );
            })}
          </div>
        </div>

        {/* notes */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Заметки (необязательно)
          </p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Детали, шаги, мотивация..."
            rows={2}
            className="w-full resize-none rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-slate-50 outline-none transition-colors placeholder:text-slate-500 focus:bg-[rgba(255,255,255,0.07)]"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* timeframe selector */}
        {!editing && (
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Период
            </p>
            <div className="grid grid-cols-4 gap-2">
              {TIMEFRAMES.map((t) => {
                const active = timeframe === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTimeframe(t.value)}
                    className="flex flex-col items-center gap-1 rounded-2xl border py-2.5 text-xs font-semibold transition-all"
                    style={
                      active
                        ? {
                            borderColor: t.accent,
                            background: `rgba(${t.glowRgb},0.16)`,
                            color: "#fff",
                            boxShadow: `0 0 16px rgba(${t.glowRgb},0.4)`,
                          }
                        : {
                            borderColor: "rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.04)",
                            color: "rgba(232,232,255,0.6)",
                          }
                    }
                  >
                    <span className="text-base leading-none">{t.icon}</span>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-white/8 py-3.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/14"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!valid}
            className="flex-[1.4] rounded-2xl py-3.5 text-sm font-bold text-[#05050f] transition-all active:scale-[0.98] disabled:opacity-30"
            style={{
              background: tf.accent,
              boxShadow: valid ? `0 0 24px ${glowMed}` : "none",
            }}
          >
            {editing ? "Сохранить" : "Добавить цель"}
          </button>
        </div>
      </form>
    </div>
  );
}
