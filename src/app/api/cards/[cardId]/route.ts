import { NextResponse } from "next/server";

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
            return NextResponse.json(existing.payloadJson, { status: 200 });
        }
    }

    try {
        const payload = await fetchCardById(cardId);

        await db.cardCache.upsert({
            where: { cardId },
            update: {
                payloadJson: payload,
            },
            create: {
                cardId,
                payloadJson: payload,
            },
        });

        return NextResponse.json(payload, { status: 200 });
    } catch (error) {
        if (existing) {
            return NextResponse.json(existing.payloadJson, {
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
