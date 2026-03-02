import { describe, expect, it } from "vitest";

import {
    buildDeckWarnings,
    buildManaCurve,
    countDeckCards,
} from "@/lib/decks/stats";

describe("deck stats", () => {
    const cards = [
        { cardId: "a", quantity: 4 },
        { cardId: "b", quantity: 3 },
        { cardId: "c", quantity: 2 },
        { cardId: "d", quantity: 1 },
        { cardId: "e", quantity: 1 },
    ];

    const meta = {
        a: { id: "a", manaValue: 1 },
        b: { id: "b", manaValue: 2 },
        c: { id: "c", manaValue: 3 },
        d: { id: "d", manaValue: 6 },
        e: { id: "e", manaValue: null },
    };

    it("counts deck cards correctly", () => {
        expect(countDeckCards(cards)).toBe(11);
    });

    it("builds mana curve buckets", () => {
        const curve = buildManaCurve(cards, meta);
        expect(curve.find((item) => item.bucket === "0-1")?.count).toBe(4);
        expect(curve.find((item) => item.bucket === "2")?.count).toBe(3);
        expect(curve.find((item) => item.bucket === "3")?.count).toBe(2);
        expect(curve.find((item) => item.bucket === "5+")?.count).toBe(1);
        expect(curve.find((item) => item.bucket === "Unknown")?.count).toBe(1);
    });

    it("warns for under-60 and too many copies", () => {
        const warnings = buildDeckWarnings(
            [
                { cardId: "x", quantity: 5 },
                { cardId: "y", quantity: 1 },
            ],
            6,
        );

        expect(warnings).toContain("Deck has fewer than 60 total cards.");
        expect(warnings).toContain("One or more cards exceed 4 copies.");
    });
});
