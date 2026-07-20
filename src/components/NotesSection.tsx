"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Pin, PinOff, Plus, Search, StickyNote } from "lucide-react";
import {
  Btn,
  ColorSwatches,
  ConfirmDelete,
  EmptyState,
  Loader,
  Modal,
  NeonPanel,
  SectionHead,
  cx,
  inputNeon,
} from "./ui";
import { NEON_COLORS, api, jpatch, jpost, plural } from "@/lib/core";
import type { Note, SectionProps } from "@/lib/core";

interface Draft {
  id?: number;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
}

const emptyDraft: Draft = {
  title: "",
  content: "",
  color: NEON_COLORS[0],
  pinned: false,
};

export default function NotesSection({ notify, intent, clearIntent }: SectionProps) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const load = useCallback(async () => {
    try {
      setNotes(await api<Note[]>("/api/notes"));
    } catch {
      notify("Не удалось загрузить заметки");
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (intent === "new-note") {
      setDraft(emptyDraft);
      setModalOpen(true);
      clearIntent();
    }
  }, [intent, clearIntent]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try {
      if (draft.id) {
        await api("/api/notes", jpatch(draft));
        notify("Заметка обновлена");
      } else {
        await api("/api/notes", jpost(draft));
        notify("Заметка создана ⚡");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const togglePin = async (n: Note) => {
    setNotes((ns) =>
      ns &&
        ns
          .map((x) => (x.id === n.id ? { ...x, pinned: !x.pinned } : x))
          .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    );
    await api("/api/notes", jpatch({ id: n.id, pinned: !n.pinned }));
  };

  const remove = async (id: number) => {
    await api(`/api/notes?id=${id}`, { method: "DELETE" });
    setNotes((ns) => ns && ns.filter((n) => n.id !== id));
    notify("Заметка удалена");
  };

  if (!notes) return <Loader />;

  const q = query.trim().toLowerCase();
  const shown = notes.filter(
    (n) => !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
  );

  return (
    <div>
      <SectionHead code="04 · NOTES" title="Заметки" accent="#ffb020">
        <Btn accent="#ffb020" onClick={() => { setDraft(emptyDraft); setModalOpen(true); }}>
          <Plus size={15} /> Заметка
        </Btn>
      </SectionHead>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mute/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заметкам…"
            className={cx(inputNeon, "pl-10")}
          />
        </div>
        <div className="font-mono text-[11px] text-mute sm:pl-4">
          {shown.length} {plural(shown.length, "запись", "записи", "записей")}
        </div>
      </div>

      {shown.length === 0 ? (
        <NeonPanel accent="#ffb020" className="p-4">
          <EmptyState
            icon={<StickyNote size={32} />}
            title={q ? "Ничего не найдено" : "Пока нет заметок"}
            text={q ? "Попробуйте другой запрос." : "Запишите первую мысль — она не потеряется."}
          />
        </NeonPanel>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">
          {shown.map((n) => (
            <NeonPanel
              key={n.id}
              accent={n.color}
              glow
              className="group relative mb-4 break-inside-avoid overflow-hidden p-4"
            >
              <span
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: `linear-gradient(90deg, ${n.color}, transparent)`, boxShadow: `0 0 12px ${n.color}88` }}
              />
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 font-display text-[14px] font-bold leading-snug">
                  {n.title}
                </h3>
                <div
                  className={cx(
                    "flex shrink-0 items-center gap-1 transition-opacity",
                    n.pinned ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                  )}
                >
                  <button
                    onClick={() => togglePin(n)}
                    title={n.pinned ? "Открепить" : "Закрепить"}
                    className={cx(
                      "flex h-7 w-7 items-center justify-center rounded-md border transition-all active:scale-90",
                      n.pinned
                        ? "border-neon-amber/60 bg-neon-amber/10 text-neon-amber"
                        : "border-transparent text-mute/60 hover:border-line hover:text-neon-amber",
                    )}
                  >
                    {n.pinned ? <Pin size={12} /> : <PinOff size={12} />}
                  </button>
                  <button
                    onClick={() => {
                      setDraft({ id: n.id, title: n.title, content: n.content, color: n.color, pinned: n.pinned });
                      setModalOpen(true);
                    }}
                    aria-label="Редактировать"
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-mute/60 transition-all hover:border-line hover:text-neon-cyan active:scale-90"
                  >
                    ✎
                  </button>
                  <ConfirmDelete onConfirm={() => remove(n.id)} className="h-7" />
                </div>
              </div>
              {n.content && (
                <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-mute">
                  {n.content}
                </p>
              )}
              <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-mute/60">
                <span>
                  {new Date(n.updatedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </span>
                {n.pinned && <span className="text-neon-amber">pinned</span>}
              </div>
            </NeonPanel>
          ))}
        </div>
      )}

      {/* редактор */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={draft.id ? "Редактировать заметку" : "Новая заметка"}
        accent="#ffb020"
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Заголовок *
            </label>
            <input
              autoFocus
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="О чём заметка?"
              className={inputNeon}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Текст
            </label>
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={7}
              placeholder="Мысли, списки, планы…"
              className={cx(inputNeon, "resize-y leading-relaxed")}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
              Цвет
            </label>
            <ColorSwatches
              colors={NEON_COLORS}
              value={draft.color}
              onChange={(color) => setDraft({ ...draft, color })}
            />
          </div>
          <button
            type="button"
            onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
            className={cx(
              "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-sm font-bold transition-all",
              draft.pinned
                ? "border-neon-amber/60 bg-neon-amber/10 text-neon-amber shadow-[0_0_16px_rgba(255,176,32,0.2)]"
                : "border-line text-mute hover:text-ink",
            )}
          >
            <span className="flex items-center gap-2">
              <Pin size={14} /> Закрепить сверху
            </span>
            <span className="font-mono text-[10px]">{draft.pinned ? "ON" : "OFF"}</span>
          </button>
          <div className="flex gap-2 pt-1">
            <Btn type="submit" accent="#ffb020" className="flex-1">
              {draft.id ? "Сохранить" : "Создать"}
            </Btn>
            <Btn type="button" ghost accent="#8b93b8" onClick={() => setModalOpen(false)}>
              Отмена
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
