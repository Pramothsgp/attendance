import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "My attendance & pay" };
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-muted/30 antialiased">
        <header className="border-b bg-background">
          <div className="mx-auto max-w-3xl px-4 py-3">
            <Link href="/" className="font-semibold">
              My attendance &amp; pay
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
