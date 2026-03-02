import { FriendRequestStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { validateCsrf } from "@/lib/auth/csrf";
import { checkRateLimit, getClientKey } from "@/lib/auth/rate-limit";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    tooManyRequests,
    unauthorized,
} from "@/lib/http/responses";
import { FriendRequestCreateSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const rateLimit = checkRateLimit(
        `friend-request:${getClientKey(request)}`,
        Math.min(env.RATE_LIMIT_PER_MINUTE, 30),
        60_000,
    );

    if (!rateLimit.ok) {
        return tooManyRequests(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000));
    }

    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = FriendRequestCreateSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    if (parsed.data.toUserId === user.id) {
        return badRequest("You cannot send a friend request to yourself");
    }

    const targetUser = await db.user.findUnique({
        where: { id: parsed.data.toUserId },
        select: { id: true },
    });

    if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existingRelationship = await db.friendRequest.findFirst({
        where: {
            OR: [
                {
                    fromUserId: user.id,
                    toUserId: parsed.data.toUserId,
                },
                {
                    fromUserId: parsed.data.toUserId,
                    toUserId: user.id,
                },
            ],
            status: {
                in: [FriendRequestStatus.PENDING, FriendRequestStatus.ACCEPTED],
            },
        },
        select: {
            status: true,
            fromUserId: true,
            toUserId: true,
        },
    });

    if (existingRelationship?.status === FriendRequestStatus.ACCEPTED) {
        return badRequest("You are already friends with this user");
    }

    if (existingRelationship?.status === FriendRequestStatus.PENDING) {
        if (existingRelationship.fromUserId === user.id) {
            return badRequest("Friend request already sent");
        }

        return badRequest("This user has already sent you a friend request");
    }

    const friendRequest = await db.friendRequest.create({
        data: {
            fromUserId: user.id,
            toUserId: parsed.data.toUserId,
            status: FriendRequestStatus.PENDING,
        },
        select: {
            id: true,
            fromUserId: true,
            toUserId: true,
            status: true,
            createdAt: true,
        },
    });

    return NextResponse.json({ request: friendRequest }, { status: 201 });
}
