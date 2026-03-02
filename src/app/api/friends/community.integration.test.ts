import { beforeEach, describe, expect, it } from "vitest";

import { GET as getFriendRequests } from "@/app/api/friend-requests/route";
import { GET as getFriends } from "@/app/api/friends/route";
import { POST as requestFriend } from "@/app/api/friends/request/route";
import { POST as respondFriend } from "@/app/api/friends/respond/route";
import { authenticateAs, createUserWithDecks, setCsrfToken } from "@/test/auth-test-utils";
import { resetDatabase } from "@/test/db";

describe("community integration", () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    it("sends and accepts a friend request", async () => {
        const fromUser = await createUserWithDecks({
            email: `from-${Date.now()}@example.com`,
            password: "Password123!",
            displayName: "Requester",
        });

        const toUser = await createUserWithDecks({
            email: `to-${Date.now()}@example.com`,
            password: "Password123!",
            displayName: "Receiver",
        });

        await authenticateAs(fromUser.id);
        setCsrfToken("csrf-from");

        const requestResponse = await requestFriend(
            new Request("http://localhost/api/friends/request", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-csrf-token": "csrf-from",
                },
                body: JSON.stringify({ toUserId: toUser.id }),
            }),
        );

        expect(requestResponse.status).toBe(201);
        const requestPayload = await requestResponse.json();
        const requestId = requestPayload.request?.id as string;
        expect(requestId).toBeTruthy();

        await authenticateAs(toUser.id);
        setCsrfToken("csrf-to");

        const pendingResponse = await getFriendRequests();
        expect(pendingResponse.status).toBe(200);
        const pendingPayload = await pendingResponse.json();
        expect(
            (pendingPayload.incoming as Array<{ id: string }>).some(
                (entry) => entry.id === requestId,
            ),
        ).toBe(true);

        const respondResponse = await respondFriend(
            new Request("http://localhost/api/friends/respond", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-csrf-token": "csrf-to",
                },
                body: JSON.stringify({ requestId, action: "accept" }),
            }),
        );

        expect(respondResponse.status).toBe(200);

        const friendsResponse = await getFriends();
        expect(friendsResponse.status).toBe(200);
        const friendsPayload = await friendsResponse.json();
        expect(
            (friendsPayload.friends as Array<{ id: string }>).some(
                (friend) => friend.id === fromUser.id,
            ),
        ).toBe(true);
    });
});
