import { DeckMode } from "@prisma/client";
import { NextResponse } from "next/server";

import { validateCsrf } from "@/lib/auth/csrf";
import { db } from "@/lib/db";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    unauthorized,
} from "@/lib/http/responses";
import { CreateDeckSchema } from "@/lib/validation/deck";

const MODE_DEFAULTS: Array<{ mode: DeckMode; name: string }> = [
    { mode: DeckMode.MAIN, name: "Main Deck" },
    { mode: DeckMode.AGGRESSIVE, name: "Aggressive Deck" },
    { mode: DeckMode.DEFENSIVE, name: "Defensive Deck" },
    { mode: DeckMode.YOLO, name: "YOLO Deck" },
];

export async function GET() {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const existingModes = await db.deck.findMany({
        where: { ownerId: user.id },
        select: { mode: true },
    });

    const existingModeSet = new Set(existingModes.map((deck) => deck.mode));
    const missingModeDecks = MODE_DEFAULTS.filter(({ mode }) => !existingModeSet.has(mode));

    if (missingModeDecks.length > 0) {
        await db.deck.createMany({
            data: missingModeDecks.map(({ mode, name }) => ({
                ownerId: user.id,
                mode,
                name,
            })),
        });
    }

    const decks = await db.deck.findMany({
        where: { ownerId: user.id },
        include: {
            cards: {
                orderBy: { cardId: "asc" },
            },
        },
        orderBy: [
            { mode: "asc" },
            { createdAt: "asc" },
        ],
    });

    return NextResponse.json({ decks }, { status: 200 });
}

export async function POST(request: Request) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = CreateDeckSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const deck = await db.deck.create({
        data: {
            ownerId: user.id,
            name: parsed.data.name,
            mode: parsed.data.mode,
            visibility: parsed.data.visibility,
        },
        include: {
            cards: {
                orderBy: { cardId: "asc" },
            },
        },
    });

    return NextResponse.json({ deck }, { status: 201 });
}
