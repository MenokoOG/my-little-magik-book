export type DeckCardEntry = {
    cardId: string;
    quantity: number;
};

export type DeckCardMeta = {
    id: string;
    manaValue: number | null;
};

export function countDeckCards(cards: DeckCardEntry[]) {
    return cards.reduce((total, card) => total + card.quantity, 0);
}

export function buildManaCurve(
    cards: DeckCardEntry[],
    cardMetaById: Record<string, DeckCardMeta>,
) {
    const buckets: Record<string, number> = {
        "0-1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5+": 0,
        Unknown: 0,
    };

    for (const card of cards) {
        const meta = cardMetaById[card.cardId];
        if (!meta || meta.manaValue === null) {
            buckets.Unknown += card.quantity;
            continue;
        }

        if (meta.manaValue <= 1) {
            buckets["0-1"] += card.quantity;
        } else if (meta.manaValue >= 5) {
            buckets["5+"] += card.quantity;
        } else {
            buckets[String(meta.manaValue)] += card.quantity;
        }
    }

    return Object.entries(buckets).map(([bucket, count]) => ({
        bucket,
        count,
    }));
}

export function buildDeckWarnings(cards: DeckCardEntry[], deckCount: number) {
    const warnings: string[] = [];

    if (deckCount < 60) {
        warnings.push("Deck has fewer than 60 total cards.");
    }

    const tooManyCopies = cards.find((card) => card.quantity > 4);
    if (tooManyCopies) {
        warnings.push("One or more cards exceed 4 copies.");
    }

    return warnings;
}
