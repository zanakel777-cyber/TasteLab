import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "TasteLab",
  description:
    "Skonio dirbtuvės su labai ribotu vietų skaičiumi: degustacijos ir maisto dirbtuvės.",
};

// Antraščių šriftas.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  display: "swap",
  subsets: ["latin-ext"],
  axes: ["SOFT", "WONK", "opsz"],
});

// Teksto šriftas.
const inter = Inter({
  variable: "--font-inter",
  display: "swap",
  subsets: ["latin-ext"],
});

const navLinks = [
  { href: "/veiklos", label: "Veiklos" },
  { href: "/rezervacijos", label: "Mano rezervacijos" },
  { href: "/organizatorius", label: "Mano veiklos" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-20 w-full border-b border-border/70 bg-background/85 backdrop-blur">
              <nav className="mx-auto w-full max-w-5xl flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="tl-heading text-xl font-semibold tracking-tight"
                  >
                    Taste<span className="tl-wine">Lab</span>
                  </Link>
                  <div className="flex items-center gap-5">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                {!hasEnvVars ? (
                  <EnvVarWarning />
                ) : (
                  <Suspense>
                    <AuthButton />
                  </Suspense>
                )}
              </nav>
            </header>

            <main className="flex-1 w-full flex justify-center">
              <div className="w-full max-w-5xl px-5">{children}</div>
            </main>

            <footer className="w-full border-t border-border/70">
              <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-xs text-muted-foreground">
                <p>TasteLab – degustacijos ir maisto dirbtuvės</p>
                <ThemeSwitcher />
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
