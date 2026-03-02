import { FriendRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { requireAuthenticatedUser, unauthorized } from "@/lib/http/responses";

export async function GET() {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const [incoming, outgoing] = await Promise.all([
        db.friendRequest.findMany({
            where: {
                toUserId: user.id,
                status: FriendRequestStatus.PENDING,
            },
            select: {
                id: true,
                fromUserId: true,
                status: true,
                createdAt: true,
                fromUser: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
        db.friendRequest.findMany({
            where: {
                fromUserId: user.id,
                status: FriendRequestStatus.PENDING,
            },
            select: {
                id: true,
                toUserId: true,
                status: true,
                createdAt: true,
                toUser: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        }),
    ]);

    return NextResponse.json({ incoming, outgoing }, { status: 200 });
}
