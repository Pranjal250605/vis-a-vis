import type { Metadata, Viewport } from "next";
import "../styles/base.css";

export const metadata: Metadata = {
  title: "Vinsight | モニター・アンケートサイト",
  description: "Vinsight（ビザビ）リプレイス・デモ：アンケートに答えてポイントをためよう。",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Jost:wght@400;500;700&family=Noto+Serif+JP:wght@500;600&display=swap"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
