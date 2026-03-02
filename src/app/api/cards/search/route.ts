import { NextResponse } from "next/server";

import { fetchCardsSearch } from "@/lib/cards/service";
import { badRequest } from "@/lib/http/responses";

const passthroughFilters = [
    "colors",
    "types",
    "rarity",
    "cmc",
    "setName",
    "page",
    "pageSize",
    "orderBy",
];

export async function GET(request: Request) {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim();

    if (!query) {
        return badRequest("Missing required query parameter: q");
    }

    const upstreamParams = new URLSearchParams({ name: query });

    for (const filter of passthroughFilters) {
        const value = url.searchParams.get(filter);
        if (value) {
            upstreamParams.set(filter, value);
        }
    }

    const filtersBlob = url.searchParams.get("filters")?.trim();
    if (filtersBlob) {
        for (const pair of filtersBlob.split(",")) {
            const [key, rawValue] = pair.split(":");
            const normalizedKey = key?.trim();
            const normalizedValue = rawValue?.trim();
            if (normalizedKey && normalizedValue) {
                upstreamParams.set(normalizedKey, normalizedValue);
            }
        }
    }

    try {
        const payload = await fetchCardsSearch(upstreamParams);
        return NextResponse.json(payload, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            {
                error: "Card search is currently unavailable",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 502 },
        );
    }
}
