"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutDashboard, StickyNote, Target, Wallet, Zap } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import GoalsSection from "@/components/GoalsSection";
import FinanceSection from "@/components/FinanceSection";
import NotesSection from "@/components/NotesSection";
import { cx } from "@/components/ui";
import { greeting } from "@/lib/core";
import type { SectionId } from "@/lib/core";

const NAV: { id: SectionId; label: string; code: string; icon: typeof Target; accent: string }[] = [
  { id: "dashboard", label: "Обзор", code: "01", icon: LayoutDashboard, accent: "#00e5ff" },
  { id: "goals", label: "Цели", code: "02", icon: Target, accent: "#ff2ec4" },
  { id: "finance", label: "Финансы", code: "03", icon: Wallet, accent: "#b8ff2e" },
  { id: "notes", label: "Заметки", code: "04", icon: StickyNote, accent: "#ffb020" },
];

const PARTICLE_COLORS = ["#00e5ff", "#ff2ec4", "#b8ff2e", "#9d6bff"];

export default function AppShell() {
  const [section, setSection] = useState<SectionId>("dashboard");
  const [intent, setIntent] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const notify = useCallback((msg: string) => setToast({ id: Date.now(), msg }), []);
  const clearIntent = useCallback(() => setIntent(null), []);
  const go = useCallback((s: SectionId, i?: string) => {
    setSection(s);
    setIntent(i ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: (i * 137.5) % 100,
        top: 8 + ((i * 71.3) % 84),
        size: 2 + (i % 3),
        delay: (i % 7) * -1.7,
        dur: 7 + (i % 5) * 2.5,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      })),
    [],
  );

  const active = NAV.find((n) => n.id === section)!;
  const time = now.toLocaleTimeString("ru-RU", { hour12: false });
  const dateStr = now.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen">
      {/* ── Эмбиент-фон ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="animate-drift absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full opacity-25 blur-[110px]"
          style={{ background: "radial-gradient(circle, #00e5ff 0%, transparent 65%)" }}
        />
        <div
          className="animate-drift-slow absolute -right-48 top-1/3 h-[520px] w-[520px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #ff2ec4 0%, transparent 65%)" }}
        />
        <div
          className="animate-drift absolute bottom-0 left-1/4 h-[380px] w-[380px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #9d6bff 0%, transparent 65%)",
            animationDelay: "-7s",
          }}
        />
        <div className="grid-floor" />
        {particles.map((p, i) => (
          <span
            key={i}
            className="particle"
            style={
              {
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: p.size,
                height: p.size,
                "--c": p.color,
                "--dur": `${p.dur}s`,
                "--delay": `${p.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
        <div className="scanlines absolute inset-0 opacity-60" />
      </div>

      {/* ── Сайдбар (десктоп) ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-abyss/70 backdrop-blur-xl lg:flex">
        <div className="px-6 pb-5 pt-7">
          <div className="font-display text-[22px] font-extrabold leading-none tracking-tight">
            LIFE
            <span className="text-neon-cyan glow-cyan-text">OS</span>
            <span className="animate-caret ml-0.5 text-neon-magenta">▮</span>
          </div>
          <div className="mt-2 font-mono text-[9px] uppercase tracking-[0.35em] text-mute">
            personal dashboard
          </div>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-transparent opacity-60" />
        </div>

        <nav className="flex-1 space-y-1 px-3 pt-2">
          {NAV.map((item) => {
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={cx(
                  "relative flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-bold transition-all",
                  isActive
                    ? "bg-white/[0.04] text-ink"
                    : "text-mute hover:bg-white/[0.03] hover:text-ink",
                )}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                    style={{ background: item.accent, boxShadow: `0 0 12px ${item.accent}` }}
                  />
                )}
                <item.icon
                  size={18}
                  style={
                    isActive
                      ? { color: item.accent, filter: `drop-shadow(0 0 6px ${item.accent})` }
                      : undefined
                  }
                />
                {item.label}
                <span className="ml-auto font-mono text-[10px] text-mute/50">{item.code}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="rounded-lg border border-neon-lime/25 bg-neon-lime/[0.04] p-3">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-neon-lime">
              <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-neon-lime" />
              SYNC · ONLINE
            </div>
            <div className="mt-1.5 font-mono text-[9px] text-mute">
              PostgreSQL · Drizzle ORM
              <br />
              LifeOS v2.0.77
            </div>
          </div>
        </div>
      </aside>

      {/* ── Контент ── */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-line bg-void/75 backdrop-blur-xl">
          <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-10">
            <div className="font-display text-lg font-extrabold leading-none tracking-tight lg:hidden">
              LIFE
              <span className="text-neon-cyan glow-cyan-text">OS</span>
              <span className="animate-caret ml-0.5 text-neon-magenta">▮</span>
            </div>
            <div className="hidden items-center gap-3 lg:flex">
              <span
                className="font-mono text-[11px] uppercase tracking-[0.3em]"
                style={{ color: active.accent, textShadow: `0 0 12px ${active.accent}77` }}
              >
                // {active.code} · {active.label}
              </span>
              <span className="text-mute/40">·</span>
              <span className="font-mono text-[11px] text-mute">{greeting()}!</span>
            </div>
            <div className="text-right">
              <div
                className="glow-cyan-text font-mono text-sm font-bold tabular-nums text-neon-cyan sm:text-base"
                suppressHydrationWarning
              >
                {time}
              </div>
              <div className="hidden font-mono text-[10px] capitalize text-mute sm:block">
                {dateStr}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:pb-12 lg:pl-10">
          <div key={section} className="animate-section-in">
            {section === "dashboard" && <Dashboard go={go} notify={notify} />}
            {section === "goals" && (
              <GoalsSection notify={notify} intent={intent} clearIntent={clearIntent} />
            )}
            {section === "finance" && (
              <FinanceSection notify={notify} intent={intent} clearIntent={clearIntent} />
            )}
            {section === "notes" && (
              <NotesSection notify={notify} intent={intent} clearIntent={clearIntent} />
            )}
          </div>

          <footer className="mt-10 border-t border-line pt-4 text-center font-mono text-[10px] tracking-widest text-mute/50">
            LIFEOS // НЕОНОВЫЙ ДАШБОРД ПРОДУКТИВНОСТИ · NEXT.JS + POSTGRESQL + DRIZZLE
          </footer>
        </main>
      </div>

      {/* ── Нижняя навигация (мобильные) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-abyss/85 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="flex flex-col items-center gap-1 pb-2 pt-2.5 transition-colors"
              >
                <item.icon
                  size={20}
                  style={
                    isActive
                      ? { color: item.accent, filter: `drop-shadow(0 0 7px ${item.accent})` }
                      : { color: "#8b93b8" }
                  }
                />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: isActive ? item.accent : "#8b93b8" }}
                >
                  {item.label}
                </span>
                <span
                  className="h-1 w-1 rounded-full transition-opacity"
                  style={{
                    background: item.accent,
                    boxShadow: `0 0 8px ${item.accent}`,
                    opacity: isActive ? 1 : 0,
                  }}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Тост ── */}
      {toast && (
        <div
          key={toast.id}
          className="animate-toast-in fixed bottom-24 left-4 right-4 z-[80] sm:left-auto sm:right-6 lg:bottom-8"
        >
          <div
            className="neon-panel flex items-center gap-2.5 px-4 py-3 text-sm font-semibold"
            style={{ "--accent": "#b8ff2e" } as React.CSSProperties}
          >
            <Zap size={15} className="shrink-0 text-neon-lime" style={{ filter: "drop-shadow(0 0 6px #b8ff2e)" }} />
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  );
}
