"use client";

import { useEffect, useState } from "react";
import type { Note } from "@/db/schema";

interface NoteColor { name: string; value: string; }

export function NoteEditor({ note, colors, onClose, onSubmit }: {
  note: Note | null;
  colors: NoteColor[];
  onClose: () => void;
  onSubmit: (d: { title: string; content: string; color: string }, id: number | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(colors[0]?.value ?? "#ff2d6f");

  useEffect(() => {
    if (note) { setTitle(note.title); setContent(note.content); setColor(note.color); }
    else { setTitle(""); setContent(""); setColor(colors[0]?.value ?? "#ff2d6f"); }
  }, [note, colors]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const valid = title.trim() && content.trim();

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg max-h-[90%] overflow-y-auto rounded-t-3xl bg-[#0c0c18] border-t border-white/[0.08]" style={{ animation: "sheetUp 0.3s ease" }}>
        <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-white/20" /></div>

        <div className="px-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white">{note ? "Изменить" : "Новая заметка"}</h2>
            <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 text-white/60">✕</button>
          </div>

          {/* Title */}
          <div className="mb-4">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заголовок" className="w-full rounded-xl bg-white/5 border px-4 py-3.5 text-[17px] font-semibold text-white outline-none placeholder:text-white/30" style={{ borderColor: `${color}30` }} autoFocus />
          </div>

          {/* Content */}
          <div className="mb-4">
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Текст заметки..." rows={8} className="w-full resize-none rounded-xl bg-white/5 border px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 leading-relaxed" style={{ borderColor: `${color}30` }} />
          </div>

          {/* Colors */}
          <div className="mb-5">
            <div className="text-xs font-semibold text-white/30 mb-2 uppercase tracking-wider">Цвет</div>
            <div className="flex gap-2.5">
              {colors.map((c) => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)} className="h-11 w-11 rounded-xl active:scale-90 transition-all" style={{ background: c.value, boxShadow: color === c.value ? `0 0 14px ${c.value}` : "none", border: color === c.value ? "2px solid #fff" : "2px solid transparent", opacity: color === c.value ? 1 : 0.5 }} aria-label={c.name} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-xl bg-white/8 py-3.5 text-sm font-semibold text-white/60">Отмена</button>
            <button onClick={() => onSubmit({ title: title.trim(), content: content.trim(), color }, note?.id ?? null)} disabled={!valid} className="flex-[1.5] rounded-xl py-3.5 text-sm font-bold text-[#000] disabled:opacity-30 active:scale-95 transition-all" style={{ background: color }}>
              {note ? "Сохранить" : "Создать"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
