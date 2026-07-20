"use client";

import { useEffect, useState } from "react";
import type { Goal, Transaction, Note } from "@/db/schema";
import type { AppSection } from "./AppShell";

interface DashboardProps {
  goals: Goal[];
  transactions: Transaction[];
  notes: Note[];
  onNavigate: (section: AppSection) => void;
}

interface DashboardData {
  goals: { total: number; completed: number; todayTotal: number; todayCompleted: number };
  finance: { totalIncome: string; totalExpense: string; monthIncome: string; monthExpense: string };
  notes: { total: number };
}

const MONTHS = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const WEEKDAYS = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];

export function Dashboard({ goals, transactions, notes, onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [goals.length, transactions.length, notes.length]);

  const now = new Date();
  const todayStr = `${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white/40">Загрузка...</div>
      </div>
    );
  }

  const goalsProgress = data.goals.total > 0 ? (data.goals.completed / data.goals.total) * 100 : 0;
  const balance = parseFloat(data.finance.totalIncome) - parseFloat(data.finance.totalExpense);
  const monthBalance = parseFloat(data.finance.monthIncome) - parseFloat(data.finance.monthExpense);

  return (
    <div className="overflow-y-auto" style={{ height: "100dvh", paddingBottom: "calc(60px + env(safe-area-inset-bottom))" }}>
      {/* Greeting */}
      <div className="px-5 pt-4 pb-2">
        <div className="text-sm text-white/40">{todayStr}</div>
        <h1 className="mt-1 text-[28px] font-bold text-white tracking-tight">LifeOS</h1>
      </div>

      {/* Main stat — balance */}
      <div className="px-5 mb-4">
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${balance >= 0 ? "#0a2e22" : "#2e0a15"}, #0a0a14)`,
            border: `1px solid ${balance >= 0 ? "rgba(0,255,163,0.2)" : "rgba(255,45,111,0.2)"}`,
          }}
        >
          <div className="text-xs font-medium text-white/50 mb-1">Общий баланс</div>
          <div className="text-[34px] font-extrabold tracking-tight" style={{ color: balance >= 0 ? "#00ffa3" : "#ff2d6f" }}>
            {balance >= 0 ? "+" : "−"}{formatMoney(Math.abs(balance))}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-400/80">
                +{formatMoney(parseFloat(data.finance.monthIncome))}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-xs text-rose-400/80">
                −{formatMoney(parseFloat(data.finance.monthExpense))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="px-5 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="🎯"
            value={`${data.goals.completed}/${data.goals.total}`}
            label="Цели"
            accent="#b14dff"
            sublabel={data.goals.todayTotal > 0 ? `Сегодня: ${data.goals.todayCompleted}/${data.goals.todayTotal}` : undefined}
            onClick={() => onNavigate("goals")}
          />
          <StatCard
            icon="📝"
            value={String(data.notes.total)}
            label="Заметки"
            accent="#00d4ff"
            onClick={() => onNavigate("notes")}
          />
        </div>
      </div>

      {/* Month progress */}
      <div className="px-5 mb-4">
        <div
          className="rounded-2xl p-4 border border-white/[0.08]"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white">Прогресс целей</span>
            <span className="text-sm font-bold" style={{ color: "#b14dff" }}>{Math.round(goalsProgress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${goalsProgress}%`, background: "linear-gradient(90deg, #b14dff, #00d4ff)" }}
            />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="px-5 mb-6">
        <div className="text-sm font-semibold text-white/70 mb-3">Быстрые действия</div>
        <div className="grid grid-cols-4 gap-2">
          <QuickBtn icon="➕" label="Цель" color="#ff2d6f" onClick={() => onNavigate("goals")} />
          <QuickBtn icon="📉" label="Расход" color="#ff6b35" onClick={() => { onNavigate("finance"); }} />
          <QuickBtn icon="📈" label="Доход" color="#00ffa3" onClick={() => { onNavigate("finance"); }} />
          <QuickBtn icon="✏️" label="Заметка" color="#b14dff" onClick={() => onNavigate("notes")} />
        </div>
      </div>

      {/* Recent transactions */}
      {transactions.length > 0 && (
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white/70">Последние операции</span>
            <button
              onClick={() => onNavigate("finance")}
              className="text-xs font-semibold"
              style={{ color: "#00ffa3" }}
            >
              Все →
            </button>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((txn) => {
              const isIn = txn.type === "income";
              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/[0.06]"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="text-lg">
                    {isIn ? "📈" : "📉"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{txn.title}</div>
                    <div className="text-xs text-white/30">{formatDate(txn.occurredOn)}</div>
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: isIn ? "#00ffa3" : "#ff2d6f" }}
                  >
                    {isIn ? "+" : "−"}{formatMoney(Number(txn.amount))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, value, label, accent, sublabel, onClick,
}: {
  icon: string; value: string; label: string; accent: string;
  sublabel?: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-4 text-left border border-white/[0.08] transition-all active:scale-95"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
      {sublabel && <div className="text-[10px] mt-1" style={{ color: accent }}>{sublabel}</div>}
    </button>
  );
}

function QuickBtn({ icon, label, color, onClick }: {
  icon: string; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-2xl py-3 border border-white/[0.06] transition-all active:scale-90"
      style={{ background: `${color}10` }}
    >
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-[11px] font-medium" style={{ color }}>{label}</span>
    </button>
  );
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
