import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { normalizeCardsPayload } from "@/lib/cards/image-url";
import { fetchCardById } from "@/lib/cards/service";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

type CardRouteParams = {
    params: Promise<{ cardId: string }>;
};

export async function GET(_: Request, { params }: CardRouteParams) {
    const { cardId } = await params;

    if (!cardId?.trim()) {
        return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }

    const existing = await db.cardCache.findUnique({
        where: { cardId },
    });

    if (existing) {
        const ageInSeconds = Math.floor((Date.now() - existing.updatedAt.getTime()) / 1000);
        if (ageInSeconds <= env.CARD_CACHE_TTL_SECONDS) {
            const normalized = normalizeCardsPayload(existing.payloadJson);
            return NextResponse.json(normalized, { status: 200 });
        }
    }

    try {
        const payload = normalizeCardsPayload(await fetchCardById(cardId));
        const payloadJson = payload as Prisma.InputJsonValue;

        await db.cardCache.upsert({
            where: { cardId },
            update: {
                payloadJson,
            },
            create: {
                cardId,
                payloadJson,
            },
        });

        return NextResponse.json(payload, { status: 200 });
    } catch (error) {
        if (existing) {
            const normalized = normalizeCardsPayload(existing.payloadJson);
            return NextResponse.json(normalized, {
                status: 200,
                headers: {
                    "X-Cache-Stale": "1",
                },
            });
        }

        return NextResponse.json(
            {
                error: "Card details are currently unavailable",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 502 },
        );
    }
}
