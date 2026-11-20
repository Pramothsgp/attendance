import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Attendance & Pay" };
// Every page reads live data or the session.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/30 antialiased">{children}</body>
    </html>
  );
}
