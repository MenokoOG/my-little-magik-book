import { randomBytes, createHash } from "node:crypto";

import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function hashSessionToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
    return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string) {
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);

    await db.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
        },
    });

    return token;
}

export async function invalidateSessionByToken(token: string | undefined) {
    if (!token) {
        return;
    }

    await db.session.deleteMany({
        where: {
            tokenHash: hashSessionToken(token),
        },
    });
}

export async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    const session = await db.session.findUnique({
        where: { tokenHash: hashSessionToken(token) },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    displayName: true,
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
        await db.session.delete({ where: { id: session.id } });
        return null;
    }

    return session.user;
}

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    };
}
