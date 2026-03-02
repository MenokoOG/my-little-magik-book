import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Little Magik Book",
  description: "Build and share your Magic decks.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

const navItems = [
  { href: "/", label: "Landing" },
  { href: "/learn", label: "Learn" },
  { href: "/home", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/deck", label: "My Deck" },
  { href: "/community", label: "Community" },
  { href: "/profile", label: "Profile" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegister />
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-5">
          <header className="mb-8 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                My Little Magik Book
              </h1>
              <ThemeToggle />
            </div>
            <nav className="mt-4 flex flex-wrap gap-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  {item.label}
                </Link>
              ))}
              <LogoutButton />
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
