"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wallet, Target, StickyNote, Sparkles, TrendingUp, Settings, Download, Upload, Trash2, BarChart3, Loader2 } from "lucide-react";
import { fetchIncomes, fetchGoals, fetchNotes, createIncome, createGoal, createNote, deleteIncome, deleteGoal, deleteNote } from "@/lib/api";
import { appSettings, formatMoney, clampPercent } from "@/lib/utils";
import type { Goal, Income, Note } from "@/lib/utils";
import { IncomesView } from "@/components/IncomesView";
import { GoalsView } from "@/components/GoalsView";
import { NotesView } from "@/components/NotesView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { Modal, EmptyState } from "@/components/ui";

type Tab = "incomes" | "goals" | "notes" | "analytics";

const TABS: { key: Tab; label: string; icon: typeof Wallet }[] = [
  { key: "incomes", label: "Доходы", icon: Wallet },
  { key: "goals", label: "Цели", icon: Target },
  { key: "notes", label: "Заметки", icon: StickyNote },
  { key: "analytics", label: "Аналитика", icon: BarChart3 },
];

const CURRENCIES = ["₽", "$", "€"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("incomes");
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("₽");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nf-settings") || "{}");
      if (saved.name) setName(saved.name);
      if (saved.currency) setCurrency(saved.currency);
    } catch {}
  }, []);

  useEffect(() => {
    appSettings.name = name;
    appSettings.currency = currency;
    try {
      localStorage.setItem("nf-settings", JSON.stringify({ name, currency }));
    } catch {}
  }, [name, currency]);

  const refresh = useCallback(async () => {
    try {
      const [i, g, n] = await Promise.all([fetchIncomes(), fetchGoals(), fetchNotes()]);
      setIncomes(i);
      setGoals(g);
      setNotes(n);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const goalsProgress = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.targetAmount, 0);
    const current = goals.reduce((s, g) => s + g.currentAmount, 0);
    return target > 0 ? clampPercent((current / target) * 100) : 0;
  }, [goals]);

  const stats = [
    { key: "incomes", label: "Доходы", value: formatMoney(totalIncome), accent: "c-green", icon: TrendingUp },
    { key: "goals", label: "Прогресс целей", value: `${Math.round(goalsProgress)}%`, accent: "c-violet", icon: Target },
    { key: "notes", label: "Заметки", value: String(notes.length), accent: "c-pink", icon: StickyNote },
  ] as const;

  function exportData() {
    const payload = {
      app: "neon-finance",
      version: 1,
      exportedAt: new Date().toISOString(),
      incomes,
      goals,
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neon-finance-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== "object") throw new Error("Неверный файл");
      if (!confirm("Импортировать данные? Записи будут добавлены к существующим.")) return;
      for (const inc of data.incomes ?? []) {
        await createIncome({ amount: Number(inc.amount), source: inc.source, category: inc.category, note: inc.note ?? undefined, date: inc.date });
      }
      for (const g of data.goals ?? []) {
        await createGoal({ title: g.title, targetAmount: Number(g.targetAmount), currentAmount: Number(g.currentAmount), deadline: g.deadline ?? null, color: g.color });
      }
      for (const n of data.notes ?? []) {
        await createNote({ title: n.title, content: n.content, color: n.color, pinned: !!n.pinned });
      }
      setSettingsOpen(false);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка импорта");
    }
  }

  async function resetAll() {
    if (!confirm("Удалить ВСЕ доходы, цели и заметки? Действие необратимо.")) return;
    try {
      for (const inc of incomes) await deleteIncome(inc.id);
      for (const g of goals) await deleteGoal(g.id);
      for (const n of notes) await deleteNote(n.id);
      await refresh();
      setSettingsOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка сброса");
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#05060f]/70 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl border border-cyan-400/40 bg-cyan-400/5">
              <Sparkles className="text-cyan-300" size={20} style={{ filter: "drop-shadow(0 0 6px #00e5ff)" }} />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-lg sm:text-xl text-cyan-300 neon-text c-cyan">
                NEON FINANCE
              </h1>
              <p className="text-[11px] text-muted tracking-wide uppercase">
                {name ? `Привет, ${name}` : "Доходы · Цели · Заметки"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              aria-label="Экспорт"
              title="Экспорт (JSON)"
              className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-cyan-300 hover:border-cyan-400/40 transition"
            >
              <Download size={17} />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Импорт"
              title="Импорт (JSON)"
              className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-cyan-300 hover:border-cyan-400/40 transition"
            >
              <Upload size={17} />
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Настройки"
              className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"
            >
              <Settings size={17} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <section className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((s) => (
            <button
              key={s.key}
              onClick={() => setTab(s.key as Tab)}
              className={`glow-card ${s.accent} p-3 text-left transition`}
            >
              <s.icon size={16} style={{ color: "var(--neon)" }} />
              <p className="text-[11px] text-muted uppercase tracking-wide mt-2">{s.label}</p>
              <p className="font-display text-lg sm:text-xl neon-text truncate">{s.value}</p>
            </button>
          ))}
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="font-display">Загрузка…</p>
          </div>
        ) : (
          <div key={tab} className="fade-up">
            {tab === "incomes" && (
              <IncomesView incomes={incomes} total={totalIncome} onChanged={refresh} />
            )}
            {tab === "goals" && <GoalsView goals={goals} onChanged={refresh} />}
            {tab === "notes" && <NotesView notes={notes} onChanged={refresh} />}
            {tab === "analytics" && <AnalyticsView incomes={incomes} />}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="max-w-3xl mx-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <div className="glass flex items-stretch justify-around p-1.5 rounded-2xl">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition ${
                    active ? "bg-white/5" : "opacity-60"
                  }`}
                >
                  <t.icon
                    size={20}
                    style={{
                      color: active ? "#00e5ff" : undefined,
                      filter: active ? "drop-shadow(0 0 8px #00e5ff)" : undefined,
                    }}
                  />
                  <span
                    className={`text-[10px] sm:text-[11px] font-display tracking-wide ${
                      active ? "text-cyan-300" : "text-muted"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Настройки" accent="cyan">
        <div className="space-y-5">
          <label className="block">
            <span className="neon-label">Ваше имя</span>
            <input
              className="neon-input c-cyan"
              type="text"
              maxLength={40}
              placeholder="Например, Алекс"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="neon-label">Валюта</span>
            <div className="flex gap-2">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`neon-btn neon-btn-sm ${currency === c ? "solid c-cyan" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="neon-label">Данные</p>
            <div className="flex gap-2">
              <button className="neon-btn c-green flex-1" onClick={exportData}>
                <Download size={16} /> Экспорт
              </button>
              <button className="neon-btn c-cyan flex-1" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> Импорт
              </button>
            </div>
            <button className="neon-btn c-red w-full" onClick={resetAll}>
              <Trash2 size={16} /> Сбросить все данные
            </button>
          </div>
        </div>
      </Modal>

      {!loading && incomes.length === 0 && goals.length === 0 && notes.length === 0 && (
        <div className="max-w-3xl mx-auto px-4 -mt-2">
          <EmptyState
            icon={<Sparkles size={38} strokeWidth={1.4} />}
            title="Добро пожаловать в NEON FINANCE"
            hint="Добавьте доход, создайте финансовую цель или сохраните заметку. Всё сохраняется в базе данных."
          />
        </div>
      )}
    </div>
  );
}
