"use client";

import { useEffect, useState } from "react";
import type { Note } from "@/db/schema";

interface NoteColor {
  name: string;
  value: string;
}

interface NoteEditorProps {
  note: Note | null;
  colors: NoteColor[];
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; color: string }, id: number | null) => void;
}

export function NoteEditor({ note, colors, onClose, onSubmit }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(colors[0]?.value ?? "#ff2d6f");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
    } else {
      setTitle("");
      setContent("");
      setColor(colors[0]?.value ?? "#ff2d6f");
    }
  }, [note, colors]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = title.trim().length > 0 && content.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ title: title.trim(), content: content.trim(), color }, note?.id ?? null);
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#04040c]/80 backdrop-blur-md" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-2xl max-h-[92%] overflow-y-auto rounded-t-[28px] border-t border-[rgba(255,255,255,0.08)] bg-[#0a0a18]/95 px-5 pb-8 pt-3 backdrop-blur-xl"
        style={{
          animation: "sheetUp 0.32s cubic-bezier(0.16,1,0.3,1)",
          boxShadow: `0 -20px 60px rgba(0,0,0,0.6), 0 -2px 30px ${color}80`,
        }}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white" style={{ textShadow: `0 0 16px ${color}80` }}>
            {note ? "Редактировать заметку" : "Новая заметка"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20"
            aria-label="Закрыть"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Заголовок"
            className="w-full rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-lg font-bold text-white outline-none transition-colors placeholder:text-white/30 focus:bg-[rgba(255,255,255,0.07)]"
            style={{ borderColor: `${color}60` }}
            autoFocus
          />
        </div>

        {/* Content */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Текст заметки..."
            rows={8}
            className="w-full resize-none rounded-2xl border bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:bg-[rgba(255,255,255,0.07)]"
            style={{ borderColor: `${color}60` }}
          />
        </div>

        {/* Colors */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Цвет</p>
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90"
                style={{
                  background: c.value,
                  boxShadow: color === c.value ? `0 0 16px ${c.value}` : "none",
                  border: color === c.value ? "2px solid white" : "2px solid transparent",
                  opacity: color === c.value ? 1 : 0.6,
                }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
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
            style={{ background: color, boxShadow: valid ? `0 0 24px ${color}80` : "none" }}
          >
            {note ? "Сохранить" : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}
