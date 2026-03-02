import { FriendRequestStatus } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import { GET as getDeckById } from "@/app/api/decks/[id]/route";
import { db } from "@/lib/db";
import { authenticateAs, createUserWithDecks } from "@/test/auth-test-utils";
import { resetDatabase } from "@/test/db";

describe("deck privacy integration", () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    it("allows FRIENDS deck access only to accepted friends", async () => {
        const owner = await createUserWithDecks({
            email: `owner-${Date.now()}@example.com`,
            password: "Password123!",
            displayName: "Deck Owner",
        });

        const viewer = await createUserWithDecks({
            email: `viewer-${Date.now()}@example.com`,
            password: "Password123!",
            displayName: "Deck Viewer",
        });

        const ownerDeck = await db.deck.findFirst({
            where: { ownerId: owner.id },
            orderBy: { createdAt: "asc" },
        });

        expect(ownerDeck).not.toBeNull();

        await db.deck.update({
            where: { id: ownerDeck!.id },
            data: { visibility: "FRIENDS" },
        });

        await authenticateAs(viewer.id);

        const blocked = await getDeckById(new Request("http://localhost/api/decks"), {
            params: Promise.resolve({ id: ownerDeck!.id }),
        });

        expect(blocked.status).toBe(403);

        await db.friendRequest.create({
            data: {
                fromUserId: owner.id,
                toUserId: viewer.id,
                status: FriendRequestStatus.ACCEPTED,
            },
        });

        const allowed = await getDeckById(new Request("http://localhost/api/decks"), {
            params: Promise.resolve({ id: ownerDeck!.id }),
        });

        expect(allowed.status).toBe(200);
        const payload = await allowed.json();
        expect(payload.deck.id).toBe(ownerDeck!.id);
    });
});
