import { PageShell } from "@/components/page-shell";
import { ExploreBrowser } from "@/components/explore-browser";

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <PageShell
        title="Explore Cards"
        description="Search and filter cards, then open details to inspect each card."
      />
      <ExploreBrowser />
    </div>
  );
}
