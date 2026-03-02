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
import { FriendRequestRespondSchema } from "@/lib/validation/community";

export async function POST(request: Request) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const rateLimit = checkRateLimit(
        `friend-respond:${getClientKey(request)}`,
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
    const parsed = FriendRequestRespondSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const existingRequest = await db.friendRequest.findUnique({
        where: { id: parsed.data.requestId },
        select: {
            id: true,
            toUserId: true,
            status: true,
        },
    });

    if (!existingRequest) {
        return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    if (existingRequest.toUserId !== user.id) {
        return forbidden("You cannot respond to this friend request");
    }

    if (existingRequest.status !== FriendRequestStatus.PENDING) {
        return badRequest("Friend request is no longer pending");
    }

    const status =
        parsed.data.action === "accept"
            ? FriendRequestStatus.ACCEPTED
            : FriendRequestStatus.REJECTED;

    const updated = await db.friendRequest.update({
        where: { id: existingRequest.id },
        data: { status },
        select: {
            id: true,
            fromUserId: true,
            toUserId: true,
            status: true,
            updatedAt: true,
        },
    });

    return NextResponse.json({ request: updated }, { status: 200 });
}
