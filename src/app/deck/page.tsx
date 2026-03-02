import { PageShell } from "@/components/page-shell";
import { DeckBuilder } from "@/components/deck-builder";

export default function DeckPage() {
  return (
    <div className="space-y-6">
      <PageShell
        title="My Deck"
        description="Build Main, Aggressive, Defensive, and YOLO decks with drag and drop."
      />
      <DeckBuilder />
    </div>
  );
}
