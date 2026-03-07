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
          <header className="mlmb-shell mb-8 rounded-2xl p-4">
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
                  className="mlmb-nav-link mlmb-focus-ring rounded-xl px-3 py-1.5"
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
