"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Note } from "@/db/schema";
import { NoteEditor } from "./NoteEditor";

const NOTE_COLORS = [
  { name: "Розовый", value: "#ff2d6f" },
  { name: "Фиолетовый", value: "#b14dff" },
  { name: "Голубой", value: "#00d4ff" },
  { name: "Зелёный", value: "#00ffa3" },
  { name: "Жёлтый", value: "#ffb020" },
  { name: "Оранжевый", value: "#ff6b35" },
];

export function NotesSection({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [editing, setEditing] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error();
      setNotes(await res.json());
    } catch (error) {
      console.error("Failed to refresh notes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const pinned = filtered.filter((n) => n.pinned);
  const regular = filtered.filter((n) => !n.pinned);

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(note: Note) {
    setEditing(note);
    setEditorOpen(true);
  }

  async function saveNote(data: { title: string; content: string; color: string }, id: number | null) {
    setEditorOpen(false);
    try {
      if (id) {
        const res = await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const updated: Note = await res.json();
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const created: Note = await res.json();
        setNotes((prev) => [created, ...prev]);
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  }

  async function deleteNote(id: number) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      await refresh();
    }
    setConfirmingDelete(null);
  }

  async function togglePin(note: Note) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === note.id ? { ...n, pinned: !n.pinned, updatedAt: new Date() } : n
      )
    );
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !note.pinned }),
      });
    } catch {
      await refresh();
    }
  }

  function confirmDelete(id: number) {
    if (confirmingDelete === id) {
      deleteNote(id);
    } else {
      setConfirmingDelete(id);
      setTimeout(() => {
        setConfirmingDelete((cur) => (cur === id ? null : cur));
      }, 3000);
    }
  }

  useEffect(() => {
    document.body.style.overflow = editorOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [editorOpen]);

  return (
    <>
      {/* Header */}
      <header
        className="relative shrink-0 overflow-hidden px-5 pb-6 pt-8 text-white"
        style={{ background: "radial-gradient(120% 90% at 50% -10%, rgba(177,77,255,0.22), transparent 60%), #08081a" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #b14dff, transparent)" }}
        />
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-lg backdrop-blur-sm"
                style={{ boxShadow: "0 0 16px rgba(177,77,255,0.4)", border: "1px solid rgba(177,77,255,0.4)" }}
              >
                📝
              </div>
              <span className="text-base font-extrabold tracking-wide" style={{ textShadow: "0 0 14px rgba(177,77,255,0.6)" }}>
                Заметки
              </span>
            </div>
            <button
              onClick={() => refresh()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 transition-all hover:bg-white/15 active:scale-90"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
              aria-label="Обновить"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          <div className="mt-6">
            <h1
              className="text-4xl font-extrabold leading-tight"
              style={{ color: "#b14dff", textShadow: "0 0 24px rgba(177,77,255,0.7)" }}
            >
              {notes.length === 0 ? "Пусто" : `${notes.length} заметок`}
            </h1>
            <p className="mt-1.5 text-[13px] font-semibold text-white/70">
              {pinned.length > 0 ? `${pinned.length} закреплённых · ` : ""}
              Записывайте идеи, планы и мысли
            </p>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="sticky top-0 z-20 border-b border-[rgba(255,255,255,0.06)] bg-[#070714]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-xl px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-2xl border border-[rgba(177,77,255,0.3)] bg-[rgba(177,77,255,0.08)] px-4 py-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#b14dff]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по заметкам..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/40 hover:text-white/70">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes grid */}
      <main className="flex-1 px-4 py-4 pb-24">
        <div className="mx-auto max-w-xl">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
                style={{
                  background: "rgba(177,77,255,0.1)",
                  border: "1px solid rgba(177,77,255,0.35)",
                  boxShadow: "0 0 30px rgba(177,77,255,0.3)",
                }}
              >
                📝
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">
                {search ? "Ничего не найдено" : "Пока нет заметок"}
              </h3>
              <p className="mt-1.5 max-w-[240px] text-sm text-white/45">
                {search ? "Попробуйте другой запрос" : "Нажмите «+», чтобы создать первую заметку"}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {pinned.length > 0 && (
                <NoteGroup title="📌 Закреплённые" notes={pinned} onEdit={openEdit} onDelete={confirmDelete} onTogglePin={togglePin} confirmingDelete={confirmingDelete} />
              )}
              {regular.length > 0 && (
                <NoteGroup
                  title={pinned.length > 0 ? "Все заметки" : ""}
                  notes={regular}
                  onEdit={openEdit}
                  onDelete={confirmDelete}
                  onTogglePin={togglePin}
                  confirmingDelete={confirmingDelete}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={openNew}
        className="fixed bottom-28 right-4 z-30 flex items-center gap-2 rounded-full text-[15px] font-bold text-[#05050f] shadow-2xl transition-all hover:scale-105 active:scale-90"
        style={{
          background: "#b14dff",
          boxShadow: "0 0 32px rgba(177,77,255,0.7), 0 10px 30px rgba(0,0,0,0.4)",
          animation: "fabIn 0.4s ease",
          paddingLeft: "1.5rem",
          paddingRight: "1.75rem",
          paddingTop: "1rem",
          paddingBottom: "1rem",
          minHeight: "56px",
        }}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>Заметка</span>
      </button>

      {editorOpen && (
        <NoteEditor
          note={editing}
          colors={NOTE_COLORS}
          onClose={() => {
            setEditorOpen(false);
            setEditing(null);
          }}
          onSubmit={saveNote}
        />
      )}
    </>
  );
}

function NoteGroup({
  title,
  notes,
  onEdit,
  onDelete,
  onTogglePin,
  confirmingDelete,
}: {
  title: string;
  notes: Note[];
  onEdit: (n: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (n: Note) => void;
  confirmingDelete: number | null;
}) {
  return (
    <div>
      {title && (
        <div className="mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wide text-white/50">{title}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
            isConfirmingDelete={confirmingDelete === note.id}
          />
        ))}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  isConfirmingDelete,
}: {
  note: Note;
  onEdit: (n: Note) => void;
  onDelete: (id: number) => void;
  onTogglePin: (n: Note) => void;
  isConfirmingDelete: boolean;
}) {
  return (
    <div
      className="group relative flex min-h-[140px] flex-col rounded-2xl border p-3 backdrop-blur-sm transition-all hover:scale-[1.02]"
      style={{
        borderColor: `${note.color}50`,
        background: `${note.color}14`,
        boxShadow: `0 0 20px ${note.color}20`,
      }}
    >
      {/* pin + delete */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(note);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] hover:bg-white/20"
          style={{ color: note.pinned ? note.color : "rgba(255,255,255,0.6)" }}
          aria-label={note.pinned ? "Открепить" : "Закрепить"}
        >
          📌
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="flex h-6 w-6 items-center justify-center rounded-full transition-all"
          style={
            isConfirmingDelete
              ? { background: "#ff2d6f", color: "#05050f" }
              : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
          }
          aria-label="Удалить"
        >
          {isConfirmingDelete ? <span className="text-[8px] font-bold">OK?</span> : "✕"}
        </button>
      </div>

      <button
        onClick={() => onEdit(note)}
        className="flex min-h-full flex-col text-left"
      >
        <div
          className="mb-1.5 text-sm font-bold text-white leading-tight"
          style={{ textShadow: `0 0 10px ${note.color}80` }}
        >
          {note.title}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-[11px] text-white/60 leading-snug line-clamp-[8]">
            {note.content}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: note.color, boxShadow: `0 0 4px ${note.color}` }}
          />
          <span className="text-[9px] text-white/30">
            {new Date(note.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
          </span>
        </div>
      </button>
    </div>
  );
}
