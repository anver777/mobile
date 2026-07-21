import { useEffect, useMemo, useRef, useState } from "react";
import {
  Wallet, Target, StickyNote, Sparkles, TrendingUp, Settings, Download, Upload, Trash2,
  BarChart3, Loader2, Plus, X, ArrowUpRight, Tag, Calendar, Search, Check, Coins, Pencil,
  ArrowDownRight, Pin, Hash, PieChart, CalendarDays,
} from "lucide-react";
import * as db from "./db.js";
import { formatMoney, categoryBreakdown, monthlySeries, incomeStats, CATEGORY_COLORS } from "./analytics.js";

const INCOME_CATEGORIES = ["Зарплата", "Фриланс", "Инвестиции", "Подарок", "Возврат", "Прочее"];
const NEON_OPTIONS = [
  { key: "cyan", label: "Циан" }, { key: "pink", label: "Розовый" }, { key: "green", label: "Зелёный" },
  { key: "violet", label: "Фиолет" }, { key: "amber", label: "Янтарь" }, { key: "red", label: "Красный" },
];
const CURRENCIES = ["₽", "$", "€"];

const TABS = [
  { key: "incomes", label: "Доходы", icon: Wallet },
  { key: "goals", label: "Цели", icon: Target },
  { key: "notes", label: "Заметки", icon: StickyNote },
  { key: "analytics", label: "Аналитика", icon: BarChart3 },
];

/* ---------- small UI primitives ---------- */
function Modal({ open, onClose, title, accent = "cyan", children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className={`modal-overlay c-${accent}`} onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg neon-text">{title}</h3>
          <button onClick={onClose} aria-label="Закрыть"
            className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {NEON_OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <button key={opt.key} type="button" title={opt.label} onClick={() => onChange(opt.key)}
            className={`c-${opt.key} w-9 h-9 rounded-full grid place-items-center transition ${active ? "ring-2 ring-offset-2 ring-offset-[#0a0b1a]" : ""}`}
            style={{ boxShadow: active ? "0 0 16px var(--neon)" : undefined }}>
            <span className="w-6 h-6 rounded-full" style={{ background: "var(--neon)", boxShadow: "0 0 10px var(--neon)" }} />
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }) {
  return (<label className="block"><span className="neon-label">{label}</span>{children}</label>);
}

function EmptyState({ icon, title, hint }) {
  return (
    <div className="glass flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="text-muted mb-3 opacity-70">{icon}</div>
      <p className="font-display text-base text-white/80">{title}</p>
      <p className="text-sm text-muted mt-1 max-w-xs">{hint}</p>
    </div>
  );
}

/* ---------- main app ---------- */
export default function App() {
  const [data, setData] = useState(db.load());
  const [tab, setTab] = useState("incomes");
  const [settings, setSettings] = useState({ name: "", currency: "₽" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  // incomes UI
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [iq, setIq] = useState("");
  const [icat, setIcat] = useState("all");
  const [iperiod, setIperiod] = useState("all");
  const [iform, setIform] = useState({ amount: "", source: "", category: INCOME_CATEGORIES[0], note: "", date: new Date().toISOString().slice(0, 10) });
  // goals UI
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [amountOpen, setAmountOpen] = useState(false);
  const [amountGoal, setAmountGoal] = useState(null);
  const [amountAction, setAmountAction] = useState("add");
  const [amount, setAmount] = useState("");
  const [gform, setGform] = useState({ title: "", targetAmount: "", currentAmount: "", deadline: "", color: "violet" });
  // notes UI
  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [nq, setNq] = useState("");
  const [nform, setNform] = useState({ title: "", content: "", color: "pink", pinned: false });

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("nf-vite-settings") || "{}");
      if (s.currency) setSettings((p) => ({ ...p, currency: s.currency }));
      if (s.name) setSettings((p) => ({ ...p, name: s.name }));
    } catch {}
  }, []);

  const refresh = () => setData(db.load());

  const { incomes, goals, notes } = data;

  const totalIncome = incomes.reduce((s, i) => s + Number(i.amount), 0);
  const goalsProgress = (() => {
    const t = goals.reduce((s, g) => s + Number(g.targetAmount), 0);
    const c = goals.reduce((s, g) => s + Number(g.currentAmount), 0);
    return t > 0 ? Math.max(0, Math.min(100, (c / t) * 100)) : 0;
  })();

  /* ---- incomes filtering ---- */
  const presentCats = useMemo(() => INCOME_CATEGORIES.filter((c) => incomes.some((i) => i.category === c)), [incomes]);
  const filteredIncomes = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lym = `${lm.getFullYear()}-${String(lm.getMonth() + 1).padStart(2, "0")}`;
    const q = iq.trim().toLowerCase();
    return incomes.filter((i) => {
      if (icat !== "all" && i.category !== icat) return false;
      if (iperiod === "month" && !i.date.startsWith(ym)) return false;
      if (iperiod === "last" && !i.date.startsWith(lym)) return false;
      if (q && !(i.source.toLowerCase().includes(q) || (i.note || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [incomes, icat, iperiod, iq]);

  const sortedNotes = useMemo(() => {
    const q = nq.trim().toLowerCase();
    const f = q ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)) : notes;
    return [...f].sort((a, b) => (a.pinned !== b.pinned ? (a.pinned ? -1 : 1) : (b.createdAt || "").localeCompare(a.createdAt || "")));
  }, [notes, nq]);

  /* ---- handlers ---- */
  function submitIncome(e) {
    e.preventDefault();
    const amt = Number(iform.amount);
    if (!Number.isFinite(amt) || amt <= 0) return alert("Сумма должна быть положительной");
    if (!iform.source.trim()) return alert("Укажите источник");
    setData(db.addIncome({ amount: amt, source: iform.source.trim(), category: iform.category, note: iform.note.trim(), date: iform.date }));
    setIform({ amount: "", source: "", category: INCOME_CATEGORIES[0], note: "", date: new Date().toISOString().slice(0, 10) });
    setIncomeOpen(false);
  }

  function openGoal(g) {
    if (g) setGform({ title: g.title, targetAmount: String(g.targetAmount), currentAmount: String(g.currentAmount), deadline: g.deadline || "", color: g.color });
    else setGform({ title: "", targetAmount: "", currentAmount: "", deadline: "", color: "violet" });
    setEditingGoal(g || null);
    setGoalOpen(true);
  }
  function submitGoal(e) {
    e.preventDefault();
    const t = Number(gform.targetAmount);
    if (!Number.isFinite(t) || t <= 0) return alert("Цель должна быть положительной");
    if (!gform.title.trim()) return alert("Укажите название");
    const payload = { title: gform.title.trim(), targetAmount: t, currentAmount: gform.currentAmount ? Number(gform.currentAmount) : 0, deadline: gform.deadline || "", color: gform.color };
    setData(editingGoal ? db.updateGoal(editingGoal.id, payload) : db.addGoal(payload));
    setGoalOpen(false);
    setEditingGoal(null);
  }
  function openAmount(g, action) {
    setAmountGoal(g); setAmountAction(action); setAmount(""); setAmountOpen(true);
  }
  function submitAmount(e) {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || !amountGoal) return;
    const cur = Number(amountGoal.currentAmount);
    const next = amountAction === "add" ? cur + amt : Math.max(0, cur - amt);
    setData(db.updateGoal(amountGoal.id, { currentAmount: next }));
    setAmountOpen(false);
  }

  function openNote(n) {
    if (n) setNform({ title: n.title, content: n.content, color: n.color, pinned: !!n.pinned });
    else setNform({ title: "", content: "", color: "pink", pinned: false });
    setEditingNote(n || null);
    setNoteOpen(true);
  }
  function submitNote(e) {
    e.preventDefault();
    if (!nform.title.trim()) return alert("Укажите заголовок");
    const payload = { ...nform, title: nform.title.trim() };
    setData(editingNote ? db.updateNote(editingNote.id, payload) : db.addNote(payload));
    setNoteOpen(false);
    setEditingNote(null);
  }
  function togglePin(n) { setData(db.updateNote(n.id, { pinned: !n.pinned })); }

  function exportData() { db.exportData(data); }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (!confirm("Импортировать данные? Записи будут добавлены к существующим.")) return;
        setData(db.importData(String(reader.result)));
        setSettingsOpen(false);
      } catch (err) { alert("Ошибка импорта: " + err.message); }
    };
    reader.readAsText(file);
  }
  function resetAll() {
    if (!confirm("Удалить ВСЕ данные? Действие необратимо.")) return;
    setData(db.resetAll());
    setSettingsOpen(false);
  }
  function saveSettings(patch) {
    setSettings((s) => {
      const next = { ...s, ...patch };
      localStorage.setItem("nf-vite-settings", JSON.stringify(next));
      return next;
    });
  }

  const cur = settings.currency;
  const stats = [
    { key: "incomes", label: "Доходы", value: formatMoney(totalIncome, cur), accent: "c-green", icon: TrendingUp },
    { key: "goals", label: "Прогресс целей", value: `${Math.round(goalsProgress)}%`, accent: "c-violet", icon: Target },
    { key: "notes", label: "Заметки", value: String(notes.length), accent: "c-pink", icon: StickyNote },
  ];

  const bd = categoryBreakdown(incomes);
  const series = monthlySeries(incomes);
  const st = incomeStats(incomes);
  const maxMonth = Math.max(1, ...series.map((s) => s.total));

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#05060f]/70 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center w-10 h-10 rounded-xl border border-cyan-400/40 bg-cyan-400/5">
              <Sparkles className="text-cyan-300" size={20} style={{ filter: "drop-shadow(0 0 6px #00e5ff)" }} />
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-lg sm:text-xl text-cyan-300 neon-text c-cyan">NEON FINANCE</h1>
              <p className="text-[11px] text-muted tracking-wide uppercase">
                {settings.name ? `Привет, ${settings.name}` : "Доходы · Цели · Заметки"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportData} aria-label="Экспорт" title="Экспорт (JSON)"
              className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-cyan-300 hover:border-cyan-400/40 transition"><Download size={17} /></button>
            <button onClick={() => fileRef.current?.click()} aria-label="Импорт" title="Импорт (JSON)"
              className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-cyan-300 hover:border-cyan-400/40 transition"><Upload size={17} /></button>
            <button onClick={() => setSettingsOpen(true)} aria-label="Настройки"
              className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"><Settings size={17} /></button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <section className="grid grid-cols-3 gap-3 mb-6">
          {stats.map((s) => (
            <button key={s.key} onClick={() => setTab(s.key)}
              className={`glow-card ${s.accent} p-3 text-left transition`}>
              <s.icon size={16} style={{ color: "var(--neon)" }} />
              <p className="text-[11px] text-muted uppercase tracking-wide mt-2">{s.label}</p>
              <p className="font-display text-lg sm:text-xl neon-text truncate">{s.value}</p>
            </button>
          ))}
        </section>

        <div key={tab} className="fade-up">
          {tab === "incomes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="neon-label">Всего получено</p>
                  <p className="font-display text-3xl text-cyan-300 neon-text c-cyan">{formatMoney(totalIncome, cur)}</p>
                </div>
                <button className="neon-btn solid c-green" onClick={() => setIncomeOpen(true)}><Plus size={18} /> Доход</button>
              </div>
              <div className="glass p-3 space-y-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input className="neon-input pl-9" placeholder="Поиск по источнику или заметке…" value={iq} onChange={(e) => setIq(e.target.value)} />
                  {iq && <button onClick={() => setIq("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white" aria-label="Очистить"><X size={16} /></button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {["all", "month", "last"].map((p) => (
                    <button key={p} onClick={() => setIperiod(p)} className={`neon-btn neon-btn-sm ${iperiod === p ? "solid" : ""}`}>
                      {p === "all" ? "Все" : p === "month" ? "Этот месяц" : "Прошлый"}
                    </button>
                  ))}
                  <span className="flex-1" />
                  {icat !== "all" && <button onClick={() => setIcat("all")} className="neon-btn neon-btn-sm c-red"><X size={14} /> {icat}</button>}
                </div>
                {presentCats.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {presentCats.map((c) => (
                      <span key={c} onClick={() => setIcat(c)} className={`neon-chip ${icat === c ? "c-cyan ring-1 ring-cyan-400/50" : "opacity-70"}`}>
                        <Tag size={11} /> {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted px-1">Показано: {filteredIncomes.length} · на сумму {formatMoney(filteredIncomes.reduce((s, i) => s + Number(i.amount), 0), cur)}</p>
              {filteredIncomes.length === 0 ? (
                <EmptyState icon={<Wallet size={40} strokeWidth={1.4} />} title={incomes.length === 0 ? "Пока нет доходов" : "Ничего не найдено"}
                  hint={incomes.length === 0 ? "Добавьте первый доход, чтобы начать отслеживать финансы." : "Измените фильтры или поиск."} />
              ) : (
                <div className="space-y-3">
                  {filteredIncomes.map((inc) => (
                    <div key={inc.id} className="glow-card c-green fade-up p-4">
                      <div className="flex items-start gap-3">
                        <div className="grid place-items-center w-11 h-11 rounded-xl border border-white/10 bg-white/5 shrink-0">
                          <ArrowUpRight size={20} style={{ color: "var(--green)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-display text-base text-white truncate">{inc.source}</p>
                            <p className="font-display text-lg neon-text c-green whitespace-nowrap">{formatMoney(Number(inc.amount), cur)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted">
                            <span className="neon-chip c-cyan"><Tag size={12} /> {inc.category}</span>
                            <span className="neon-chip c-violet"><Calendar size={12} /> {inc.date}</span>
                            {inc.note && <span className="inline-flex items-center gap-1 max-w-full truncate"><StickyNote size={12} /> <span className="truncate">{inc.note}</span></span>}
                          </div>
                        </div>
                        <button onClick={() => { if (confirm("Удалить запись?")) setData(db.deleteIncome(inc.id)); }} aria-label="Удалить"
                          className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-red-400 hover:border-red-400/40 transition shrink-0"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Modal open={incomeOpen} onClose={() => setIncomeOpen(false)} title="Новый доход" accent="green">
                <form onSubmit={submitIncome} className="space-y-4">
                  <Field label="Сумма"><input className="neon-input c-green" type="number" inputMode="decimal" step="0.01" min="0" required placeholder="10000" value={iform.amount} onChange={(e) => setIform({ ...iform, amount: e.target.value })} /></Field>
                  <Field label="Источник"><input className="neon-input c-cyan" type="text" required maxLength={60} placeholder="Зарплата за март" value={iform.source} onChange={(e) => setIform({ ...iform, source: e.target.value })} /></Field>
                  <Field label="Категория">
                    <select className="neon-select c-violet" value={iform.category} onChange={(e) => setIform({ ...iform, category: e.target.value })}>
                      {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Дата"><input className="neon-input c-amber" type="date" value={iform.date} onChange={(e) => setIform({ ...iform, date: e.target.value })} /></Field>
                  <Field label="Заметка"><textarea className="neon-textarea c-pink" maxLength={240} placeholder="Комментарий" value={iform.note} onChange={(e) => setIform({ ...iform, note: e.target.value })} /></Field>
                  <button type="submit" className="neon-btn solid c-green w-full">Добавить доход</button>
                </form>
              </Modal>
            </div>
          )}

          {tab === "goals" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="neon-label">Целей достигнуто</p>
                  <p className="font-display text-3xl text-violet-300 neon-text c-violet">{goals.filter((g) => Number(g.currentAmount) >= Number(g.targetAmount)).length} / {goals.length}</p>
                  <p className="text-xs text-muted mt-1">Накоплено всего: {formatMoney(goals.reduce((s, g) => s + Number(g.currentAmount), 0), cur)}</p>
                </div>
                <button className="neon-btn solid c-violet" onClick={() => openGoal(null)}><Plus size={18} /> Цель</button>
              </div>
              {goals.length === 0 ? (
                <EmptyState icon={<Target size={40} strokeWidth={1.4} />} title="Целей пока нет" hint="Создайте цель и отслеживайте прогресс." />
              ) : (
                <div className="space-y-3">
                  {goals.map((g) => {
                    const pct = Math.max(0, Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100));
                    const done = Number(g.currentAmount) >= Number(g.targetAmount);
                    const left = Math.max(0, Number(g.targetAmount) - Number(g.currentAmount));
                    return (
                      <div key={g.id} className={`glow-card c-${g.color} fade-up p-4`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0"><Target size={18} style={{ color: "var(--neon)" }} /><p className="font-display text-base text-white truncate">{g.title}</p></div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openGoal(g)} aria-label="Редактировать" className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"><Pencil size={14} /></button>
                            <button onClick={() => { if (confirm("Удалить цель?")) setData(db.deleteGoal(g.id)); }} aria-label="Удалить" className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-red-400 hover:border-red-400/40 transition"><Trash2 size={15} /></button>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="flex items-end justify-between mb-2">
                            <span className="font-display text-lg neon-text">{formatMoney(Number(g.currentAmount), cur)}</span>
                            <span className="text-sm text-muted">из {formatMoney(Number(g.targetAmount), cur)}</span>
                          </div>
                          <div className="neon-progress"><span style={{ width: `${pct}%` }} /></div>
                          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                            <span className="neon-chip">{done ? <><Check size={12} /> Цель достигнута</> : `${Math.round(pct)}% · осталось ${formatMoney(left, cur)}`}</span>
                            <div className="flex items-center gap-2">
                              {g.deadline && <span className="neon-chip c-amber"><Calendar size={12} /> {g.deadline}</span>}
                              <button className="neon-btn neon-btn-sm c-green" onClick={() => openAmount(g, "add")}><Coins size={14} /> Пополнить</button>
                              <button className="neon-btn neon-btn-sm c-red" onClick={() => openAmount(g, "subtract")} title="Снять"><ArrowDownRight size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title={editingGoal ? "Редактировать цель" : "Новая цель"} accent="violet">
                <form onSubmit={submitGoal} className="space-y-4">
                  <Field label="Название цели"><input className="neon-input c-violet" type="text" required maxLength={60} placeholder="Новый ноутбук" value={gform.title} onChange={(e) => setGform({ ...gform, title: e.target.value })} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Цель"><input className="neon-input c-green" type="number" inputMode="decimal" step="0.01" min="0" required placeholder="100000" value={gform.targetAmount} onChange={(e) => setGform({ ...gform, targetAmount: e.target.value })} /></Field>
                    <Field label="Накоплено"><input className="neon-input c-cyan" type="number" inputMode="decimal" step="0.01" min="0" placeholder="0" value={gform.currentAmount} onChange={(e) => setGform({ ...gform, currentAmount: e.target.value })} /></Field>
                  </div>
                  <Field label="Срок"><input className="neon-input c-amber" type="date" value={gform.deadline} onChange={(e) => setGform({ ...gform, deadline: e.target.value })} /></Field>
                  <Field label="Цвет"><ColorPicker value={gform.color} onChange={(c) => setGform({ ...gform, color: c })} /></Field>
                  <button type="submit" className="neon-btn solid c-violet w-full">{editingGoal ? "Сохранить" : "Создать цель"}</button>
                </form>
              </Modal>
              <Modal open={amountOpen} onClose={() => setAmountOpen(false)} title={amountAction === "add" ? "Пополнить цель" : "Снять с цели"} accent={amountAction === "add" ? "green" : "red"}>
                <form onSubmit={submitAmount} className="space-y-4">
                  <Field label="Сумма"><input className={`neon-input c-${amountAction === "add" ? "green" : "red"}`} type="number" inputMode="decimal" step="0.01" min="0" required autoFocus placeholder="5000" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                  <button type="submit" className={`neon-btn solid c-${amountAction === "add" ? "green" : "red"} w-full`}>{amountAction === "add" ? "Добавить к цели" : "Снять с цели"}</button>
                </form>
              </Modal>
            </div>
          )}

          {tab === "notes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="neon-label">Заметок</p><p className="font-display text-3xl text-pink-300 neon-text c-pink">{notes.length}</p></div>
                <button className="neon-btn solid c-pink" onClick={() => openNote(null)}><Plus size={18} /> Заметка</button>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input className="neon-input pl-9" placeholder="Поиск по заметкам…" value={nq} onChange={(e) => setNq(e.target.value)} />
                {nq && <button onClick={() => setNq("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white" aria-label="Очистить"><X size={16} /></button>}
              </div>
              {notes.length === 0 ? (
                <EmptyState icon={<StickyNote size={40} strokeWidth={1.4} />} title="Заметок пока нет" hint="Записывайте идеи и планы в неоновом стиле." />
              ) : sortedNotes.length === 0 ? (
                <EmptyState icon={<Search size={40} strokeWidth={1.4} />} title="Ничего не найдено" hint="Измените поисковый запрос." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sortedNotes.map((n) => (
                    <div key={n.id} className={`glow-card c-${n.color} fade-up p-4 flex flex-col`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display text-base text-white break-words flex-1">{n.title}</p>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => togglePin(n)} aria-label="Закрепить" className={`grid place-items-center w-8 h-8 rounded-lg border transition ${n.pinned ? "border-amber-400/50 text-amber-300" : "border-white/10 text-muted hover:text-white hover:border-white/30"}`}><Pin size={14} fill={n.pinned ? "currentColor" : "none"} /></button>
                          <button onClick={() => openNote(n)} aria-label="Редактировать" className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"><Pencil size={14} /></button>
                          <button onClick={() => { if (confirm("Удалить заметку?")) setData(db.deleteNote(n.id)); }} aria-label="Удалить" className="grid place-items-center w-8 h-8 rounded-lg border border-white/10 text-muted hover:text-red-400 hover:border-red-400/40 transition"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      {n.content && <p className="text-sm text-muted mt-2 whitespace-pre-wrap break-words flex-1">{n.content}</p>}
                      <p className="text-xs text-muted/70 mt-3">{n.createdAt ? new Date(n.createdAt).toLocaleDateString("ru-RU") : ""}</p>
                    </div>
                  ))}
                </div>
              )}
              <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={editingNote ? "Редактировать заметку" : "Новая заметка"} accent={nform.color}>
                <form onSubmit={submitNote} className="space-y-4">
                  <Field label="Заголовок"><input className="neon-input" type="text" required maxLength={80} placeholder="Идея, план, мысль" value={nform.title} onChange={(e) => setNform({ ...nform, title: e.target.value })} /></Field>
                  <Field label="Текст"><textarea className="neon-textarea" maxLength={1000} placeholder="Опишите подробнее…" value={nform.content} onChange={(e) => setNform({ ...nform, content: e.target.value })} /></Field>
                  <Field label="Цвет"><ColorPicker value={nform.color} onChange={(c) => setNform({ ...nform, color: c })} /></Field>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={nform.pinned} onChange={(e) => setNform({ ...nform, pinned: e.target.checked })} className="accent-pink-500 w-4 h-4" />
                    <span className="text-sm text-muted">Закрепить заметку сверху</span>
                  </label>
                  <button type="submit" className="neon-btn solid w-full">{editingNote ? "Сохранить" : "Создать заметку"}</button>
                </form>
              </Modal>
            </div>
          )}

          {tab === "analytics" && (
            <div className="space-y-4">
              <p className="neon-label">Аналитика доходов</p>
              <section className="grid grid-cols-2 gap-3">
                {[
                  { label: "Всего доходов", value: formatMoney(st.total, cur), icon: TrendingUp, accent: "c-green" },
                  { label: "В среднем / мес", value: formatMoney(st.avg, cur), icon: BarChart3, accent: "c-cyan" },
                  { label: "Лучший месяц", value: st.bestMonth, sub: formatMoney(st.bestMonthTotal, cur), icon: CalendarDays, accent: "c-violet" },
                  { label: "Записей", value: String(st.count), icon: Hash, accent: "c-pink" },
                ].map((c) => (
                  <div key={c.label} className={`glow-card ${c.accent} p-3`}>
                    <c.icon size={16} style={{ color: "var(--neon)" }} />
                    <p className="text-[11px] text-muted uppercase tracking-wide mt-2">{c.label}</p>
                    <p className="font-display text-lg sm:text-xl neon-text truncate">{c.value}</p>
                    {c.sub && <p className="text-xs text-muted">{c.sub}</p>}
                  </div>
                ))}
              </section>
              <section className="glow-card c-cyan p-4">
                <div className="flex items-center gap-2 mb-4"><PieChart size={18} className="text-cyan-300" /><h3 className="font-display text-base text-white">Распределение по категориям</h3></div>
                {bd.length === 0 ? <p className="text-sm text-muted">Нет данных о доходах.</p> : (
                  <div className="space-y-3">
                    {bd.map((b) => (
                      <div key={b.category}>
                        <div className="flex items-center justify-between text-sm mb-1"><span className="text-white/90">{b.category}</span><span className="text-muted">{formatMoney(b.total, cur)} · {b.pct}%</span></div>
                        <div className="neon-progress"><span style={{ width: `${b.pct}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${b.color} 55%, transparent), ${b.color})`, boxShadow: `0 0 12px ${b.color}` }} /></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              <section className="glow-card c-violet p-4">
                <div className="flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-violet-300" /><h3 className="font-display text-base text-white">Динамика по месяцам</h3></div>
                {series.length === 0 ? <p className="text-sm text-muted">Нет данных о доходах.</p> : (
                  <div className="flex items-end justify-between gap-2 h-44">
                    {series.map((s) => (
                      <div key={s.key} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                        <span className="text-[10px] text-muted">{formatMoney(s.total, cur)}</span>
                        <div className="w-full rounded-t-md" style={{ height: `${(s.total / maxMonth) * 100}%`, minHeight: 4, background: "linear-gradient(180deg, var(--violet), color-mix(in srgb, var(--violet) 30%, transparent))", boxShadow: "0 0 14px color-mix(in srgb, var(--violet) 60%, transparent)" }} title={`${s.label}: ${formatMoney(s.total, cur)}`} />
                        <span className="text-[10px] text-muted">{s.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>

        {incomes.length === 0 && goals.length === 0 && notes.length === 0 && (
          <div className="max-w-3xl mx-auto px-4 -mt-2">
            <EmptyState icon={<Sparkles size={38} strokeWidth={1.4} />} title="Добро пожаловать в NEON FINANCE"
              hint="Добавьте доход, создайте цель или сохраните заметку. Данные хранятся локально в браузере." />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="max-w-3xl mx-auto px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
          <div className="glass flex items-stretch justify-around p-1.5 rounded-2xl">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition ${active ? "bg-white/5" : "opacity-60"}`}>
                  <t.icon size={20} style={{ color: active ? "#00e5ff" : undefined, filter: active ? "drop-shadow(0 0 8px #00e5ff)" : undefined }} />
                  <span className={`text-[10px] sm:text-[11px] font-display tracking-wide ${active ? "text-cyan-300" : "text-muted"}`}>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Настройки" accent="cyan">
        <div className="space-y-5">
          <Field label="Ваше имя"><input className="neon-input c-cyan" type="text" maxLength={40} placeholder="Например, Алекс" value={settings.name} onChange={(e) => saveSettings({ name: e.target.value })} /></Field>
          <Field label="Валюта">
            <div className="flex gap-2">
              {CURRENCIES.map((c) => <button key={c} onClick={() => saveSettings({ currency: c })} className={`neon-btn neon-btn-sm ${settings.currency === c ? "solid c-cyan" : ""}`}>{c}</button>)}
            </div>
          </Field>
          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="neon-label">Данные</p>
            <div className="flex gap-2">
              <button className="neon-btn c-green flex-1" onClick={exportData}><Download size={16} /> Экспорт</button>
              <button className="neon-btn c-cyan flex-1" onClick={() => fileRef.current?.click()}><Upload size={16} /> Импорт</button>
            </div>
            <button className="neon-btn c-red w-full" onClick={resetAll}><Trash2 size={16} /> Сбросить все данные</button>
            <p className="text-xs text-muted text-center">Версия на React + Vite. Данные хранятся локально в браузере (localStorage).</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
