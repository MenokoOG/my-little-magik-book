import { NextResponse } from "next/server";

import { ensureCsrfCookie } from "@/lib/auth/csrf";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { checkRateLimit, getClientKey } from "@/lib/auth/rate-limit";
import {
    createSession,
    getSessionCookieOptions,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { badRequest, tooManyRequests, unauthorized } from "@/lib/http/responses";
import { LoginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
    const rateLimit = checkRateLimit(
        `login:${getClientKey(request)}`,
        env.RATE_LIMIT_PER_MINUTE,
        60_000,
    );

    if (!rateLimit.ok) {
        return tooManyRequests(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000));
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = LoginSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid login payload");
    }

    const user = await db.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
    });

    if (!user) {
        return unauthorized("Invalid credentials");
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, parsed.data.password);

    if (!isPasswordValid) {
        return unauthorized("Invalid credentials");
    }

    const sessionToken = await createSession(user.id);
    await ensureCsrfCookie();

    const response = NextResponse.json(
        {
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
            },
        },
        { status: 200 },
    );

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions());
    return response;
}
