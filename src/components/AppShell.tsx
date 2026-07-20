"use client";

import { useState } from "react";
import { Dashboard } from "./Dashboard";
import { GoalsSection } from "./GoalsSection";
import { FinanceSection } from "./FinanceSection";
import { NotesSection } from "./NotesSection";
import type { Goal, FinanceCategory, Transaction, Note } from "@/db/schema";

export type AppSection = "dashboard" | "goals" | "finance" | "notes";

interface AppShellProps {
  initialGoals: Goal[];
  initialTransactions: Transaction[];
  initialCategories: FinanceCategory[];
  initialNotes: Note[];
}

export function AppShell({
  initialGoals,
  initialTransactions,
  initialCategories,
  initialNotes,
}: AppShellProps) {
  const [section, setSection] = useState<AppSection>("dashboard");

  return (
    <div className="neon-bg relative min-h-screen w-full">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {section === "dashboard" && (
          <Dashboard
            goals={initialGoals}
            transactions={initialTransactions}
            notes={initialNotes}
            onNavigate={setSection}
          />
        )}
        {section === "goals" && <GoalsSection initialGoals={initialGoals} />}
        {section === "finance" && (
          <FinanceSection
            initialTransactions={initialTransactions}
            initialCategories={initialCategories}
          />
        )}
        {section === "notes" && <NotesSection initialNotes={initialNotes} />}
      </div>

      {/* Bottom navigation with safe-area */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(255,255,255,0.06)] bg-[#070714]/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-1.5 py-1.5">
          <NavButton
            icon="📊"
            label="Главная"
            active={section === "dashboard"}
            onClick={() => setSection("dashboard")}
          />
          <NavButton
            icon="🎯"
            label="Цели"
            active={section === "goals"}
            onClick={() => setSection("goals")}
          />
          <NavButton
            icon="💰"
            label="Финансы"
            active={section === "finance"}
            onClick={() => setSection("finance")}
          />
          <NavButton
            icon="📝"
            label="Заметки"
            active={section === "notes"}
            onClick={() => setSection("notes")}
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-[11px] font-bold transition-all duration-200 active:scale-90 active:opacity-80"
      style={{
        minHeight: "48px",
        ...(active
          ? {
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              boxShadow: "0 0 12px rgba(255,255,255,0.1)",
            }
          : { color: "rgba(232,232,255,0.5)" }),
      }}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
