"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Plus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Btn,
  CountUp,
  EmptyState,
  Loader,
  NeonPanel,
  SectionHead,
  cx,
  inputNeon,
} from "./ui";
import { api, fmtDateShort, fmtMoney, jpost, todayISO } from "@/lib/core";
import type { FinanceData, SectionProps, TxType } from "@/lib/core";

export default function FinanceSection({ notify, intent, clearIntent }: SectionProps) {
  const [data, setData] = useState<FinanceData | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number>(0);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [txFilter, setTxFilter] = useState<"all" | TxType>("all");
  const [catFilter, setCatFilter] = useState(0);
  const [chartReady, setChartReady] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<FinanceData>("/api/finance"));
    } catch {
      notify("Не удалось загрузить финансы");
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => setChartReady(true), 60);
    return () => clearTimeout(t);
  }, [data]);

  const typeCats = useMemo(
    () => (data ? data.categories.filter((c) => c.type === type) : []),
    [data, type],
  );

  useEffect(() => {
    if (typeCats.length && !typeCats.some((c) => c.id === categoryId)) {
      setCategoryId(typeCats[0].id);
    }
  }, [typeCats, categoryId]);

  useEffect(() => {
    if (intent === "new-tx") {
      setFormOpen(true);
      clearIntent();
    }
  }, [intent, clearIntent]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const val = Number(amount.replace(",", "."));
    if (!Number.isFinite(val) || val <= 0 || !categoryId) {
      notify("Укажите сумму и категорию");
      return;
    }
    try {
      await api("/api/finance", jpost({ categoryId, amount: val, note, date }));
      notify("Операция добавлена ⚡");
      setAmount("");
      setNote("");
      setFormOpen(false);
      load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const removeTx = async (id: number) => {
    await api(`/api/finance?id=${id}`, { method: "DELETE" });
    setData((d) => d && { ...d, transactions: d.transactions.filter((t) => t.id !== id) });
    notify("Операция удалена");
    load();
  };

  if (!data) return <Loader />;

  const shownTx = data.transactions.filter(
    (t) =>
      (txFilter === "all" || t.type === txFilter) &&
      (catFilter === 0 || t.category.id === catFilter),
  );

  const maxFlow = Math.max(1, ...data.byMonth.flatMap((m) => [m.income, m.expense]));

  return (
    <div>
      <SectionHead code="03 · FINANCE" title="Финансы" accent="#b8ff2e">
        <Btn accent="#b8ff2e" onClick={() => setFormOpen((v) => !v)}>
          <Plus size={15} /> Операция
        </Btn>
      </SectionHead>

      {/* сводка */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <NeonPanel accent="#00e5ff" glow className="clip-corner p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <PiggyBank size={12} className="text-neon-cyan" /> Текущий баланс
          </div>
          <div
            className="mt-2 font-mono text-2xl font-bold text-neon-cyan sm:text-3xl"
            style={{ textShadow: "0 0 20px rgba(0,229,255,0.55)" }}
          >
            <CountUp value={data.balance} format={fmtMoney} />
          </div>
        </NeonPanel>
        <NeonPanel accent="#b8ff2e" glow className="clip-corner p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <TrendingUp size={12} className="text-neon-lime" /> Доходы · месяц
          </div>
          <div
            className="mt-2 font-mono text-2xl font-bold text-neon-lime sm:text-3xl"
            style={{ textShadow: "0 0 20px rgba(184,255,46,0.45)" }}
          >
            <CountUp value={data.incomeMonth} format={(n) => `+ ${fmtMoney(n)}`} />
          </div>
        </NeonPanel>
        <NeonPanel accent="#ff2ec4" glow className="clip-corner p-4 sm:p-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-mute">
            <TrendingDown size={12} className="text-neon-magenta" /> Расходы · месяц
          </div>
          <div
            className="mt-2 font-mono text-2xl font-bold text-neon-magenta sm:text-3xl"
            style={{ textShadow: "0 0 20px rgba(255,46,196,0.45)" }}
          >
            <CountUp value={data.expenseMonth} format={(n) => `− ${fmtMoney(n)}`} />
          </div>
        </NeonPanel>
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-3">
        {/* левая колонка */}
        <div className="order-2 space-y-3 sm:space-y-4 lg:order-1 lg:col-span-2">
          {/* денежный поток */}
          <NeonPanel accent="#9d6bff" className="p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-display text-xs font-bold uppercase tracking-wider">
                Денежный поток <span className="text-mute">· 5 месяцев</span>
              </div>
              <div className="flex gap-3 font-mono text-[10px]">
                <span className="text-neon-lime">■ доходы</span>
                <span className="text-neon-magenta">■ расходы</span>
              </div>
            </div>
            <div className="mt-4 flex h-36 items-end justify-around gap-2">
              {data.byMonth.map((m, i) => (
                <div key={m.key} className="group flex h-full flex-1 flex-col items-center justify-end">
                  <div className="flex h-full w-full items-end justify-center gap-1.5">
                    <div
                      className="w-3 rounded-t-[2px] bg-gradient-to-t from-neon-lime/20 to-neon-lime transition-all duration-700 group-hover:brightness-150 sm:w-5"
                      style={{
                        height: chartReady ? `${Math.max(2, (m.income / maxFlow) * 100)}%` : "0%",
                        transitionDelay: `${i * 80}ms`,
                        boxShadow: "0 0 10px rgba(184,255,46,0.4)",
                      }}
                      title={`+${fmtMoney(m.income)}`}
                    />
                    <div
                      className="w-3 rounded-t-[2px] bg-gradient-to-t from-neon-magenta/20 to-neon-magenta transition-all duration-700 group-hover:brightness-150 sm:w-5"
                      style={{
                        height: chartReady ? `${Math.max(2, (m.expense / maxFlow) * 100)}%` : "0%",
                        transitionDelay: `${i * 80 + 40}ms`,
                        boxShadow: "0 0 10px rgba(255,46,196,0.4)",
                      }}
                      title={`−${fmtMoney(m.expense)}`}
                    />
                  </div>
                  <div className="mt-2 font-mono text-[10px] capitalize text-mute">{m.label}</div>
                </div>
              ))}
            </div>
          </NeonPanel>

          {/* операции */}
          <NeonPanel accent="#ff2ec4" className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-display text-xs font-bold uppercase tracking-wider">Операции</div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["all", "Все"],
                    ["income", "Доходы"],
                    ["expense", "Расходы"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setTxFilter(id)}
                    className={cx(
                      "rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all",
                      txFilter === id
                        ? "border-neon-cyan/70 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_12px_rgba(0,229,255,0.25)]"
                        : "border-line text-mute hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(Number(e.target.value))}
                  className="rounded-full border border-line bg-abyss px-2.5 py-1 text-[11px] font-bold text-mute outline-none focus:border-neon-cyan/60"
                >
                  <option value={0}>Все категории</option>
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 max-h-[420px] divide-y divide-white/[0.04] overflow-y-auto pr-1">
              {shownTx.map((t) => (
                <div key={t.id} className="group flex items-center gap-3 py-2.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
                    style={{ background: `${t.category.color}1f`, boxShadow: `inset 0 0 0 1px ${t.category.color}44` }}
                  >
                    {t.category.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{t.note || t.category.name}</div>
                    <div className="font-mono text-[10px] text-mute">
                      {t.category.name} · {fmtDateShort(t.date)}
                    </div>
                  </div>
                  <div
                    className={cx(
                      "font-mono text-sm font-bold",
                      t.type === "income" ? "text-neon-lime" : "text-neon-magenta",
                    )}
                  >
                    {t.type === "income" ? "+" : "−"} {fmtMoney(t.amount)}
                  </div>
                  <button
                    onClick={() => removeTx(t.id)}
                    aria-label="Удалить операцию"
                    className="text-mute/40 transition-all hover:text-neon-red sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {shownTx.length === 0 && (
                <EmptyState title="Ничего не найдено" text="Измените фильтры или добавьте операцию." />
              )}
            </div>
          </NeonPanel>
        </div>

        {/* правая колонка */}
        <div className="order-1 space-y-3 sm:space-y-4 lg:order-2">
          {/* форма */}
          <NeonPanel
            accent={type === "income" ? "#b8ff2e" : "#ff2ec4"}
            glow
            className={cx("p-4 transition-all sm:p-5", !formOpen && "hidden sm:block")}
          >
            <div className="font-display text-xs font-bold uppercase tracking-wider">
              {formOpen ? "Новая операция" : "Добавить операцию"}
            </div>
            <form onSubmit={submit} className="mt-3.5 space-y-3.5">
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-line p-1">
                {(
                  [
                    ["expense", "Расход", "#ff2ec4", ArrowUpRight],
                    ["income", "Доход", "#b8ff2e", ArrowDownLeft],
                  ] as const
                ).map(([id, label, color, Icon]) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setType(id)}
                    className={cx(
                      "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold transition-all",
                      type === id ? "text-void" : "text-mute hover:text-ink",
                    )}
                    style={
                      type === id
                        ? { background: color, boxShadow: `0 0 16px ${color}88` }
                        : undefined
                    }
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
                  Сумма, ₽
                </label>
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cx(inputNeon, "font-mono text-lg font-bold")}
                />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-mute">
                  Категория
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {typeCats.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCategoryId(c.id)}
                      className={cx(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-bold transition-all",
                        categoryId === c.id
                          ? "text-ink"
                          : "border-line text-mute hover:text-ink",
                      )}
                      style={
                        categoryId === c.id
                          ? {
                              borderColor: `${c.color}99`,
                              background: `${c.color}14`,
                              boxShadow: `0 0 14px ${c.color}33`,
                            }
                          : undefined
                      }
                    >
                      <span className="text-sm">{c.icon}</span> {c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Комментарий"
                  className={inputNeon}
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputNeon}
                />
              </div>
              <Btn type="submit" accent={type === "income" ? "#b8ff2e" : "#ff2ec4"} className="w-full">
                <Plus size={14} /> Записать
              </Btn>
            </form>
          </NeonPanel>

          {/* структура расходов */}
          <NeonPanel accent="#ffb020" className="p-4 sm:p-5">
            <div className="font-display text-xs font-bold uppercase tracking-wider">
              Структура расходов <span className="text-mute">· месяц</span>
            </div>
            <div className="mt-3.5 space-y-3">
              {data.byCategory.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center gap-2 text-xs">
                    <span>{c.icon}</span>
                    <span className="flex-1 truncate font-semibold">{c.name}</span>
                    <span className="font-mono font-bold" style={{ color: c.color }}>
                      {fmtMoney(c.total)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: chartReady ? `${Math.max(2, c.share * 100)}%` : "0%",
                        background: c.color,
                        boxShadow: `0 0 8px ${c.color}99`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.byCategory.length === 0 && (
                <EmptyState title="Расходов нет" text="Отличная новость — в этом месяце вы ничего не потратили." />
              )}
            </div>
          </NeonPanel>
        </div>
      </div>
    </div>
  );
}
