"use client";

import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { Inbox, Trash2, X } from "lucide-react";

export const cx = (...cls: (string | false | null | undefined)[]) =>
  cls.filter(Boolean).join(" ");

export const inputNeon =
  "w-full rounded-lg border border-line bg-abyss/80 px-3.5 py-2.5 text-sm text-ink placeholder:text-mute/50 outline-none transition-all focus:border-neon-cyan/60 focus:shadow-[0_0_0_1px_rgba(0,229,255,0.35),0_0_20px_rgba(0,229,255,0.12)]";

// ─── Панель с неоновым акцентом ─────────────────────────────────────────────

export function NeonPanel({
  accent = "#00e5ff",
  glow = false,
  className,
  style,
  children,
}: {
  accent?: string;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={cx("neon-panel", glow && "neon-panel-glow", className)}
      style={{ "--accent": accent, ...style } as CSSProperties}
    >
      {children}
    </div>
  );
}

// ─── Заголовок раздела ──────────────────────────────────────────────────────

export function SectionHead({
  code,
  title,
  accent,
  children,
}: {
  code: string;
  title: string;
  accent: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
      <div>
        <div
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.35em] sm:text-[11px]"
          style={{ color: accent, textShadow: `0 0 12px ${accent}88` }}
        >
          {code}
        </div>
        <h2 className="mt-1 font-display text-2xl font-extrabold leading-none tracking-tight sm:text-[32px]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

// ─── Кнопки ─────────────────────────────────────────────────────────────────

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  accent?: string;
  ghost?: boolean;
};

export function Btn({ accent = "#00e5ff", ghost = false, className, style, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx("btn-neon", ghost && "btn-ghost", className)}
      style={{ "--accent": accent, ...style } as CSSProperties}
    />
  );
}

// ─── Модальное окно (на мобильных — шторка снизу) ───────────────────────────

export function Modal({
  open,
  onClose,
  title,
  accent = "#00e5ff",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      onMouseDown={onClose}
    >
      <div className="animate-fade-in absolute inset-0 bg-void/80 backdrop-blur-sm" />
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="neon-panel animate-modal-in relative max-h-[92vh] w-full overflow-y-auto rounded-b-none rounded-t-2xl sm:max-w-lg sm:rounded-[12px]"
        style={{ "--accent": accent } as CSSProperties}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel/90 px-5 py-3.5 backdrop-blur">
          <h3
            className="font-display text-sm font-bold uppercase tracking-wider"
            style={{ color: accent, textShadow: `0 0 14px ${accent}77` }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="text-mute transition-colors hover:text-neon-red"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Анимированное число ────────────────────────────────────────────────────

export function CountUp({
  value,
  format,
  duration = 900,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setN(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return (
    <span className={className} suppressHydrationWarning>
      {format ? format(n) : Math.round(n).toLocaleString("ru-RU")}
    </span>
  );
}

// ─── Прогресс-бар ───────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  color,
  className,
}: {
  value: number;
  color: string;
  className?: string;
}) {
  return (
    <div className={cx("h-2 overflow-hidden rounded-full bg-white/[0.06]", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          boxShadow: `0 0 12px ${color}99`,
        }}
      />
    </div>
  );
}

// ─── Кнопка удаления с подтверждением в 2 клика ─────────────────────────────

export function ConfirmDelete({
  onConfirm,
  label = "Точно?",
  className,
}: {
  onConfirm: () => void;
  label?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2400);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      aria-label="Удалить"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={cx(
        "inline-flex h-8 items-center justify-center gap-1 rounded-md border px-2 transition-all",
        armed
          ? "border-neon-red/70 bg-neon-red/10 font-bold text-neon-red shadow-[0_0_14px_rgba(255,84,112,0.35)]"
          : "border-transparent text-mute/70 hover:border-neon-red/40 hover:text-neon-red",
        className,
      )}
    >
      {armed ? <span className="text-[11px]">{label}</span> : <Trash2 size={14} />}
    </button>
  );
}

// ─── Палитра неоновых цветов ────────────────────────────────────────────────

export function ColorSwatches({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (c: string) => void;
  colors: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          className={cx(
            "h-8 w-8 rounded-full border-2 transition-all hover:scale-110",
            value === c ? "scale-110 border-white" : "border-transparent opacity-60 hover:opacity-100",
          )}
          style={{ background: c, boxShadow: value === c ? `0 0 16px ${c}` : "none" }}
        />
      ))}
    </div>
  );
}

// ─── Служебные состояния ────────────────────────────────────────────────────

export function EmptyState({ icon, title, text }: { icon?: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="text-mute/50">{icon ?? <Inbox size={34} />}</div>
      <div className="font-display text-sm font-bold">{title}</div>
      <div className="max-w-xs text-xs leading-relaxed text-mute">{text}</div>
    </div>
  );
}

export function Loader() {
  return (
    <div className="flex items-center gap-3 py-16 font-mono text-xs tracking-[0.3em] text-neon-cyan">
      <span className="inline-block h-2 w-2 animate-ping rounded-full bg-neon-cyan shadow-[0_0_10px_#00e5ff]" />
      ЗАГРУЗКА ДАННЫХ
    </div>
  );
}
