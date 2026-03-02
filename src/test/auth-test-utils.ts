import { DeckMode } from "@prisma/client";

import { SESSION_COOKIE_NAME, CSRF_COOKIE_NAME } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { setTestCookie } from "@/test/cookie-store";

export async function createUserWithDecks(input: {
    email: string;
    password: string;
    displayName: string;
}) {
    return db.user.create({
        data: {
            email: input.email.toLowerCase(),
            passwordHash: await hashPassword(input.password),
            displayName: input.displayName,
            decks: {
                createMany: {
                    data: [
                        { name: "Main", mode: DeckMode.MAIN },
                        { name: "Aggressive", mode: DeckMode.AGGRESSIVE },
                        { name: "Defensive", mode: DeckMode.DEFENSIVE },
                        { name: "YOLO", mode: DeckMode.YOLO },
                    ],
                },
            },
        },
    });
}

export async function authenticateAs(userId: string) {
    const token = await createSession(userId);
    setTestCookie(SESSION_COOKIE_NAME, token);
}

export function setCsrfToken(token: string) {
    setTestCookie(CSRF_COOKIE_NAME, token);
}
