"use client";

import { useEffect, type ReactNode } from "react";
import { NEON_OPTIONS, type NeonKey } from "@/lib/utils";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  accent = "cyan",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  accent?: NeonKey;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={`modal-overlay c-${accent}`} onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg neon-text">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="grid place-items-center w-9 h-9 rounded-lg border border-white/10 text-muted hover:text-white hover:border-white/30 transition"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: NeonKey;
  onChange: (c: NeonKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {NEON_OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            title={opt.label}
            className={`c-${opt.key} w-9 h-9 rounded-full grid place-items-center transition ${
              active ? "ring-2 ring-offset-2 ring-offset-[#0a0b1a]" : ""
            }`}
            style={{ boxShadow: active ? `0 0 16px var(--neon)` : undefined }}
          >
            <span
              className="w-6 h-6 rounded-full"
              style={{
                background: "var(--neon)",
                boxShadow: `0 0 10px var(--neon)`,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="glass flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="text-muted mb-3 opacity-70">{icon}</div>
      <p className="font-display text-base text-white/80">{title}</p>
      <p className="text-sm text-muted mt-1 max-w-xs">{hint}</p>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="neon-label">{label}</span>
      {children}
    </label>
  );
}
