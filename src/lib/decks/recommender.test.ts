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
            colors: ["Red"],
            colorIdentity: ["R"],
        },
        {
            id: "c2",
            name: "Shielded Angel",
            cmc: 5,
            type: "Creature — Angel",
            text: "Flying. You gain 4 life.",
            power: "4",
            toughness: "5",
            colors: ["White"],
            colorIdentity: ["W"],
        },
        {
            id: "c3",
            name: "Removal Bolt",
            cmc: 2,
            type: "Instant",
            text: "Destroy target creature.",
            colors: ["Red"],
            colorIdentity: ["R"],
        },
        {
            id: "c4",
            name: "Ocean Leviathan",
            cmc: 6,
            type: "Creature — Leviathan",
            text: "Ward 2",
            power: "6",
            toughness: "6",
            colors: ["Blue"],
            colorIdentity: ["U"],
        },
    ] as Array<Record<string, unknown>>;

    const deckContext = [
        {
            id: "d1",
            name: "Goblin Scout",
            cmc: 1,
            type: "Creature — Goblin",
            text: "Haste",
            colors: ["Red"],
            colorIdentity: ["R"],
        },
        {
            id: "d2",
            name: "Goblin Brute",
            cmc: 2,
            type: "Creature — Goblin",
            text: "Haste",
            colors: ["Red"],
            colorIdentity: ["R"],
        },
    ] as Array<Record<string, unknown>>;

    it("returns explainable aggressive recommendations", () => {
        const output = buildDeckRecommendations({
            mode: "aggressive",
            deckCardIds: [],
            deckContextRaw: deckContext,
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
            deckContextRaw: deckContext,
            candidatesRaw: candidates,
            limit: 5,
        });

        expect(output.find((item) => item.card_id === "c3")).toBeUndefined();
    });

    it("applies deterministic yolo ordering by seed", () => {
        const first = buildDeckRecommendations({
            mode: "yolo",
            deckCardIds: [],
            deckContextRaw: deckContext,
            candidatesRaw: candidates,
            randomSeedKey: "seed-1",
            limit: 3,
        });

        const second = buildDeckRecommendations({
            mode: "yolo",
            deckCardIds: [],
            deckContextRaw: deckContext,
            candidatesRaw: candidates,
            randomSeedKey: "seed-1",
            limit: 3,
        });

        expect(first).toEqual(second);
    });

    it("prefers color and tribal synergy from deck context", () => {
        const output = buildDeckRecommendations({
            mode: "aggressive",
            deckCardIds: [],
            deckContextRaw: deckContext,
            candidatesRaw: candidates,
            limit: 4,
        });

        expect(output[0]?.card_id).toBe("c1");
        expect(output.find((item) => item.card_id === "c4")?.score ?? 0).toBeLessThan(
            output.find((item) => item.card_id === "c1")?.score ?? 0,
        );
    });

    it("handles sparse candidate payloads gracefully", () => {
        const output = buildDeckRecommendations({
            mode: "defensive",
            deckCardIds: [],
            deckContextRaw: deckContext,
            candidatesRaw: [{ id: "s1" }, { id: "s2", text: "you gain life" }],
            limit: 2,
        });

        expect(output).toHaveLength(2);
        expect(output.every((item) => item.reason.length > 0)).toBe(true);
    });
});
