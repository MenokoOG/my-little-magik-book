import { DeckMode } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { checkRateLimit, getClientKey } from "@/lib/auth/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { badRequest, tooManyRequests } from "@/lib/http/responses";
import { SignupSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
    const rateLimit = checkRateLimit(
        `signup:${getClientKey(request)}`,
        env.RATE_LIMIT_PER_MINUTE,
        60_000,
    );

    if (!rateLimit.ok) {
        return tooManyRequests(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000));
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = SignupSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid signup payload");
    }

    try {
        const user = await db.user.create({
            data: {
                email: parsed.data.email.toLowerCase(),
                passwordHash: await hashPassword(parsed.data.password),
                displayName: parsed.data.displayName,
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
            select: {
                id: true,
                email: true,
                displayName: true,
            },
        });

        return NextResponse.json(
            {
                message: "Account created successfully. Please log in.",
                user,
            },
            { status: 201 },
        );
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return badRequest("An account with that email already exists");
        }

        return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }
}
