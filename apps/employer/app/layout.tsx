import { ThemeScript } from "@repo/ui";
import type { Metadata, Viewport } from "next";
import { body, head } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance & Pay",
  description: "Mark attendance and pay your team.",
  // Home-screen name and full-screen launch on iPhone.
  appleWebApp: { capable: true, title: "Attendance", statusBarStyle: "default" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0d111c" },
  ],
};
// Every page reads live data or the session.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
