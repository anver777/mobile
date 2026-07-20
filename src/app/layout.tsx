import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOS — Цели, Финансы, Заметки",
  description:
    "Всё в одном месте: цели, доходы и расходы, заметки. Полная личная аналитика для продуктивной жизни.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LifeOS",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#05050f",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-[#05050f] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
