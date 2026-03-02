import { FriendRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAuthenticatedUser, unauthorized } from "@/lib/http/responses";

export async function GET() {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const accepted = await db.friendRequest.findMany({
        where: {
            status: FriendRequestStatus.ACCEPTED,
            OR: [{ fromUserId: user.id }, { toUserId: user.id }],
        },
        select: {
            id: true,
            fromUserId: true,
            toUserId: true,
            fromUser: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
            toUser: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
            updatedAt: true,
        },
        orderBy: {
            updatedAt: "desc",
        },
    });

    const friends = accepted.map((request) => {
        const peer = request.fromUserId === user.id ? request.toUser : request.fromUser;
        return {
            friendshipId: request.id,
            id: peer.id,
            displayName: peer.displayName,
            connectedAt: request.updatedAt,
        };
    });

    return NextResponse.json({ friends }, { status: 200 });
}
