"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type { Note } from "@/db/schema";
import { NoteEditor } from "./NoteEditor";

const NOTE_COLORS = [
  { name: "Розовый", value: "#ff2d6f" },
  { name: "Фиолет", value: "#b14dff" },
  { name: "Голубой", value: "#00d4ff" },
  { name: "Зелёный", value: "#00ffa3" },
  { name: "Жёлтый", value: "#ffb020" },
  { name: "Оранж", value: "#ff6b35" },
];

export function NotesSection({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [search, setSearch] = useState("");
  const [delConfirm, setDelConfirm] = useState<number | null>(null);
  const delTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) setNotes(await res.json());
    } catch {}
  }, []);

  useEffect(() => { return () => { if (delTimer.current) clearTimeout(delTimer.current); }; }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [notes, search]);

  const pinned = filtered.filter((n) => n.pinned);
  const regular = filtered.filter((n) => !n.pinned);

  function openNew() { setEditing(null); setEditorOpen(true); }
  function openEdit(n: Note) { setEditing(n); setEditorOpen(true); }

  async function saveNote(data: { title: string; content: string; color: string }, id: number | null) {
    setEditorOpen(false);
    try {
      const url = id ? `/api/notes/${id}` : "/api/notes";
      const res = await fetch(url, { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (res.ok) { const n = await res.json(); if (id) setNotes((p) => p.map((x) => x.id === n.id ? n : x)); else setNotes((p) => [n, ...p]); }
    } catch {}
  }

  async function delNote(id: number) {
    setNotes((p) => p.filter((n) => n.id !== id));
    try { await fetch(`/api/notes/${id}`, { method: "DELETE" }); } catch { refresh(); }
    setDelConfirm(null);
  }

  async function togglePin(note: Note) {
    setNotes((p) => p.map((n) => n.id === note.id ? { ...n, pinned: !n.pinned, updatedAt: new Date() } : n));
    try { await fetch(`/api/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !note.pinned }) }); } catch { refresh(); }
  }

  function handleDel(id: number) {
    if (delConfirm === id) { if (delTimer.current) clearTimeout(delTimer.current); delNote(id); }
    else { setDelConfirm(id); delTimer.current = setTimeout(() => setDelConfirm(null), 3000); }
  }

  useEffect(() => {
    document.body.style.overflow = editorOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [editorOpen]);

  return (
    <>
      {/* Header */}
      <div className="px-5 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold text-white tracking-tight">Заметки</h1>
          <button onClick={refresh} className="h-9 w-9 flex items-center justify-center rounded-full active:scale-90 transition-transform">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
        <div className="text-sm text-white/40 mt-0.5">{notes.length} {pluralize(notes.length, "заметка", "заметки", "заметок")}</div>
      </div>

      {/* Search */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 border border-white/[0.08]" style={{ background: "rgba(255,255,255,0.04)" }}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/30" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
          {search && <button onClick={() => setSearch("")} className="text-white/30">✕</button>}
        </div>
      </div>

      {/* Notes */}
      <div className="px-5 pb-28 space-y-3" style={{ overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="text-4xl mb-3">📝</div>
            <div className="text-sm font-medium text-white/50">{search ? "Ничего не найдено" : "Пока нет заметок"}</div>
          </div>
        ) : (
          <>
            {pinned.length > 0 && <NoteGroup title="📌 Закреплённые" notes={pinned} onEdit={openEdit} onDel={handleDel} onPin={togglePin} delConfirm={delConfirm} />}
            {regular.length > 0 && <NoteGroup title={pinned.length > 0 ? "Все" : ""} notes={regular} onEdit={openEdit} onDel={handleDel} onPin={togglePin} delConfirm={delConfirm} />}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] right-4 z-30 h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        style={{ background: "#b14dff", boxShadow: "0 0 24px rgba(177,77,255,0.5), 0 8px 24px rgba(0,0,0,0.4)" }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-[#000]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {editorOpen && (
        <NoteEditor
          note={editing}
          colors={NOTE_COLORS}
          onClose={() => { setEditorOpen(false); setEditing(null); }}
          onSubmit={saveNote}
        />
      )}
    </>
  );
}

function NoteGroup({
  title, notes, onEdit, onDel, onPin, delConfirm,
}: {
  title: string; notes: Note[];
  onEdit: (n: Note) => void; onDel: (id: number) => void; onPin: (n: Note) => void; delConfirm: number | null;
}) {
  return (
    <div>
      {title && <div className="text-xs font-semibold text-white/30 mb-2 px-1">{title}</div>}
      <div className="space-y-2">
        {notes.map((n) => (
          <div
            key={n.id}
            className="group relative rounded-2xl border overflow-hidden active:scale-[0.98] transition-all"
            style={{ borderColor: `${n.color}30`, background: `${n.color}08` }}
          >
            {/* Actions overlay */}
            <div className="absolute right-2 top-2 flex gap-1.5 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); onPin(n); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-xs"
                style={{ background: n.pinned ? `${n.color}30` : "rgba(0,0,0,0.4)" }}
              >
                📌
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDel(n.id); }}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-xs"
                style={{ background: delConfirm === n.id ? "#ff2d6f" : "rgba(0,0,0,0.4)", color: delConfirm === n.id ? "#fff" : "#fff" }}
              >
                {delConfirm === n.id ? "✕" : "🗑️"}
              </button>
            </div>

            <button onClick={() => onEdit(n)} className="w-full p-4 text-left">
              <div className="text-[15px] font-semibold text-white mb-1 pr-16" style={{ textShadow: `0 0 8px ${n.color}50` }}>
                {n.title}
              </div>
              <div className="text-xs text-white/40 line-clamp-3 leading-relaxed">{n.content}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="h-1.5 w-1.5 rounded-full" style={{ background: n.color }} />
                <span className="text-[10px] text-white/25">
                  {new Date(n.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </span>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// useRef imported at top

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
