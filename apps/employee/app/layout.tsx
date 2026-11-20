import { ThemeScript, ThemeToggle } from "@repo/ui";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { body, head } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = { title: "My attendance & pay", description: "Your days worked and your pay." };
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d111c" },
  ],
};
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">
        <header className="sticky top-0 z-30 border-b bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-display text-lg font-bold">
              My attendance &amp; pay
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto max-w-3xl space-y-5 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-5">{children}</main>
      </body>
    </html>
  );
}
