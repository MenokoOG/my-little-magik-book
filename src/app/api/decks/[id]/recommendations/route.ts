import { NextResponse } from "next/server";

import { checkRateLimit, getClientKey } from "@/lib/auth/rate-limit";
import { validateCsrf } from "@/lib/auth/csrf";
import { fetchCardById, fetchCardsSearch } from "@/lib/cards/service";
import { buildDeckRecommendations } from "@/lib/decks/recommender";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
    badRequest,
    forbidden,
    requireAuthenticatedUser,
    tooManyRequests,
    unauthorized,
} from "@/lib/http/responses";
import {
    RecommendationModeSchema,
    type RecommendationMode,
} from "@/lib/validation/deck";

type Context = {
    params: Promise<{ id: string }>;
};

function getSearchTerms(mode: RecommendationMode) {
    switch (mode) {
        case "aggressive":
            return ["Goblin", "Lightning", "Warrior"];
        case "defensive":
            return ["Control", "Shield", "Angel"];
        case "yolo":
            return ["Dragon", "Chaos", "Mythic"];
        default:
            return ["Creature"];
    }
}

function parseCardPayload(payload: unknown): Record<string, unknown>[] {
    if (!payload || typeof payload !== "object") {
        return [];
    }

    const cards = (payload as { cards?: unknown }).cards;
    if (!Array.isArray(cards)) {
        return [];
    }

    return cards.filter((item): item is Record<string, unknown> => {
        return Boolean(item && typeof item === "object");
    });
}

async function getSeedCandidates(mode: RecommendationMode, colors: string[]) {
    const terms = getSearchTerms(mode);
    const blobs = await Promise.all(
        terms.map(async (term) => {
            const params = new URLSearchParams({
                name: term,
                pageSize: "18",
            });

            if (colors.length > 0) {
                params.set("colors", colors.join(","));
            }

            return fetchCardsSearch(params);
        }),
    );

    return blobs.flatMap((blob) => parseCardPayload(blob));
}

async function getDeckContextCards(deckCardIds: string[]) {
    const ids = deckCardIds.slice(0, 24);
    const details = await Promise.all(
        ids.map(async (cardId) => {
            try {
                const payload = await fetchCardById(cardId);
                const card = (payload as { card?: unknown }).card;
                if (card && typeof card === "object") {
                    return card as Record<string, unknown>;
                }
            } catch {
                return null;
            }

            return null;
        }),
    );

    return details.filter(
        (card): card is Record<string, unknown> => Boolean(card),
    );
}

export async function POST(request: Request, context: Context) {
    const user = await requireAuthenticatedUser();

    if (!user) {
        return unauthorized();
    }

    if (!(await validateCsrf(request))) {
        return forbidden("CSRF token mismatch");
    }

    const rateLimit = checkRateLimit(
        `deck-recommendations:${user.id}:${getClientKey(request)}`,
        Math.max(10, Math.floor(env.RATE_LIMIT_PER_MINUTE / 2)),
        60_000,
    );

    if (!rateLimit.ok) {
        return tooManyRequests(Math.ceil((rateLimit.retryAfterMs ?? 0) / 1000));
    }

    const url = new URL(request.url);
    const modeParse = RecommendationModeSchema.safeParse(
        url.searchParams.get("mode"),
    );

    if (!modeParse.success) {
        return badRequest("mode must be one of: aggressive, defensive, yolo");
    }

    const { id } = await context.params;

    const deck = await db.deck.findUnique({
        where: { id },
        include: {
            cards: {
                orderBy: { cardId: "asc" },
            },
        },
    });

    if (!deck) {
        return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (deck.ownerId !== user.id) {
        return forbidden("You cannot access recommendations for this deck");
    }

    const deckCardIds = deck.cards.map((entry) => entry.cardId);
    const contextCards = await getDeckContextCards(deckCardIds);

    const deckColors = new Set<string>();
    for (const card of contextCards) {
        const colors = card.colors;
        if (Array.isArray(colors)) {
            for (const color of colors) {
                if (typeof color === "string" && color.trim().length > 0) {
                    deckColors.add(color.trim().toUpperCase());
                }
            }
        }
    }

    const seedCandidates = await getSeedCandidates(
        modeParse.data,
        Array.from(deckColors),
    );

    const recommendations = buildDeckRecommendations({
        mode: modeParse.data,
        deckCardIds,
        deckContextRaw: contextCards,
        candidatesRaw: [...contextCards, ...seedCandidates],
        limit: 8,
        randomSeedKey: `${deck.id}:${deck.updatedAt.toISOString()}`,
    });

    return NextResponse.json(
        {
            mode: modeParse.data,
            recommendations,
        },
        { status: 200 },
    );
}
