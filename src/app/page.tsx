import Link from "next/link";

import { PageShell } from "@/components/page-shell";

export default function LandingPage() {
  return (
    <div className="space-y-6">
      <PageShell
        title="Your pocket spellbook for deck building"
        description="Search cards, shape multiple decks, and share with your friends."
      />
      <div className="flex flex-wrap gap-3">
        <Link className="rounded border px-4 py-2" href="/login">
          Log in
        </Link>
        <Link className="rounded border px-4 py-2" href="/signup">
          Sign up
        </Link>
      </div>
    </div>
  );
}
