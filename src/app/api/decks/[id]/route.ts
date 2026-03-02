import { DeckVisibility } from "@prisma/client";
import { NextResponse } from "next/server";

import { validateCsrf } from "@/lib/auth/csrf";
import { db } from "@/lib/db";
import { areFriends } from "@/lib/friends";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    unauthorized,
} from "@/lib/http/responses";
import { UpdateDeckSchema } from "@/lib/validation/deck";

type Context = {
    params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    const { id } = await context.params;

    const deck = await db.deck.findUnique({
        where: { id },
        include: {
            cards: {
                orderBy: { cardId: "asc" },
            },
            owner: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
        },
    });

    if (!deck) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (deck.ownerId === user.id) {
        return NextResponse.json({ deck }, { status: 200 });
    }

    if (deck.visibility === DeckVisibility.PUBLIC) {
        return NextResponse.json({ deck }, { status: 200 });
    }

    if (deck.visibility === DeckVisibility.FRIENDS) {
        const friendship = await areFriends(user.id, deck.ownerId);
        if (friendship) {
            return NextResponse.json({ deck }, { status: 200 });
        }
    }

    return forbidden("You do not have access to this deck");
}

export async function PATCH(request: Request, context: Context) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const { id } = await context.params;

    const existingDeck = await db.deck.findUnique({
        where: { id },
        select: {
            id: true,
            ownerId: true,
        },
    });

    if (!existingDeck) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (existingDeck.ownerId !== user.id) {
        return forbidden("You cannot update this deck");
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = UpdateDeckSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const deck = await db.deck.update({
        where: { id },
        data: parsed.data,
        include: {
            cards: {
                orderBy: { cardId: "asc" },
            },
        },
    });

    return NextResponse.json({ deck }, { status: 200 });
}
