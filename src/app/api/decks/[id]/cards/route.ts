import { NextResponse } from "next/server";

import { validateCsrf } from "@/lib/auth/csrf";
import { db } from "@/lib/db";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    unauthorized,
} from "@/lib/http/responses";
import { ReplaceDeckCardsSchema } from "@/lib/validation/deck";

type Context = {
    params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: Context) {
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
    const parsed = ReplaceDeckCardsSchema.safeParse(rawBody);

    if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const aggregated = new Map<string, number>();
    for (const entry of parsed.data.cards) {
        aggregated.set(entry.cardId, (aggregated.get(entry.cardId) ?? 0) + entry.quantity);
    }

    await db.$transaction(async (tx) => {
        await tx.deckCard.deleteMany({
            where: { deckId: id },
        });

        if (aggregated.size > 0) {
            await tx.deckCard.createMany({
                data: Array.from(aggregated.entries()).map(([cardId, quantity]) => ({
                    deckId: id,
                    cardId,
                    quantity,
                })),
            });
        }
    });

    const deck = await db.deck.findUnique({
        where: { id },
        include: {
            cards: {
                orderBy: { cardId: "asc" },
            },
        },
    });

    return NextResponse.json({ deck }, { status: 200 });
}
