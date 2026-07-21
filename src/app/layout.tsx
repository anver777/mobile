import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "NEON// FINANCE — Доходы, Цели, Заметки",
  description:
    "Кибер-неоновый трекер доходов, финансовых целей и заметок. Vanilla JavaScript, работает офлайн, данные хранятся локально.",
};

export const viewport: Viewport = {
  themeColor: "#02030a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
