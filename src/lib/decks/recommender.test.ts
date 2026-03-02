import { describe, expect, it } from "vitest";

import { buildDeckRecommendations } from "@/lib/decks/recommender";

describe("buildDeckRecommendations", () => {
    const candidates = [
        {
            id: "c1",
            name: "Fast Goblin",
            cmc: 1,
            type: "Creature — Goblin",
            text: "Haste",
            power: "2",
            toughness: "1",
        },
        {
            id: "c2",
            name: "Shielded Angel",
            cmc: 5,
            type: "Creature — Angel",
            text: "Flying. You gain 4 life.",
            power: "4",
            toughness: "5",
        },
        {
            id: "c3",
            name: "Removal Bolt",
            cmc: 2,
            type: "Instant",
            text: "Destroy target creature.",
        },
    ] as Array<Record<string, unknown>>;

    it("returns explainable aggressive recommendations", () => {
        const output = buildDeckRecommendations({
            mode: "aggressive",
            deckCardIds: [],
            candidatesRaw: candidates,
            limit: 3,
        });

        expect(output.length).toBeGreaterThan(0);
        expect(output[0]).toHaveProperty("card_id");
        expect(output[0]).toHaveProperty("score");
        expect(output[0]).toHaveProperty("reason");
        expect(output.some((item) => item.reason.length > 0)).toBe(true);
    });

    it("filters out cards already in deck", () => {
        const output = buildDeckRecommendations({
            mode: "defensive",
            deckCardIds: ["c3"],
            candidatesRaw: candidates,
            limit: 5,
        });

        expect(output.find((item) => item.card_id === "c3")).toBeUndefined();
    });

    it("applies deterministic yolo ordering by seed", () => {
        const first = buildDeckRecommendations({
            mode: "yolo",
            deckCardIds: [],
            candidatesRaw: candidates,
            randomSeedKey: "seed-1",
            limit: 3,
        });

        const second = buildDeckRecommendations({
            mode: "yolo",
            deckCardIds: [],
            candidatesRaw: candidates,
            randomSeedKey: "seed-1",
            limit: 3,
        });

        expect(first).toEqual(second);
    });
});
