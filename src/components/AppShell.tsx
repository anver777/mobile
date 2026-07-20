"use client";

import { useState, useEffect } from "react";
import type { Goal, FinanceCategory, Transaction, Note } from "@/db/schema";
import { Dashboard } from "./Dashboard";
import { GoalsSection } from "./GoalsSection";
import { FinanceSection } from "./FinanceSection";
import { NotesSection } from "./NotesSection";

export type AppSection = "dashboard" | "goals" | "finance" | "notes";

interface AppShellProps {
  initialGoals: Goal[];
  initialTransactions: Transaction[];
  initialCategories: FinanceCategory[];
  initialNotes: Note[];
}

const TABS = [
  { key: "dashboard", icon: "home", label: "Главная" },
  { key: "goals", icon: "target", label: "Цели" },
  { key: "finance", icon: "wallet", label: "Финансы" },
  { key: "notes", icon: "notes", label: "Заметки" },
] as const;

export function AppShell({
  initialGoals,
  initialTransactions,
  initialCategories,
  initialNotes,
}: AppShellProps) {
  const [section, setSection] = useState<AppSection>("dashboard");
  const [animating, setAnimating] = useState(false);

  function navigate(s: AppSection) {
    if (s === section || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setSection(s);
      setAnimating(false);
    }, 150);
  }

  return (
    <div className="neon-bg flex min-h-screen flex-col">
      {/* Content area */}
      <div className="flex-1 overflow-hidden" style={{ animation: animating ? "none" : undefined }}>
        {section === "dashboard" && (
          <Dashboard goals={initialGoals} transactions={initialTransactions} notes={initialNotes} onNavigate={navigate} />
        )}
        {section === "goals" && <GoalsSection initialGoals={initialGoals} />}
        {section === "finance" && (
          <FinanceSection initialTransactions={initialTransactions} initialCategories={initialCategories} />
        )}
        {section === "notes" && <NotesSection initialNotes={initialNotes} />}
      </div>

      {/* Tab bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key as AppSection)}
              className="relative flex flex-1 flex-col items-center justify-center py-2 transition-all active:scale-90"
              style={{ minHeight: "52px" }}
            >
              <div className="relative">
                <TabIcon icon={tab.icon} active={section === tab.key} />
              </div>
              <span
                className="mt-1 text-[10px] font-medium"
                style={{
                  color: section === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
                  transition: "color 0.2s",
                }}
              >
                {tab.label}
              </span>
              {section === tab.key && (
                <div
                  className="absolute -bottom-[2px] left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full"
                  style={{ background: "#fff", boxShadow: "0 0 6px rgba(255,255,255,0.5)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
  const s = 22;
  const color = active ? "#ffffff" : "rgba(255,255,255,0.4)";
  const glow = active ? "0 0 8px rgba(255,255,255,0.4)" : "none";

  if (icon === "home") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(${glow})`, transition: "all 0.2s" }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }
  if (icon === "target") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(${glow})`, transition: "all 0.2s" }}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  if (icon === "wallet") {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(${glow})`, transition: "all 0.2s" }}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M16 12h.01" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(${glow})`, transition: "all 0.2s" }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
