"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, StickyNote, Pencil, Pin, Search, X } from "lucide-react";
import type { Note, NeonKey } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { createNote, updateNote, deleteNote } from "@/lib/api";
import { Modal, ColorPicker, EmptyState, Field } from "./ui";

export function NotesView({ notes, onChanged }: { notes: Note[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
        )
      : notes;
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [notes, query]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(n: Note) {
    setEditing(n);
    setOpen(true);
  }

  async function togglePin(n: Note) {
    try {
      await updateNote(n.id, { pinned: !n.pinned });
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ошибка");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="neon-label">Заметок</p>
          <p className="font-display text-3xl text-pink-300 neon-text c-pink">{notes.length}</p>
        </div>
        <button className="neon-btn solid c-pink" onClick={openNew}>
          <Plus size={18} /> Заметка
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="neon-input pl-9"
          placeholder="Поиск по заметкам…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
            aria-label="Очистить"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={40} strokeWidth={1.4} />}
          title="Заметок пока нет"
          hint="Записывайте идеи, мысли и планы — всё в неоновом стиле."
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<Search size={40} strokeWidth={1.4} />}
          title="Ничего не найдено"
          hint="Попробуйте изменить поисковый запрос."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map((n) => (
            <div key={n.id} className={`glow-card c-${n.color} fade-up p-4 flex flex-col`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-display text-base text-white break-words flex-1">{n.title}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => togglePin(n)}
                    aria-label="Закрепить"
                    className={`grid place-items-center w-8 h-8 rounded-lg border transition ${
                      n.pinned
                        ? "border-amber-400/50 text-amber-300"
                        : "border-white/10 text-muted hover:text-white hover:border-white/30"
                    }`}
                  >
                    <Pin size={14} fill={n.pinned ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => openEdit(n)}
                    aria-label="Редактировать"
                    className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm("Удалить заметку?")) return;
                      try {
                        await deleteNote(n.id);
                        onChanged();
                      } catch (e) {
                        alert(e instanceof Error ? e.message : "Ошибка");
                      }
                    }}
                    aria-label="Удалить"
                    className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-red-400 hover:border-red-400/40 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {n.content && (
                <p className="text-sm text-muted mt-2 whitespace-pre-wrap break-words flex-1">
                  {n.content}
                </p>
              )}
              <p className="text-xs text-muted/70 mt-3">{formatDate(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      <NoteModal open={open} onClose={() => setOpen(false)} note={editing} onChanged={onChanged} />
    </div>
  );
}

function NoteModal({
  open,
  onClose,
  note,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  note: Note | null;
  onChanged: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: note?.title ?? "",
    content: note?.content ?? "",
    color: (note?.color ?? "pink") as NeonKey,
    pinned: note?.pinned ?? false,
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: note?.title ?? "",
        content: note?.content ?? "",
        color: note?.color ?? "pink",
        pinned: note?.pinned ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, note?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (note) {
        await updateNote(note.id, form);
      } else {
        await createNote(form);
      }
      onClose();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={note ? "Редактировать заметку" : "Новая заметка"}
      accent={form.color}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Заголовок">
          <input
            className="neon-input"
            type="text"
            required
            maxLength={80}
            placeholder="Идея, план, мысль"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Текст">
          <textarea
            className="neon-textarea"
            maxLength={1000}
            placeholder="Опишите подробнее…"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </Field>
        <Field label="Цвет">
          <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
        </Field>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.pinned}
            onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
            className="accent-pink-500 w-4 h-4"
          />
          <span className="text-sm text-muted">Закрепить заметку сверху</span>
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="neon-btn solid w-full" disabled={loading}>
          {loading ? "Сохраняем…" : note ? "Сохранить" : "Создать заметку"}
        </button>
      </form>
    </Modal>
  );
}
