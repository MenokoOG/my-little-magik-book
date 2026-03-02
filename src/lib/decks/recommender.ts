import type { RecommendationMode } from "@/lib/validation/deck";

type CardCandidate = {
    id: string;
    name: string;
    cmc: number | null;
    typeLine: string;
    text: string;
    power: number | null;
    toughness: number | null;
};

export type DeckRecommendation = {
    card_id: string;
    score: number;
    reason: string;
};

function toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
}

function parseCandidate(raw: Record<string, unknown>): CardCandidate | null {
    const id = String(raw.id ?? "").trim();
    if (!id) {
        return null;
    }

    return {
        id,
        name: String(raw.name ?? id),
        cmc: toNumber(raw.cmc),
        typeLine: String(raw.type ?? ""),
        text: String(raw.text ?? ""),
        power: toNumber(raw.power),
        toughness: toNumber(raw.toughness),
    };
}

function hashToUnit(value: string) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }

    return Math.abs(hash % 10_000) / 10_000;
}

function scoreAggressive(card: CardCandidate) {
    const reasons: string[] = [];
    let score = 0;

    if (card.cmc !== null) {
        if (card.cmc <= 2) {
            score += 30;
            reasons.push("low mana value helps early pressure");
        } else if (card.cmc <= 4) {
            score += 12;
            reasons.push("playable on curve for mid-game tempo");
        } else {
            score -= 8;
        }
    }

    if (/Creature/i.test(card.typeLine)) {
        score += 14;
        reasons.push("creature threat supports combat pressure");
    }

    if (card.power !== null && card.cmc !== null && card.cmc > 0) {
        const ratio = card.power / card.cmc;
        if (ratio >= 1.5) {
            score += 10;
            reasons.push("efficient power-to-cost ratio");
        }
    }

    if (/(haste|flying|trample|first strike|double strike)/i.test(card.text)) {
        score += 8;
        reasons.push("combat keyword increases immediate damage potential");
    }

    return { score, reason: reasons[0] ?? "supports aggressive tempo" };
}

function scoreDefensive(card: CardCandidate) {
    const reasons: string[] = [];
    let score = 0;

    if (/(destroy target|exile target|counter target|tap target|can't attack)/i.test(card.text)) {
        score += 24;
        reasons.push("interaction helps control enemy threats");
    }

    if (/(gain \d+ life|you gain life)/i.test(card.text)) {
        score += 16;
        reasons.push("life gain helps stabilize longer games");
    }

    if (/Creature/i.test(card.typeLine) && card.toughness !== null && card.toughness >= 4) {
        score += 14;
        reasons.push("higher toughness can hold the board");
    }

    if (card.cmc !== null && card.cmc >= 2 && card.cmc <= 5) {
        score += 8;
        reasons.push("mana curve fits defensive pacing");
    }

    return { score, reason: reasons[0] ?? "supports board stabilization" };
}

function scoreYolo(card: CardCandidate, seedKey: string) {
    const reasons: string[] = [];
    let score = 0;

    const randomBoost = hashToUnit(seedKey) * 28;
    score += randomBoost;

    if (card.cmc !== null) {
        if (card.cmc <= 6) {
            score += 8;
            reasons.push("still castable within a reasonable curve");
        } else {
            score -= 6;
        }
    }

    if (/(draw|damage|destroy|create|token)/i.test(card.text)) {
        score += 6;
        reasons.push("swingy effect matches YOLO playstyle");
    }

    return { score, reason: reasons[0] ?? "high-variance pick with playable constraints" };
}

export function buildDeckRecommendations(input: {
    mode: RecommendationMode;
    deckCardIds: string[];
    candidatesRaw: Array<Record<string, unknown>>;
    limit?: number;
    randomSeedKey?: string;
}): DeckRecommendation[] {
    const limit = Math.max(1, Math.min(input.limit ?? 8, 20));
    const inDeck = new Set(input.deckCardIds);

    const deduped = new Map<string, CardCandidate>();
    for (const raw of input.candidatesRaw) {
        const parsed = parseCandidate(raw);
        if (!parsed || inDeck.has(parsed.id) || deduped.has(parsed.id)) {
            continue;
        }

        deduped.set(parsed.id, parsed);
    }

    const scored = Array.from(deduped.values()).map((card) => {
        if (input.mode === "aggressive") {
            const { score, reason } = scoreAggressive(card);
            return { card_id: card.id, score: Number(score.toFixed(2)), reason };
        }

        if (input.mode === "defensive") {
            const { score, reason } = scoreDefensive(card);
            return { card_id: card.id, score: Number(score.toFixed(2)), reason };
        }

        const { score, reason } = scoreYolo(
            card,
            `${input.randomSeedKey ?? "default"}:${card.id}`,
        );
        return { card_id: card.id, score: Number(score.toFixed(2)), reason };
    });

    scored.sort((left, right) => right.score - left.score);
    return scored.slice(0, limit);
}
