import { FriendRequestStatus } from "@prisma/client";

import { db } from "@/lib/db";

export async function areFriends(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
        return true;
    }

    const friendship = await db.friendRequest.findFirst({
        where: {
            status: FriendRequestStatus.ACCEPTED,
            OR: [
                { fromUserId: userId, toUserId: otherUserId },
                { fromUserId: otherUserId, toUserId: userId },
            ],
        },
        select: { id: true },
    });

    return Boolean(friendship);
}
