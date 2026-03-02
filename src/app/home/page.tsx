import { PageShell } from "@/components/page-shell";
import { FriendsWidget } from "@/components/friends-widget";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageShell
        title="Home"
        description="Quick access to Explore Cards, My Deck, and your friends list widget."
      />

      <div className="flex flex-wrap gap-3">
        <Link
          href="/explore"
          className="rounded border px-4 py-2 text-sm font-medium"
        >
          Explore Cards
        </Link>
        <Link
          href="/deck"
          className="rounded border px-4 py-2 text-sm font-medium"
        >
          My Deck
        </Link>
      </div>

      <FriendsWidget />
    </div>
  );
}
