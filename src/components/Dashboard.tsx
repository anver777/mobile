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

export function Dashboard({ goals, transactions, notes, onNavigate }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      }
    }
    fetchDashboard();
  }, [goals.length, transactions.length, notes.length]);

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white/50">Загрузка...</div>
      </div>
    );
  }

  const goalsProgress = data.goals.total > 0 ? (data.goals.completed / data.goals.total) * 100 : 0;
  const todayProgress = data.goals.todayTotal > 0 ? (data.goals.todayCompleted / data.goals.todayTotal) * 100 : 0;
  const balance = parseFloat(data.finance.totalIncome) - parseFloat(data.finance.totalExpense);
  const monthBalance = parseFloat(data.finance.monthIncome) - parseFloat(data.finance.monthExpense);

  return (
    <div className="px-4 pt-8">
      {/* Header */}
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-white" style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
          📊 Обзор
        </h1>
      </header>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Goals card */}
        <button
          onClick={() => onNavigate("goals")}
          className="rounded-2xl border border-[rgba(255,45,111,0.3)] bg-[rgba(255,45,111,0.08)] p-4 text-left transition-all hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 0 20px rgba(255,45,111,0.15)" }}
        >
          <div className="text-2xl mb-2">🎯</div>
          <div className="text-xs text-white/50 mb-1">Цели</div>
          <div className="text-2xl font-bold text-[#ff2d6f]" style={{ textShadow: "0 0 10px rgba(255,45,111,0.5)" }}>
            {data.goals.completed}/{data.goals.total}
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#ff2d6f]"
              style={{ width: `${goalsProgress}%`, boxShadow: "0 0 8px rgba(255,45,111,0.6)" }}
            />
          </div>
        </button>

        {/* Today goals card */}
        <button
          onClick={() => onNavigate("goals")}
          className="rounded-2xl border border-[rgba(177,77,255,0.3)] bg-[rgba(177,77,255,0.08)] p-4 text-left transition-all hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 0 20px rgba(177,77,255,0.15)" }}
        >
          <div className="text-2xl mb-2">☀️</div>
          <div className="text-xs text-white/50 mb-1">Сегодня</div>
          <div className="text-2xl font-bold text-[#b14dff]" style={{ textShadow: "0 0 10px rgba(177,77,255,0.5)" }}>
            {data.goals.todayCompleted}/{data.goals.todayTotal}
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#b14dff]"
              style={{ width: `${todayProgress}%`, boxShadow: "0 0 8px rgba(177,77,255,0.6)" }}
            />
          </div>
        </button>

        {/* Balance card */}
        <button
          onClick={() => onNavigate("finance")}
          className={`rounded-2xl border p-4 text-left transition-all hover:scale-105 active:scale-95`}
          style={{
            borderColor: balance >= 0 ? "rgba(0,255,163,0.3)" : "rgba(255,45,111,0.3)",
            background: balance >= 0 ? "rgba(0,255,163,0.08)" : "rgba(255,45,111,0.08)",
            boxShadow: `0 0 20px ${balance >= 0 ? "rgba(0,255,163,0.15)" : "rgba(255,45,111,0.15)"}`,
          }}
        >
          <div className="text-2xl mb-2">💳</div>
          <div className="text-xs text-white/50 mb-1">Баланс</div>
          <div
            className="text-2xl font-bold"
            style={{
              color: balance >= 0 ? "#00ffa3" : "#ff2d6f",
              textShadow: `0 0 10px ${balance >= 0 ? "rgba(0,255,163,0.5)" : "rgba(255,45,111,0.5)"}`,
            }}
          >
            {balance >= 0 ? "+" : ""}
            {balance.toFixed(0)}
          </div>
          <div className="text-[10px] text-white/30 mt-1">Всё время</div>
        </button>

        {/* Month balance card */}
        <button
          onClick={() => onNavigate("finance")}
          className={`rounded-2xl border p-4 text-left transition-all hover:scale-105 active:scale-95`}
          style={{
            borderColor: monthBalance >= 0 ? "rgba(0,212,255,0.3)" : "rgba(255,107,53,0.3)",
            background: monthBalance >= 0 ? "rgba(0,212,255,0.08)" : "rgba(255,107,53,0.08)",
            boxShadow: `0 0 20px ${monthBalance >= 0 ? "rgba(0,212,255,0.15)" : "rgba(255,107,53,0.15)"}`,
          }}
        >
          <div className="text-2xl mb-2">📅</div>
          <div className="text-xs text-white/50 mb-1">Месяц</div>
          <div
            className="text-2xl font-bold"
            style={{
              color: monthBalance >= 0 ? "#00d4ff" : "#ff6b35",
              textShadow: `0 0 10px ${monthBalance >= 0 ? "rgba(0,212,255,0.5)" : "rgba(255,107,53,0.5)"}`,
            }}
          >
            {monthBalance >= 0 ? "+" : ""}
            {monthBalance.toFixed(0)}
          </div>
          <div className="text-[10px] text-white/30 mt-1">Этот месяц</div>
        </button>
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-3" style={{ textShadow: "0 0 12px rgba(255,255,255,0.2)" }}>
          Быстрые действия
        </h2>
        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon="➕" label="Цель" onClick={() => onNavigate("goals")} />
          <QuickAction icon="💸" label="Расход" onClick={() => onNavigate("finance")} />
          <QuickAction icon="💰" label="Доход" onClick={() => onNavigate("finance")} />
          <QuickAction icon="📝" label="Заметка" onClick={() => onNavigate("notes")} />
        </div>
      </div>

      {/* Notes preview */}
      {notes.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white" style={{ textShadow: "0 0 12px rgba(255,255,255,0.2)" }}>
              Последние заметки
            </h2>
            <button onClick={() => onNavigate("notes")} className="text-xs text-[#ff2d6f] font-semibold">
              Все →
            </button>
          </div>
          <div className="space-y-2">
            {notes.slice(0, 3).map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
              >
                <div className="flex items-start gap-2">
                  <div
                    className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: note.color, boxShadow: `0 0 6px ${note.color}` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{note.title}</div>
                    <div className="text-xs text-white/40 line-clamp-2 mt-0.5">{note.content}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-white/5 py-3 transition-all hover:scale-105 active:scale-95"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] font-semibold text-white/60">{label}</span>
    </button>
  );
}
