import { PageShell } from "@/components/page-shell";
import { CommunityPanel } from "@/components/community-panel";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <PageShell
        title="Community"
        description="Search users, manage friend requests, and view your friends list."
      />
      <CommunityPanel />
    </div>
  );
}
