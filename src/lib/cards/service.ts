import { readFileSync } from "node:fs";
import { join } from "node:path";

import { env } from "@/lib/env";

const SEARCH_CACHE = new Map<string, { payload: unknown; expiresAt: number }>();
const DEFAULT_API_BASE = "https://api.magicthegathering.io";

function getAllowlistedOrigins() {
    const filePath = join(process.cwd(), "resource.txt");
    const lines = readFileSync(filePath, "utf8")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("#"));

    return new Set(
        lines
            .map((line) => {
                try {
                    return new URL(line).origin;
                } catch {
                    return null;
                }
            })
            .filter((value): value is string => Boolean(value)),
    );
}

function assertAllowlistedApiBase() {
    const apiBase = env.MAGICTHEGATHERING_API_BASE ?? DEFAULT_API_BASE;
    const parsed = new URL(apiBase);

    if (parsed.protocol !== "https:") {
        throw new Error("Card API base must use HTTPS");
    }

    const allowlistedOrigins = getAllowlistedOrigins();
    if (!allowlistedOrigins.has(parsed.origin)) {
        throw new Error(`Card API base origin is not allowlisted: ${parsed.origin}`);
    }

    return parsed.origin;
}

export async function fetchCardsSearch(urlSearchParams: URLSearchParams) {
    const cacheKey = urlSearchParams.toString();
    const now = Date.now();
    const cached = SEARCH_CACHE.get(cacheKey);

    if (cached && cached.expiresAt > now) {
        return cached.payload;
    }

    const origin = assertAllowlistedApiBase();
    const target = new URL("/v1/cards", origin);
    target.search = urlSearchParams.toString();

    const response = await fetch(target, {
        method: "GET",
        redirect: "manual",
        headers: {
            accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Card search request failed with status ${response.status}`);
    }

    const payload = await response.json();

    SEARCH_CACHE.set(cacheKey, {
        payload,
        expiresAt: now + Math.min(env.CARD_CACHE_TTL_SECONDS, 300) * 1000,
    });

    return payload;
}

export async function fetchCardById(cardId: string) {
    const origin = assertAllowlistedApiBase();
    const target = new URL(`/v1/cards/${encodeURIComponent(cardId)}`, origin);

    const response = await fetch(target, {
        method: "GET",
        redirect: "manual",
        headers: {
            accept: "application/json",
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Card details request failed with status ${response.status}`);
    }

    return response.json();
}
