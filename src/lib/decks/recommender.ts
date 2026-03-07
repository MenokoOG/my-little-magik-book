import type { RecommendationMode } from "@/lib/validation/deck";

type CardCandidate = {
    id: string;
    name: string;
    cmc: number | null;
    typeLine: string;
    text: string;
    power: number | null;
    toughness: number | null;
    colors: string[];
    colorIdentity: string[];
    subtypes: string[];
    keywords: string[];
};

export type DeckRecommendation = {
    card_id: string;
    score: number;
    reason: string;
};

type DeckProfile = {
    colors: Set<string>;
    avgCmc: number | null;
    frequentSubtypes: Set<string>;
    commonKeywords: Set<string>;
};

type ScoreResult = {
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

    const normalizedColors = parseStringArray(raw.colors).map((value) =>
        value.toUpperCase(),
    );
    const normalizedColorIdentity = parseStringArray(raw.colorIdentity).map(
        (value) => value.toUpperCase(),
    );
    const normalizedTypeLine = String(raw.type ?? "");
    const normalizedText = String(raw.text ?? "");

    return {
        id,
        name: String(raw.name ?? id),
        cmc: toNumber(raw.cmc),
        typeLine: normalizedTypeLine,
        text: normalizedText,
        power: toNumber(raw.power),
        toughness: toNumber(raw.toughness),
        colors: normalizedColors,
        colorIdentity: normalizedColorIdentity,
        subtypes: extractSubtypes(normalizedTypeLine),
        keywords: extractKeywords(normalizedText),
    };
}

function parseStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function extractSubtypes(typeLine: string) {
    const split = typeLine.split("—");
    if (split.length < 2) {
        return [];
    }

    return split[1]
        .split(" ")
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 0);
}

function extractKeywords(text: string) {
    const knownKeywords = [
        "haste",
        "flying",
        "trample",
        "lifelink",
        "first strike",
        "double strike",
        "deathtouch",
        "vigilance",
        "menace",
        "hexproof",
        "ward",
        "reach",
    ];

    const lowered = text.toLowerCase();
    return knownKeywords.filter((keyword) => lowered.includes(keyword));
}

function addReason(
    state: { reason: string; reasonWeight: number },
    candidateReason: string,
    weight: number,
) {
    if (weight > state.reasonWeight) {
        state.reason = candidateReason;
        state.reasonWeight = weight;
    }
}

function buildDeckProfile(deckContextRaw: Array<Record<string, unknown>>): DeckProfile {
    const parsedCards = deckContextRaw
        .map((raw) => parseCandidate(raw))
        .filter((card): card is CardCandidate => Boolean(card));

    const colors = new Set<string>();
    const subtypeCounts = new Map<string, number>();
    const keywordCounts = new Map<string, number>();
    let totalCmc = 0;
    let cmcCount = 0;

    for (const card of parsedCards) {
        for (const color of card.colors) {
            colors.add(color);
        }

        for (const color of card.colorIdentity) {
            colors.add(color);
        }

        if (card.cmc !== null) {
            totalCmc += card.cmc;
            cmcCount += 1;
        }

        for (const subtype of card.subtypes) {
            subtypeCounts.set(subtype, (subtypeCounts.get(subtype) ?? 0) + 1);
        }

        for (const keyword of card.keywords) {
            keywordCounts.set(keyword, (keywordCounts.get(keyword) ?? 0) + 1);
        }
    }

    const frequentSubtypes = new Set(
        Array.from(subtypeCounts.entries())
            .filter(([, count]) => count >= 2)
            .map(([subtype]) => subtype),
    );

    const commonKeywords = new Set(
        Array.from(keywordCounts.entries())
            .filter(([, count]) => count >= 2)
            .map(([keyword]) => keyword),
    );

    return {
        colors,
        avgCmc: cmcCount > 0 ? totalCmc / cmcCount : null,
        frequentSubtypes,
        commonKeywords,
    };
}

function applyDeckSynergy(card: CardCandidate, profile: DeckProfile): ScoreResult {
    let score = 0;
    const reasonState = {
        reason: "supports current deck strategy",
        reasonWeight: 0,
    };

    const cardColors = new Set<string>([...card.colors, ...card.colorIdentity]);
    if (profile.colors.size > 0 && cardColors.size > 0) {
        const hasColorOverlap = Array.from(cardColors).some((color) =>
            profile.colors.has(color),
        );

        if (hasColorOverlap) {
            score += 12;
            addReason(reasonState, "matches your deck colors", 12);
        } else {
            score -= 20;
        }
    }

    const sharedSubtype = card.subtypes.find((subtype) =>
        profile.frequentSubtypes.has(subtype),
    );
    if (sharedSubtype) {
        score += 10;
        addReason(
            reasonState,
            `synergizes with your ${sharedSubtype} package`,
            10,
        );
    }

    const sharedKeyword = card.keywords.find((keyword) =>
        profile.commonKeywords.has(keyword),
    );
    if (sharedKeyword) {
        score += 6;
        addReason(
            reasonState,
            `reinforces your ${sharedKeyword} game plan`,
            6,
        );
    }

    if (profile.avgCmc !== null && card.cmc !== null) {
        const delta = Math.abs(card.cmc - profile.avgCmc);
        if (delta <= 1.25) {
            score += 8;
            addReason(reasonState, "fits your deck's mana curve", 8);
        } else if (delta >= 3) {
            score -= 6;
        }
    }

    return {
        score,
        reason: reasonState.reason,
    };
}

function hashToUnit(value: string) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }

    return Math.abs(hash % 10_000) / 10_000;
}

function scoreAggressive(card: CardCandidate, profile: DeckProfile) {
    const reasonState = {
        reason: "supports aggressive tempo",
        reasonWeight: 0,
    };
    let score = 0;

    if (card.cmc !== null) {
        if (card.cmc <= 2) {
            score += 30;
            addReason(reasonState, "low mana value helps early pressure", 30);
        } else if (card.cmc <= 4) {
            score += 12;
            addReason(
                reasonState,
                "playable on curve for mid-game tempo",
                12,
            );
        } else {
            score -= 8;
        }
    }

    if (/Creature/i.test(card.typeLine)) {
        score += 14;
        addReason(reasonState, "creature threat supports combat pressure", 14);
    }

    if (card.power !== null && card.cmc !== null && card.cmc > 0) {
        const ratio = card.power / card.cmc;
        if (ratio >= 1.5) {
            score += 10;
            addReason(reasonState, "efficient power-to-cost ratio", 10);
        }
    }

    if (/(haste|flying|trample|first strike|double strike)/i.test(card.text)) {
        score += 8;
        addReason(
            reasonState,
            "combat keyword increases immediate damage potential",
            8,
        );
    }

    const synergy = applyDeckSynergy(card, profile);
    score += synergy.score;
    addReason(reasonState, synergy.reason, Math.max(1, synergy.score));

    return { score, reason: reasonState.reason };
}

function scoreDefensive(card: CardCandidate, profile: DeckProfile) {
    const reasonState = {
        reason: "supports board stabilization",
        reasonWeight: 0,
    };
    let score = 0;

    if (/(destroy target|exile target|counter target|tap target|can't attack)/i.test(card.text)) {
        score += 24;
        addReason(reasonState, "interaction helps control enemy threats", 24);
    }

    if (/(gain \d+ life|you gain life)/i.test(card.text)) {
        score += 16;
        addReason(reasonState, "life gain helps stabilize longer games", 16);
    }

    if (/Creature/i.test(card.typeLine) && card.toughness !== null && card.toughness >= 4) {
        score += 14;
        addReason(reasonState, "higher toughness can hold the board", 14);
    }

    if (card.cmc !== null && card.cmc >= 2 && card.cmc <= 5) {
        score += 8;
        addReason(reasonState, "mana curve fits defensive pacing", 8);
    }

    const synergy = applyDeckSynergy(card, profile);
    score += synergy.score;
    addReason(reasonState, synergy.reason, Math.max(1, synergy.score));

    return { score, reason: reasonState.reason };
}

function scoreYolo(card: CardCandidate, profile: DeckProfile, seedKey: string) {
    const reasonState = {
        reason: "high-variance pick with playable constraints",
        reasonWeight: 0,
    };
    let score = 0;

    const randomBoost = hashToUnit(seedKey) * 28;
    score += randomBoost;

    if (card.cmc !== null) {
        if (card.cmc <= 6) {
            score += 8;
            addReason(
                reasonState,
                "still castable within a reasonable curve",
                8,
            );
        } else {
            score -= 6;
        }
    }

    if (/(draw|damage|destroy|create|token)/i.test(card.text)) {
        score += 6;
        addReason(reasonState, "swingy effect matches YOLO playstyle", 6);
    }

    const synergy = applyDeckSynergy(card, profile);
    score += synergy.score * 0.6;
    addReason(reasonState, synergy.reason, Math.max(1, synergy.score * 0.6));

    return { score, reason: reasonState.reason };
}

export function buildDeckRecommendations(input: {
    mode: RecommendationMode;
    deckCardIds: string[];
    deckContextRaw?: Array<Record<string, unknown>>;
    candidatesRaw: Array<Record<string, unknown>>;
    limit?: number;
    randomSeedKey?: string;
}): DeckRecommendation[] {
    const limit = Math.max(1, Math.min(input.limit ?? 8, 20));
    const inDeck = new Set(input.deckCardIds);
    const deckProfile = buildDeckProfile(input.deckContextRaw ?? []);

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
            const { score, reason } = scoreAggressive(card, deckProfile);
            return { card_id: card.id, score: Number(score.toFixed(2)), reason };
        }

        if (input.mode === "defensive") {
            const { score, reason } = scoreDefensive(card, deckProfile);
            return { card_id: card.id, score: Number(score.toFixed(2)), reason };
        }

        const { score, reason } = scoreYolo(
            card,
            deckProfile,
            `${input.randomSeedKey ?? "default"}:${card.id}`,
        );
        return { card_id: card.id, score: Number(score.toFixed(2)), reason };
    });

    scored.sort((left, right) => right.score - left.score);
    return scored.slice(0, limit);
}
