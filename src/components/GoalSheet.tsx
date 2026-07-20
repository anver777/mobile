"use client";

import { useEffect, useState } from "react";
import type { Goal } from "@/db/schema";
import { TIMEFRAMES, type TimeframeValue } from "@/lib/timeframes";

const EMOJIS = ["🎯","💪","📚","🏃","🧘","💧","🥗","😴","💼","💰","✍️","🎨","🎸","🧠","❤️","🌱","🏆","🔥","⭐","🚀","📖","💻","🏋️","🚴","🍎","🥦","🧹","📅","🗣️","🌍","✈️","🎓"];

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
  tf: { accent: string; glowRgb: string; label: string; icon: string };
  onClose: () => void;
  onSubmit: (draft: GoalDraft) => void;
}

export function GoalSheet({ open, editing, defaultTimeframe, tf, onClose, onSubmit }: GoalSheetProps) {
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
        setTitle(""); setNotes(""); setEmoji("🎯"); setTimeframe(defaultTimeframe);
      }
    }
  }, [open, editing, defaultTimeframe]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = title.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 mx-auto max-w-lg max-h-[90%] overflow-y-auto rounded-t-3xl bg-[#0c0c18] border-t border-white/[0.08]"
        style={{ animation: "sheetUp 0.3s ease" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">{editing ? "Изменить" : "Новая цель"}</h2>
            <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 text-white/60">✕</button>
          </div>

          {/* Emoji + Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shrink-0" style={{ border: `1px solid rgba(${tf.glowRgb},0.2)` }}>
              {emoji}
            </div>
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Что хотите достичь?"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30"
            />
          </div>

          {/* Emoji picker */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Иконка</div>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  key={em} type="button" onClick={() => setEmoji(em)}
                  className="h-10 rounded-xl flex items-center justify-center text-xl active:scale-90 transition-all"
                  style={{ background: emoji === em ? `rgba(${tf.glowRgb},0.2)` : "rgba(255,255,255,0.05)", border: emoji === em ? `1px solid ${tf.accent}` : "1px solid transparent" }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Заметки</div>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Детали, шаги..."
              rows={2}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none resize-none placeholder:text-white/30"
            />
          </div>

          {/* Timeframe */}
          {!editing && (
            <div className="mb-5">
              <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Период</div>
              <div className="grid grid-cols-4 gap-1.5">
                {TIMEFRAMES.map((t) => (
                  <button
                    key={t.value} type="button" onClick={() => setTimeframe(t.value)}
                    className="rounded-xl py-2.5 text-[12px] font-semibold active:scale-95 transition-all flex flex-col items-center gap-0.5"
                    style={timeframe === t.value ? { background: `${t.accent}20`, color: t.accent } : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                  >
                    <span className="text-base">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-xl bg-white/8 py-3.5 text-sm font-semibold text-white/60">Отмена</button>
            <button
              onClick={() => onSubmit({ title: title.trim(), notes: notes.trim(), emoji, timeframe })}
              disabled={!valid}
              className="flex-[1.5] rounded-xl py-3.5 text-sm font-bold text-[#000] disabled:opacity-30 active:scale-95 transition-all"
              style={{ background: tf.accent }}
            >
              {editing ? "Сохранить" : "Создать"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
