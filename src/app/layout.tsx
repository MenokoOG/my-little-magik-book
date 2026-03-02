import type { Metadata } from "next";
import Link from "next/link";

import { LogoutButton } from "@/components/logout-button";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Little Magik Book",
  description: "Build and share your Magic decks.",
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
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-4">
          <header className="mb-8 border-b pb-4">
            <h1 className="text-2xl font-semibold">My Little Magik Book</h1>
            <nav className="mt-3 flex flex-wrap gap-3 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded border px-3 py-1"
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
