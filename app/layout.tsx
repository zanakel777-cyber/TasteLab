import type { Metadata } from "next";
import { Geist } from "next/font/google";
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
    "Degustacijų ir maisto dirbtuvių platforma: kurk veiklas ir rezervuok vietas.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
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
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
              <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center">
                  <Link href="/" className="font-semibold">
                    TasteLab
                  </Link>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-foreground/80 hover:text-foreground hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                {!hasEnvVars ? (
                  <EnvVarWarning />
                ) : (
                  <Suspense>
                    <AuthButton />
                  </Suspense>
                )}
              </div>
            </nav>

            <main className="flex-1 w-full flex justify-center">
              <div className="w-full max-w-5xl p-5">{children}</div>
            </main>

            <footer className="w-full flex items-center justify-center border-t text-center text-xs gap-8 py-8">
              <p>TasteLab – degustacijos ir maisto dirbtuvės</p>
              <ThemeSwitcher />
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
